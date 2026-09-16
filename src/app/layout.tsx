import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
  title: "SMRIDHI | Business Compliance & Tax Made Simple",
  description:
    "SMRIDHI helps Indian businesses manage GST, Income Tax, Accounting, Bookkeeping and ROC compliance with expert support.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}