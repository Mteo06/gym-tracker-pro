'use client';

import { useEffect, useState } from 'react';
import { creaClientSupabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, ClipboardList, Calendar, Dumbbell, Trash2, CheckCircle2, XCircle } from 'lucide-react';

export default function SchedeListPage() {
  const [schede, setSchede] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const router = useRouter();
  const supabase = creaClientSupabase();

  useEffect(() => {
    verificaECaricaSchede();
  }, []);

  const verificaECaricaSchede = async () => {
    const {  { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/LoginPage');
      return;
    }

    await caricaSchede(user.id);
  };

  const caricaSchede = async (utenteId) => {
    const { data, error } = await supabase
      .from('schede_allenamento')
      .select(`
        id,
        nome_scheda,
        giorni_settimana,
        scheda_attiva,
        descrizione,
        data_creazione,
        esercizi_scheda (id)
      `)
      .eq('utente_id', utenteId)
      .order('data_creazione', { ascending: false });

    if (!error && data) {
      setSchede(data);
    }
    setCaricamento(false);
  };

  const eliminaScheda = async (schedaId, nomeScheda) => {
    if (!confirm(`Sei sicuro di voler eliminare la scheda "${nomeScheda}"?`)) {
      return;
    }
    
    const { error } = await supabase
      .from('schede_allenamento')
      .delete()
      .eq('id', schedaId);

    if (!error) {
      setSchede(schede.filter(s => s.id !== schedaId));
    }
  };

  const attivaDisattivaScheda = async (schedaId, statoAttuale) => {
    const { error } = await supabase
      .from('schede_allenamento')
      .update({ scheda_attiva: !statoAttuale })
      .eq('id', schedaId);

    if (!error) {
      const {  { user } } = await supabase.auth.getUser();
      caricaSchede(user.id);
    }
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between section-header">
        <div>
          <h1 className="section-title mb-2">
            LE TUE <span className="text-gradient">SCHEDE</span>
          </h1>
          <p className="section-subtitle">Gestisci i tuoi programmi di allenamento personalizzati</p>
        </div>
        <Link href="/CreaSchedaPage" className="btn-primary mt-4 md:mt-0">
          <Plus className="w-5 h-5" />
          NUOVA SCHEDA
        </Link>
      </div>

      {schede.length === 0 ? (
        <div className="card text-center py-16 animate-slide-in">
          <div className="bg-zinc-800 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="w-16 h-16 text-zinc-600" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Nessuna scheda creata</h3>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            Crea la tua prima scheda di allenamento personalizzata
          </p>
          <Link href="/CreaSchedaPage" className="btn-primary inline-flex">
            <Plus className="w-5 h-5" />
            CREA LA TUA PRIMA SCHEDA
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schede.map((scheda, index) => (
            <div 
              key={scheda.id} 
              className="card-hover group animate-slide-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gym-red p-3 rounded-lg group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-2">
                  {scheda.scheda_attiva ? (
                    <span className="badge-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Attiva
                    </span>
                  ) : (
                    <span className="bg-zinc-800 text-zinc-400 text-xs font-bold px-3 py-1 rounded-full uppercase flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Inattiva
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-black text-white mb-3 line-clamp-2">
                {scheda.nome_scheda}
              </h3>

              {scheda.descrizione && (
                <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
                  {scheda.descrizione}
                </p>
              )}

              <div className="flex items-center text-zinc-400 text-sm mb-3">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{scheda.giorni_settimana?.length || 0} giorni/settimana</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {scheda.giorni_settimana?.slice(0, 4).map((giorno) => (
                  <span key={giorno} className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded font-semibold">
                    {giorno.slice(0, 3).toUpperCase()}
                  </span>
                ))}
                {scheda.giorni_settimana?.length > 4 && (
                  <span className="bg-zinc-800 text-zinc-300 text-xs px-2 py-1 rounded font-semibold">
                    +{scheda.giorni_settimana.length - 4}
                  </span>
                )}
              </div>

              <div className="text-sm text-zinc-500 mb-4">
                {scheda.esercizi_scheda?.length || 0} esercizi totali
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => attivaDisattivaScheda(scheda.id, scheda.scheda_attiva)}
                    className="text-zinc-400 hover:text-gym-red transition-colors"
                  >
                    {scheda.scheda_attiva ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => eliminaScheda(scheda.id, scheda.nome_scheda)}
                    className="text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <Link
                  href={`/SchedaDettaglioPage?id=${scheda.id}`}
                  className="text-gym-red hover:text-gym-red-light font-semibold text-sm uppercase tracking-wide transition-colors"
                >
                  Visualizza →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
