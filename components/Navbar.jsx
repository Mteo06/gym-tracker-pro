'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { creaClientSupabase } from '../lib/supabaseClient';
import { 
  Home, 
  ClipboardList, 
  Calendar, 
  History, 
  User, 
  LogOut, 
  Menu, 
  X,
  Dumbbell
} from 'lucide-react';

export default function Navbar() {
  const [utente, setUtente] = useState(null);
  const [menuAperto, setMenuAperto] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = creaClientSupabase();

  useEffect(() => {
    verificaUtente();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUtente(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const verificaUtente = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUtente(user);
  };

  const gestisciLogout = async () => {
    await supabase.auth.signOut();
    setUtente(null);
    router.push('/LoginPage');
  };

  const linkNavigation = [
    { nome: 'Dashboard', href: '/', icona: Home },
    { nome: 'Schede', href: '/SchedeListPage', icona: ClipboardList },
    { nome: 'Calendario', href: '/CalendarioPage', icona: Calendar },
    { nome: 'Storico', href: '/StoricoPage', icona: History },
  ];

  const isAttivo = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (pathname === '/LoginPage' || pathname === '/RegisterPage') {
    return null;
  }

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-lg bg-opacity-95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="bg-gym-red p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-white hidden sm:block">
              GYM<span className="text-gym-red">TRACKER</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          {utente && (
            <div className="hidden md:flex items-center space-x-1">
              {linkNavigation.map((link) => {
                const Icona = link.icona;
                const attivo = isAttivo(link.href);
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                      attivo
                        ? 'bg-gym-red text-white shadow-gym'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icona className="w-5 h-5" />
                    <span>{link.nome}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Menu Desktop */}
          {utente ? (
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-zinc-400">
                <User className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  {utente.user_metadata?.nome_completo || utente.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={gestisciLogout}
                className="btn-secondary"
              >
                <LogOut className="w-5 h-5" />
                Esci
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/LoginPage" className="btn-secondary">
                Accedi
              </Link>
              <Link href="/RegisterPage" className="btn-primary">
                Registrati
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          {utente && (
            <button
              onClick={() => setMenuAperto(!menuAperto)}
              className="md:hidden btn-secondary p-2"
            >
              {menuAperto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {utente && menuAperto && (
          <div className="md:hidden py-4 border-t border-zinc-800 animate-slide-in">
            <div className="space-y-2">
              {linkNavigation.map((link) => {
                const Icona = link.icona;
                const attivo = isAttivo(link.href);
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuAperto(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                      attivo
                        ? 'bg-gym-red text-white'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icona className="w-5 h-5" />
                    <span>{link.nome}</span>
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-zinc-800 space-y-2">
                <div className="flex items-center space-x-2 px-4 py-2 text-zinc-400">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-semibold">
                    {utente.user_metadata?.nome_completo || utente.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={gestisciLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-zinc-800 rounded-lg font-semibold transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Esci</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
