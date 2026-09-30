import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import { AdminProviders } from "src/providers/admin-providers";
import "src/styles/admin.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-admin" });

export const metadata: Metadata = {
  title: { default: "ZTES Admin", template: "%s · ZTES Admin" },
  description: "Store administration.",
  robots: { index: false, follow: false },
};

/** The admin's own root layout — English, LTR, entirely separate from the storefront's `[locale]` tree. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={inter.variable}>
      <body className="font-sans antialiased">
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
