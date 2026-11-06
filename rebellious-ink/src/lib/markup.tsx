import { escapeHtml } from "./enquiries";

/** Tiny deterministic renderer for the document library markup. No raw HTML allowed in content. */
export function renderDocumentBody(body: string) {
  const lines = body.split("\n");
  const out: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let key = 0;
  const flush = () => {
    if (para.length) { out.push(<p key={key++}>{para.join(" ")}</p>); para = []; }
    if (list.length) { out.push(<ul key={key++}>{list.map((l, i) => <li key={i}>{l}</li>)}</ul>); list = []; }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("# ")) { flush(); out.push(<h2 key={key++}>{line.slice(2)}</h2>); }
    else if (line.startsWith("- ")) { if (para.length) flush(); list.push(line.slice(2)); }
    else if (line.startsWith("! ")) { flush(); out.push(<div key={key++} className="callout urgent"><strong>Important: </strong>{line.slice(2)}</div>); }
    else if (line.startsWith("> ")) { flush(); out.push(<div key={key++} className="callout">{line.slice(2)}</div>); }
    else if (line === "") { flush(); }
    else { if (list.length) flush(); para.push(line); }
  }
  flush();
  return out;
}

export { escapeHtml };
