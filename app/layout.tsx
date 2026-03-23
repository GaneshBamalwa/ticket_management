import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "Customer Support Portal - Ticket Management System",
  description:
    "A modern ticket management system for customer support. Submit tickets, track status, and get help from our support team.",
};

export const viewport: Viewport = {
  themeColor: "#020818",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full">
      <body
        className={`${inter.variable} ${syne.variable} font-sans antialiased w-full min-w-full`}
      >
        <div className="flex min-h-screen w-full flex-col">
          <Navbar />
          <main className="relative z-10 flex-1 w-full page-enter">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
