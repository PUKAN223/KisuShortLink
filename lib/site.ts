export const SHORT_LINK_ORIGIN = "https://qr.kisux3.xyz";

export function shortLinkUrl(slug: string): string {
  return `${SHORT_LINK_ORIGIN}/${slug}`;
}
