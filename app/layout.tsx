import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "./providers";

export const metadata = {
  title: "Deadline Manager",
  description: "Urgency-first deadline management",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
