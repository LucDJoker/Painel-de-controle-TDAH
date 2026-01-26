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
  title: "Focus ERP",
  description: "Focus ERP — gerencie tarefas, finanças e mantenha o foco.",
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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
                if (typeof caches !== "undefined" && caches.keys) {
                  caches.keys().then(keys => keys.forEach(key => caches.delete(key)));
                }
              }
            `,
          }}
        />
      </head>
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