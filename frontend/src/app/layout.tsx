import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "AURA", description: "Acompañante de bienestar" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8EA7FF" />
      </head>
      <body className={`${inter.className} min-h-dvh bg-brand-bg text-brand-text`}>
        {children}
      </body>
    </html>
  );
}
