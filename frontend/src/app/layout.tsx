import "./globals.css";
import { CategoriaProvider } from '../context/CategoriaContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <CategoriaProvider>
          {children}
        </CategoriaProvider>
      </body>
    </html>
  );
}
