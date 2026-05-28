import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'La Casa de Víboras',
  description: 'El reality definitivo de las Víboras Rosas. Vota, mirá, sentí la vibración.',
  openGraph: {
    title: 'La Casa de Víboras',
    description: 'El reality definitivo de las Víboras Rosas.',
    type: 'website',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La Casa de Víboras',
  },
}

export const viewport: Viewport = {
  themeColor: '#D4186C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white antialiased">
        <div className="scanline" aria-hidden="true" />
        {children}
      </body>
    </html>
  )
}
