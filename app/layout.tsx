import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Kisu Link — Short links & QR codes",
  description: "Create memorable short links and downloadable QR codes in seconds.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body>{children}</body></html>;
}
