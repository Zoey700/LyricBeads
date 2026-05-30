import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LyricBeads - 个性化手链生成",
  description: "根据心情、诗词、歌词生成专属个性化手链",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    console.log('Dark mode applied:', document.documentElement.classList.contains('dark'));
                  } else {
                    document.documentElement.classList.remove('dark');
                    console.log('Light mode applied');
                  }
                } catch (e) {
                  console.error('Failed to apply theme:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
