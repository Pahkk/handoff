import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://opryn.app"),
  title: "Opryn — Build a Business That Doesn't Depend on You",
  description:
    "Opryn learns how you run your business, trains the people you hire, and answers the questions that used to interrupt you.",
  openGraph: {
    title: "Opryn — Build a Business That Doesn't Depend on You",
    description:
      "Turn how you work into the systems your team needs to run the business without you.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
