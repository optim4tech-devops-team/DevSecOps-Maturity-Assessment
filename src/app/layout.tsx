import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevOps & DevSecOps Maturity Assessment",
  description: "Global DevOps & DevSecOps Maturity Assessment Platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
