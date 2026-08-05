import type { Metadata } from "next";
import { AuthProvider } from "../shared/providers/AuthProvider";
import "./globals.css";

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
      <body className="antialiased bg-bg-default text-content-default">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
