import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { Server } from '../../types/index.js';
import { X, LogIn } from 'lucide-react';

interface JoinServerModalProps {
  onClose: () => void;
  onServerJoined: (server: Server) => void;
}

export const JoinServerModal: React.FC<JoinServerModalProps> = ({ onClose, onServerJoined }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Extrair código se colaram a URL inteira
    let cleanCode = code.trim();
    if (cleanCode.includes('/invite/')) {
      cleanCode = cleanCode.split('/invite/')[1];
    }

    try {
      const res = await api.post(`/servers/join/${cleanCode}`);
      onServerJoined(res.data.server);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ou código de convite inválido/expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-vocalis-card border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <LogIn className="w-5 h-5 text-vocalis-accent" />
            <h3 className="font-bold text-lg">Entrar em um Servidor</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Código ou Link de Convite
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: a1b2c3d4 ou http://localhost:5173/invite/a1b2c3d4"
              className="w-full px-4 py-2.5 bg-vocalis-bg border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent"
            />
          </div>

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
              {loading ? 'Entrando...' : 'Entrar no Servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

