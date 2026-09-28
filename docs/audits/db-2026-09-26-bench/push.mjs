// Replays POST /sync/push against the benchmark DB with the repo's own postgres.js.
//   node push.mjs <rows|batch> <ticketsPerPush> <clients> <seconds> [hot] [rttMs]
// rows  = today's code: per delta -> ref checks, receipt lookup, SAVEPOINT (never released),
//         upsert, cursor bump, [sync_log], receipt upsert.  batch = one statement per table.
// Each ticket = 1 ticket + 2 sale lines + 2 stock movements = 5 deltas.
import postgres from 'postgres'; // run from the repo root so it resolves the workspace copy
const [mode, K, C, SECS, hot, rttArg] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5], process.argv[6] === 'hot', process.argv[7]];
const RTT = rttArg === undefined ? 1 : +rttArg;
const sql = postgres('postgres://xangarro_app:xangarro_app@localhost:55498/xangarro', { max: C, prepare: false, onnotice: () => {} });
const admin = postgres('postgres://postgres:xangarro@localhost:55498/xangarro', { max: 1 });
const tenants = await admin`select t.id, (select id from bench.prod p where p.business_id = t.id and p.k = 1) pid from bench.tenants t order by n`;
const pool = hot ? tenants.slice(1000, 1003) : tenants;
const sleep = (ms) => (ms ? new Promise((r) => setTimeout(r, ms)) : null);
let folio = 200_000_000 + Math.floor(Math.random() * 1e8);
const uid = () => crypto.randomUUID();
async function q(tx, strings, ...v) { if (!strings.raw) Object.defineProperty(strings, "raw", { value: strings }); await sleep(RTT); return tx(strings, ...v); }

async function pushRows(tx, bid, dev, pid) {
  for (let t = 0; t < K; t++) {
    const tk = uid();
    const deltas = [['tickets', tk], ['sales', uid()], ['inventory_movements', uid()], ['sales', uid()], ['inventory_movements', uid()]];
    for (const [tbl, rid] of deltas) {
      await q(tx, ['select id from products where id = ', ''], pid);
      if (tbl !== 'tickets') await q(tx, ['select id from products where id = ', ''], pid);
      await q(tx, ['select seq from sync_receipts where table_name = ', ' and row_id = ', ''], tbl, rid);
      await sleep(RTT);
      await tx.savepoint(async (sp) => {
        if (tbl === 'tickets')
          await q(sp, ["insert into tickets (id,business_id,device_id,folio,fecha,concepto,metodo,estado_pago,created_at,updated_at) values (", ",", ",", ",", ",to_char(now(),'YYYY-MM-DD'),'Venta','Efectivo','pagado',now(),now()) on conflict (id) do update set concepto = excluded.concepto where tickets.updated_at < excluded.updated_at returning id"], rid, bid, dev, folio++);
        else if (tbl === 'sales')
          await q(sp, ["insert into sales (id,business_id,device_id,ticket_id,fecha,concepto,categoria,monto_centavos,producto_id,cantidad,created_at,updated_at) values (", ",", ",", ",", ",to_char(now(),'YYYY-MM-DD'),'Producto','Producto',5000,", ",1,now(),now()) on conflict (id) do update set concepto = excluded.concepto where sales.updated_at < excluded.updated_at returning id"], rid, bid, dev, tk, pid);
        else
          await q(sp, ["insert into inventory_movements (id,business_id,device_id,producto_id,fecha,tipo,cantidad,costo_unit_centavos,motivo,origen,created_at,updated_at) values (", ",", ",", ",", ",to_char(now(),'YYYY-MM-DD'),'salida',1,1500,'Venta','venta',now(),now()) on conflict (id) do nothing returning id"], rid, bid, dev, pid);
        const [{ seq }] = await q(sp, ['insert into sync_cursors (business_id,last_seq) values (', ',1) on conflict (business_id) do update set last_seq = sync_cursors.last_seq + 1 returning last_seq as seq'], bid);
        if (tbl === 'inventory_movements')
          await q(sp, ['insert into sync_log (seq,table_name,row_id,op,business_id,created_at,updated_at) values (', ',', ',', ",'insert',", ',now(),now())'], seq, tbl, rid, bid);
        await q(sp, ['insert into sync_receipts (table_name,row_id,seq,device_id,row_updated_at,received_at,business_id) values (', ',', ',', ',', ',now(),now(),', ') on conflict (business_id,table_name,row_id) do update set seq = excluded.seq'], tbl, rid, seq, dev, bid);
      });
    }
  }
}

