'use client';

import { useState } from 'react';
import { creaClientSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, AlertCircle, Zap } from 'lucide-react';

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gym-red p-4 rounded-full shadow-gym animate-pulse-soft">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white mb-2">BENTORNATO</h2>
          <p className="text-zinc-400">Continua il tuo percorso di allenamento</p>
        </div>

        {/* Card Login */}
        <div className="card">
          <form onSubmit={gestisciLogin} className="space-y-6">
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
                placeholder="tua@email.com"
                required
                autoFocus
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
                placeholder="••••••••"
                required
              />
            </div>

            {/* Messaggio Errore */}
            {errore && (
              <div className="alert-error flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{errore}</span>
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

          {/* Link Registrazione */}
          <div className="mt-6 text-center">
            <p className="text-zinc-400">
              Non hai un account?{' '}
              <Link href="/register" className="text-gym-red hover:text-gym-red-light font-semibold transition-colors">
                Registrati ora
              </Link>
            </p>
          </div>

          {/* Password dimenticata (opzionale) */}
          <div className="mt-4 text-center">
            <Link href="#" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">
              Password dimenticata?
            </Link>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="text-zinc-400">
            <div className="text-2xl font-black text-gym-red mb-1">∞</div>
            <div className="text-xs">Schede Illimitate</div>
          </div>
          <div className="text-zinc-400">
            <div className="text-2xl font-black text-gym-red mb-1">📊</div>
            <div className="text-xs">Tracking Completo</div>
          </div>
          <div className="text-zinc-400">
            <div className="text-2xl font-black text-gym-red mb-1">🔥</div>
            <div className="text-xs">100% Gratuito</div>
          </div>
        </div>
      </div>
    </div>
  );
}
