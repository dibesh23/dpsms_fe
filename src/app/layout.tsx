import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "../shared/providers/AuthProvider";
import { ToastProvider } from "@/shared/components/ui/toast";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "DP-SMS — School Management System",
  description: "Digital Pathshala School Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased bg-bg-default text-content-default`}>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
