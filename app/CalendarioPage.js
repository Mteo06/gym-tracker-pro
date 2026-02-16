'use client';

import { useEffect, useState } from 'react';
import { creaClientSupabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2, Dumbbell } from 'lucide-react';

export default function CalendarioPage() {
  const [schedaAttiva, setSchedaAttiva] = useState(null);
  const [sessioni, setSessioni] = useState([]);
  const [settimanaCorrente, setSettimanaCorrente] = useState(new Date());
  const [caricamento, setCaricamento] = useState(true);
  const router = useRouter();
  const supabase = creaClientSupabase();

  useEffect(() => {
    verificaECaricaDati();
  }, [settimanaCorrente]);

  const verificaECaricaDati = async () => {
    const {  { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/LoginPage');
      return;
    }

    await Promise.all([
      caricaSchedaAttiva(user.id),
      caricaSessioniSettimana(user.id)
    ]);
    setCaricamento(false);
  };

  const caricaSchedaAttiva = async (utenteId) => {
    const { data } = await supabase
      .from('schede_allenamento')
      .select('*')
      .eq('utente_id', utenteId)
      .eq('scheda_attiva', true)
      .single();

    if (data) {
      setSchedaAttiva(data);
    }
  };

  const caricaSessioniSettimana = async (utenteId) => {
    const inizioSettimana = startOfWeek(settimanaCorrente, { weekStartsOn: 1 });
    const fineSettimana = addDays(inizioSettimana, 6);

    const { data } = await supabase
      .from('sessioni_allenamento')
      .select('*')
      .eq('utente_id', utenteId)
      .gte('data_allenamento', format(inizioSettimana, 'yyyy-MM-dd'))
      .lte('data_allenamento', format(fineSettimana, 'yyyy-MM-dd'));

    if (data) {
      setSessioni(data);
    }
  };

  const ottieniGiorniSettimana = () => {
    const inizio = startOfWeek(settimanaCorrente, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(inizio, i));
  };

  const giorniSettimana = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

  const sessionePerGiorno = (data) => {
    return sessioni.find(s => isSameDay(parseISO(s.data_allenamento), data));
  };

  const giornoProgrammato = (data) => {
    if (!schedaAttiva) return false;
    const nomeGiorno = giorniSettimana[data.getDay() === 0 ? 6 : data.getDay() - 1];
    return schedaAttiva.giorni_settimana?.includes(nomeGiorno);
  };

  const cambiaSettimana = (direzione) => {
    const nuovaData = addDays(settimanaCorrente, direzione * 7);
    setSettimanaCorrente(nuovaData);
  };

  if (caricamento) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-16 w-16"></div>
      </div>
    );
  }

  const giorni = ottieniGiorniSettimana();

  return (
    <div className="page-container">
      <div className="section-header">
        <h1 className="section-title">
          <CalendarIcon className="inline w-10 h-10 mr-3 text-gym-red" />
          CALENDARIO <span className="text-gradient">ALLENAMENTI</span>
        </h1>
        <p className="section-subtitle">Visualizza e pianifica i tuoi allenamenti settimanali</p>
      </div>

      {/* Navigazione Settimana */}
      <div className="card mb-8 animate-slide-in">
        <div className="flex items-center justify-between">
          <button
            onClick={() => cambiaSettimana(-1)}
            className="btn-secondary p-3"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <h3 className="text-2xl font-black text-white">
              {format(giorni[0], 'd MMMM', { locale: it })} - {format(giorni[6], 'd MMMM yyyy', { locale: it })}
            </h3>
            <button
              onClick={() => setSettimanaCorrente(new Date())}
              className="text-sm text-gym-red hover:text-gym-red-light mt-2 font-semibold"
            >
              Torna a questa settimana
            </button>
          </div>

          <button
            onClick={() => cambiaSettimana(1)}
            className="btn-secondary p-3"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Griglia Giorni */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {giorni.map((giorno, index) => {
          const programmato = giornoProgrammato(giorno);
          const sessione = sessionePerGiorno(giorno);
          const oggi = isSameDay(giorno, new Date());

          return (
            <div
              key={index}
              className={`card animate-slide-in ${
                oggi ? 'ring-2 ring-gym-red' : ''
              } ${programmato ? 'bg-gradient-to-br from-gym-red/5 to-zinc-900' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Header Giorno */}
              <div className="text-center mb-4">
                <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                  oggi ? 'text-gym-red' : 'text-zinc-500'
                }`}>
                  {format(giorno, 'EEE', { locale: it })}
                </div>
                <div className={`text-3xl font-black ${
                  oggi ? 'text-gym-red' : 'text-white'
                }`}>
                  {format(giorno, 'd')}
                </div>
                <div className="text-xs text-zinc-500">
                  {format(giorno, 'MMM', { locale: it })}
                </div>
              </div>

              {/* Stato Allenamento */}
              <div className="space-y-2">
                {programmato && (
                  <div className="flex items-center justify-center space-x-2 bg-zinc-800 rounded-lg p-2">
                    <Dumbbell className="w-4 h-4 text-gym-red" />
                    <span className="text-xs text-zinc-300 font-semibold">Programmato</span>
                  </div>
                )}

                {sessione && (
                  <div className={`flex items-center justify-center space-x-2 rounded-lg p-2 ${
                    sessione.sessione_completata
                      ? 'bg-green-900/30 border border-green-600'
                      : 'bg-yellow-900/30 border border-yellow-600'
                  }`}>
                    <CheckCircle2 className={`w-4 h-4 ${
                      sessione.sessione_completata ? 'text-green-500' : 'text-yellow-500'
                    }`} />
                    <span className={`text-xs font-semibold ${
                      sessione.sessione_completata ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {sessione.sessione_completata ? 'Completato' : 'In corso'}
                    </span>
                  </div>
                )}

                {!programmato && !sessione && (
                  <div className="text-center py-4 text-zinc-600 text-xs">
                    Riposo
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Scheda Attiva */}
      {schedaAttiva && (
        <div className="card mt-8 bg-gradient-to-br from-gym-red/10 to-zinc-900 border-gym-red/30 animate-slide-in">
          <h3 className="text-xl font-black text-white mb-4">Scheda Attiva</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gym-red">{schedaAttiva.nome_scheda}</p>
              <p className="text-sm text-zinc-400 mt-1">
                {schedaAttiva.giorni_settimana?.length} giorni/settimana
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {schedaAttiva.giorni_settimana?.map((giorno) => (
                <span key={giorno} className="bg-gym-red/20 text-gym-red border border-gym-red/30 px-3 py-1 rounded-full text-xs font-bold">
                  {giorno.slice(0, 3).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!schedaAttiva && (
        <div className="card mt-8 text-center py-12">
          <CalendarIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessuna scheda attiva</h3>
          <p className="text-zinc-400 mb-4">Attiva una scheda per vedere gli allenamenti programmati</p>
        </div>
      )}
    </div>
  );
}
