import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Orbit News Network", template: "%s · ONN" },
  description: "The intelligence and publishing network behind every Orbit application.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
