import type { ReactNode } from "react";
import "./globals.css";

/**
 * Root layout — passes through so [locale]/layout can own <html lang>.
 * Required by Next.js App Router.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
