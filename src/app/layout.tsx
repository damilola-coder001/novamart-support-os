import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { DemoHeader } from "@/components/layout/DemoHeader";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NovaMart Support OS — AI Customer Support Automation",
  description:
    "Enterprise-grade AI customer support platform with autonomous resolution, controlled tools, human escalation, and agent copilot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-background text-foreground`}>
        <ThemeProvider>
          <SessionProvider>
            <DemoHeader />
            <main className="flex-1 flex flex-col">{children}</main>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
