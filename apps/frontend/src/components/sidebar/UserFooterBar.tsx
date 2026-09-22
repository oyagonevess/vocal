import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useRTC } from '../../context/RTCContext.js';
import { Mic, MicOff, Headphones, Settings, LogOut } from 'lucide-react';
import { UserSettingsModal } from '../modals/UserSettingsModal.js';

export const UserFooterBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { mediaDevices } = useRTC();
  const [showSettings, setShowSettings] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="h-16 bg-vocalis-card border-t border-gray-800/80 px-3 flex items-center justify-between z-20 select-none">
        {/* User Info */}
        <div className="flex items-center space-x-2.5 truncate max-w-[120px]">
          <div className="relative">
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-9 h-9 rounded-full bg-gray-700 border border-gray-700 object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-vocalis-card" />
          </div>

          <div className="truncate">
            <p className="text-sm font-bold text-white leading-tight truncate">{user.username}</p>
            <p className="text-[10px] text-emerald-400 leading-tight">Conectado</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center space-x-1 text-gray-300">
          <button
            onClick={mediaDevices.toggleMute}
            className={`p-2 rounded-lg transition-colors ${
              mediaDevices.muted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'hover:bg-vocalis-hover hover:text-white'
            }`}
            title={mediaDevices.muted ? 'Ativar Microfone' : 'Mutar Microfone'}
          >
            {mediaDevices.muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={mediaDevices.toggleDeafen}
            className={`p-2 rounded-lg transition-colors ${
              mediaDevices.deafened ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'hover:bg-vocalis-hover hover:text-white'
            }`}
            title={mediaDevices.deafened ? 'Ativar Som' : 'Ensurdecer (Deafen)'}
          >
            <Headphones className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg hover:bg-vocalis-hover text-gray-400 hover:text-white transition-colors"
            title="Configurações de Perfil"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            title="Sair da Conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && <UserSettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
};
