"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Link2, LoaderCircle, RotateCcw, X } from "lucide-react";
import { RecentLink, type ShortLink } from "../components/recent-link";
import { SHORT_LINK_ORIGIN, shortLinkUrl } from "../lib/site";

async function loadLinks(): Promise<ShortLink[]> {
  const response = await fetch("/api/links");
  if (!response.ok) throw new Error();
  const data = await response.json() as { links?: ShortLink[] };
  return Array.isArray(data.links) ? data.links : [];
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [toast, setToast] = useState<ShortLink | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [toastPaused, setToastPaused] = useState(false);

  useEffect(() => {
    loadLinks().then(setLinks).catch(() => setListError("Could not load your links. Try refreshing.")).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!toast || toastPaused) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast, toastPaused]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(""), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function refresh() {
    setLoading(true);
    setListError("");
    try { setLinks(await loadLinks()); }
    catch { setListError("Could not refresh your links. Your current list is still shown."); }
    finally { setLoading(false); }
  }

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);

    } catch { setListError("Clipboard access is unavailable. Select the link text to copy it."); }
  }

  async function shorten(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const parsed = new URL(url.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Enter a valid http or https URL.");
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsed.href, alias: alias.trim() }),
      });
      const data = await response.json() as { error?: string; link?: ShortLink };
      if (!response.ok || !data.link) throw new Error(data.error || "Could not create this link.");
      const link = data.link;
      setLinks(previous => [link, ...previous]);
      setEditingSlug(link.slug);
      setToast(link);
      setToastPaused(false);
      setUrl("");
      setAlias("");
      window.setTimeout(() => document.getElementById(`link-${link.slug}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }), 0);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create this link."); }
    finally { setBusy(false); }
  }

  async function deleteLink(slug: string) {
      const response = await fetch(`/api/links/${encodeURIComponent(slug)}`, { method: "DELETE" });
      if (!response.ok) throw new Error();
      setLinks(previous => previous.filter(link => link.slug !== slug));
      if (editingSlug === slug) setEditingSlug(null);
      if (toast?.slug === slug) setToast(null);
      try { window.localStorage.removeItem(`kisux3:qr:${slug}`); } catch { /* Storage may be unavailable. */ }
      window.requestAnimationFrame(() => document.getElementById("recent-heading")?.focus());
  }

  return <div className="app-shell">
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Kisux3 home"><span className="brand-mark"><Link2 size={21} strokeWidth={2.8}/></span><span>kisux3<span className="brand-dot">.</span>xyz</span></Link>
      <span className="header-caption">PERSONAL WORKSPACE</span>
    </header>

    <main className="main-content">
      <section className="hero"><h1>Short links</h1><p>Create a link. Its QR code appears with it below.</p></section>
      <section className="workspace" aria-label="Create a short link">
        <div className="panel-content">
          <div className="panel-heading"><span className="tool-icon"><Link2 size={23}/></span><div><h2>Shorten a URL</h2><p>Add a destination and an optional alias.</p></div></div>
          <form onSubmit={shorten}>
            <label htmlFor="long-url">Destination URL</label><div className="input-wrap"><Link2 size={18}/><input id="long-url" type="url" maxLength={2048} autoComplete="url" autoCapitalize="none" spellCheck={false} required value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com/page"/></div>
            <div className="field-bottom"><div><label htmlFor="alias">Custom alias <span className="optional">(optional)</span></label><div className="alias-wrap"><span>{new URL(SHORT_LINK_ORIGIN).host}/</span><input id="alias" autoCapitalize="none" spellCheck={false} aria-describedby="alias-help" value={alias} onChange={event => setAlias(event.target.value)} placeholder="my-link" maxLength={32} pattern="[A-Za-z0-9_-]{3,32}" title="3–32 letters, numbers, dashes or underscores"/></div></div><button type="submit" className="primary-button" disabled={busy || loading}>{busy ? <><LoaderCircle size={18} className="spin"/> Creating…</> : <>Create link <ArrowRight size={18}/></>}</button></div>
            <p id="alias-help" className="field-help">Alias: 3–32 letters, numbers, dashes, or underscores.</p>
          </form>
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      </section>

      <section className="links-section"><div className="section-title"><h2 id="recent-heading" tabIndex={-1}>Recent links <span>{links.length}</span></h2><button className="refresh-button" disabled={loading || busy} onClick={() => void refresh()}><RotateCcw size={15} className={loading ? "spin" : undefined}/> {loading ? "Loading…" : "Refresh"}</button></div>
        {listError && <p className="list-error" role="alert">{listError}</p>}
        {loading && !links.length ? <div className="list-loading" role="status"><LoaderCircle size={20} className="spin"/> Loading links…</div> : links.length ? <div className="link-list">{links.map(link => <RecentLink key={link.slug} link={link} expanded={editingSlug === link.slug} copied={copied === link.slug} onToggle={() => setEditingSlug(editingSlug === link.slug ? null : link.slug)} onCopy={() => void copy(shortLinkUrl(link.slug), link.slug)} onDelete={() => deleteLink(link.slug)}/>)}</div> : listError ? null : <div className="empty-links"><span className="empty-icon"><Link2 size={24}/></span><strong>No links yet</strong><p>Create one above to get a short URL and QR code.</p></div>}
      </section>
    </main>
    {toast && <div className="toast" aria-label="Notification" onMouseEnter={() => setToastPaused(true)} onMouseLeave={() => setToastPaused(false)} onFocus={() => setToastPaused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setToastPaused(false); }}>
      <span className="toast-icon"><Check size={17}/></span>
      <div className="toast-content"><strong role="status">Link added</strong><span>{shortLinkUrl(toast.slug)}</span></div>
      <button className="toast-copy" onClick={() => void copy(shortLinkUrl(toast.slug), toast.slug)}>{copied === toast.slug ? <Check size={15}/> : <Copy size={15}/>} {copied === toast.slug ? "Copied" : "Copy"}</button>
      <button className="toast-close" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16}/></button>
    </div>}
  </div>;
}
