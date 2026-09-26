import React, { useState } from 'react';
import { Menu, Volume2, Hash, Search, Bell, Settings, Radio, Monitor, Users, ChevronLeft } from 'lucide-react';
import { useRTC } from '../../context/RTCContext';
import { useAuth } from '../../context/AuthContext';
import { ParticipantCard } from './ParticipantCard';
import { StreamPlayer } from './StreamPlayer';
import { TextChatView } from '../chat/TextChatView';
import { RoomPeer, Channel, Server } from '../../types/index';
import { MembersSidebar } from '../sidebar/MembersSidebar';

interface MediaStageProps {
  selectedChannel: Channel | null;
  activeServer?: Server | null;
  onToggleMobileMenu?: () => void;
}

export const MediaStage: React.FC<MediaStageProps> = ({
  selectedChannel,
  activeServer,
  onToggleMobileMenu,
}) => {
  const { activeChannel, peers, mediaDevices, joinChannel } = useRTC();
  const { user } = useAuth();
  const [showMembersList, setShowMembersList] = useState(false);

  const isConnectedToVoice = activeChannel && selectedChannel && activeChannel.id === selectedChannel.id;

  const selfPeer: RoomPeer | null = (user && isConnectedToVoice)
    ? {
        socketId: 'self',
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        muted: mediaDevices.muted,
        deafened: mediaDevices.deafened,
        cameraOn: mediaDevices.cameraOn,
        screenSharing: mediaDevices.screenSharing,
        isSpeaking: false,
        stream: mediaDevices.localVideoStream || undefined,
        screenStream: mediaDevices.localScreenStream || undefined,
      }
    : null;

  const allParticipants = selfPeer ? [selfPeer, ...peers] : peers;

  // Find if any peer (or self) is sharing screen
  const screenSharingPeer = allParticipants.find((p) => p.screenSharing);
  const activeSpotlightStream = screenSharingPeer ? (screenSharingPeer.screenStream || screenSharingPeer.stream) : null;

  const isTextChannel = selectedChannel?.type === 'TEXT';
  const isVoiceChannel = selectedChannel?.type === 'VOICE';

  return (
    <div className="flex-1 flex flex-row overflow-hidden relative w-full h-full">
      <main className="flex-1 bg-vocalis-bg flex flex-col relative overflow-hidden">
        {/* Top Bar Header */}
        <header className="h-16 md:h-16 pt-2 md:pt-0 px-4 md:px-6 border-b border-gray-800/60 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            {onToggleMobileMenu && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMobileMenu();
                }}
                className="md:hidden flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-vocalis-accent/20 hover:bg-vocalis-accent/30 text-white transition-all mr-1 border border-vocalis-accent/40 shadow-sm shrink-0 active:scale-95"
                title="Voltar para Canais e Servidores"
              >
                <ChevronLeft className="w-5 h-5 text-vocalis-accent shrink-0" />
                <span className="text-xs font-bold text-white">Salas</span>
              </button>
            )}
            {isTextChannel ? (
              <Hash className="w-5 h-5 text-vocalis-accent shrink-0" />
            ) : (
              <Volume2 className="w-5 h-5 text-vocalis-accent shrink-0" />
            )}
            <h1 className="font-bold text-base md:text-lg text-white truncate">
              {selectedChannel ? selectedChannel.name : 'Nenhum canal selecionado'}
            </h1>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar no Vocalis..."
                className="pl-9 pr-4 py-1.5 bg-vocalis-card border border-gray-800/80 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-vocalis-accent w-48 transition-all"
              />
            </div>

            {/* Toggle Members List Button */}
            {activeServer && (
              <button
                onClick={() => setShowMembersList(!showMembersList)}
                className={`p-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                  showMembersList
                    ? 'bg-vocalis-accent text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-vocalis-card hover:bg-vocalis-hover text-gray-300'
                }`}
                title={showMembersList ? 'Ocultar Membros' : 'Ver Membros (Usuários)'}
              >
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline text-xs font-semibold">
                  Membros ({activeServer.members?.length || 0})
                </span>
              </button>
            )}

            <button className="hidden sm:block p-2 rounded-xl bg-vocalis-card hover:bg-vocalis-hover text-gray-300 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <button className="hidden sm:block p-2 rounded-xl bg-vocalis-card hover:bg-vocalis-hover text-gray-300 transition-colors">
              <Settings className="w-4 h-4" />
            </button>

            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-gray-800/80">
                <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full bg-gray-800 object-cover" />
                <span className="hidden sm:inline text-sm font-semibold text-gray-200">{user.username}</span>
              </div>
            )}
          </div>
        </header>

        {/* Main Viewport Grid / Stage or Text Chat */}
        <div className="flex-1 overflow-hidden flex flex-col h-full">
          {!selectedChannel ? (
            /* Empty State Dashboard */
            <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto my-auto p-6">
              <div className="w-20 h-20 bg-vocalis-card rounded-3xl flex items-center justify-center text-vocalis-accent border border-gray-800 shadow-neon">
                <Radio className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">Bem-vindo ao Vocalis</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Plataforma de comunicação em tempo real via áudio, vídeo, transmissões e chat de texto.
                Selecione um canal de texto ou de voz no menu lateral para começar.
              </p>
            </div>
          ) : isTextChannel ? (
            /* Text Chat View */
            <TextChatView channel={selectedChannel} />
          ) : !isConnectedToVoice ? (
            /* Disconnected Voice Channel Lobby */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 my-auto">
              <div className="w-20 h-20 bg-vocalis-card rounded-3xl flex items-center justify-center text-vocalis-accent border border-gray-800/80 shadow-2xl">
                <Volume2 className="w-10 h-10 text-vocalis-accent" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-2xl font-bold text-white">{selectedChannel.name}</h3>
                <p className="text-sm text-gray-400">
                  Você visualizou um canal de voz. Conecte-se para conversar e transmitir.
                </p>
              </div>
              <button
                onClick={() => joinChannel(selectedChannel, activeServer?.id || '')}
                className="px-6 py-3 bg-vocalis-accent hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all flex items-center space-x-2"
              >
                <Volume2 className="w-5 h-5" />
                <span>Conectar ao Canal de Voz</span>
              </button>
            </div>
          ) : screenSharingPeer ? (
            /* 🎥 SPOTLIGHT MODE: Big Screen Transmission + Small Bottom Participant Strip (Discord Style) */
            <div className="flex-1 flex flex-col h-full overflow-hidden p-3 md:p-4 space-y-3 pb-20 md:pb-4">
              {/* Big Featured Screen Share Stream */}
              <div className="flex-1 w-full min-h-0 flex items-center justify-center bg-black rounded-xl relative overflow-hidden border border-vocalis-accent/40 shadow-2xl">
                <StreamPlayer
                  stream={activeSpotlightStream}
                  isSelf={screenSharingPeer?.socketId === 'self'}
                  objectFit="contain"
                />

                {/* Live Screen Sharing Badge */}
                <div className="absolute top-4 left-4 px-3.5 py-1.5 bg-vocalis-accent/90 backdrop-blur-md rounded-xl flex items-center space-x-2 text-xs font-bold text-white shadow-lg border border-indigo-400/40">
                  <Monitor className="w-4 h-4 text-white animate-pulse" />
                  <span>TRANSMISSÃO AO VIVO de {screenSharingPeer.username}</span>
                </div>
              </div>

              {/* Bottom Compact Horizontal Participant Strip */}
              <div className="h-20 px-2 flex items-center justify-center space-x-3 overflow-x-auto scrollbar-thin shrink-0">
                {allParticipants.map((peer) => (
                  <div
                    key={peer.socketId}
                    className={`relative w-32 h-18 md:w-36 md:h-20 bg-vocalis-card rounded-2xl overflow-hidden flex flex-col items-center justify-center border transition-all duration-200 shrink-0 shadow-md ${
                      peer.isSpeaking
                        ? 'border-vocalis-neon shadow-speaker'
                        : peer.screenSharing
                        ? 'border-vocalis-accent ring-2 ring-vocalis-accent/50'
                        : 'border-gray-800'
                    }`}
                  >
                    {/* Small Avatar Thumbnail */}
                    <div className="relative">
                      <img
                        src={peer.avatarUrl}
                        alt={peer.username}
                        className={`w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-700 object-cover border ${
                          peer.isSpeaking ? 'border-vocalis-neon' : 'border-gray-600'
                        }`}
                      />
                      <span className="absolute bottom-0 right-0 w-2 h-2 md:w-2.5 md:h-2.5 bg-emerald-500 rounded-full border border-vocalis-card" />
                    </div>

                    <span className="text-[10px] md:text-[11px] font-bold text-gray-200 mt-1 truncate max-w-[100px] md:max-w-[120px]">
                      {peer.socketId === 'self' ? `${peer.username} (Você)` : peer.username}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Standard Voice Grid Mode (When No Screen Share is Active) */
            <div className="flex-1 p-3 sm:p-4 md:p-8 overflow-y-auto scrollbar-thin flex items-center justify-center pb-24 md:pb-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto w-full">
                {allParticipants.map((peer) => (
                  <ParticipantCard
                    key={peer.socketId}
                    peer={peer}
                    isSelf={peer.socketId === 'self'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Members Sidebar */}
      {activeServer && (
        <MembersSidebar
          server={activeServer}
          isOpen={showMembersList}
          onClose={() => setShowMembersList(false)}
        />
      )}
    </div>
  );
};
