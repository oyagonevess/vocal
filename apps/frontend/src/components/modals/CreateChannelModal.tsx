import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { Channel } from '../../types/index.js';
import { X, Volume2, Hash } from 'lucide-react';

interface CreateChannelModalProps {
  serverId: string;
  onClose: () => void;
  onChannelCreated: (channel: Channel) => void;
}

export const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ serverId, onClose, onChannelCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'TEXT' | 'VOICE'>('TEXT');
  const [userLimit, setUserLimit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post(`/servers/${serverId}/channels`, { name, type, userLimit: Number(userLimit) });
      onChannelCreated(res.data.channel);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar canal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-vocalis-card border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Hash className="w-5 h-5 text-vocalis-accent" />
            <h3 className="font-bold text-lg">Criar Novo Canal</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">
              Tipo do Canal
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('TEXT')}
                className={`p-3 rounded-2xl border flex flex-col items-center space-y-1.5 transition-all ${
                  type === 'TEXT'
                    ? 'bg-vocalis-accent/20 border-vocalis-accent text-white shadow-md'
                    : 'bg-vocalis-bg border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Hash className="w-6 h-6 text-vocalis-accent" />
                <span className="text-xs font-bold">Canal de Texto</span>
              </button>

              <button
                type="button"
                onClick={() => setType('VOICE')}
                className={`p-3 rounded-2xl border flex flex-col items-center space-y-1.5 transition-all ${
                  type === 'VOICE'
                    ? 'bg-vocalis-accent/20 border-vocalis-accent text-white shadow-md'
                    : 'bg-vocalis-bg border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <Volume2 className="w-6 h-6 text-vocalis-accent" />
                <span className="text-xs font-bold">Canal de Voz</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Nome do Canal
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'TEXT' ? 'Ex: conversas, memes' : 'Ex: Reunião, Jogos'}
              className="w-full px-4 py-2.5 bg-vocalis-bg border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent"
            />
          </div>

          {type === 'VOICE' && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Limite de Usuários (0 = Ilimitado)
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={userLimit}
                onChange={(e) => setUserLimit(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-vocalis-bg border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent"
              />
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-vocalis-accent hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-sm"
            >
              {loading ? 'Criando...' : 'Criar Canal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
