
import "./globals.css";
import MainLayout from "../layouts/MainLayout";
import { TitleProvider } from "../context/TitleContext";
import { ThemeProvider } from "../theme/ThemeProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeProvider>
          <TitleProvider>
            <MainLayout>{children}</MainLayout>
          </TitleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
