import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import React from 'react'
import { ApolloWrapper } from '@/lib/graphql/apollowrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MPD.FM',
  description: 'Remote Control Internet Radio',
}

const RootLayout: React.FC<{
  children: React.ReactNode
}> = ({
  children,
}) => 
  <html lang="en">
    <head>
      <link rel='manifest' href='/manifest.json' />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/favicon-apple-touch.png" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#000" />
      <meta name="mobile-web-app-capable" content="yes" />
    </head>
    <body>
      <ApolloWrapper>
        {children}
      </ApolloWrapper>
    </body>
  </html>

export default RootLayout;