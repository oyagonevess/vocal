import React from 'react';
import { ShieldAlert, MicOff, RefreshCw, X } from 'lucide-react';
import { MediaErrorState } from '../../hooks/useMediaDevices.js';

interface MediaPermissionModalProps {
  error: MediaErrorState;
  onClose: () => void;
}

export const MediaPermissionModal: React.FC<MediaPermissionModalProps> = ({ error, onClose }) => {
  if (!error.hasError) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-vocalis-card border border-red-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-400">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="font-bold text-lg text-white">Acesso de Mídia Bloqueado</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 py-2">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <MicOff className="w-7 h-7" />
          </div>

          <p className="text-sm text-gray-300 text-center leading-relaxed">
            {error.message || 'Não foi possível acessar seu microfone ou câmera. O navegador bloqueou as permissões de mídia.'}
          </p>

          <div className="bg-vocalis-bg p-4 rounded-2xl border border-gray-800 space-y-2 text-xs text-gray-400">
            <p className="font-bold text-gray-200">Como resolver no navegador:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Clique no ícone de cadeado/permissões na barra de endereço.</li>
              <li>Altere a opção de <strong>Microfone</strong> e <strong>Câmera</strong> para <em>Permitir</em>.</li>
              <li>Recarregue a página para aplicar as alterações.</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-vocalis-accent hover:bg-indigo-600 text-white font-bold rounded-xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Recarregar Página</span>
          </button>
        </div>
      </div>
    </div>
  );
};

