import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from '@/components/ThemeRegistry';

export const metadata: Metadata = {
  title: "Desk Booking App",
  description: "Book your workspace with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
