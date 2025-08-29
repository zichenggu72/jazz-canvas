import './globals.css'

export const metadata = {
  title: 'Keyboard Canvas',
  description: 'A keyboard-driven pixel art canvas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen p-8">
        {children}
      </body>
    </html>
  )
}