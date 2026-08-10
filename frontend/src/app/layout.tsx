import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MetroFlow — AI Metro Crowd Management & Smart Scheduling",
    template: "%s · MetroFlow",
  },
  description:
    "MetroFlow is a privacy-preserving AI command center for metro operators — crowd prediction, congestion heatmaps and schedule optimization from ticketing and operational data. No cameras.",
  keywords: [
    "metro",
    "crowd management",
    "AI transportation",
    "smart city",
    "train scheduling",
    "passenger demand forecasting",
  ],
  openGraph: {
    title: "MetroFlow — AI Metro Crowd Management & Smart Scheduling",
    description:
      "Predict the crowd. Move the city. AI operations for metro authorities.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${display.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
