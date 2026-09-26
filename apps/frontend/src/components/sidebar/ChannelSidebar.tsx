import React from 'react';
import { Server, Channel, RoomPeer } from '../../types/index.js';
import { Volume2, Hash, Plus, UserPlus, MicOff, Monitor, Settings, MessageSquare } from 'lucide-react';
import { useRTC } from '../../context/RTCContext.js';

interface ChannelSidebarProps {
  server: Server | null;
  activeChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onOpenCreateChannel: () => void;
  onOpenInviteModal: () => void;
  onOpenServerSettings: () => void;
  onToggleMobileStage?: () => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  server,
  activeChannel: selectedChannel,
  onSelectChannel,
  onOpenCreateChannel,
  onOpenInviteModal,
  onOpenServerSettings,
  onToggleMobileStage,
}) => {
  const { joinChannel, channelPresence } = useRTC();

  if (!server) {
    return (
      <aside className="w-full md:w-64 bg-vocalis-sidebar border-r border-gray-800/60 p-4 flex items-center justify-center text-gray-500 text-sm">
        Nenhum servidor selecionado.
      </aside>
    );
  }

  const textChannels = server.channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = server.channels.filter((c) => c.type === 'VOICE');

  const handleChannelClick = (channel: Channel) => {
    onSelectChannel(channel);
    if (channel.type === 'VOICE') {
      joinChannel(channel, server.id);
    }
  };

  return (
    <aside className="w-full md:w-64 bg-vocalis-sidebar border-r border-gray-800/60 flex flex-col z-10 select-none h-full">
      {/* Server Title Header */}
      <div className="h-16 px-4 border-b border-gray-800/60 flex items-center justify-between shadow-sm">
        <h2 className="font-bold text-lg text-white truncate">{server.name}</h2>
        <div className="flex items-center space-x-1">
          {onToggleMobileStage && (
            <button
              onClick={onToggleMobileStage}
              className="md:hidden p-1.5 rounded-lg bg-vocalis-accent/20 text-vocalis-accent hover:bg-vocalis-accent/30 transition-colors text-xs font-semibold px-2 flex items-center space-x-1"
              title="Ir para o Chat/Estágio"
            >
              <span>Chat</span>
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onOpenServerSettings}
            className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-vocalis-hover text-gray-400 hover:text-white transition-colors"
            title="Configurações do Servidor"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenInviteModal}
            className="p-1.5 rounded-lg bg-gray-800/50 hover:bg-vocalis-hover text-gray-300 hover:text-white transition-colors"
            title="Convidar Pessoas"
          >
            <UserPlus className="w-4 h-4 text-vocalis-accent" />
          </button>
        </div>
      </div>

      {/* Channels List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {/* 1. Text Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Canais de Texto ({textChannels.length})
            </span>
            <button
              onClick={onOpenCreateChannel}
              className="text-gray-400 hover:text-white transition-colors"
              title="Criar Canal"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {textChannels.map((channel) => {
              const isActive = selectedChannel?.id === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className={`w-full group flex items-center space-x-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-vocalis-card text-white border border-vocalis-accent/40 shadow-sm'
                      : 'text-gray-400 hover:bg-vocalis-hover hover:text-gray-200'
                  }`}
                >
                  <Hash
                    className={`w-4 h-4 ${
                      isActive ? 'text-vocalis-accent' : 'text-gray-400 group-hover:text-gray-200'
                    }`}
                  />
                  <span className="truncate">{channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Voice Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Canais de Voz ({voiceChannels.length})
            </span>
            <button
              onClick={onOpenCreateChannel}
              className="text-gray-400 hover:text-white transition-colors"
              title="Criar Canal de Voz"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {voiceChannels.map((channel) => {
              const isActive = selectedChannel?.id === channel.id;
              const connectedPeers = channelPresence.get(channel.id) || [];

              return (
                <div key={channel.id} className="space-y-1">
                  <button
                    onClick={() => handleChannelClick(channel)}
                    className={`w-full group flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-vocalis-card text-white border border-vocalis-accent/40 shadow-sm'
                        : 'text-gray-400 hover:bg-vocalis-hover hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Volume2
                        className={`w-4 h-4 ${
                          isActive ? 'text-vocalis-accent' : 'text-gray-400 group-hover:text-gray-200'
                        }`}
                      />
                      <span className="truncate">{channel.name}</span>
                    </div>

                    {channel.userLimit > 0 && (
                      <span className="text-xs text-gray-500 font-mono">
                        {connectedPeers.length}/{channel.userLimit}
                      </span>
                    )}
                  </button>

                  {/* Connected Users inside channel */}
                  {connectedPeers.length > 0 && (
                    <div className="pl-6 space-y-1.5 py-1">
                      {connectedPeers.map((peer) => (
                        <div
                          key={peer.socketId}
                          className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-gray-800/40 text-xs text-gray-300"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <div className="relative">
                              <img
                                src={peer.avatarUrl}
                                alt={peer.username}
                                className={`w-6 h-6 rounded-full bg-gray-700 object-cover ${
                                  peer.isSpeaking ? 'ring-2 ring-vocalis-neon' : ''
                                }`}
                              />
                              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full border border-vocalis-sidebar" />
                            </div>
                            <span className="truncate font-medium">{peer.username}</span>
                          </div>

                          <div className="flex items-center space-x-1 text-gray-400">
                            {peer.muted && <MicOff className="w-3 h-3 text-red-400" />}
                            {peer.screenSharing && <Monitor className="w-3 h-3 text-vocalis-accent animate-pulse" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
