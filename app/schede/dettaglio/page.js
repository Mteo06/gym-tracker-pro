'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { creaClientSupabase } from '../../../lib/supabaseClient';

export default function DettaglioSchedaPage() {
  const [scheda, setScheda] = useState(null);
  const [esercizi, setEsercizi] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const schedaId = searchParams.get('id');
  const supabase = creaClientSupabase();

  useEffect(() => {
    if (schedaId) {
      caricaDettaglioScheda();
    }
  }, [schedaId]);

  const caricaDettaglioScheda = async () => {
    const {  { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const {  schedaData, error: schedaError } = await supabase
      .from('schede_allenamento')
      .select('*')
      .eq('id', schedaId)
      .eq('utente_id', user.id)
      .single();

    if (schedaError || !schedaData) {
      router.push('/schede');
      return;
    }

    setScheda(schedaData);

    const {  eserciziData } = await supabase
      .from('esercizi_scheda')
      .select('*')
      .eq('scheda_id', schedaId)
      .order('giorno_settimana')
      .order('ordine_esecuzione');

    if (eserciziData) {
      setEsercizi(eserciziData);
    }

    setCaricamento(false);
  };

  const eliminaScheda = async () => {
    if (!confirm(`Sei sicuro di voler eliminare la scheda "${scheda.nome_scheda}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('schede_allenamento')
      .delete()
      .eq('id', schedaId);

    if (!error) {
      router.push('/schede');
    }
  };

  const raggruppaEserciziPerGiorno = () => {
    const grouped = {};
    esercizi.forEach(ex => {
      if (!grouped[ex.giorno_settimana]) {
        grouped[ex.giorno_settimana] = [];
      }
      grouped[ex.giorno_settimana].push(ex);
    });
    return grouped;
  };

  if (caricamento) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-16 w-16"></div>
      </div>
    );
  }

  if (!scheda) {
    return (
      <div className="page-container">
        <div className="card text-center py-16">
          <h3 className="text-2xl font-bold text-white mb-4">Scheda non trovata</h3>
          <Link href="/schede" className="btn-primary inline-flex">
            Torna alle Schede
          </Link>
        </div>
      </div>
    );
  }

  const eserciziPerGiorno = raggruppaEserciziPerGiorno();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between section-header gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/schede" className="btn-secondary p-3">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="section-title">{scheda.nome_scheda}</h1>
            {scheda.descrizione && (
              <p className="section-subtitle">{scheda.descrizione}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-2">
          {scheda.scheda_attiva && (
            <span className="badge-success text-base px-4 py-2">
              <CheckCircle2 className="w-4 h-4" />
              Attiva
            </span>
          )}
          <Link
            href={`/schede/modifica?id=${schedaId}`}
            className="btn-secondary"
          >
            <Edit className="w-5 h-5" />
            Modifica
          </Link>
          <button
            onClick={eliminaScheda}
            className="btn-secondary bg-red-900 border-red-700 hover:bg-red-800"
          >
            <Trash2 className="w-5 h-5" />
            Elimina
          </button>
        </div>
      </div>

      {/* Info Scheda */}
      <div className="card mb-8 bg-gradient-to-br from-gym-red/10 to-zinc-900 border-gym-red/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="w-5 h-5 text-gym-red" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Giorni di Allenamento
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {scheda.giorni_settimana?.map((giorno) => (
                <span key={giorno} className="bg-gym-red/20 text-gym-red border border-gym-red/30 px-4 py-2 rounded-lg font-bold">
                  {giorno}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black text-white">{esercizi.length}</div>
            <div className="text-sm text-zinc-400">Esercizi Totali</div>
          </div>
        </div>
      </div>

      {/* Esercizi per Giorno */}
      <div className="space-y-8">
        {scheda.giorni_settimana?.map((giorno) => (
          <div key={giorno} className="card animate-slide-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black text-white uppercase">{giorno}</h2>
              <span className="bg-zinc-800 text-zinc-300 text-base px-4 py-2 rounded-full font-bold">
                {eserciziPerGiorno[giorno]?.length || 0} esercizi
              </span>
            </div>

            {!eserciziPerGiorno[giorno] || eserciziPerGiorno[giorno].length === 0 ? (
              <div className="text-center py-8 text-zinc-500 bg-zinc-800 rounded-lg">
                Nessun esercizio per questo giorno
              </div>
            ) : (
              <div className="space-y-4">
                {eserciziPerGiorno[giorno].map((esercizio, index) => (
                  <div key={esercizio.id} className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-gym-red text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <h3 className="text-xl font-black text-white">{esercizio.nome_esercizio}</h3>
                      </div>
                      {esercizio.gruppo_muscolare && (
                        <span className="bg-zinc-900 text-zinc-400 px-3 py-1 rounded-full text-xs font-bold">
                          {esercizio.gruppo_muscolare}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div className="bg-zinc-900 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 uppercase mb-1">Serie</div>
                        <div className="text-lg font-bold text-white">{esercizio.numero_serie}</div>
                      </div>
                      <div className="bg-zinc-900 p-3 rounded-lg">
                        <div className="text-xs text-zinc-500 uppercase mb-1">Ripetizioni</div>
                        <div className="text-lg font-bold text-white">{esercizio.numero_ripetizioni}</div>
                      </div>
                      {esercizio.peso_utilizzato && (
                        <div className="bg-zinc-900 p-3 rounded-lg">
                          <div className="text-xs text-zinc-500 uppercase mb-1">Peso</div>
                          <div className="text-lg font-bold text-gym-red">{esercizio.peso_utilizzato} kg</div>
                        </div>
                      )}
                      {esercizio.tempo_pausa && (
                        <div className="bg-zinc-900 p-3 rounded-lg">
                          <div className="text-xs text-zinc-500 uppercase mb-1">Pausa</div>
                          <div className="text-lg font-bold text-blue-500">{esercizio.tempo_pausa}</div>
                        </div>
                      )}
                    </div>

                    {esercizio.note_tecniche && (
                      <div className="mt-4 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                        <div className="text-xs text-zinc-500 uppercase mb-1">Note Tecniche</div>
                        <p className="text-sm text-zinc-300">{esercizio.note_tecniche}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
