'use client';

import { useEffect, useState } from 'react';
import { creaClientSupabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { History, Calendar, Dumbbell, Search, Filter, CheckCircle2, XCircle } from 'lucide-react';

export default function StoricoPage() {
  const [allenamenti, setAllenamenti] = useState([]);
  const [allenamentiFiltrati, setAllenamentiFiltrati] = useState([]);
  const [schede, setSchede] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [filtroScheda, setFiltroScheda] = useState('tutte');
  const [ricerca, setRicerca] = useState('');
  const router = useRouter();
  const supabase = creaClientSupabase();

  useEffect(() => {
    verificaECaricaDati();
  }, []);

  useEffect(() => {
    applicaFiltri();
  }, [filtroScheda, ricerca, allenamenti]);

  const verificaECaricaDati = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/LoginPage');
      return;
    }

    await Promise.all([
      caricaAllenamenti(user.id),
      caricaSchede(user.id)
    ]);
    setCaricamento(false);
  };

  const caricaAllenamenti = async (utenteId) => {
    const { data, error } = await supabase
      .from('sessioni_allenamento')
      .select(`
        *,
        schede_allenamento (nome_scheda),
        serie_eseguite (*)
      `)
      .eq('utente_id', utenteId)
      .order('data_allenamento', { ascending: false });

    if (!error && data) {
      setAllenamenti(data);
      setAllenamentiFiltrati(data);
    }
  };

  const caricaSchede = async (utenteId) => {
    const { data } = await supabase
      .from('schede_allenamento')
      .select('id, nome_scheda')
      .eq('utente_id', utenteId)
      .order('nome_scheda');

    if (data) {
      setSchede(data);
    }
  };

  const applicaFiltri = () => {
    let risultati = [...allenamenti];

    if (filtroScheda !== 'tutte') {
      risultati = risultati.filter(a => a.scheda_id === filtroScheda);
    }

    if (ricerca.trim()) {
      risultati = risultati.filter(a => 
        a.note_allenamento?.toLowerCase().includes(ricerca.toLowerCase())
      );
    }

    setAllenamentiFiltrati(risultati);
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
      <div className="section-header">
        <h1 className="section-title">
          <History className="inline w-10 h-10 mr-3 text-gym-red" />
          STORICO <span className="text-gradient">ALLENAMENTI</span>
        </h1>
        <p className="section-subtitle">Rivedi tutti i tuoi allenamenti passati</p>
      </div>

      {/* Statistiche Rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card-stats">
          <div className="flex items-center justify-between mb-4">
            <Dumbbell className="w-8 h-8 text-gym-red" />
            <span className="text-xs font-bold text-zinc-500 uppercase">Totale</span>
          </div>
          <p className="text-4xl font-black text-white">
            {allenamenti.length}
            <span className="text-2xl text-zinc-500 ml-2">allenamenti</span>
          </p>
        </div>

        <div className="card-stats">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <span className="text-xs font-bold text-zinc-500 uppercase">Completati</span>
          </div>
          <p className="text-4xl font-black text-white">
            {allenamenti.filter(a => a.sessione_completata).length}
            <span className="text-2xl text-zinc-500 ml-2">sessioni</span>
          </p>
        </div>

        <div className="card-stats">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 text-yellow-600" />
            <span className="text-xs font-bold text-zinc-500 uppercase">Parziali</span>
          </div>
          <p className="text-4xl font-black text-white">
            {allenamenti.filter(a => !a.sessione_completata).length}
            <span className="text-2xl text-zinc-500 ml-2">sessioni</span>
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className="card mb-8 animate-slide-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
          <div>
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
        <div className="card text-center py-16">
          <History className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">
            {allenamenti.length === 0 ? 'Nessun allenamento registrato' : 'Nessun risultato'}
          </h3>
          <p className="text-zinc-400">
            {allenamenti.length === 0 
              ? 'Inizia ad allenarti per vedere lo storico qui'
              : 'Prova a modificare i filtri di ricerca'
            }
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
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    allenamento.sessione_completata 
                      ? 'bg-green-900/30 border border-green-600' 
                      : 'bg-yellow-900/30 border border-yellow-600'
                  }`}>
                    {allenamento.sessione_completata ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-white mb-1">
                      {allenamento.schede_allenamento?.nome_scheda || 'Scheda eliminata'}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm text-zinc-400">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {format(parseISO(allenamento.data_allenamento), 'EEEE d MMMM yyyy', { locale: it })}
                      </span>
                      {allenamento.durata_minuti && (
                        <span>• {allenamento.durata_minuti} min</span>
                      )}
                    </div>
                  </div>
                </div>

                <span className={`badge ${
                  allenamento.sessione_completata 
                    ? 'badge-success' 
                    : 'bg-yellow-900/30 text-yellow-400 border border-yellow-600'
                }`}>
                  {allenamento.sessione_completata ? 'Completato' : 'Parziale'}
                </span>
              </div>

              {/* Dettagli Serie */}
              <div className="bg-zinc-800 rounded-lg p-4 mb-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-black text-gym-red">
                      {allenamento.serie_eseguite?.length || 0}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase">Serie Totali</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">
                      {allenamento.serie_eseguite?.filter(s => s.serie_completata).length || 0}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase">Completate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-blue-500">
                      {allenamento.serie_eseguite?.reduce((sum, s) => sum + (s.ripetizioni_effettuate || 0), 0) || 0}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase">Rip Totali</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-purple-500">
                      {Math.round(allenamento.serie_eseguite?.reduce((sum, s) => 
                        sum + ((s.peso_effettivo || 0) * (s.ripetizioni_effettuate || 0)), 0) || 0)}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase">Volume kg</div>
                  </div>
                </div>
              </div>

              {/* Note */}
              {allenamento.note_allenamento && (
                <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                  <div className="text-xs text-zinc-500 uppercase mb-2 font-bold">Note Allenamento</div>
                  <p className="text-sm text-zinc-300">{allenamento.note_allenamento}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
