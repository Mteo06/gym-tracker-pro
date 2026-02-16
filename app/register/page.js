'use client';

import { useState } from 'react';
import { creaClientSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Mail, Lock, User, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confermaPassword, setConfermaPassword] = useState('');
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
    if (!nome.trim()) {
      setErrore('Inserisci il tuo nome');
      return;
    }

    if (!cognome.trim()) {
      setErrore('Inserisci il tuo cognome');
      return;
    }

    if (password !== confermaPassword) {
      setErrore('Le password non corrispondono');
      return;
    }

    if (password.length < 6) {
      setErrore('La password deve essere di almeno 6 caratteri');
      return;
    }

    setCaricamento(true);

    // Registrazione con Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: nome,
          cognome: cognome,
        },
        emailRedirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      setErrore(
        error.message === 'User already registered' 
          ? 'Email già registrata. Prova ad accedere.' 
          : error.message
      );
      setCaricamento(false);
      return;
    }

    if (data.user) {
      // Inserisci il profilo utente nella tabella profili
      const { error: profiloError } = await supabase
        .from('profili')
        .insert([
          { 
            id: data.user.id,
            nome: nome,
            cognome: cognome,
            email: email
          }
        ]);

      if (profiloError) {
        console.error('Errore creazione profilo:', profiloError);
        // Non bloccare la registrazione se c'è un trigger che crea già il profilo
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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gym-red p-4 rounded-2xl">
              <Dumbbell className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            CREA <span className="text-gradient">ACCOUNT</span>
          </h1>
          <p className="text-zinc-400">Inizia il tuo percorso di crescita muscolare</p>
        </div>

        {/* Card Form */}
        <div className="card">
          <form onSubmit={gestisciRegistrazione} className="space-y-5">
            {/* Nome */}
            <div>
              <label className="label">Nome *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Mario"
                  required
                />
              </div>
            </div>

            {/* Cognome */}
            <div>
              <label className="label">Cognome *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Rossi"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                  placeholder="mario.rossi@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Minimo 6 caratteri"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Conferma Password */}
            <div>
              <label className="label">Conferma Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="password"
                  value={confermaPassword}
                  onChange={(e) => setConfermaPassword(e.target.value)}
                  className="input-field pl-11"
                  placeholder="Ripeti la password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Messaggi di errore/successo */}
            {errore && (
              <div className="flex items-start space-x-2 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{errore}</span>
              </div>
            )}

            {successo && (
              <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg text-green-300 text-sm">
                {successo}
              </div>
            )}

            {/* Bottone Submit */}
            <button
              type="submit"
              disabled={caricamento}
              className="btn-primary w-full justify-center text-lg py-3"
            >
              {caricamento ? (
                <>
                  <div className="spinner h-5 w-5 border-2"></div>
                  REGISTRAZIONE...
                </>
              ) : (
                'CREA ACCOUNT'
              )}
            </button>
          </form>
        </div>

        {/* Link Login */}
        <div className="text-center mt-6">
          <p className="text-zinc-400">
            Hai già un account?{' '}
            <Link href="/login" className="text-gym-red hover:text-gym-red-light font-bold transition-colors">
              Accedi qui
            </Link>
          </p>
        </div>

        {/* Privacy */}
        <p className="text-xs text-zinc-500 text-center mt-6">
          Registrandoti, accetti i nostri{' '}
          <Link href="/termini" className="underline hover:text-zinc-400">
            Termini di Servizio
          </Link>{' '}
          e la{' '}
          <Link href="/privacy" className="underline hover:text-zinc-400">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
