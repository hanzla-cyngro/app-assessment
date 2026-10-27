import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from '@/components/ui/sonner'
import { SessionProvider } from '@/components/providers/session-provider'
import { ApiProvider } from '@/components/providers/api-provider'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Incident Command Center',
    template: '%s · Incident Command Center',
  },
  description: 'Create, triage, assign, and resolve operational incidents with live operator presence.',
}

export const viewport: Viewport = {
  themeColor: '#000000',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">
        <SessionProvider>
          <ApiProvider>{children}</ApiProvider>
        </SessionProvider>
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
