'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { creaClientSupabase, eseguiLogout } from '../lib/supabaseClient';
import { useEffect, useState } from 'react';
import { Dumbbell, Home, Calendar, ClipboardList, History, LogOut, User, Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [utenteCorrente, setUtenteCorrente] = useState(null);
  const [profilo, setProfilo] = useState(null);
  const [menuMobileAperto, setMenuMobileAperto] = useState(false);
  const [menuProfiloAperto, setMenuProfiloAperto] = useState(false);
  const [caricamento, setCaricamento] = useState(true);
  const supabase = creaClientSupabase();

  useEffect(() => {
    verificaUtente();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento, sessione) => {
      setUtenteCorrente(sessione?.user || null);
      if (sessione?.user) {
        caricaProfilo(sessione.user.id);
      }
      setCaricamento(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const verificaUtente = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUtenteCorrente(user);
    if (user) {
      await caricaProfilo(user.id);
    }
    setCaricamento(false);
  };

  const caricaProfilo = async (userId) => {
    const { data: profiloData } = await supabase
      .from('profili')
      .select('nome, cognome')
      .eq('id', userId)
      .single();
    
    if (profiloData) {
      setProfilo(profiloData);
    }
  };

  const gestisciLogout = async () => {
    await eseguiLogout();
    router.push('/login');
  };

  // Chiudi menu quando si clicca fuori
  useEffect(() => {
    const chiudiMenu = () => {
      setMenuProfiloAperto(false);
    };

    if (menuProfiloAperto) {
      document.addEventListener('click', chiudiMenu);
    }

    return () => document.removeEventListener('click', chiudiMenu);
  }, [menuProfiloAperto]);

  // Non mostrare navbar se l'utente non è loggato
  if (!utenteCorrente || caricamento) return null;

  const vociMenu = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/schede', icon: ClipboardList, label: 'Schede' },
    { href: '/calendario', icon: Calendar, label: 'Calendario' },
    { href: '/storico', icon: History, label: 'Storico' },
  ];

  const nomeCompleto = profilo?.nome && profilo?.cognome 
    ? `${profilo.nome} ${profilo.cognome}` 
    : utenteCorrente?.email?.split('@')[0] || 'Utente';

  return (
    <>
      {/* Menu Mobile Dropdown */}
      {menuMobileAperto && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMenuMobileAperto(false)}>
          <div className="bg-zinc-900 w-64 h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-2">
                  <Dumbbell className="w-6 h-6 text-gym-red" />
                  <span className="text-xl font-black text-white">GYM TRACKER</span>
                </div>
                <button
                  onClick={() => setMenuMobileAperto(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <nav className="space-y-2">
                {vociMenu.map((voce) => {
                  const Icon = voce.icon;
                  const isActive = pathname === voce.href || (voce.href !== '/' && pathname.startsWith(voce.href));
                  
                  return (
                    <Link
                      key={voce.href}
                      href={voce.href}
                      onClick={() => setMenuMobileAperto(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-gym-red text-white shadow-gym'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{voce.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 pt-8 border-t border-zinc-800">
                <Link
                  href="/profilo"
                  onClick={() => setMenuMobileAperto(false)}
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  <User className="w-5 h-5" />
                  <span className="font-semibold">Il Mio Profilo</span>
                </Link>
                
                <button
                  onClick={gestisciLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all mt-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-semibold">Esci</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navbar Desktop */}
      <nav className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="bg-gym-red p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-black text-white hidden sm:block">
                GYM <span className="text-gradient">TRACKER</span>
              </span>
            </Link>

            {/* Menu Desktop */}
            <div className="hidden lg:flex items-center space-x-1">
              {vociMenu.map((voce) => {
                const Icon = voce.icon;
                const isActive = pathname === voce.href || (voce.href !== '/' && pathname.startsWith(voce.href));
                
                return (
                  <Link
                    key={voce.href}
                    href={voce.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-semibold ${
                      isActive
                        ? 'bg-gym-red text-white shadow-gym'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{voce.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* User Menu Desktop */}
            <div className="flex items-center space-x-4">
              {/* Dropdown Profilo Desktop */}
              <div className="hidden lg:block relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuProfiloAperto(!menuProfiloAperto);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-all group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-gym-red to-red-700 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-semibold">{nomeCompleto}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${menuProfiloAperto ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {menuProfiloAperto && (
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden">
                    <div className="p-3 border-b border-zinc-700">
                      <p className="text-sm text-zinc-400">Connesso come</p>
                      <p className="text-white font-semibold truncate">{utenteCorrente.email}</p>
                    </div>
                    
                    <Link
                      href="/profilo"
                      onClick={() => setMenuProfiloAperto(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
                    >
                      <User className="w-5 h-5" />
                      <span className="font-semibold">Il Mio Profilo</span>
                    </Link>

                    <button
                      onClick={gestisciLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-all border-t border-zinc-700"
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="font-semibold">Esci</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Mobile Button */}
              <button
                onClick={() => setMenuMobileAperto(true)}
                className="lg:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
