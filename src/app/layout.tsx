import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Savor Authentic Wraps & Shawarma In Islamabad | Wrap Lab - Order Online!",
  description:
    "Order online from Wrap Lab in Islamabad. Try our wide range of mouth-watering Wraps, Shawarma, Mandi, Madbi, and more. Order now and avail our home delivery service!",
  keywords: [
    "Wrap Lab",
    "Shawarma",
    "Wraps",
    "Mandi",
    "Madbi",
    "Islamabad",
    "Arabic food",
    "delivery",
  ],
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌯</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#333333" />
        <meta name="msapplication-navbutton-color" content="#333333" />
        <meta name="apple-mobile-web-app-status-bar-style" content="#333333" />
      </head>
      <body className={`${poppins.variable} font-[family-name:var(--font-poppins)] antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
