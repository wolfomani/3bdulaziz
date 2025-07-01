import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "drx3 - منصة الذكاء الاصطناعي المتقدمة | قوة AI في متناول يدك",
  description:
    "منصة drx3 تقدم لك أحدث تقنيات الذكاء الاصطناعي بواجهة سهلة الاستخدام وإمكانيات لا محدودة. استكشف قوة الذكاء الاصطناعي اليوم",
  keywords: "ذكاء اصطناعي, AI, تقنية, درx3, machine learning, chatbot, automation",
  authors: [{ name: "drx3 Team" }],
  creator: "drx3",
  publisher: "drx3",
  robots: "index, follow",
  openGraph: {
    title: "drx3 - منصة الذكاء الاصطناعي المتقدمة",
    description: "استكشف قوة الذكاء الاصطناعي مع drx3 - منصة متقدمة تقدم حلولاً مبتكرة",
    url: "https://drx3.com",
    siteName: "drx3",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "drx3 - منصة الذكاء الاصطناعي المتقدمة",
    description: "استكشف قوة الذكاء الاصطناعي مع drx3",
    creator: "@drx3",
  },
  generator: "Next.js",
  applicationName: "drx3",
  referrer: "origin-when-cross-origin",
  colorScheme: "dark",
  themeColor: "#ef4444",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
