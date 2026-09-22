import React, { useState } from 'react';
import { Server, Channel, Member } from '../../types/index.js';
import { api } from '../../services/api.js';
import { X, Shield, Trash2, UserX, Hash, Volume2, Settings, Users, Server as ServerIcon } from 'lucide-react';

interface ServerSettingsModalProps {
  server: Server;
  currentUserId: string;
  onClose: () => void;
  onServerUpdated: (server: Server) => void;
  onServerDeleted: (serverId: string) => void;
  onChannelDeleted: (channelId: string) => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  server,
  currentUserId,
  onClose,
  onServerUpdated,
  onServerDeleted,
  onChannelDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'geral' | 'canais' | 'membros'>('geral');
  const [name, setName] = useState(server.name);
  const [iconUrl, setIconUrl] = useState(server.iconUrl || '');
  const [members, setMembers] = useState<Member[]>(server.members);
  const [channels, setChannels] = useState<Channel[]>(server.channels);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentUserMember = server.members.find((m) => m.userId === currentUserId);
  const isOwner = currentUserMember?.role === 'OWNER';
  const isAdmin = currentUserMember?.role === 'ADMIN' || isOwner;

  const handleUpdateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.put(`/servers/${server.id}`, { name, iconUrl });
      onServerUpdated(res.data.server);
      setSuccess('Configurações do servidor salvas com sucesso!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao atualizar servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteServer = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir o servidor "${server.name}"? Esta ação é irreversível.`)) return;

    try {
      await api.delete(`/servers/${server.id}`);
      onServerDeleted(server.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao excluir servidor.');
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      await api.delete(`/channels/${channelId}`);
      setChannels((prev) => prev.filter((c) => c.id !== channelId));
      onChannelDeleted(channelId);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao deletar canal.');
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'ADMIN' | 'MEMBER') => {
    try {
      const res = await api.put(`/servers/${server.id}/members/${targetUserId}/role`, { role: newRole });
      setMembers((prev) => prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m)));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao alterar cargo do membro.');
    }
  };

  const handleKickMember = async (targetUserId: string) => {
    if (!window.confirm('Deseja realmente expulsar este membro do servidor?')) return;

    try {
      await api.delete(`/servers/${server.id}/members/${targetUserId}`);
      setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao expulsar membro.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-vocalis-card border border-gray-800 rounded-3xl shadow-2xl flex flex-col h-[580px] overflow-hidden">
        {/* Modal Header */}
        <div className="h-16 px-6 border-b border-gray-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-white">
            <Settings className="w-5 h-5 text-vocalis-accent" />
            <h3 className="font-bold text-lg">Configurações de {server.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-800 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Sidebar Tabs */}
        <div className="flex-1 flex overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-48 bg-vocalis-sidebar border-r border-gray-800/80 p-3 space-y-1">
            <button
              onClick={() => setActiveTab('geral')}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'geral' ? 'bg-vocalis-accent text-white shadow-md' : 'text-gray-400 hover:bg-vocalis-hover hover:text-white'
              }`}
            >
              <ServerIcon className="w-4 h-4" />
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('canais')}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'canais' ? 'bg-vocalis-accent text-white shadow-md' : 'text-gray-400 hover:bg-vocalis-hover hover:text-white'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Gerenciar Canais</span>
            </button>

            <button
              onClick={() => setActiveTab('membros')}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'membros' ? 'bg-vocalis-accent text-white shadow-md' : 'text-gray-400 hover:bg-vocalis-hover hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Membros ({members.length})</span>
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
            {error && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl mb-4">{error}</p>}
            {success && <p className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-xl mb-4">{success}</p>}

            {/* TAB 1: GERAL */}
            {activeTab === 'geral' && (
              <form onSubmit={handleUpdateServer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    Nome do Servidor
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    disabled={!isAdmin}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-vocalis-bg border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                    URL do Ícone do Servidor
                  </label>
                  <input
                    type="url"
                    value={iconUrl}
                    disabled={!isAdmin}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="https://exemplo.com/icone.png"
                    className="w-full px-4 py-2.5 bg-vocalis-bg border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent"
                  />
                </div>

                {isAdmin && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-vocalis-accent hover:bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                )}

                {/* Zona de Perigo */}
                {isOwner && (
                  <div className="pt-6 border-t border-gray-800 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-400">Zona de Perigo</h4>
                    <button
                      type="button"
                      onClick={handleDeleteServer}
                      className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir Servidor</span>
                    </button>
                  </div>
                )}
              </form>
            )}

            {/* TAB 2: CANAIS */}
            {activeTab === 'canais' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Canais Existentes</h4>
                <div className="space-y-2">
                  {channels.map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center justify-between p-3 bg-vocalis-bg border border-gray-800 rounded-2xl"
                    >
                      <div className="flex items-center space-x-2 text-sm text-gray-200">
                        {ch.type === 'TEXT' ? <Hash className="w-4 h-4 text-vocalis-accent" /> : <Volume2 className="w-4 h-4 text-vocalis-accent" />}
                        <span className="font-semibold">{ch.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-400 rounded-full font-mono">{ch.type}</span>
                      </div>

                      {isAdmin && channels.length > 1 && (
                        <button
                          onClick={() => handleDeleteChannel(ch.id)}
                          className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Deletar Canal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: MEMBROS */}
            {activeTab === 'membros' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Lista de Membros</h4>
                <div className="space-y-2">
                  {members.map((member) => {
                    const isSelf = member.userId === currentUserId;
                    const isMemberOwner = member.role === 'OWNER';

                    return (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-vocalis-bg border border-gray-800 rounded-2xl"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={member.user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.user?.username}`}
                            alt={member.user?.username}
                            className="w-8 h-8 rounded-full bg-gray-700 object-cover"
                          />
                          <div>
                            <span className="text-sm font-bold text-white leading-tight">
                              {member.user?.username} {isSelf && '(Você)'}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  isMemberOwner
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : member.role === 'ADMIN'
                                    ? 'bg-vocalis-accent/20 text-vocalis-accent border border-vocalis-accent/30'
                                    : 'bg-gray-800 text-gray-400'
                                }`}
                              >
                                {member.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions for Owner */}
                        {isOwner && !isMemberOwner && !isSelf && (
                          <div className="flex items-center space-x-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.userId, e.target.value as any)}
                              className="bg-vocalis-card border border-gray-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
                            >
                              <option value="MEMBER">MEMBER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>

                            <button
                              onClick={() => handleKickMember(member.userId)}
                              className="p-1.5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                              title="Expulsar Membro"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

