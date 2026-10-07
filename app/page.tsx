"use client";

import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { ArrowDownToLine, ArrowRight, Check, Copy, ExternalLink, Link2, LoaderCircle, QrCode, RotateCcw, Sparkles, Trash2 } from "lucide-react";

type ShortLink = { slug: string; url: string; createdAt: number; clicks: number };

export default function Home() {
  const [tab, setTab] = useState<"shorten" | "qr">("shorten");
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [qrData, setQrData] = useState("");
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [created, setCreated] = useState<ShortLink | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");

  async function refresh() {
    try { const data = await (await fetch("/api/links")).json() as { links?: ShortLink[] }; if (Array.isArray(data.links)) setLinks(data.links); }
    catch { setError("Could not load your links."); }
  }
  useEffect(() => { setOrigin(window.location.origin); void refresh(); }, []);
  async function copy(value: string, key: string) {
    try { await navigator.clipboard.writeText(value); setCopied(key); window.setTimeout(() => setCopied(""), 2000); }
    catch { setError("Clipboard access is unavailable. Please copy the link manually."); }
  }
  function normalized(value: string) {
    const parsed = new URL(value.trim());
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Enter a valid http or https URL.");
    return parsed.href;
  }
  async function shorten(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const response = await fetch("/api/links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: normalized(url), alias: alias.trim() }) });
      const data = await response.json() as { error?: string; link?: ShortLink };
      if (!response.ok) throw new Error(data.error || "Could not create this link.");
      if (!data.link) throw new Error("Could not create this link.");
      const link = data.link;
      setCreated(link); setLinks(previous => [link, ...previous]); setAlias("");
      setQrUrl(`${window.location.origin}/${link.slug}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create this link."); }
    finally { setBusy(false); }
  }
  async function createQr(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try { setQrData(await QRCode.toDataURL(normalized(qrUrl), { errorCorrectionLevel: "H", margin: 2, width: 640, color: { dark: "#171b28", light: "#ffffff" } })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the QR code."); }
    finally { setBusy(false); }
  }
  async function deleteLink(slug: string) {
    try {
      const response = await fetch(`/api/links/${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setLinks(previous => previous.filter(link => link.slug !== slug));
      if (created?.slug === slug) setCreated(null);
    } catch { setError("Could not delete this link."); }
  }
  function downloadQr() {
    if (!qrData) return;
    const anchor = document.createElement("a"); anchor.href = qrData; anchor.download = "kisu-qrcode.png"; anchor.click();
  }

  const shortUrl = created && origin ? `${origin}/${created.slug}` : "";
  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href="/" aria-label="Kisu Link home"><span className="brand-mark"><Link2 size={21} strokeWidth={2.8}/></span><span>kisu<span className="brand-dot">.</span>link</span></a>
      <div className="header-right"><span className="header-caption">YOUR LINK STUDIO</span><span className="status"><span className="status-dot"/> All systems ready</span></div>
    </header>

    <main className="main-content">
      <section className="hero"><div className="eyebrow"><Sparkles size={13}/> SIMPLE TOOLS, BIG IMPACT</div><h1>Make every link <em>count.</em></h1><p>Short links and beautiful QR codes, made in seconds.<br className="desktop-break"/> One clean place for everything you share.</p></section>
      <section className="workspace" aria-label="Link tools">
        <div className="workspace-header"><div className="tabs" role="tablist" aria-label="Choose tool"><button role="tab" aria-selected={tab === "shorten"} className={tab === "shorten" ? "tab active" : "tab"} onClick={() => {setTab("shorten");setError("");}}><Link2 size={17}/> Shorten link</button><button role="tab" aria-selected={tab === "qr"} className={tab === "qr" ? "tab active" : "tab"} onClick={() => {setTab("qr");setError("");}}><QrCode size={17}/> QR code</button></div><span className="free-tag">✦ &nbsp; FREE TO USE</span></div>
        {tab === "shorten" ? <div className="panel-content">
          <div className="panel-heading"><span className="tool-icon"><Link2 size={23}/></span><div><h2>Shorten a URL</h2><p>Turn a long link into something easy to remember.</p></div></div>
          <form onSubmit={shorten}><label htmlFor="long-url">Your long URL</label><div className="input-wrap"><Link2 size={18}/><input id="long-url" type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/your-very-long-link"/></div>
            <div className="field-bottom"><div><label htmlFor="alias">Custom alias <span className="optional">(optional)</span></label><div className="alias-wrap"><span>{origin ? new URL(origin).host : "your.domain"}/</span><input id="alias" value={alias} onChange={e => setAlias(e.target.value)} placeholder="my-link" maxLength={32} pattern="[A-Za-z0-9_-]{3,32}" title="3–32 letters, numbers, dashes or underscores"/></div></div><button type="submit" className="primary-button" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <>Shorten URL <ArrowRight size={18}/></>}</button></div>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
          {created && <div className="result" aria-live="polite"><div className="result-text"><span><Check size={15}/> YOUR LINK IS READY</span><strong>{shortUrl}</strong><small>{created.url}</small></div><button className="copy-button" onClick={() => copy(shortUrl, "created")}>{copied === "created" ? <Check size={16}/> : <Copy size={16}/>} {copied === "created" ? "Copied" : "Copy link"}</button></div>}
        </div> : <div className="panel-content qr-panel">
          <div className="panel-heading"><span className="tool-icon"><QrCode size={23}/></span><div><h2>Create a QR code</h2><p>Make any URL easy to scan and share.</p></div></div>
          <form onSubmit={createQr}><label htmlFor="qr-url">URL to encode</label><div className="input-wrap"><Link2 size={18}/><input id="qr-url" type="url" required value={qrUrl} onChange={e => setQrUrl(e.target.value)} placeholder="https://example.com"/></div><button type="submit" className="primary-button qr-submit" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin"/> : <>Generate QR code <ArrowRight size={18}/></>}</button></form>
          {error && <p className="error" role="alert">{error}</p>}
          {qrData && <div className="qr-result" aria-live="polite"><img src={qrData} alt={`QR code for ${qrUrl}`}/><div><strong>Ready to scan</strong><p>Download a high resolution PNG for sharing or printing.</p><button className="copy-button" onClick={downloadQr}><ArrowDownToLine size={16}/> Download PNG</button></div></div>}
        </div>}
        <div className="workspace-footer"><span><Check size={14}/> Saved links</span><span><Check size={14}/> Instant results</span><span><Check size={14}/> Simple by design</span></div>
      </section>

      <section className="links-section"><div className="section-title"><div><span className="section-kicker">YOUR SPACE</span><h2>Recent links <span>{links.length}</span></h2></div><button className="refresh-button" onClick={() => void refresh()}><RotateCcw size={15}/> Refresh</button></div>
        {links.length ? <div className="link-list">{links.map(link => <div className="link-row" key={link.slug}><span className="row-icon"><Link2 size={19}/></span><div className="row-details"><a href={`/${link.slug}`} target="_blank" rel="noopener noreferrer">{origin}/{link.slug} <ExternalLink size={13}/></a><span>{link.url}</span></div><div className="row-meta"><span>{link.clicks} clicks</span><span>{new Date(link.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div><div className="row-actions"><button aria-label={`Copy ${link.slug}`} title="Copy link" onClick={() => copy(`${origin}/${link.slug}`, link.slug)}>{copied === link.slug ? <Check size={17}/> : <Copy size={17}/>}</button><button aria-label={`Create QR code for ${link.slug}`} title="Create QR code" onClick={() => {setQrUrl(`${origin}/${link.slug}`);setQrData("");setTab("qr");window.scrollTo({top:0,behavior:"smooth"});}}><QrCode size={17}/></button><button aria-label={`Delete ${link.slug}`} title="Delete link" onClick={() => deleteLink(link.slug)}><Trash2 size={17}/></button></div></div>)}</div> : <div className="empty-links"><span className="empty-icon"><Link2 size={24}/></span><strong>No links yet</strong><p>Your shortened links will show up here. Create your first one above.</p></div>}
      </section>
    </main>
    <footer className="site-footer"><span className="footer-brand">kisu<span>.</span>link</span><span>Less link. More connection.</span><span>Made for sharing ✦</span></footer>
  </div>;
}
