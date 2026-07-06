import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetingOS",
  description: "Voice memo intelligence. Decisions, commitments, contradictions.",
  icons: {
    icon: "/meetOSLogo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}