import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { X, User as UserIcon, Camera, Sparkles } from 'lucide-react';

interface UserSettingsModalProps {
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleRandomAvatar = () => {
    const seed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.put('/auth/profile', { username, avatarUrl });
      setSuccess('Perfil atualizado com sucesso! Recarregue para aplicar todas as fotos.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-vocalis-card border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <UserIcon className="w-5 h-5 text-vocalis-accent" />
            <h3 className="font-bold text-lg">Configurações de Perfil</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl">{error}</p>}
        {success && <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Preview & Randomizer */}
          <div className="flex flex-col items-center space-y-3 py-2">
            <div className="relative">
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`}
                alt="Avatar"
                className="w-20 h-20 rounded-full bg-gray-800 border-2 border-vocalis-accent object-cover shadow-neon"
              />
              <button
                type="button"
                onClick={handleRandomAvatar}
                className="absolute -bottom-1 -right-1 p-1.5 bg-vocalis-neon text-white rounded-full hover:scale-110 transition-transform shadow-md"
                title="Gerar Avatar Aleatório"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-400">Clique na varinha para gerar novo avatar</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Nome de Usuário
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-vocalis-bg border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              URL da Foto de Perfil
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://exemplo.com/avatar.png"
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
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

