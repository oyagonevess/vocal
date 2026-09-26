import React, { useState, useRef } from 'react';
import { api } from '../../services/api.js';
import { Server } from '../../types/index.js';
import { X, Server as ServerIcon, Upload, Camera } from 'lucide-react';

interface CreateServerModalProps {
  onClose: () => void;
  onServerCreated: (server: Server) => void;
}

export const CreateServerModal: React.FC<CreateServerModalProps> = ({ onClose, onServerCreated }) => {
  const [name, setName] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/servers', { name, iconUrl });
      onServerCreated(res.data.server);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-vocalis-card border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <ServerIcon className="w-5 h-5 text-vocalis-accent" />
            <h3 className="font-bold text-lg">Criar Novo Servidor</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Server Icon Preview & Upload */}
          <div className="flex flex-col items-center space-y-3 py-1">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt="Ícone do Servidor"
                  className="w-20 h-20 rounded-2xl bg-gray-800 border-2 border-vocalis-accent object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-400">
                  <ServerIcon className="w-8 h-8" />
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Camera className="w-5 h-5" />
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-gray-800 hover:bg-vocalis-hover text-gray-200 border border-gray-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-vocalis-accent" />
              <span>Escolher Foto do Servidor</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Nome do Servidor
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Comunidade Vocalis, Time Dev"
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
              {loading ? 'Criando...' : 'Criar Servidor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

