import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Vault",
  description: "Personal financial dashboard powered by Gmail",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <main className="min-h-screen max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
