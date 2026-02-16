import '../styles/globals.css';
import { Inter } from 'next/font/google';
import Navbar from '../components/Navbar';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'GymTracker Pro - Traccia i Tuoi Allenamenti',
  description: 'Applicazione completa per il monitoraggio degli allenamenti in palestra.',
  themeColor: '#dc2626',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it" className={inter.variable}>
      <body className="bg-zinc-950 text-white min-h-screen antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
        <footer className="bg-zinc-900 border-t border-zinc-800 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-zinc-500 text-sm">
            <p>&copy; 2026 GymTracker Pro. Costruisci il tuo futuro, un allenamento alla volta.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
