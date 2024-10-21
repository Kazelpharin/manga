import "./globals.css";


import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/layout/navbar"
import { fontGeist, fontHeading, fontSans, fontUrban } from "@/assets/fonts";
import { SessionProvider } from "next-auth/react";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "manga app",
  description: "manga app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      
      <body>

        <SessionProvider >
          <ThemeProvider 
            attribute="class"
            defaultTheme="dark"
          >
            <Navbar />
            {children}
          </ThemeProvider>        
        </SessionProvider>

        </body>
    </html>
  );
}
