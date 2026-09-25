/**
 * A legal text page on xangarro.mx (N-34): the aviso de privacidad and the
 * ARCO procedure, rendered from their Markdown source in docs/legal/aviso,
 * so the published text is the reviewed text and there is no second copy.
 */
import { parseLegalMarkdown } from './markdown.js';

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|(?<![\w])_[^_]+_(?![\w]))/g;

/** Bold, code and emphasis; everything else is text. */
function Inline({ text }) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function Table({ head, rows }) {
  return (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} style={cellStyle(true)}>
                <Inline text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={cellStyle(false)}>
                  <Inline text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellStyle(head) {
  return {
    border: '1.5px solid var(--black)',
    padding: '8px 10px',
    textAlign: 'left',
    verticalAlign: 'top',
    background: head ? 'var(--yellow)' : 'var(--white)',
  };
}

function Block({ block }) {
  if (block.type === 'heading') {
    // The document's `#` title is the page's H1; deeper levels keep their rank.
    const Tag = `h${Math.min(block.level, 4)}`;
    return (
      <Tag style={{ marginTop: block.level === 1 ? 0 : 28 }}>
        <Inline text={block.text} />
      </Tag>
    );
  }
  if (block.type === 'table') return <Table head={block.head} rows={block.rows} />;
  if (block.type === 'ul' || block.type === 'ol') {
    const List = block.type;
    return (
      <List>
        {block.items.map((item, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            <Inline text={item} />
          </li>
        ))}
      </List>
    );
  }
  return (
    <p>
      <Inline text={block.text} />
    </p>
  );
}

export function LegalPage({ source, schema }) {
  const blocks = parseLegalMarkdown(source);
  return (
    <div
      style={{ fontFamily: 'var(--font-sans)', background: 'var(--offwhite)', minHeight: '100vh' }}
    >
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <header style={{ borderBottom: '2.5px solid var(--black)', background: 'var(--white)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '14px clamp(16px, 5vw, 28px)' }}>
          <a href="/" style={{ fontWeight: 900, color: 'var(--black)', textDecoration: 'none' }}>
            ← Xangarro
          </a>
        </div>
      </header>
      <main
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '32px clamp(16px, 5vw, 28px) 64px',
          lineHeight: 1.6,
        }}
      >
        {blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </main>
    </div>
  );
}
