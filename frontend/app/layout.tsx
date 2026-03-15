import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conversational BI Dashboard | AI-Powered Business Intelligence",
  description:
    "Ask questions in plain English and get instant interactive business dashboards powered by Google Gemini AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
