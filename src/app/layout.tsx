import type { Metadata } from "next";
import { AuthProvider } from "../shared/providers/AuthProvider";
import { ToastProvider } from "@/shared/components/ui/toast";
import { NotificationPopup } from "@/shared/components/ui/NotificationPopup";
import { ExamResultNotifier } from "@/features/exam/components/ExamResultNotifier";
import { NoticeNotifier } from "@/features/notice/components/NoticeNotifier";
import "./globals.css";

export const metadata: Metadata = {
  title: "DP-SMS — School Management System",
  description: "Digital Pathshala School Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg-default text-content-default antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
          <ExamResultNotifier />
          <NoticeNotifier />
          <NotificationPopup />
        </AuthProvider>
      </body>
    </html>
  );
}
