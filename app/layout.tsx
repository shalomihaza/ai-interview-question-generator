import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Question Generator",
  description:
    "Generate role-specific interview questions from a generic job title.",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
