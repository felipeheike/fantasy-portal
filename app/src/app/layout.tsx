import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'sonner';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fantasy Portal - Crônicas do Destino Infinito",
  description: "Um RPG narrativo de próxima geração alimentado por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950">
        {children}
        <Toaster 
          position="bottom-right" 
          theme="dark" 
          richColors 
          expand={true}
          toastOptions={{
            style: {
              background: '#09090b',
              border: '1px solid #27272a',
              color: '#f4f4f5'
            }
          }}
        />
      </body>
    </html>
  );
}
