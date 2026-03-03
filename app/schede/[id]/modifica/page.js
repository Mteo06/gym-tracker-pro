'use client';

import { useState, useRef, useEffect } from 'react';
import { creaClientSupabase } from '../../../../lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Trash2, Save, Calendar, AlertCircle, GripVertical, Dumbbell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModificaSchedaPage() {
  const [nomeScheda, setNomeScheda] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [giorniSelezionati, setGiorniSelezionati] = useState([]);
  const [esercizi, setEsercizi] = useState([]);
  const [caricamento, setCaricamento] = useState(true);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  const [errore, setErrore] = useState('');
  const router = useRouter();
  const params = useParams();
  const supabase = creaClientSupabase();
  const ultimoEsercizioRef = useRef(null);

  const giorniSettimana = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const gruppiMuscolari = ['Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti', 'Gambe', 'Addome', 'Cardio', 'Altro'];

  useEffect(() => {
    caricaScheda();
  }, [params.id]);

  useEffect(() => {
    if (ultimoEsercizioRef.current) {
      ultimoEsercizioRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [esercizi.length]);

  const caricaScheda = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Carica scheda
    const { data: schedaData, error: schedaError } = await supabase
      .from('schede_allenamento')
      .select('*')
      .eq('id', params.id)
      .eq('utente_id', user.id)
      .single();

    if (schedaError || !schedaData) {
      router.push('/schede');
      return;
    }

    setNomeScheda(schedaData.nome_scheda);
    setDescrizione(schedaData.descrizione || '');
    setGiorniSelezionati(schedaData.giorni_settimana || []);

    // Carica esercizi
    const { data: eserciziData } = await supabase
      .from('esercizi_scheda')
      .select('*')
      .eq('scheda_id', params.id)
      .order('ordine_esecuzione');

    if (eserciziData) {
      // Add a local ID for animations and tracking un-saved ones
      setEsercizi(eserciziData.map(e => ({ ...e, id_locale: e.id })));
    }

    setCaricamento(false);
  };

  const aggiungiEsercizio = () => {
    setEsercizi([...esercizi, {
      id_locale: Date.now().toString(),
      giorno_settimana: giorniSelezionati[0] || '',
      nome_esercizio: '',
      numero_serie: 3,
      numero_ripetizioni: '10',
      peso_utilizzato: '',
      note_tecniche: '',
      tempo_pausa: '90s',
      gruppo_muscolare: '',
      ordine_esecuzione: esercizi.length
    }]);
  };

  const rimuoviEsercizio = (index) => {
    // We do NOT delete from DB here. Just carefully remove from local state.
    // Overwriting the full list in DB upon submit is safer and simpler.
    setEsercizi(esercizi.filter((_, i) => i !== index));
  };

  const aggiornaEsercizio = (index, campo, valore) => {
    const nuoviEsercizi = [...esercizi];
    nuoviEsercizi[index][campo] = valore;
    setEsercizi(nuoviEsercizi);
  };

  const salvaModifiche = async (e) => {
    e.preventDefault();
    if (salvataggioInCorso) return; // Prevent double submit

    setErrore('');

    if (giorniSelezionati.length === 0) {
      setErrore('Seleziona almeno un giorno di allenamento');
      return;
    }

    if (esercizi.length === 0) {
      setErrore('Aggiungi almeno un esercizio alla scheda');
      return;
    }

    const eserciziSenzaGiorno = esercizi.some(ex => !ex.giorno_settimana);
    if (eserciziSenzaGiorno) {
      setErrore('Alcuni esercizi non hanno un giorno assegnato');
      return;
    }

    setSalvataggioInCorso(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Aggiorna scheda
      const { error: schedaError } = await supabase
        .from('schede_allenamento')
        .update({
          nome_scheda: nomeScheda,
          descrizione: descrizione || null,
          giorni_settimana: giorniSelezionati
        })
        .eq('id', params.id);

      if (schedaError) throw new Error('Errore nel salvataggio della scheda: ' + schedaError.message);

      // Trova gli esercizi attualmente nel DB per capire quali eliminare
      const { data: eserciziAttuali } = await supabase
        .from('esercizi_scheda')
        .select('id')
        .eq('scheda_id', params.id);

      const idEserciziMantenuti = esercizi.filter(ex => ex.id).map(ex => ex.id);

      const idDaEliminare = eserciziAttuali
        ? eserciziAttuali.map(e => e.id).filter(id => !idEserciziMantenuti.includes(id))
        : [];

      // Elimina gli esercizi rimossi
      if (idDaEliminare.length > 0) {
        // Se ci sono errori, tipo costrizioni FK, per ora proviamo a forzare o farne log.
        const { error: deleteError } = await supabase
          .from('esercizi_scheda')
          .delete()
          .in('id', idDaEliminare);

        if (deleteError) {
          console.warn("Non è stato possibile eliminare alcuni esercizi storici:", deleteError);
          // Continuiamo comunque a fare l'upsert del resto.
        }
      }

      // Inserisci e aggiorna esercizi con upsert (così non duplichiamo)
      if (esercizi.length > 0) {
        const eserciziFormattati = esercizi.map((ex, index) => {
          const payload = {
            scheda_id: params.id,
            giorno_settimana: ex.giorno_settimana,
            nome_esercizio: ex.nome_esercizio,
            numero_serie: parseInt(ex.numero_serie) || 3,
            numero_ripetizioni: ex.numero_ripetizioni,
            peso_utilizzato: ex.peso_utilizzato ? parseFloat(ex.peso_utilizzato) : null,
            note_tecniche: ex.note_tecniche || null,
            tempo_pausa: ex.tempo_pausa || null,
            gruppo_muscolare: ex.gruppo_muscolare || null,
            ordine_esecuzione: index
          };
          if (ex.id) {
            payload.id = ex.id; // per forzare l'update se esiste
          }
          return payload;
        });

        const { error: eserciziError } = await supabase
          .from('esercizi_scheda')
          .upsert(eserciziFormattati);

        if (eserciziError) throw new Error('Errore nel salvataggio degli esercizi: ' + eserciziError.message);
      }

      router.push(`/schede/${params.id}`);
    } catch (err) {
      setErrore(err.message);
      setSalvataggioInCorso(false);
    }
  };

  const toggleGiorno = (giorno) => {
    if (giorniSelezionati.includes(giorno)) {
      setGiorniSelezionati(giorniSelezionati.filter(g => g !== giorno));
    } else {
      setGiorniSelezionati([...giorniSelezionati, giorno]);
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
    <div className="page-container max-w-5xl">
      <div className="section-header">
        <div className="flex items-center space-x-4 mb-4">
          <Link href={`/schede/${params.id}`} className="btn-secondary p-3">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="section-title">
              MODIFICA <span className="text-gradient">SCHEDA</span>
            </h1>
            <p className="section-subtitle">Aggiorna il tuo programma di allenamento</p>
          </div>
        </div>
      </div>

      <form onSubmit={salvaModifiche} className="space-y-8">
        {/* Informazioni Base */}
        <div className="card animate-slide-in">
          <h2 className="text-2xl font-black text-white mb-6 uppercase">Informazioni Base</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Nome Scheda *</label>
              <input
                type="text"
                value={nomeScheda}
                onChange={(e) => setNomeScheda(e.target.value)}
                className="input-field"
                placeholder="es: Forza Full Body, Ipertrofia Push/Pull/Legs..."
                required
              />
            </div>

            <div>
              <label className="label">Descrizione (Opzionale)</label>
              <textarea
                value={descrizione}
                onChange={(e) => setDescrizione(e.target.value)}
                className="textarea-field"
                placeholder="es: Scheda per aumento massa muscolare, 3 volte a settimana..."
                rows="3"
              />
            </div>
          </div>
        </div>

        {/* Giorni Allenamento */}
        <div className="card animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-2xl font-black text-white mb-6 uppercase flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-gym-red" />
            Giorni di Allenamento *
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {giorniSettimana.map(giorno => (
              <button
                key={giorno}
                type="button"
                onClick={() => toggleGiorno(giorno)}
                className={`p-4 rounded-lg border-2 text-center font-bold transition-all ${giorniSelezionati.includes(giorno)
                  ? 'bg-gym-red border-gym-red text-white shadow-gym scale-105'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-gym-red'
                  }`}
              >
                <div className="text-xs uppercase tracking-wide">{giorno.slice(0, 3)}</div>
              </button>
            ))}
          </div>

          {giorniSelezionati.length > 0 && (
            <div className="mt-4 text-sm text-zinc-400">
              Hai selezionato {giorniSelezionati.length} giorn{giorniSelezionati.length === 1 ? 'o' : 'i'} di allenamento
            </div>
          )}
        </div>

        {/* Esercizi */}
        <div className="card animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-white uppercase">Esercizi *</h2>
            {giorniSelezionati.length > 0 && (
              <button
                type="button"
                onClick={aggiungiEsercizio}
                className="btn-secondary"
              >
                <Plus className="w-5 h-5" />
                Aggiungi Esercizio
              </button>
            )}
          </div>

          {giorniSelezionati.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 bg-zinc-800 rounded-lg">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p>Seleziona almeno un giorno prima di aggiungere esercizi</p>
            </div>
          ) : esercizi.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 bg-zinc-800 rounded-lg">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p>Nessun esercizio aggiunto.</p>
              <p className="text-sm mt-2">Clicca su "Aggiungi Esercizio" per iniziare!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {esercizi.map((ex, index) => (
                  <motion.div
                    key={ex.id_locale}
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.3 }}
                    ref={index === esercizi.length - 1 ? ultimoEsercizioRef : null}
                    className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gym-red opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <GripVertical className="w-5 h-5 text-zinc-600" />
                        <span className="text-sm font-bold text-zinc-500">ESERCIZIO #{index + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => rimuoviEsercizio(index)}
                        className="text-red-600 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-zinc-700"
                        title="Rimuovi Esercizio"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Giorno *</label>
                        <select
                          value={ex.giorno_settimana}
                          onChange={(e) => aggiornaEsercizio(index, 'giorno_settimana', e.target.value)}
                          className="select-field"
                          required
                        >
                          <option value="">Seleziona giorno</option>
                          {giorniSelezionati.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label">Nome Esercizio *</label>
                        <input
                          type="text"
                          value={ex.nome_esercizio}
                          onChange={(e) => aggiornaEsercizio(index, 'nome_esercizio', e.target.value)}
                          placeholder="es: Panca Piana, Squat..."
                          className="input-field"
                          required
                        />
                      </div>

                      <div>
                        <label className="label">Gruppo Muscolare</label>
                        <select
                          value={ex.gruppo_muscolare}
                          onChange={(e) => aggiornaEsercizio(index, 'gruppo_muscolare', e.target.value)}
                          className="select-field"
                        >
                          <option value="">Seleziona gruppo</option>
                          {gruppiMuscolari.map(gruppo => (
                            <option key={gruppo} value={gruppo}>{gruppo}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="label">Serie *</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={ex.numero_serie}
                          onChange={(e) => aggiornaEsercizio(index, 'numero_serie', e.target.value)}
                          placeholder="3"
                          className="input-field"
                          required
                        />
                      </div>

                      <div>
                        <label className="label">Ripetizioni *</label>
                        <input
                          type="text"
                          value={ex.numero_ripetizioni}
                          onChange={(e) => aggiornaEsercizio(index, 'numero_ripetizioni', e.target.value)}
                          placeholder="8-12"
                          className="input-field"
                          required
                        />
                      </div>

                      <div>
                        <label className="label">Peso (kg)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={ex.peso_utilizzato}
                          onChange={(e) => aggiornaEsercizio(index, 'peso_utilizzato', e.target.value)}
                          placeholder="60"
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="label">Tempo di Pausa</label>
                        <input
                          type="text"
                          value={ex.tempo_pausa}
                          onChange={(e) => aggiornaEsercizio(index, 'tempo_pausa', e.target.value)}
                          placeholder="90s, 2min..."
                          className="input-field"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label">Note Tecniche</label>
                        <textarea
                          value={ex.note_tecniche}
                          onChange={(e) => aggiornaEsercizio(index, 'note_tecniche', e.target.value)}
                          placeholder="es: Focus eccentrica lenta..."
                          className="textarea-field"
                          rows="2"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button
                type="button"
                onClick={aggiungiEsercizio}
                className="btn-secondary w-full border-dashed"
              >
                <Plus className="w-5 h-5 mr-2" />
                Aggiungi Altro Esercizio
              </button>
            </div>
          )}
        </div>

        {errore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="alert-error flex items-start"
          >
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{errore}</span>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Link href={`/schede/${params.id}`} className="btn-secondary text-center">
            Annulla
          </Link>
          <button
            type="submit"
            disabled={salvataggioInCorso || esercizi.length === 0 || giorniSelezionati.length === 0}
            className="btn-primary"
          >
            {salvataggioInCorso ? (
              <>
                <div className="spinner h-5 w-5 border-2"></div>
                SALVATAGGIO...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                SALVA MODIFICHE
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
