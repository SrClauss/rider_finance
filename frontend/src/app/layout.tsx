import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { SessionProvider } from '@/context/SessionContext';
import { MetasProvider } from '@/context/MetasContext';
import { CategoriaProvider } from '@/context/CategoriaContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rider Finance",
  description: "Sistema de gestão financeira pessoal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <MetasProvider>
              <CategoriaProvider>
                {children}
              </CategoriaProvider>
            </MetasProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
