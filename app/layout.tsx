import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TypeCraft — Work Management Platform',
  description: 'Data entry and typing work management platform for Admins and Workers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-slate-950 text-slate-100 antialiased dark">
      <body className={`${inter.className} min-h-full flex flex-col bg-slate-950`}>
        {children}
      </body>
    </html>
  )
}
