'use client';

import { useState } from 'react';
import { creaClientSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confermaPassword, setConfermaPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();
  const supabase = creaClientSupabase();

  const gestisciRegistrazione = async (e) => {
    e.preventDefault();
    setErrore('');
    setSuccesso('');

    // Validazioni
    if (password !== confermaPassword) {
      setErrore('Le password non corrispondono');
      return;
    }

    if (password.length < 6) {
      setErrore('La password deve essere di almeno 6 caratteri');
      return;
    }

    if (!nomeCompleto.trim()) {
      setErrore('Inserisci il tuo nome');
      return;
    }

    setCaricamento(true);

    // Registrazione con Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
        },
        emailRedirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      setErrore(error.message === 'User already registered' 
        ? 'Email già registrata. Prova ad accedere.' 
        : error.message);
      setCaricamento(false);
      return;
    }

    if (data.user) {
      // Inserisci il profilo utente nella tabella profili_utenti
      const { error: profiloError } = await supabase
        .from('profili_utenti')
        .insert([
          { 
            id: data.user.id, 
            nome_completo: nomeCompleto, 
            email: email 
          }
        ]);

      if (profiloError) {
        console.error('Errore creazione profilo:', profiloError);
      }

      // Controlla se è richiesta la verifica email
      if (data.session) {
        // Login automatico
        router.push('/');
      } else {
        // Email di conferma richiesta
        setSuccesso('Registrazione completata! Controlla la tua email per verificare l\'account.');
        setTimeout(() => router.push('/login'), 3000);
      }
    }
    
    setCaricamento(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-gym">
      <div className="max-w-md w-full animate-slide-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gym-red p-4 rounded-full shadow-gym animate-pulse-soft">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white mb-2">REGISTRATI</h2>
          <p className="text-zinc-400">Inizia il tuo percorso di crescita muscolare</p>
        </div>

        <div className="card">
          <form onSubmit={gestisciRegistrazione} className="space-y-6">
            {/* Nome Completo */}
            <div>
              <label className="label">
                <User className="w-4 h-4 inline mr-2" />
                Nome Completo
              </label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                className="input-field"
                placeholder="Mario Rossi"
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="mario.rossi@email.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-2" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Minimo 6 caratteri"
                required
                minLength={6}
              />
            </div>

            {/* Conferma Password */}
            <div>
              <label className="label">
                <Lock className="w-4 h-4 inline mr-2" />
                Conferma Password
              </label>
              <input
                type="password"
                value={confermaPassword}
                onChange={(e) => setConfermaPassword(e.target.value)}
                className="input-field"
                placeholder="Ripeti la password"
                required
                minLength={6}
              />
            </div>

            {/* Messaggio Errore */}
            {errore && (
              <div className="alert-error flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{errore}</span>
              </div>
            )}

            {/* Messaggio Successo */}
            {successo && (
              <div className="alert-success">
                {successo}
              </div>
            )}

            {/* Bottone Submit */}
            <button
              type="submit"
              disabled={caricamento}
              className="btn-primary w-full"
            >
              {caricamento ? (
                <>
                  <div className="spinner h-5 w-5 border-2"></div>
                  REGISTRAZIONE IN CORSO...
                </>
              ) : (
                'REGISTRATI ORA'
              )}
            </button>
          </form>

          {/* Link Login */}
          <div className="mt-6 text-center">
            <p className="text-zinc-400">
              Hai già un account?{' '}
              <Link href="/login" className="text-gym-red hover:text-gym-red-light font-semibold transition-colors">
                Accedi qui
              </Link>
            </p>
          </div>

          {/* Info Privacy */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <p className="text-xs text-zinc-500 text-center">
              Registrandoti, accetti i nostri Termini di Servizio e la Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
