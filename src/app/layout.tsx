import { cn } from '@/utils/tailwind';
import { type Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Geist_Mono, Lato } from 'next/font/google';

import './globals.css';

const latoSans = Lato({
  variable: '--font-lato-sans',
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mikhail Snake',
    description: '🐍 The legendary Mikhail Snake game',
    icons: { icon: '/favicon.ico' },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(latoSans.variable, geistMono.variable, 'antialiased')}>
        <ThemeProvider
          defaultTheme="system"
          attribute="class"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
