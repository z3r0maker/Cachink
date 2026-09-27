import 'server-only';

import { once } from 'node:events';
import { PassThrough, Readable, type Writable } from 'node:stream';

import { loadExcelJs, type Column } from './workbook';

/**
 * An .xlsx written as it is read (audit DB3-EXP-01, ADR-120).
 *
 * The in-memory `Workbook` held every cell as an object until the end: 100K
 * rows took 829 MB and a one-year whale 2.7 GB, past any function's memory.
 * ExcelJS's streaming `WorkbookWriter` serialises each row as it is committed,
 * straight into the zip, and the zip into the response body — so memory holds
 * about one batch whatever the file's length.
 *
 * **Past Excel's row limit the file gets another sheet** («Ventas», «Ventas
 * (2)», …), each with its own header. Excel refuses a sheet of more than
 * 1,048,576 rows; a CSV would open with the same truncation in Excel, which is
 * what the contador uses, so splitting keeps the file whole *and* openable.
 */
export const EXCEL_MAX_DATA_ROWS = 1_048_575;

export interface SheetSpec<T> {
  readonly name: string;
  readonly columns: readonly Column<T>[];
}

export interface StreamOptions {
  /** Data rows per sheet; lowered only by tests. */
  readonly maxRows?: number;
  readonly exportedAt?: Date;
}

type Writer = InstanceType<
  Awaited<ReturnType<typeof loadExcelJs>>['stream']['xlsx']['WorkbookWriter']
>;
type Sheet = ReturnType<Writer['addWorksheet']>;

function addSheet<T>(wb: Writer, spec: SheetSpec<T>, n: number): Sheet {
  const sheet = wb.addWorksheet(n === 1 ? spec.name : `${spec.name} (${n})`);
  sheet.columns = spec.columns.map((c) => ({ header: c.header, width: c.width ?? 18 }));
  sheet.getRow(1).font = { bold: true };
  return sheet;
}

/**
 * `writableNeedDrain`, also for archiver's `readable-stream` v2 streams,
 * which predate the getter and keep the flag only in their state.
 */
const needsDrain = (w: Writable): boolean =>
  w.writableNeedDrain ??
  (w as unknown as { _writableState?: { needDrain?: boolean } })._writableState?.needDrain ??
  false;

/** Resolves when `w` has room again — or has gone away. */
async function drained(w: Writable): Promise<void> {
  if (w.destroyed || !needsDrain(w)) return;
  // The losing listener is removed, not left behind once per batch.
  const done = new AbortController();
  const { signal } = done;
  await Promise.race([once(w, 'drain', { signal }), once(w, 'close', { signal })]).finally(() =>
    done.abort(),
  );
}

/**
 * Where a sheet's XML waits for the zip. ExcelJS's sheet buffer pipes into
 * archiver **ignoring backpressure**, so rows committed faster than deflate
 * runs pile up there — measured: 250 MB of buffers at 1.1 M rows with no
 * pacing. Waiting on this stream's drain paces the reads to the compressor.
 * An internal of ExcelJS 4.x; if it moves, pacing falls back to the response.
 */
const zipInput = (sheet: Sheet): Writable | undefined =>
  (sheet as unknown as { _stream?: { pipes?: Writable[] } })._stream?.pipes?.[0];

/** Waits until both the compressor and the response side have room. */
async function room(sheet: Sheet, out: PassThrough): Promise<void> {
  const zip = zipInput(sheet);
  if (zip !== undefined) await drained(zip);
  await drained(out);
}

async function write<T>(
  wb: Writer,
  out: PassThrough,
  spec: SheetSpec<T>,
  batches: AsyncIterator<readonly T[]>,
  first: IteratorResult<readonly T[]>,
  maxRows: number,
): Promise<void> {
  let n = 1;
  let sheet = addSheet(wb, spec, n);
  let rows = 0;
  for (let r = first; r.done !== true; r = await batches.next()) {
    for (const row of r.value) {
      if (rows === maxRows) {
        sheet.commit();
        sheet = addSheet(wb, spec, (n += 1));
        rows = 0;
      }
      sheet.addRow(spec.columns.map((c) => c.value(row))).commit();
      rows += 1;
    }
    // The download went away: stop reading the database for nobody.
    if (out.destroyed) {
      await batches.return?.(undefined);
      return;
    }
    // A slow connection throttles the reads instead of growing the heap.
    await room(sheet, out);
  }
  sheet.commit();
  await wb.commit();
}

/**
 * The workbook as a web stream, for a `Response` body. The first batch is read
 * **before** the stream is returned, so a database that is down or busy still
 * fails the request with a status; a failure after that aborts the download,
 * which the browser reports as failed rather than saving a truncated file.
 */
export async function streamWorkbook<T>(
  spec: SheetSpec<T>,
  batches: AsyncIterable<readonly T[]>,
  { maxRows = EXCEL_MAX_DATA_ROWS, exportedAt = new Date() }: StreamOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const iterator = batches[Symbol.asyncIterator]();
  const first = await iterator.next();
  const ExcelJs = await loadExcelJs();
  const out = new PassThrough({ highWaterMark: 1 << 20 });
  const wb = new ExcelJs.stream.xlsx.WorkbookWriter({
    stream: out,
    useStyles: true,
    // Shared strings would keep every distinct text in memory to the end.
    useSharedStrings: false,
  });
  wb.creator = 'Xangarro';
  wb.created = exportedAt;
  wb.modified = exportedAt;
  write(wb, out, spec, iterator, first, maxRows).catch((error: unknown) =>
    out.destroy(error as Error),
  );
  return Readable.toWeb(out) as ReadableStream<Uint8Array>;
}
