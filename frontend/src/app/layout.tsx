import "./globals.css";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <nav className="border-b p-3 flex gap-4">
          <Link href="/">Home</Link>
          <Link href="/chat">Chat</Link>
          <Link href="/journal">Journal</Link>
          <Link href="/checkin">Check-in</Link>
        </nav>
        <main className="p-4 max-w-3xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
