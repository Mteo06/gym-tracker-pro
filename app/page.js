'use client';

import { useEffect, useState, useRef } from 'react';
import { creaClientSupabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import WeightChart from '../components/WeightChart';
import RestTimer from '../components/RestTimer';
import confetti from 'canvas-confetti';
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Plus,
  Target,
  Calendar,
  Flame,
  Activity,
  Dumbbell,
  CheckCircle2,
  Circle,
  Trophy,
  Clock
} from 'lucide-react';
import { format, getDay } from 'date-fns';
import { it } from 'date-fns/locale';

export default function DashboardPage() {
  const [utenteCorrente, setUtenteCorrente] = useState(null);
  const [misurazioniPeso, setMisurazioniPeso] = useState([]);
  const [nuovoPesoInput, setNuovoPesoInput] = useState('');
  const [dataPesoInput, setDataPesoInput] = useState(new Date().toISOString().split('T')[0]);
  const [statistiche, setStatistiche] = useState({
    variazione: 0,
    pesoAttuale: 0,
    pesoIniziale: 0,
    totaleAllenamenti: 0
  });
  const [schedaOggi, setSchedaOggi] = useState(null);
  const [eserciziOggi, setEserciziOggi] = useState([]);
  const [eserciziCompletati, setEserciziCompletati] = useState([]);
  const [sessioneId, setSessioneId] = useState(null);
  const [caricamento, setCaricamento] = useState(true);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  // Timer states
  const [timerInEsecuzione, setTimerInEsecuzione] = useState(false);
  const [timerSecondi, setTimerSecondi] = useState(90);

  const prevCompletamentoRef = useRef(0);

  const router = useRouter();
  const supabase = creaClientSupabase();

  const giorniSettimana = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

  useEffect(() => {
    verificaUtenteECaricaDati();
  }, []);

  const verificaUtenteECaricaDati = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUtenteCorrente(user);
    await Promise.all([
      caricaMisurazioniPeso(user.id),
      caricaStatistiche(user.id),
      caricaAllenamentoOggi(user.id)
    ]);
    setCaricamento(false);
  };

  const caricaMisurazioniPeso = async (utenteId) => {
    const { data, error } = await supabase
      .from('misurazioni_peso')
      .select('*')
      .eq('utente_id', utenteId)
      .order('data_misurazione', { ascending: true });

    if (!error && data) {
      setMisurazioniPeso(data);

      if (data.length > 0) {
        const pesoAttuale = parseFloat(data[data.length - 1].valore_peso);
        const pesoIniziale = parseFloat(data[0].valore_peso);
        const variazione = pesoAttuale - pesoIniziale;
        setStatistiche(prev => ({ ...prev, pesoAttuale, pesoIniziale, variazione }));
      }
    }
  };

  const caricaStatistiche = async (utenteId) => {
    const { count } = await supabase
      .from('sessioni_allenamento')
      .select('*', { count: 'exact', head: true })
      .eq('utente_id', utenteId);

    setStatistiche(prev => ({ ...prev, totaleAllenamenti: count || 0 }));
  };

  const caricaAllenamentoOggi = async (utenteId) => {
    // Ottieni giorno della settimana
    const oggi = new Date();
    const giornoIdx = getDay(oggi);
    const giornoNome = giorniSettimana[giornoIdx];

    // Carica scheda attiva
    const { data: scheda } = await supabase
      .from('schede_allenamento')
      .select('*')
      .eq('utente_id', utenteId)
      .eq('scheda_attiva', true)
      .single();

    if (!scheda || !scheda.giorni_settimana?.includes(giornoNome)) {
      setSchedaOggi(null);
      return;
    }

    setSchedaOggi(scheda);

    // Carica esercizi di oggi
    const { data: esercizi } = await supabase
      .from('esercizi_scheda')
      .select('*')
      .eq('scheda_id', scheda.id)
      .eq('giorno_settimana', giornoNome)
      .order('ordine_esecuzione');

    if (esercizi) {
      setEserciziOggi(esercizi);
    }

    // Verifica se c'è già una sessione oggi
    const dataOggi = oggi.toISOString().split('T')[0];
    const { data: sessioneEsistente } = await supabase
      .from('sessioni_allenamento')
      .select('id, sessione_completata')
      .eq('utente_id', utenteId)
      .eq('data_allenamento', dataOggi)
      .single();

    if (sessioneEsistente) {
      setSessioneId(sessioneEsistente.id);

      // Carica esercizi già completati
      const { data: completati } = await supabase
        .from('serie_eseguite')
        .select('esercizio_id')
        .eq('sessione_id', sessioneEsistente.id);

      if (completati) {
        const idsCompletati = [...new Set(completati.map(c => c.esercizio_id))];
        setEserciziCompletati(idsCompletati);
      }
    }
  };

  const toggleEsercizio = async (esercizio) => {
    const esercizioId = esercizio.id;
    let newSessionId = sessioneId;

    // Crea sessione se non esiste
    if (!newSessionId) {
      const { data: nuovaSessione } = await supabase
        .from('sessioni_allenamento')
        .insert([{
          utente_id: utenteCorrente.id,
          scheda_id: schedaOggi.id,
          data_allenamento: new Date().toISOString().split('T')[0],
          sessione_completata: false
        }])
        .select()
        .single();

      if (nuovaSessione) {
        newSessionId = nuovaSessione.id;
        setSessioneId(newSessionId);
      }
    }

    // Toggle completamento
    let nuoviCompletati = [];
    if (eserciziCompletati.includes(esercizioId)) {
      // Rimuovi
      await supabase
        .from('serie_eseguite')
        .delete()
        .eq('sessione_id', newSessionId)
        .eq('esercizio_id', esercizioId);

      nuoviCompletati = eserciziCompletati.filter(id => id !== esercizioId);
      setEserciziCompletati(nuoviCompletati);
      // Disattiva timer se si deseleziona (opzionale)
      setTimerInEsecuzione(false);
    } else {
      // Aggiungi
      const serie = [];

      for (let i = 1; i <= esercizio.numero_serie; i++) {
        serie.push({
          sessione_id: newSessionId,
          esercizio_id: esercizioId,
          numero_serie: i,
          ripetizioni_effettuate: parseInt(esercizio.numero_ripetizioni) || 10,
          peso_effettivo: esercizio.peso_utilizzato || 0,
          serie_completata: true
        });
      }

      await supabase.from('serie_eseguite').insert(serie);
      nuoviCompletati = [...eserciziCompletati, esercizioId];
      setEserciziCompletati(nuoviCompletati);

      // Estrai il timer predefinito dall'esercizio oppure usa 90
      let pausa = 90;
      if (esercizio.tempo_pausa) {
        const parsed = parseInt(esercizio.tempo_pausa);
        if (!isNaN(parsed)) {
          // assumi secondi base se non ha "min"
          pausa = esercizio.tempo_pausa.includes('min') ? parsed * 60 : parsed;
        }
      }
      setTimerSecondi(pausa);
      setTimerInEsecuzione(true); // Fai apparire il timer
    }

    // Verifica se tutti completati
    const percentualeNuova = (nuoviCompletati.length / eserciziOggi.length) * 100;

    if (nuoviCompletati.length === eserciziOggi.length && eserciziOggi.length > 0) {
      // Segna sessione come completata
      await supabase
        .from('sessioni_allenamento')
        .update({ sessione_completata: true })
        .eq('id', newSessionId);
    } else {
      // Segna come non completata se rimuovi spunte
      await supabase
        .from('sessioni_allenamento')
        .update({ sessione_completata: false })
        .eq('id', newSessionId);
    }
  };

  const salvaNuovoPeso = async (e) => {
    e.preventDefault();
    if (salvataggioInCorso) return; // Prevent double submit
    setSalvataggioInCorso(true);

    const { error } = await supabase
      .from('misurazioni_peso')
      .insert([
        {
          utente_id: utenteCorrente.id,
          valore_peso: parseFloat(nuovoPesoInput),
          data_misurazione: dataPesoInput
        }
      ]);

    if (!error) {
      setNuovoPesoInput('');
      await caricaMisurazioniPeso(utenteCorrente.id);
    }

    setSalvataggioInCorso(false);
  };

  const oggiGiornoNome = giorniSettimana[getDay(new Date())];
  const percentualeCompletamento = eserciziOggi.length > 0
    ? Math.round((eserciziCompletati.length / eserciziOggi.length) * 100)
    : 0;

  // Trigger confetti only when going from < 100 to 100
  useEffect(() => {
    if (percentualeCompletamento === 100 && prevCompletamentoRef.current < 100) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E63946', '#2a9d8f', '#e9c46a', '#f4a261', '#FFFFFF']
      });
      // Chiudi il timer se finisce
      setTimerInEsecuzione(false);
    }
    prevCompletamentoRef.current = percentualeCompletamento;
  }, [percentualeCompletamento]);

  if (caricamento) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-16 w-16"></div>
      </div>
    );
  }

  return (
    <div className="page-container relative pb-24">
      {/* Timer Pausa Floating */}
      {timerInEsecuzione && (
        <RestTimer
          key={Date.now()} // Force remount if timer starts again to reset state
          initialSeconds={timerSecondi}
          chiudi={() => setTimerInEsecuzione(false)}
        />
      )}

      {/* Header Dashboard */}
      <div className="section-header text-center">
        <h1 className="section-title">
          DASHBOARD <span className="text-gradient">ALLENAMENTO</span>
        </h1>
        <p className="section-subtitle">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: it })}
        </p>
      </div>

      {/* Il Mio Allenamento di Oggi */}
      {schedaOggi && eserciziOggi.length > 0 && (
        <div className="card mb-8 bg-gradient-to-br from-gym-red/10 to-zinc-900 border-gym-red/30 animate-slide-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Dumbbell className="w-6 h-6 text-gym-red" />
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  Il Mio Allenamento di Oggi - {oggiGiornoNome}
                </span>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">{schedaOggi.nome_scheda}</h2>
              <div className="flex items-center space-x-4 text-sm text-zinc-400">
                <span>{eserciziOggi.length} esercizi</span>
                <span>•</span>
                <span>{eserciziCompletati.length}/{eserciziOggi.length} completati</span>
              </div>
            </div>
            {percentualeCompletamento === 100 && (
              <div className="bg-green-600 text-white px-6 py-3 rounded-full font-black flex items-center space-x-2 shadow-lg shadow-green-900/50">
                <Trophy className="w-5 h-5" />
                <span>COMPLETATO!</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-zinc-400">Progresso</span>
              <span className="text-sm font-bold text-gym-red">{percentualeCompletamento}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gym-red h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${percentualeCompletamento}%` }}
              />
            </div>
          </div>

          {/* Lista Esercizi */}
          <div className="space-y-3">
            {eserciziOggi.map((esercizio) => {
              const completato = eserciziCompletati.includes(esercizio.id);

              return (
                <button
                  key={esercizio.id}
                  onClick={() => toggleEsercizio(esercizio)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${completato
                    ? 'bg-green-900/30 border-green-600 shadow-green-900/20'
                    : 'bg-zinc-800 border-zinc-700 hover:border-gym-red hover:bg-zinc-800/80 shadow-lg'
                    }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${completato ? 'bg-green-600' : 'bg-zinc-700'
                      }`}>
                      {completato ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className={`text-lg font-bold mb-1 transition-colors ${completato ? 'text-green-400 line-through opacity-70' : 'text-white'
                        }`}>
                        {esercizio.nome_esercizio}
                      </h3>
                      <div className={`flex flex-wrap gap-3 text-sm ${completato ? 'opacity-50' : ''}`}>
                        <span className="text-zinc-400">
                          {esercizio.numero_serie} serie × {esercizio.numero_ripetizioni} rip
                        </span>
                        {esercizio.peso_utilizzato && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-gym-red font-bold">
                              {esercizio.peso_utilizzato} kg
                            </span>
                          </>
                        )}
                        {esercizio.tempo_pausa && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-blue-400">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {esercizio.tempo_pausa}
                            </span>
                          </>
                        )}
                      </div>
                      {esercizio.note_tecniche && (
                        <p className={`text-xs text-zinc-500 mt-2 italic ${completato ? 'hidden' : ''}`}>
                          {esercizio.note_tecniche}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nessun Allenamento Oggi */}
      {schedaOggi && eserciziOggi.length === 0 && (
        <div className="card mb-8 text-center py-8 bg-zinc-800/50">
          <Calendar className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessun allenamento programmato oggi</h3>
          <p className="text-zinc-400">Goditi il tuo giorno di riposo! 💪</p>
        </div>
      )}

      {!schedaOggi && (
        <div className="card mb-8 text-center py-8 bg-zinc-800/50">
          <Dumbbell className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nessuna scheda attiva per oggi</h3>
          <p className="text-zinc-400 mb-4">Crea o attiva una scheda per vedere gli allenamenti</p>
          <button
            onClick={() => router.push('/schede')}
            className="btn-primary inline-flex"
          >
            Vai alle Schede
          </button>
        </div>
      )}

      {/* Cards Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-stats hover:-translate-y-2 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gym-red opacity-10 rounded-full -mr-16 -mt-16 blur-xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <Scale className="w-8 h-8 text-gym-red" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Peso Attuale</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            {statistiche.pesoAttuale ? statistiche.pesoAttuale.toFixed(1) : '-'}
            <span className="text-2xl text-zinc-500 font-medium"> kg</span>
          </p>
        </div>

        <div className="card-stats hover:-translate-y-2 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 opacity-10 rounded-full -mr-16 -mt-16 blur-xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <Target className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Peso Iniziale</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            {statistiche.pesoIniziale ? statistiche.pesoIniziale.toFixed(1) : '-'}
            <span className="text-2xl text-zinc-500 font-medium"> kg</span>
          </p>
        </div>

        <div className="card-stats hover:-translate-y-2 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-600 opacity-10 rounded-full -mr-16 -mt-16 blur-xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            {statistiche.variazione >= 0 ? (
              <TrendingUp className="w-8 h-8 text-green-600" />
            ) : (
              <TrendingDown className="w-8 h-8 text-green-600" />
            )}
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Variazione</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            {statistiche.variazione > 0 ? '+' : ''}
            {statistiche.variazione ? statistiche.variazione.toFixed(1) : '0.0'}
            <span className="text-2xl text-zinc-500 font-medium"> kg</span>
          </p>
        </div>

        <div className="card-stats hover:-translate-y-2 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 opacity-10 rounded-full -mr-16 -mt-16 blur-xl"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <Activity className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Allenamenti</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            {statistiche.totaleAllenamenti}
            <span className="text-2xl text-zinc-500 font-medium"> tot</span>
          </p>
        </div>
      </div>

      {/* Grafico Peso */}
      <div className="card mb-8 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center">
            <Flame className="w-6 h-6 mr-2 text-gym-red" />
            Andamento Peso Corporeo
          </h2>
        </div>
        <WeightChart datiPeso={misurazioniPeso} />
      </div>

      {/* Form Aggiunta Peso */}
      <div className="card bg-gradient-to-br from-zinc-900 to-zinc-800 border-red-900 animate-slide-in">
        <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tight flex items-center">
          <Plus className="w-5 h-5 mr-2 text-gym-red" />
          Aggiungi Nuova Misurazione
        </h3>
        <form onSubmit={salvaNuovoPeso} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="label">Peso Corporeo (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="300"
              value={nuovoPesoInput}
              onChange={(e) => setNuovoPesoInput(e.target.value)}
              placeholder="75.5"
              className="input-field"
              required
            />
          </div>
          <div className="flex-1">
            <label className="label flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Data Misurazione
            </label>
            <input
              type="date"
              value={dataPesoInput}
              onChange={(e) => setDataPesoInput(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="input-field"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary whitespace-nowrap"
              disabled={salvataggioInCorso}
            >
              {salvataggioInCorso ? (
                <>
                  <div className="spinner h-5 w-5 border-2"></div>
                  Salvataggio...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  SALVA PESO
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
