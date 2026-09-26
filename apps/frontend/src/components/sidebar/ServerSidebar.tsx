import React from 'react';
import { Server } from '../../types/index.js';
import { Plus, Globe, Radio, LogIn } from 'lucide-react';

interface ServerSidebarProps {
  servers: Server[];
  activeServerId: string | null;
  onSelectServer: (server: Server) => void;
  onOpenCreateServer: () => void;
  onOpenJoinServer: () => void;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({
  servers,
  activeServerId,
  onSelectServer,
  onOpenCreateServer,
  onOpenJoinServer,
}) => {
  return (
    <aside className="w-18 shrink-0 bg-vocalis-sidebar flex flex-col items-center py-4 space-y-3 border-r border-gray-800/60 z-20 select-none h-full">
      {/* App Logo */}
      <div className="w-12 h-12 bg-vocalis-accent rounded-2xl flex items-center justify-center text-white shadow-neon cursor-pointer transition-all hover:rounded-xl">
        <Radio className="w-7 h-7" />
      </div>

      <div className="w-8 h-[2px] bg-gray-800/80 rounded-full my-1" />

      {/* Servers List */}
      <div className="flex-1 w-full space-y-3 px-3 overflow-y-auto scrollbar-thin flex flex-col items-center">
        {servers.map((server) => {
          const isActive = server.id === activeServerId;
          const initials = server.name.substring(0, 3).toUpperCase();

          return (
            <div key={server.id} className="relative group flex items-center">
              {/* Left active pill */}
              <div
                className={`absolute -left-3 w-1 bg-white rounded-r-full transition-all duration-200 ${
                  isActive ? 'h-10' : 'h-0 group-hover:h-5'
                }`}
              />
              
              <button
                onClick={() => onSelectServer(server)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-vocalis-accent text-white rounded-xl shadow-lg shadow-indigo-500/20'
                    : 'bg-vocalis-card text-gray-300 hover:bg-vocalis-hover hover:text-white hover:rounded-xl'
                }`}
                title={server.name}
              >
                {server.iconUrl ? (
                  <img src={server.iconUrl} alt={server.name} className="w-full h-full rounded-[inherit] object-cover" />
                ) : (
                  <span>{initials}</span>
                )}
              </button>
            </div>
          );
        })}

        {/* Global Join by Invite Code Button */}
        <button
          onClick={onOpenJoinServer}
          className="w-12 h-12 rounded-2xl bg-vocalis-card text-gray-400 flex items-center justify-center hover:bg-vocalis-hover hover:text-white hover:rounded-xl transition-all"
          title="Entrar com Código de Convite"
        >
          <LogIn className="w-5 h-5 text-emerald-400" />
        </button>
      </div>

      {/* Create Server (+) Button */}
      <button
        onClick={onOpenCreateServer}
        className="w-12 h-12 rounded-2xl bg-vocalis-accent/20 text-vocalis-accent border border-vocalis-accent/30 flex items-center justify-center hover:bg-vocalis-accent hover:text-white hover:rounded-xl transition-all shadow-sm"
        title="Criar Novo Servidor"
      >
        <Plus className="w-6 h-6" />
      </button>
    </aside>
  );
};
