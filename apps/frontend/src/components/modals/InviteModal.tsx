import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { X, Copy, Check, Link } from 'lucide-react';

interface InviteModalProps {
  serverId: string;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ serverId, onClose }) => {
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/servers/${serverId}/invites`);
      setInviteCode(res.data.invite.code);
    } catch (err) {
      console.error('Erro ao gerar link de convite:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!inviteCode) return;
    const fullLink = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-vocalis-card border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Link className="w-5 h-5 text-vocalis-accent" />
            <h3 className="font-bold text-lg">Convidar Amigos para o Servidor</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!inviteCode ? (
          <div className="text-center space-y-4 py-3">
            <p className="text-sm text-gray-300">
              Gere um link temporário seguro com validade de 7 dias para convidar novos participantes.
            </p>
            <button
              onClick={generateLink}
              disabled={loading}
              className="px-6 py-3 bg-vocalis-accent hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-sm"
            >
              {loading ? 'Gerando Link...' : 'Gerar Link de Convite Seguro'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Link de Convite Temporário (7 dias)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/invite/${inviteCode}`}
                className="flex-1 px-4 py-2.5 bg-vocalis-bg border border-gray-700 rounded-xl text-xs font-mono text-white focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2.5 bg-vocalis-accent hover:bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

