'use client';

import { useState, useRef, useEffect } from 'react';
import { creaClientSupabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, Calendar, GripVertical, Dumbbell, AlertCircle } from 'lucide-react';

export default function CreaSchedaPage() {
  const [nomeScheda, setNomeScheda] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [giorniSelezionati, setGiorniSelezionati] = useState([]);
  const [esercizi, setEsercizi] = useState([]);
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState('');
  const router = useRouter();
  const supabase = creaClientSupabase();
  const ultimoEsercizioRef = useRef(null);

  const giorniSettimana = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const gruppiMuscolari = ['Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti', 'Gambe', 'Addome', 'Cardio', 'Altro'];

  useEffect(() => {
    if (ultimoEsercizioRef.current) {
      ultimoEsercizioRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [esercizi.length]);

  const aggiungiEsercizio = () => {
    setEsercizi([...esercizi, {
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
    setEsercizi(esercizi.filter((_, i) => i !== index));
  };

  const aggiornaEsercizio = (index, campo, valore) => {
    const nuoviEsercizi = [...esercizi];
    nuoviEsercizi[index][campo] = valore;
    setEsercizi(nuoviEsercizi);
  };

  const salvaScheda = async (e) => {
    e.preventDefault();
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

    setCaricamento(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: schedaData, error: schedaError } = await supabase
      .from('schede_allenamento')
      .insert([
        { 
          utente_id: user.id, 
          nome_scheda: nomeScheda, 
          descrizione: descrizione || null,
          giorni_settimana: giorniSelezionati, 
          scheda_attiva: true 
        }
      ])
      .select()
      .single();

    if (schedaError) {
      setErrore('Errore nel salvataggio della scheda: ' + schedaError.message);
      setCaricamento(false);
      return;
    }

    if (esercizi.length > 0) {
      const eserciziFormattati = esercizi.map(ex => ({
        scheda_id: schedaData.id,
        giorno_settimana: ex.giorno_settimana,
        nome_esercizio: ex.nome_esercizio,
        numero_serie: parseInt(ex.numero_serie) || 3,
        numero_ripetizioni: ex.numero_ripetizioni,
        peso_utilizzato: ex.peso_utilizzato ? parseFloat(ex.peso_utilizzato) : null,
        note_tecniche: ex.note_tecniche || null,
        tempo_pausa: ex.tempo_pausa || null,
        gruppo_muscolare: ex.gruppo_muscolare || null,
        ordine_esecuzione: ex.ordine_esecuzione
      }));

      const { error: eserciziError } = await supabase
        .from('esercizi_scheda')
        .insert(eserciziFormattati);

      if (eserciziError) {
        setErrore('Errore nel salvataggio degli esercizi: ' + eserciziError.message);
        setCaricamento(false);
        return;
      }
    }

    router.push('/schede');
    setCaricamento(false);
  };

  const toggleGiorno = (giorno) => {
    if (giorniSelezionati.includes(giorno)) {
      setGiorniSelezionati(giorniSelezionati.filter(g => g !== giorno));
    } else {
      setGiorniSelezionati([...giorniSelezionati, giorno]);
    }
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="section-header">
        <h1 className="section-title">
          CREA <span className="text-gradient">SCHEDA</span>
        </h1>
        <p className="section-subtitle">Personalizza il tuo programma di allenamento</p>
      </div>

      <form onSubmit={salvaScheda} className="space-y-8">
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
                className={`p-4 rounded-lg border-2 text-center font-bold transition-all ${
                  giorniSelezionati.includes(giorno)
                    ? 'bg-gym-red border-gym-red text-white shadow-gym'
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
            {/* Bottone in alto a destra - sempre visibile se giorni selezionati */}
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
              {esercizi.map((ex, index) => (
                <div 
                  key={index} 
                  ref={index === esercizi.length - 1 ? ultimoEsercizioRef : null}
                  className="bg-zinc-800 p-6 rounded-lg border border-zinc-700 relative"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="w-5 h-5 text-zinc-600" />
                      <span className="text-sm font-bold text-zinc-500">ESERCIZIO #{index + 1}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => rimuoviEsercizio(index)}
                      className="text-red-600 hover:text-red-500 transition-colors"
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
                </div>
              ))}

              {/* Bottone anche in fondo */}
              <button
                type="button"
                onClick={aggiungiEsercizio}
                className="btn-secondary w-full"
              >
                <Plus className="w-5 h-5" />
                Aggiungi Altro Esercizio
              </button>
            </div>
          )}
        </div>

        {errore && (
          <div className="alert-error flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{errore}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
            disabled={caricamento}
          >
            Annulla
          </button>
          <button
            type="submit"
            disabled={caricamento || esercizi.length === 0 || giorniSelezionati.length === 0}
            className="btn-primary"
          >
            {caricamento ? (
              <>
                <div className="spinner h-5 w-5 border-2"></div>
                SALVATAGGIO...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                SALVA SCHEDA
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
