'use client';

import { useState } from 'react';
import { creaClientSupabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errore, setErrore] = useState('');
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();
  const supabase = creaClientSupabase();

  const gestisciLogin = async (e) => {
    e.preventDefault();
    setErrore('');
    setCaricamento(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrore(
        error.message === 'Invalid login credentials'
          ? 'Email o password non validi'
          : error.message
      );
      setCaricamento(false);
      return;
    }

    if (data.session) {
      router.push('/');
      router.refresh();
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
          <h2 className="text-4xl font-black text-white mb-2">BENTORNATO</h2>
          <p className="text-zinc-400">Continua il tuo percorso di allenamento</p>
        </div>

        <div className="card">
          <form onSubmit={gestisciLogin} className="space-y-6">
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
                placeholder="tua@email.com"
                required
                autoFocus
              />
            </div>

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
                placeholder="••••••••"
                required
              />
            </div>

            {errore && (
              <div className="alert-error">
                <span>{errore}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={caricamento}
              className="btn-primary w-full"
            >
              {caricamento ? (
                <>
                  <div className="spinner h-5 w-5 border-2"></div>
                  ACCESSO IN CORSO...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  ACCEDI
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-zinc-400">
              Non hai un account?{' '}
              <Link href="/RegisterPage" className="text-gym-red hover:text-gym-red-light font-semibold transition-colors">
                Registrati ora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
