'use client';

import { useState, useEffect } from 'react';
import { creaClientSupabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { User, Mail, Users, Ruler, Edit2, Save, X, LogOut } from 'lucide-react';

export default function ProfiloPage() {
  const [profilo, setProfilo] = useState(null);
  const [modalitaModifica, setModalitaModifica] = useState(false);
  const [caricamento, setCaricamento] = useState(true);
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);
  const [errore, setErrore] = useState('');
  const [successo, setSuccesso] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    sesso: '',
    altezza: ''
  });

  const router = useRouter();
  const supabase = creaClientSupabase();

  useEffect(() => {
    caricaProfilo();
  }, []);

  const caricaProfilo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Carica i dati del profilo
    const { data, error } = await supabase
      .from('profili')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfilo(data);
      setFormData({
        nome: data.nome || '',
        cognome: data.cognome || '',
        email: data.email || user.email,
        sesso: data.sesso || '',
        altezza: data.altezza || ''
      });
    }

    setCaricamento(false);
  };

  const handleInputChange = (campo, valore) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valore
    }));
  };

  const annullaModifica = () => {
    setFormData({
      nome: profilo?.nome || '',
      cognome: profilo?.cognome || '',
      email: profilo?.email || '',
      sesso: profilo?.sesso || '',
      altezza: profilo?.altezza || ''
    });
    setModalitaModifica(false);
    setErrore('');
  };

  const salvaProfilo = async (e) => {
    e.preventDefault();
    setErrore('');
    setSuccesso('');
    setSalvataggioInCorso(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Aggiorna il profilo
    const { error: profiloError } = await supabase
      .from('profili')
      .update({
        nome: formData.nome,
        cognome: formData.cognome,
        email: formData.email,
        sesso: formData.sesso,
        altezza: formData.altezza ? parseFloat(formData.altezza) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profiloError) {
      setErrore('Errore nel salvataggio: ' + profiloError.message);
      setSalvataggioInCorso(false);
      return;
    }

    // Aggiorna anche i metadata nell'auth
    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        nome: formData.nome,
        cognome: formData.cognome
      }
    });

    // Aggiorna email se cambiata
    if (formData.email !== profilo.email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: formData.email
      });

      if (emailError) {
        setErrore('Profilo aggiornato ma errore nell\'aggiornamento email: ' + emailError.message);
      }
    }

    setSuccesso('Profilo aggiornato con successo!');
    await caricaProfilo();
    setModalitaModifica(false);
    setSalvataggioInCorso(false);

    setTimeout(() => setSuccesso(''), 3000);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (caricamento) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-16 w-16"></div>
      </div>
    );
  }

  const nomeCompleto = profilo?.nome && profilo?.cognome 
    ? `${profilo.nome} ${profilo.cognome}` 
    : 'Nome non impostato';

  return (
    <div className="page-container max-w-4xl">
      <div className="section-header">
        <h1 className="section-title">
          IL MIO <span className="text-gradient">PROFILO</span>
        </h1>
        <p className="section-subtitle">Gestisci i tuoi dati personali</p>
      </div>

      {successo && (
        <div className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-lg text-green-300 flex items-center">
          <Save className="w-5 h-5 mr-2" />
          {successo}
        </div>
      )}

      {errore && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300">
          {errore}
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-gym-red to-red-700 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{nomeCompleto}</h2>
              <p className="text-zinc-400">{profilo?.email}</p>
            </div>
          </div>

          {!modalitaModifica && (
            <button
              onClick={() => setModalitaModifica(true)}
              className="btn-secondary"
            >
              <Edit2 className="w-5 h-5" />
              Modifica
            </button>
          )}
        </div>

        {!modalitaModifica ? (
          // Visualizzazione dati
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="w-5 h-5 text-gym-red" />
                  <span className="text-sm text-zinc-500 uppercase font-bold">Nome</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {profilo?.nome || 'Non impostato'}
                </p>
              </div>

              <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="w-5 h-5 text-gym-red" />
                  <span className="text-sm text-zinc-500 uppercase font-bold">Cognome</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {profilo?.cognome || 'Non impostato'}
                </p>
              </div>

              <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                <div className="flex items-center space-x-3 mb-2">
                  <Mail className="w-5 h-5 text-gym-red" />
                  <span className="text-sm text-zinc-500 uppercase font-bold">Email</span>
                </div>
                <p className="text-xl font-bold text-white break-all">
                  {profilo?.email || 'Non impostato'}
                </p>
              </div>

              <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="w-5 h-5 text-gym-red" />
                  <span className="text-sm text-zinc-500 uppercase font-bold">Sesso</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {profilo?.sesso || 'Non impostato'}
                </p>
              </div>

              <div className="bg-zinc-800 p-5 rounded-lg border border-zinc-700">
                <div className="flex items-center space-x-3 mb-2">
                  <Ruler className="w-5 h-5 text-gym-red" />
                  <span className="text-sm text-zinc-500 uppercase font-bold">Altezza</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {profilo?.altezza ? `${profilo.altezza} cm` : 'Non impostato'}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-700">
              <button
                onClick={logout}
                className="btn-secondary bg-red-900 border-red-700 hover:bg-red-800"
              >
                <LogOut className="w-5 h-5" />
                Esci
              </button>
            </div>
          </div>
        ) : (
          // Form di modifica
          <form onSubmit={salvaProfilo} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className="input-field"
                  placeholder="Il tuo nome"
                  required
                />
              </div>

              <div>
                <label className="label">Cognome *</label>
                <input
                  type="text"
                  value={formData.cognome}
                  onChange={(e) => handleInputChange('cognome', e.target.value)}
                  className="input-field"
                  placeholder="Il tuo cognome"
                  required
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                  placeholder="email@esempio.com"
                  required
                />
              </div>

              <div>
                <label className="label">Sesso</label>
                <select
                  value={formData.sesso}
                  onChange={(e) => handleInputChange('sesso', e.target.value)}
                  className="select-field"
                >
                  <option value="">Seleziona</option>
                  <option value="Maschio">Maschio</option>
                  <option value="Femmina">Femmina</option>
                  <option value="Altro">Altro</option>
                </select>
              </div>

              <div>
                <label className="label">Altezza (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="300"
                  value={formData.altezza}
                  onChange={(e) => handleInputChange('altezza', e.target.value)}
                  className="input-field"
                  placeholder="175"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-zinc-700">
              <button
                type="button"
                onClick={annullaModifica}
                disabled={salvataggioInCorso}
                className="btn-secondary"
              >
                <X className="w-5 h-5" />
                Annulla
              </button>
              <button
                type="submit"
                disabled={salvataggioInCorso}
                className="btn-primary"
              >
                {salvataggioInCorso ? (
                  <>
                    <div className="spinner h-5 w-5 border-2"></div>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salva Modifiche
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
