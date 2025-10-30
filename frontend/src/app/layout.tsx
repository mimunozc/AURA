import "./globals.css";

export const metadata = {
  title: "AURA",
  description: "Bienestar emocional",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
