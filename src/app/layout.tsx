import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tathya · तथ्य",
  description:
    "An evidence-first atlas of Sanātana Dharma and a structured ledger that documents and counters propaganda about it. Every claim sourced, every uncertainty named.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
