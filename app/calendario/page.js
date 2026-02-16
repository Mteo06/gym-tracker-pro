'use client';

import { useEffect, useState } from 'react';
import { creaClientSupabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Calendar, Dumbbell, CheckCircle, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  getDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  getDate
} from 'date-fns';
import { it } from 'date-fns/locale';

export default function CalendarioPage() {
  const [schedaAttiva, setSchedaAttiva] = useState(null);
  const [allenamenti, setAllenamenti] = useState([]);
  const [meseCorrente, setMeseCorrente] = useState(new Date());
  const [caricamento, setCaricamento] = useState(true);
  const router = useRouter();
  const supabase = creaClientSupabase();

  useEffect(() => {
    caricaDatiCalendario();
  }, []);

  const caricaDatiCalendario = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: scheda } = await supabase
      .from('schede_allenamento')
      .select('*')
      .eq('utente_id', user.id)
      .eq('scheda_attiva', true)
      .single();

    if (scheda) setSchedaAttiva(scheda);

    const { data: allData } = await supabase
      .from('sessioni_allenamento')
      .select('*')
      .eq('utente_id', user.id);

    if (allData) setAllenamenti(allData);
    setCaricamento(false);
  };

  // Giorni settimana da Lunedì a Domenica
  const giorniSettimana = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const giorniSettimanaAbbr = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const isGiornoAllenamento = (data) => {
    if (!schedaAttiva) return false;
    const dayOfWeek = getDay(data);
    // Converti: domenica=0 diventa indice 6, lunedì=1 diventa indice 0, ecc.
    const giornoIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const giornoNome = giorniSettimana[giornoIdx];
    return schedaAttiva.giorni_settimana?.includes(giornoNome);
  };

  const isAllenamentoCompletato = (data) => {
    return allenamenti.some(all => isSameDay(new Date(all.data_allenamento), data));
  };

  const giorni = eachDayOfInterval({
    start: startOfMonth(meseCorrente),
    end: endOfMonth(meseCorrente)
  });

  // Calcola l'offset per iniziare da Lunedì
  const primoGiornoMese = getDay(giorni[0]);
  const offsetIniziale = primoGiornoMese === 0 ? 6 : primoGiornoMese - 1;

  const mesePrecedente = () => setMeseCorrente(subMonths(meseCorrente, 1));
  const meseProssimo = () => setMeseCorrente(addMonths(meseCorrente, 1));
  const tornaOggi = () => setMeseCorrente(new Date());

  if (caricamento) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-16 w-16"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-header">
        <h1 className="section-title flex items-center">
          <Calendar className="w-12 h-12 mr-4 text-gym-red" />
          CALENDARIO <span className="text-gradient">ALLENAMENTI</span>
        </h1>
        <p className="section-subtitle">Pianifica e traccia le tue sessioni di allenamento</p>
      </div>

      {schedaAttiva && (
        <div className="card mb-8 bg-gradient-to-br from-gym-red/10 to-zinc-900 border-gym-red/30 animate-slide-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-5 h-5 text-gym-red" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Scheda Attiva</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2">{schedaAttiva.nome_scheda}</h3>
              <div className="flex flex-wrap gap-2">
                {schedaAttiva.giorni_settimana?.map((giorno) => (
                  <span key={giorno} className="bg-gym-red/20 text-gym-red border border-gym-red/30 text-xs px-3 py-1 rounded-full font-bold">
                    {giorno}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-gym-red p-4 rounded-full">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!schedaAttiva ? (
        <div className="card text-center py-16 animate-slide-in">
          <div className="bg-zinc-800 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-16 h-16 text-zinc-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Nessuna scheda attiva</h3>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            Crea o attiva una scheda di allenamento per visualizzare il calendario
          </p>
          <button
            onClick={() => router.push('/schede')}
            className="btn-primary inline-flex"
          >
            Vai alle Schede
          </button>
        </div>
      ) : (
        <div className="card animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h2 className="text-3xl font-black text-white uppercase">
              {format(meseCorrente, 'MMMM yyyy', { locale: it })}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={mesePrecedente}
                className="btn-secondary px-4 py-2"
                title="Mese precedente"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={tornaOggi}
                className="btn-secondary px-4 py-2"
              >
                Oggi
              </button>
              <button
                onClick={meseProssimo}
                className="btn-secondary px-4 py-2"
                title="Mese successivo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {/* Header da Lunedì a Domenica */}
            {giorniSettimanaAbbr.map(day => (
              <div key={day} className="text-center font-bold text-zinc-500 text-xs uppercase py-2 hidden md:block">
                {day}
              </div>
            ))}
            {giorniSettimanaAbbr.map(day => (
              <div key={`mobile-${day}`} className="text-center font-bold text-zinc-500 text-xs uppercase py-2 md:hidden">
                {day.charAt(0)}
              </div>
            ))}

            {/* Celle vuote iniziali per allineare al Lunedì */}
            {Array.from({ length: offsetIniziale }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {/* Giorni del mese */}
            {giorni.map(data => {
              const isAllenamento = isGiornoAllenamento(data);
              const isCompletato = isAllenamentoCompletato(data);
              const isToday = isSameDay(data, new Date());
              const isPast = data < new Date() && !isToday;

              return (
                <div
                  key={data.toString()}
                  className={`aspect-square p-1 md:p-2 rounded-lg border-2 flex flex-col items-center justify-center relative transition-all hover:scale-105 ${
                    isToday 
                      ? 'border-gym-red bg-gym-red/20 shadow-gym' 
                      : isAllenamento 
                        ? 'border-zinc-700 bg-zinc-800' 
                        : 'border-zinc-800 bg-zinc-900'
                  } ${isPast ? 'opacity-50' : ''}`}
                >
                  <span className={`text-xs md:text-sm font-bold ${
                    isToday 
                      ? 'text-gym-red' 
                      : isCompletato 
                        ? 'text-green-500' 
                        : 'text-white'
                  }`}>
                    {getDate(data)}
                  </span>

                  {isAllenamento && !isCompletato && (
                    <Dumbbell className="w-3 h-3 md:w-4 md:h-4 text-zinc-500 mt-1" />
                  )}

                  {isCompletato && (
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-500 absolute top-0.5 right-0.5 md:top-1 md:right-1" />
                  )}

                  {isToday && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-gym-red rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Legenda</h4>
            <div className="grid grid-cols-2 md:flex md:items-center md:justify-center md:space-x-8 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-zinc-800 rounded border-2 border-zinc-700 flex items-center justify-center">
                  <Dumbbell className="w-3 h-3 text-zinc-500" />
                </div>
                <span className="text-zinc-400">Allenamento programmato</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-zinc-400">Completato</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-gym-red bg-gym-red/20 rounded"></div>
                <span className="text-zinc-400">Oggi</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Statistiche {format(meseCorrente, 'MMMM', { locale: it })}</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-zinc-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-black text-gym-red mb-1">
                  {allenamenti.filter(a => {
                    const dataAll = new Date(a.data_allenamento);
                    return dataAll.getMonth() === meseCorrente.getMonth() && 
                           dataAll.getFullYear() === meseCorrente.getFullYear();
                  }).length}
                </div>
                <div className="text-xs text-zinc-400 uppercase">Allenamenti</div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-black text-blue-500 mb-1">
                  {schedaAttiva?.giorni_settimana?.length || 0}
                </div>
                <div className="text-xs text-zinc-400 uppercase">Giorni/Settimana</div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-black text-green-500 mb-1">
                  {Math.round(
                    (allenamenti.filter(a => {
                      const dataAll = new Date(a.data_allenamento);
                      return dataAll.getMonth() === meseCorrente.getMonth() && 
                             dataAll.getFullYear() === meseCorrente.getFullYear() &&
                             a.durata_minuti;
                    }).reduce((acc, curr) => acc + (curr.durata_minuti || 0), 0) / 
                    allenamenti.filter(a => {
                      const dataAll = new Date(a.data_allenamento);
                      return dataAll.getMonth() === meseCorrente.getMonth() && 
                             dataAll.getFullYear() === meseCorrente.getFullYear() &&
                             a.durata_minuti;
                    }).length) || 0
                  )}
                </div>
                <div className="text-xs text-zinc-400 uppercase">Durata Media (min)</div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-black text-purple-500 mb-1">
                  {allenamenti.filter(a => {
                    const dataAll = new Date(a.data_allenamento);
                    return dataAll.getMonth() === meseCorrente.getMonth() && 
                           dataAll.getFullYear() === meseCorrente.getFullYear();
                  }).reduce((acc, curr) => acc + (curr.durata_minuti || 0), 0)}
                </div>
                <div className="text-xs text-zinc-400 uppercase">Minuti Totali</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
