import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/ToastProvider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: "FinTrackr - Premium Expense Manager",
  description: "Track your finances with elegance and precision",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <ToastProvider>
          <AuthProvider>
            <Navbar />
            <main className="pt-16">
              {children}
            </main>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
