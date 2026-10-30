import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Irama Kerja MAZARIN",
  description: "Ruang kerja bersama untuk target, laporan, dan rapat mingguan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
