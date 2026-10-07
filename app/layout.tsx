import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Kisu Link — Personal workspace",
  description: "Personal short link and QR code manager.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body>{children}</body></html>;
}