async function pushBatch(tx, bid, dev, pid) {
  const n = 5 * K;
  const tks = Array.from({ length: K }, () => ({ t: uid(), s: [uid(), uid()], m: [uid(), uid()], f: folio++ }));
  const all = tks.flatMap((x) => [['tickets', x.t], ['sales', x.s[0]], ['sales', x.s[1]], ['inventory_movements', x.m[0]], ['inventory_movements', x.m[1]]]);
  await q(tx, ['select id from products where id = any(', ')'], [pid]);
  await q(tx, ['select r.table_name, r.row_id from sync_receipts r join unnest(', '::text[], ', '::text[]) u(t, id) on r.table_name = u.t and r.row_id = u.id'], all.map((a) => a[0]), all.map((a) => a[1]));
  const [{ seq }] = await q(tx, ['insert into sync_cursors (business_id,last_seq) values (', ',', ') on conflict (business_id) do update set last_seq = sync_cursors.last_seq + excluded.last_seq returning last_seq as seq'], bid, n);
  const d = new Date().toISOString(), day = d.slice(0, 10);
  await q(tx, ['insert into tickets ', ' on conflict (id) do update set concepto = excluded.concepto where tickets.updated_at < excluded.updated_at'],
    tx(tks.map((x) => ({ id: x.t, business_id: bid, device_id: dev, folio: x.f, fecha: day, concepto: 'Venta', metodo: 'Efectivo', estado_pago: 'pagado', created_at: d, updated_at: d }))));
  await q(tx, ['insert into sales ', ' on conflict (id) do update set concepto = excluded.concepto where sales.updated_at < excluded.updated_at'],
    tx(tks.flatMap((x) => x.s.map((id) => ({ id, business_id: bid, device_id: dev, ticket_id: x.t, fecha: day, concepto: 'Producto', categoria: 'Producto', monto_centavos: 5000, producto_id: pid, cantidad: 1, created_at: d, updated_at: d })))));
  await q(tx, ['insert into inventory_movements ', ' on conflict (id) do nothing'],
    tx(tks.flatMap((x) => x.m.map((id) => ({ id, business_id: bid, device_id: dev, producto_id: pid, fecha: day, tipo: 'salida', cantidad: 1, costo_unit_centavos: 1500, motivo: 'Venta', origen: 'venta', created_at: d, updated_at: d })))));
  const base = Number(seq) - n;
  await q(tx, ['insert into sync_log ', ''], tx(all.map((a, i) => ({ a, i })).filter(({ a }) => a[0] === 'inventory_movements').map(({ a, i }) => ({ seq: base + i + 1, table_name: a[0], row_id: a[1], op: 'insert', business_id: bid, created_at: d, updated_at: d }))));
  await q(tx, ['insert into sync_receipts ', ' on conflict (business_id,table_name,row_id) do update set seq = excluded.seq'],
    tx(all.map((a, i) => ({ table_name: a[0], row_id: a[1], seq: base + i + 1, device_id: dev, row_updated_at: d, received_at: d, business_id: bid }))));
}

const lat = []; let errors = 0; const errKinds = {};
const end = Date.now() + SECS * 1000;
async function worker() {
  while (Date.now() < end) {
    const t = pool[Math.floor(Math.random() * pool.length)];
    const bid = t.id, dev = `DEV-${bid}-1`, t0 = performance.now();
    try {
      // device route: auth tx + throttle + latency (as deviceRoute does), then the tenant tx
      await sleep(RTT); await sql.begin(async (tx) => { await q(tx, ["select set_config('xangarro.business_id', ", ', true)'], bid); await q(tx, ['select revoked_at from devices where id = ', ''], dev); });
      await q(sql, ["select xangarro.throttle_take('device:' || ", ', 100000, 60)'], dev);
      if (!process.env.NOLAT) await q(sql, ["select xangarro.api_latency_record('sync/push', 120)"]);
      await sleep(RTT);
      await sql.begin(async (tx) => {
        await q(tx, ["select set_config('request.jwt.claims', ", ', true)'], JSON.stringify({ business_id: bid }));
        if (mode === 'rows') await pushRows(tx, bid, dev, t.pid); else await pushBatch(tx, bid, dev, t.pid);
        await q(tx, ['update devices set acknowledged_through = greatest(acknowledged_through, 1), last_push_at = now() where id = ', ''], dev);
        await q(tx, ['select last_seq from sync_cursors']);
      });
      lat.push(performance.now() - t0);
    } catch (e) { errors++; errKinds[e.code ?? e.message] = (errKinds[e.code ?? e.message] ?? 0) + 1; }
  }
}
await Promise.all(Array.from({ length: C }, worker));
lat.sort((a, b) => a - b);
const p = (x) => (lat.length ? lat[Math.min(lat.length - 1, Math.floor(x * lat.length))].toFixed(0) : '-');
const rate = lat.length / SECS;
console.log(`RESULT ${mode} K=${K} (${5 * K} deltas) c=${C}${hot ? ' HOT(3 tenants)' : ''} rtt=${RTT}ms | pushes/s=${rate.toFixed(1)} deltas/s=${(rate * 5 * K).toFixed(0)} | p50=${p(0.5)}ms p95=${p(0.95)}ms p99=${p(0.99)}ms max=${p(1)}ms | errors=${errors} ${JSON.stringify(errKinds)}`);
await sql.end(); await admin.end();
