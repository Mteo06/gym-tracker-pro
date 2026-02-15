'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { creaClientSupabase, eseguiLogout } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import { 
  Dumbbell, 
  Home, 
  Calendar, 
  ClipboardList, 
  History, 
  LogOut, 
  User,
  Menu,
  X 
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [utenteCorrente, setUtenteCorrente] = useState(null);
  const [menuMobileAperto, setMenuMobileAperto] = useState(false);
  const [caricamento, setCaricamento] = useState(true);
  const supabase = creaClientSupabase();

  useEffect(() => {
    verificaUtente();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessione) => {
      setUtenteCorrente(sessione?.user || null);
      setCaricamento(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const verificaUtente = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUtenteCorrente(user);
    setCaricamento(false);
  };

  const gestisciLogout = async () => {
    await eseguiLogout();
    router.push('/login');
  };

  // Non mostrare navbar se l'utente non è loggato
  if (!utenteCorrente || caricamento) return null;

  const vociMenu = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/schede', icon: ClipboardList, label: 'Schede' },
    { href: '/calendario', icon: Calendar, label: 'Calendario' },
    { href: '/storico', icon: History, label: 'Storico' },
  ];

  const nomeUtente = utenteCorrente?.email?.split('@')[0] || 'Utente';

  return (
    <>
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 text-gym-red hover:text-gym-red-light transition-colors">
              <Dumbbell className="w-8 h-8" />
              <span className="font-black text-xl tracking-tight">
                GYM<span className="text-white">TRACKER</span>
              </span>
            </Link>
            
            {/* Menu Desktop */}
            <div className="hidden md:flex space-x-1">
              {vociMenu.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-semibold ${
                    pathname === href
                      ? 'bg-gym-red text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Utente e Logout Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-zinc-400 bg-zinc-800 px-4 py-2 rounded-lg">
                <User className="w-4 h-4" />
                <span className="text-sm font-semibold">{nomeUtente}</span>
              </div>
              <button
                onClick={gestisciLogout}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-gym-red text-white transition-all font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Esci</span>
              </button>
            </div>

            {/* Hamburger Menu Mobile */}
            <button
              onClick={() => setMenuMobileAperto(!menuMobileAperto)}
              className="md:hidden p-2 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              {menuMobileAperto ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Menu Mobile Dropdown */}
      {menuMobileAperto && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-zinc-900 bg-opacity-98 backdrop-blur-lg animate-fade-in">
          <div className="container mx-auto px-4 py-6 space-y-2">
            {vociMenu.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuMobileAperto(false)}
                className={`flex items-center space-x-3 px-4 py-4 rounded-lg transition-all font-semibold text-lg ${
                  pathname === href
                    ? 'bg-gym-red text-white shadow-lg'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}

            <div className="divider"></div>

            <div className="flex items-center space-x-3 px-4 py-4 bg-zinc-800 rounded-lg">
              <User className="w-5 h-5 text-zinc-400" />
              <span className="text-zinc-300 font-semibold">{nomeUtente}</span>
            </div>

            <button
              onClick={() => {
                gestisciLogout();
                setMenuMobileAperto(false);
              }}
              className="flex items-center space-x-3 px-4 py-4 rounded-lg bg-red-900 hover:bg-red-800 text-white transition-all font-semibold text-lg w-full"
            >
              <LogOut className="w-5 h-5" />
              <span>Esci dall'App</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
