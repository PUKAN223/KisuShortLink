"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ArrowDownToLine, Check, Copy, ExternalLink, LoaderCircle, QrCode, SlidersHorizontal, Trash2 } from "lucide-react";
import { renderQrCode, type QrStyle } from "../lib/qr-render";
import { shortLinkUrl } from "../lib/site";

export type ShortLink = { slug: string; url: string; createdAt: number; clicks: number };

type QrSettings = {
  style: QrStyle;
  foreground: string;
  background: string;
  logo: { name: string; data: string } | null;
};

const defaultSettings: QrSettings = {
  style: "square",
  foreground: "#171b28",
  background: "#ffffff",
  logo: null,
};

const storageKey = (slug: string) => `kisux3:qr:${slug}`;

function savedSettings(slug: string): QrSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const value = window.localStorage.getItem(storageKey(slug));
    if (!value) return defaultSettings;
    const parsed = JSON.parse(value) as Partial<QrSettings>;
    const color = /^#[0-9a-f]{6}$/i;
    if (!["square", "rounded", "dots"].includes(parsed.style ?? "") ||
      !color.test(parsed.foreground ?? "") || !color.test(parsed.background ?? "")) return defaultSettings;
    const logo = parsed.logo && typeof parsed.logo.name === "string" &&
      /^data:image\/(png|jpeg|webp);base64,/.test(parsed.logo.data)
      ? parsed.logo : null;
    return { style: parsed.style as QrStyle, foreground: parsed.foreground!, background: parsed.background!, logo };
  } catch { return defaultSettings; }
}

type Props = {
  link: ShortLink;
  expanded: boolean;
  copied: boolean;
  onToggle: () => void;
  onCopy: () => void;
  onDelete: () => Promise<void>;
};

