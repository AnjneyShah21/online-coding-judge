import type { Metadata } from "next";
import "./globals.css";
import InteractiveMesh from "@/components/InteractiveMesh";

export const metadata: Metadata = {
  title: "AI Judge | Competitive Programming Platform",
  description:
    "A modern online judge platform with AI-powered test case generation, smart hints, and code review. Submit your solutions in Python, C++, or JavaScript.",
  keywords: ["online judge", "competitive programming", "coding platform", "AI judge"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <InteractiveMesh />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
