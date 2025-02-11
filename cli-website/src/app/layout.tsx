import "@/styles/globals.css"

import { IBM_Plex_Mono } from "next/font/google"
import type React from "react"

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={fontMono.className}>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  )
}

