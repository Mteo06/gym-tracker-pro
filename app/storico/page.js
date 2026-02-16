'use client';

import { useEffect, useState } from 'react';
import { creaClientSupabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { History, Calendar, Clock, Dumbbell, TrendingUp, Award, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function StoricoPage() {
  const [allenamenti, setAllenamenti] = useState([]);
  const [allenamentiFiltrati, setAllenamentiFiltrati] = useState([]);
  const [schede, setSchede] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [filtroScheda, setFiltroScheda] = useState('tutte');
  const [ricerca, setRicerca] = useState('');
  const [statistiche, setStatistiche] = useState({
    totaleAllenamenti: 0,
    minutiTotali: 0,
    mediaIntensita: 0,
    allenamentoRecente: null
  });
  const router = useRouter();
  const supabase = creaClientSupabase();

  useEffect(() => {
    caricaStoricoCompleto();
  }, []);

  useEffect(() => {
    applicaFiltri();
  }, [filtroScheda, ricerca, allenamenti]);

  const caricaStoricoCompleto = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Carica allenamenti
    const { data: allData, error: allError } = await supabase
      .from('sessioni_allenamento')
      .select(`
        *,
        schede_allenamento (
          id,
          nome_scheda
        )
      `)
      .eq('utente_id', user.id)
      .order('data_allenamento', { ascending: false })
      .limit(100);

    if (!allError && allData) {
      setAllenamenti(allData);
      setAllenamentiFiltrati(allData);
      
      // Calcola statistiche
      const totale = allData.length;
      const minutiTot = allData.reduce((acc, curr) => acc + (curr.durata_minuti || 0), 0);
      const intensitaMedia = allData.filter(a => a.valutazione_intensita).length > 0
        ? allData.reduce((acc, curr) => acc + (curr.valutazione_intensita || 0), 0) / 
          allData.filter(a => a.valutazione_intensita).length
        : 0;
      
      setStatistiche({
        totaleAllenamenti: totale,
        minutiTotali: minutiTot,
        mediaIntensita: intensitaMedia,
        allenamentoRecente: allData[0] || null
      });
    }

    // Carica schede per filtro
    const { data: schedeData } = await supabase
      .from('schede_allenamento')
      .select('id, nome_scheda')
      .eq('utente_id', user.id)
      .order('nome_scheda');

    if (schedeData) {
      setSchede(schedeData);
    }

    setCaricamento(false);
  };

  const applicaFiltri = () => {
    let risultati = [...allenamenti];

    // Filtro per scheda
    if (filtroScheda !== 'tutte') {
      risultati = risultati.filter(all => 
        all.schede_allenamento?.id === filtroScheda
      );
    }

    // Filtro ricerca nelle note
    if (ricerca.trim()) {
      risultati = risultati.filter(all =>
        all.note_sessione?.toLowerCase().includes(ricerca.toLowerCase()) ||
        all.schede_allenamento?.nome_scheda.toLowerCase().includes(ricerca.toLowerCase())
      );
    }

    setAllenamentiFiltrati(risultati);
  };

  const getIntensitaColor = (intensita) => {
    if (!intensita) return 'text-zinc-500';
    if (intensita <= 3) return 'text-green-500';
    if (intensita <= 6) return 'text-yellow-500';
    if (intensita <= 8) return 'text-orange-500';
    return 'text-red-500';
  };

  const getIntensitaLabel = (intensita) => {
    if (!intensita) return 'N/D';
    if (intensita <= 3) return 'Leggera';
    if (intensita <= 6) return 'Moderata';
    if (intensita <= 8) return 'Intensa';
    return 'Molto Intensa';
  };

  if (caricamento) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-16 w-16"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="section-header">
        <h1 className="section-title flex items-center">
          <History className="w-12 h-12 mr-4 text-gym-red" />
          STORICO <span className="text-gradient">ALLENAMENTI</span>
        </h1>
        <p className="section-subtitle">Rivedi le tue sessioni passate e analizza i progressi</p>
      </div>

      {/* Statistiche Generali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-stats">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gym-red opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <Dumbbell className="w-8 h-8 text-gym-red" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Totale</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            {statistiche.totaleAllenamenti}
            <span className="text-2xl text-zinc-500"> session{statistiche.totaleAllenamenti !== 1 ? 'i' : 'e'}</span>
          </p>
        </div>

        <div className="card-stats">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <Clock className="w-8 h-8 text-blue-600" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tempo Totale</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            {Math.round(statistiche.minutiTotali / 60)}
            <span className="text-2xl text-zinc-500"> ore</span>
          </p>
        </div>

        <div className="card-stats">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Intensità Media</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            {statistiche.mediaIntensita.toFixed(1)}
            <span className="text-2xl text-zinc-500"> /10</span>
          </p>
        </div>

        <div className="card-stats">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-600 opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <Award className="w-8 h-8 text-green-600" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Media Durata</span>
          </div>
          <p className="text-4xl font-black text-white relative z-10">
            {statistiche.totaleAllenamenti > 0 
              ? Math.round(statistiche.minutiTotali / statistiche.totaleAllenamenti)
              : 0}
            <span className="text-2xl text-zinc-500"> min</span>
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className="card mb-8 animate-slide-in">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="label">
              <Search className="w-4 h-4 inline mr-2" />
              Cerca
            </label>
            <input
              type="text"
              value={ricerca}
              onChange={(e) => setRicerca(e.target.value)}
              placeholder="Cerca nelle note..."
              className="input-field"
            />
          </div>
          <div className="flex-1">
            <label className="label">
              <Filter className="w-4 h-4 inline mr-2" />
              Filtra per Scheda
            </label>
            <select
              value={filtroScheda}
              onChange={(e) => setFiltroScheda(e.target.value)}
              className="select-field"
            >
              <option value="tutte">Tutte le schede</option>
              {schede.map(scheda => (
                <option key={scheda.id} value={scheda.id}>
                  {scheda.nome_scheda}
                </option>
              ))}
            </select>
          </div>
        </div>
        {allenamentiFiltrati.length !== allenamenti.length && (
          <div className="mt-4 text-sm text-zinc-400">
            Mostrando {allenamentiFiltrati.length} di {allenamenti.length} allenamenti
          </div>
        )}
      </div>

      {/* Lista Allenamenti */}
      {allenamentiFiltrati.length === 0 ? (
        <div className="card text-center py-16 animate-slide-in">
          <div className="bg-zinc-800 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
            <Dumbbell className="w-16 h-16 text-zinc-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">
            {allenamenti.length === 0 
              ? 'Nessun allenamento registrato' 
              : 'Nessun risultato trovato'}
          </h3>
          <p className="text-zinc-400">
            {allenamenti.length === 0
              ? 'Inizia ad allenarti per vedere lo storico qui'
              : 'Prova a modificare i filtri di ricerca'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allenamentiFiltrati.map((allenamento, index) => (
            <div 
              key={allenamento.id} 
              className="card-hover animate-slide-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Info Principale */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-white mb-2">
                        {allenamento.schede_allenamento?.nome_scheda || 'Scheda eliminata'}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {format(new Date(allenamento.data_allenamento), 'EEEE d MMMM yyyy', { locale: it })}
                          </span>
                        </div>
                        
                        {allenamento.durata_minuti && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>{allenamento.durata_minuti} minuti</span>
                          </div>
                        )}

                        {allenamento.valutazione_intensita && (
                          <div className="flex items-center space-x-2">
                            <TrendingUp className={`w-4 h-4 flex-shrink-0 ${getIntensitaColor(allenamento.valutazione_intensita)}`} />
                            <span className={getIntensitaColor(allenamento.valutazione_intensita)}>
                              {getIntensitaLabel(allenamento.valutazione_intensita)} ({allenamento.valutazione_intensita}/10)
                            </span>
                          </div>
                        )}
                      </div>

                      {allenamento.note_sessione && (
                        <div className="mt-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                          <p className="text-zinc-300 text-sm italic">
                            "{allenamento.note_sessione}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Badge Completato */}
                {allenamento.sessione_completata && (
                  <div className="flex-shrink-0">
                    <div className="badge-success text-base px-6 py-3">
                      ✓ COMPLETATO
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginazione (opzionale) */}
      {allenamentiFiltrati.length >= 50 && (
        <div className="mt-8 text-center">
          <p className="text-zinc-500 text-sm">
            Mostrando i primi 100 allenamenti più recenti
          </p>
        </div>
      )}
    </div>
  );
}
