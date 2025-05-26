// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google"; // Importando como FontSans
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils"; // Importando cn se você usar para o body

const fontSans = FontSans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Painel de Controle TDAH",
  description: "Seu painel para gerenciar tarefas e manter o foco.",
  manifest: "/manifest.json",
  icons: { apple: "/icon-192x192.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body 
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable // Aplicando a variável da fonte
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}