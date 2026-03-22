import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Agent Dashboard',
  description: 'AI-powered personal agent hub',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk" className="dark">
      <body className={`${inter.variable} font-sans bg-dark-950 text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
