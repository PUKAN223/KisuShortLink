export const SHORT_LINK_ORIGIN = "https://kisux3.xyz";

export function shortLinkUrl(slug: string): string {
  return `${SHORT_LINK_ORIGIN}/${slug}`;
}
