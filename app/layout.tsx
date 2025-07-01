import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "عبد العزيز الحمداني - مهندس برمجيات متخصص في الذكاء الاصطناعي",
    template: "%s | عبد العزيز الحمداني",
  },
  description:
    "موقع شخصي احترافي لعبد العزيز الحمداني، مهندس برمجيات متخصص في Python والذكاء الاصطناعي من سلطنة عُمان. خبرة في Groq API، RAG، وتطوير التطبيقات الذكية.",
  keywords: [
    "عبد العزيز الحمداني",
    "مهندس برمجيات",
    "الذكاء الاصطناعي",
    "Python",
    "RAG",
    "Groq API",
    "سلطنة عمان",
    "تطوير التطبيقات",
    "قواعد البيانات المتجهة",
    "التعلم الآلي",
    "البرمجة",
    "تطوير الويب",
    "الذكاء الاصطناعي العربي",
    "مطور عماني",
    "تقنية المعلومات",
  ],
  authors: [{ name: "عبد العزيز الحمداني", url: "https://github.com/wolfomani" }],
  creator: "عبد العزيز الحمداني",
  publisher: "عبد العزيز الحمداني",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://drx3.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ar_OM",
    url: "/",
    title: "عبد العزيز الحمداني - مهندس برمجيات متخصص في الذكاء الاصطناعي",
    description:
      "موقع شخصي احترافي لعبد العزيز الحمداني، مهندس برمجيات متخصص في Python والذكاء الاصطناعي من سلطنة عُمان. خبرة في Groq API، RAG، وتطوير التطبيقات الذكية.",
    siteName: "عبد العزيز الحمداني",
    images: [
      {
        url: "/images/profile-photo.jpg",
        width: 1200,
        height: 630,
        alt: "عبد العزيز الحمداني - مهندس برمجيات متخصص في الذكاء الاصطناعي",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "عبد العزيز الحمداني - مهندس برمجيات متخصص في الذكاء الاصطناعي",
    description:
      "موقع شخصي احترافي لعبد العزيز الحمداني، مهندس برمجيات متخصص في Python والذكاء الاصطناعي من سلطنة عُمان.",
    images: ["/images/profile-photo.jpg"],
    creator: "@wolfaiOM",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "technology",
  classification: "Business",
  referrer: "origin-when-cross-origin",
  colorScheme: "dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#ef4444",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "عبد العزيز الحمداني",
  },
  applicationName: "عبد العزيز الحمداني - Portfolio",
  generator: "Next.js",
  abstract: "موقع شخصي لمهندس برمجيات متخصص في الذكاء الاصطناعي",
  archives: ["https://github.com/wolfomani"],
  bookmarks: ["https://github.com/wolfomani"],
  other: {
    "msapplication-TileColor": "#ef4444",
    "msapplication-config": "/browserconfig.xml",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://github.com" />
        <link rel="dns-prefetch" href="https://t.me" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "عبد العزيز الحمداني",
              alternateName: "Abdul Aziz Al Hamdani",
              description: "مهندس برمجيات متخصص في الذكاء الاصطناعي من سلطنة عُمان",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://drx3.vercel.app",
              image: "/images/profile-photo.jpg",
              sameAs: ["https://github.com/wolfomani", "https://t.me/wolfaiOM"],
              jobTitle: "Software Engineer",
              worksFor: {
                "@type": "Organization",
                name: "Freelance",
              },
              nationality: "Omani",
              knowsAbout: [
                "Python Programming",
                "Artificial Intelligence",
                "RAG Systems",
                "Groq API",
                "Vector Databases",
                "Machine Learning",
                "Natural Language Processing",
              ],
              email: "openaziz00@gmail.com",
              address: {
                "@type": "PostalAddress",
                addressCountry: "OM",
                addressRegion: "Oman",
              },
            }),
          }}
        />

        {/* Additional SEO tags */}
        <meta name="author" content="عبد العزيز الحمداني" />
        <meta name="copyright" content="عبد العزيز الحمداني" />
        <meta name="language" content="Arabic" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="rating" content="general" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

        {/* Geo tags */}
        <meta name="geo.region" content="OM" />
        <meta name="geo.country" content="Oman" />
        <meta name="ICBM" content="23.5859, 58.4059" />

        {/* Mobile optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Performance hints */}
        <link rel="preload" href="/images/profile-photo.jpg" as="image" />
        <link rel="prefetch" href="/chat" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
