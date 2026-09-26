import React, { useState } from 'react';
import { Server, Member } from '../../types/index';
import { Users, Shield, Crown, X, Search } from 'lucide-react';
import { useRTC } from '../../context/RTCContext';

interface MembersSidebarProps {
  server: Server | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MembersSidebar: React.FC<MembersSidebarProps> = ({ server, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { peers } = useRTC();

  if (!isOpen || !server) return null;

  const members = server.members || [];

  // Filter members by search query
  const filteredMembers = members.filter((m) =>
    m.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group members by Role
  const owners = filteredMembers.filter((m) => m.role === 'OWNER');
  const admins = filteredMembers.filter((m) => m.role === 'ADMIN');
  const regularMembers = filteredMembers.filter((m) => m.role === 'MEMBER');

  // Helper to check if a user is online (e.g. in RTC peers or connected)
  const isUserOnline = (userId: string) => {
    return peers.some((p) => p.userId === userId || p.socketId === userId);
  };

  const renderMemberItem = (member: Member) => {
    const online = isUserOnline(member.userId);

    return (
      <div
        key={member.id}
        className="flex items-center space-x-3 px-2.5 py-2 rounded-xl hover:bg-vocalis-hover transition-colors group cursor-pointer"
      >
        <div className="relative shrink-0">
          <img
            src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.userId}`}
            alt={member.user?.username}
            className="w-8 h-8 rounded-full bg-gray-800 object-cover border border-gray-700/60"
          />
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-vocalis-sidebar ${
              online ? 'bg-emerald-500 shadow-sm' : 'bg-gray-500'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm font-semibold text-gray-200 group-hover:text-white truncate">
              {member.user?.username || 'Usuário'}
            </span>
            {member.role === 'OWNER' && (
              <span title="Dono do Servidor">
                <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </span>
            )}
            {member.role === 'ADMIN' && (
              <span title="Administrador">
                <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-400 leading-tight capitalize">
            {member.role === 'OWNER' ? 'Dono' : member.role === 'ADMIN' ? 'Admin' : 'Membro'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        onClick={onClose}
        className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30"
      />

      <aside className="fixed md:relative right-0 top-0 bottom-0 z-40 md:z-10 w-64 bg-vocalis-sidebar border-l border-gray-800/60 flex flex-col h-full select-none shadow-2xl md:shadow-none transition-all duration-200 shrink-0">
        {/* Header */}
        <div className="h-16 px-4 border-b border-gray-800/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-vocalis-accent" />
            <h3 className="font-bold text-sm text-white">
              Membros ({members.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-vocalis-hover text-gray-400 hover:text-white transition-colors"
            title="Fechar Lista de Membros"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-gray-800/40 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar membro..."
              className="w-full pl-8 pr-3 py-1.5 bg-vocalis-card border border-gray-800 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-vocalis-accent transition-colors"
            />
          </div>
        </div>

        {/* Member Categories List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          {owners.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-2 mb-1.5 flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span>Dono — {owners.length}</span>
              </h4>
              <div className="space-y-0.5">{owners.map(renderMemberItem)}</div>
            </div>
          )}

          {admins.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 px-2 mb-1.5 flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>Admins — {admins.length}</span>
              </h4>
              <div className="space-y-0.5">{admins.map(renderMemberItem)}</div>
            </div>
          )}

          {regularMembers.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1.5">
                Membros — {regularMembers.length}
              </h4>
              <div className="space-y-0.5">{regularMembers.map(renderMemberItem)}</div>
            </div>
          )}

          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-500">
              Nenhum membro encontrado.
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