export function RecentLink({ link, expanded, copied, onToggle, onCopy, onDelete }: Props) {
  const [settings, setSettings] = useState<QrSettings>(() => savedSettings(link.slug));
  const [qrData, setQrData] = useState("");
  const [qrError, setQrError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [renderedSettings, setRenderedSettings] = useState<QrSettings | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const settingsButton = useRef<HTMLButtonElement>(null);
  const deleteButton = useRef<HTMLButtonElement>(null);
  const cancelDeleteButton = useRef<HTMLButtonElement>(null);
  const pending = settings !== renderedSettings;
  const shortUrl = shortLinkUrl(link.slug);

  useEffect(() => {
    let cancelled = false;
    renderQrCode(shortUrl, { ...settings, logo: settings.logo?.data, size: 240 })
      .then((data) => {
        if (cancelled) return;
        setQrData(data); setRenderedSettings(settings); setQrError("");
        try {
          window.localStorage.setItem(storageKey(link.slug), JSON.stringify(settings));
          setSaveError("");
        } catch { setSaveError("Settings could not be saved in this browser."); }
      })
      .catch((cause) => { if (!cancelled) { setQrData(""); setQrError(cause instanceof Error ? cause.message : "Could not draw the QR code."); } });
    return () => { cancelled = true; };
  }, [shortUrl, settings, link.slug]);

  function changeSettings(next: QrSettings) {
    setSettings(next);
    setQrError("");
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2_000_000) {
      setQrError("Choose a PNG, JPG, or WebP image under 2 MB.");
      return;
    }
    setUploading(true);
    try {
      const image = await createImageBitmap(file);
      try {
        if (image.width > 4096 || image.height > 4096) throw new Error("Choose an image smaller than 4096 pixels.");
        const scale = Math.min(1, 256 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Could not prepare that image.");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        changeSettings({ ...settings, logo: { name: file.name, data: canvas.toDataURL("image/png") } });
      } finally { image.close(); }
    } catch (cause) { setQrError(cause instanceof Error ? cause.message : "Could not read that image."); }
    finally { setUploading(false); }
  }

  async function downloadQr() {
    setDownloading(true);
    try {
      const png = await renderQrCode(shortUrl, { ...settings, logo: settings.logo?.data, size: 640 });
      const anchor = document.createElement("a");
      anchor.href = png;
      anchor.download = `${link.slug}-qr.png`;
      anchor.click();
    } catch (cause) { setQrError(cause instanceof Error ? cause.message : "Could not download the QR code."); }
    finally { setDownloading(false); }
  }

  async function removeLink() {
    setDeleting(true); setDeleteError("");
    try { await onDelete(); }
    catch { setDeleteError("Could not delete this link. Try again."); setDeleting(false); }
  }

  function closeEditor() {
    onToggle();
    settingsButton.current?.focus();
  }

  return <article id={`link-${link.slug}`} className="link-item">
    <div className="link-row">
      <button className="row-qr" aria-label={`Customize QR code for ${link.slug}`} aria-expanded={expanded} aria-controls={`qr-editor-${link.slug}`} onClick={onToggle}>{qrData ? <Image unoptimized src={qrData} width={64} height={64} alt=""/> : <QrCode size={24}/>}</button>
      <div className="row-details"><a href={shortUrl} target="_blank" rel="noopener noreferrer"><span className="short-link-text">{shortUrl}</span><ExternalLink size={13}/></a><span title={link.url}>{link.url}</span></div>
      <div className="row-meta"><span>{link.clicks} clicks</span><span>{new Date(link.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>
      <div className="row-actions"><button aria-label={`Copy ${link.slug}`} title="Copy link" onClick={onCopy}>{copied ? <Check size={17}/> : <Copy size={17}/>}</button><button ref={settingsButton} className="settings-action" aria-label={`QR settings for ${link.slug}`} aria-expanded={expanded} aria-controls={`qr-editor-${link.slug}`} title="QR settings" onClick={onToggle}><SlidersHorizontal size={17}/><span>QR settings</span></button><button ref={deleteButton} aria-label={`Delete ${link.slug}`} title="Delete link" onClick={() => { setConfirmDelete(true); window.requestAnimationFrame(() => cancelDeleteButton.current?.focus()); }}><Trash2 size={17}/></button></div>
    </div>
    {confirmDelete && <div className="delete-confirm" role="group" aria-label={`Confirm deletion of ${link.slug}`}><p>Delete <strong>{link.slug}</strong>? Its short URL and QR code will stop working.</p><div><button ref={cancelDeleteButton} disabled={deleting} onClick={() => { setConfirmDelete(false); setDeleteError(""); deleteButton.current?.focus(); }}>Cancel</button><button className="delete-confirm-action" disabled={deleting} onClick={() => void removeLink()}>{deleting ? "Deleting…" : "Delete link"}</button></div>{deleteError && <p className="error" role="alert">{deleteError}</p>}</div>}
    {expanded && <div id={`qr-editor-${link.slug}`} className="link-qr-editor" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); closeEditor(); } }}><div className="qr-editor-heading"><div><h3>QR settings</h3><p>{saveError ? "Changes are only available for this session." : qrError ? "Fix the settings below." : pending ? "Updating preview…" : "Saved in this browser."}</p></div><div className="editor-header-actions"><button className="qr-editor-close" disabled={uploading} onClick={() => changeSettings(defaultSettings)}>Reset</button><button className="qr-editor-close" onClick={closeEditor}>Close</button></div></div>
      <div className="qr-builder"><div className="qr-controls">
        <fieldset className="qr-customize" disabled={uploading}><legend className="sr-only">Customize QR code</legend>
          <div className="qr-option"><span className="qr-option-label">Style</span><div className="qr-style-options" role="group" aria-label={`QR style for ${link.slug}`}>{(["square", "rounded", "dots"] as const).map(style => <button key={style} type="button" aria-pressed={settings.style === style} className={settings.style === style ? "qr-style active" : "qr-style"} onClick={() => changeSettings({ ...settings, style })}>{style === "square" ? "Classic" : style === "rounded" ? "Rounded" : "Dots"}</button>)}</div></div>
          <div className="qr-color-options"><div className="qr-option"><label htmlFor={`qr-foreground-${link.slug}`}>Code color</label><div className="qr-color-field"><input id={`qr-foreground-${link.slug}`} type="color" value={settings.foreground} onChange={event => changeSettings({ ...settings, foreground: event.target.value })}/><span>{settings.foreground.toUpperCase()}</span></div></div><div className="qr-option"><label htmlFor={`qr-background-${link.slug}`}>Background</label><div className="qr-color-field"><input id={`qr-background-${link.slug}`} type="color" value={settings.background} onChange={event => changeSettings({ ...settings, background: event.target.value })}/><span>{settings.background.toUpperCase()}</span></div></div></div>
          <div className="qr-option"><span className="qr-option-label">Center image <span className="optional">(optional)</span></span><div className="qr-logo-field"><input id={`qr-logo-${link.slug}`} className="qr-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadLogo}/><label htmlFor={`qr-logo-${link.slug}`} className="qr-upload">{uploading ? "Preparing…" : "Choose image"}</label>{settings.logo && <><span className="qr-logo-name">{settings.logo.name}</span><button type="button" className="qr-remove" onClick={() => changeSettings({ ...settings, logo: null })}>Remove</button></>}</div><p className="qr-hint">PNG, JPG, or WebP, up to 2 MB. Scan the result before sharing.</p></div>
        </fieldset>
        {qrError && <p className="error" role="alert">{qrError}</p>}
        {saveError && <p className="error" role="alert">{saveError}</p>}
      </div>
      <aside className="qr-result" aria-label={`QR preview for ${link.slug}`}><strong>Preview</strong><div className="qr-preview-frame" aria-busy={pending && !qrError}>{qrData ? <Image unoptimized src={qrData} width={208} height={208} alt={`QR code for ${shortUrl}`}/> : <div className="qr-preview-empty"><QrCode size={34}/></div>}</div><p role="status">{qrError ? "Fix the settings to download." : pending ? "Updating preview…" : "640 × 640 PNG · Scan before sharing."}</p><button className="copy-button" onClick={downloadQr} disabled={!qrData || pending || downloading || uploading || !!qrError}>{downloading ? <LoaderCircle size={16} className="spin"/> : <ArrowDownToLine size={16}/>} Download PNG</button></aside>
      </div>
    </div>}
  </article>;
}
