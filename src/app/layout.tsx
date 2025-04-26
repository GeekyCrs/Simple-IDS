
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Use Inter font as example
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import ClientProviders from './client-providers';
import { AuthProvider } from "@/lib/auth-context"; // Import AuthProvider

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' }); // Setup font variable

export const metadata: Metadata = {
  title: 'CanteenConnect',
  description: 'Manage your canteen orders and bills easily.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Added suppressHydrationWarning */}
      <body className={`${inter.variable} font-sans antialiased`}>
        <ClientProviders>
          <AuthProvider> {/* Wrap children with AuthProvider */}
            <main className="flex min-h-screen flex-col">
              {children}
            </main>
            <Toaster />
          </AuthProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
