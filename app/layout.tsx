import type { Metadata } from "next"
import { Fraunces, Newsreader } from "next/font/google"
import "./globals.css"

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
})

const body = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-body",
})

export const metadata: Metadata = {
  title: "Mo's Not The Best® — Personal Dining Memory",
  description:
    "The world's leading Personal Dining Memory Platform. Every meal becomes a memory.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} font-body antialiased`}>
        {children}
      </body>
    </html>
  )
}
