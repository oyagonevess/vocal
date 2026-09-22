import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { useRTC } from './context/RTCContext.js';
import { api } from './services/api.js';
import { Server, Channel } from './types/index.js';

import { ServerSidebar } from './components/sidebar/ServerSidebar.js';
import { ChannelSidebar } from './components/sidebar/ChannelSidebar.js';
import { UserFooterBar } from './components/sidebar/UserFooterBar.js';
import { MediaStage } from './components/stage/MediaStage.js';
import { FloatingControlBar } from './components/stage/FloatingControlBar.js';

import { AuthModal } from './components/modals/AuthModal.js';
import { CreateServerModal } from './components/modals/CreateServerModal.js';
import { CreateChannelModal } from './components/modals/CreateChannelModal.js';
import { InviteModal } from './components/modals/InviteModal.js';
import { JoinServerModal } from './components/modals/JoinServerModal.js';
import { ServerSettingsModal } from './components/modals/ServerSettingsModal.js';
import { MediaPermissionModal } from './components/modals/MediaPermissionModal.js';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { mediaDevices } = useRTC();

  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinServerModal, setShowJoinServerModal] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);

  // Fetch User's Servers on login & process Invite Link URL
  useEffect(() => {
    if (user) {
      handleInitialLoadAndInvites();
    }
  }, [user]);

  const handleInitialLoadAndInvites = async () => {
    try {
      // Check if URL has /invite/:code
      const pathname = window.location.pathname;
      let inviteCode = '';
      if (pathname.includes('/invite/')) {
        inviteCode = pathname.split('/invite/')[1]?.trim();
      }

      // Fetch user servers
      const res = await api.get('/servers');
      let fetchedServers: Server[] = res.data.servers;

      // If invite code exists in URL, attempt joining server
      if (inviteCode) {
        try {
          const joinRes = await api.post(`/servers/join/${inviteCode}`);
          const joinedServer: Server = joinRes.data.server;
          
          if (!fetchedServers.some((s) => s.id === joinedServer.id)) {
            fetchedServers.push(joinedServer);
          }
          setActiveServer(joinedServer);
          if (joinedServer.channels.length > 0) {
            setSelectedChannel(joinedServer.channels[0]);
          }
          // Clear URL path
          window.history.replaceState({}, '', '/');
        } catch (err: any) {
          console.warn('Erro ao processar convite da URL:', err.response?.data?.error);
        }
      }

      setServers(fetchedServers);
      if (fetchedServers.length > 0 && !activeServer && !inviteCode) {
        setActiveServer(fetchedServers[0]);
        if (fetchedServers[0].channels.length > 0) {
          setSelectedChannel(fetchedServers[0].channels[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar servidores:', err);
    }
  };

  const handleSelectServer = (server: Server) => {
    setActiveServer(server);
    if (server.channels.length > 0) {
      setSelectedChannel(server.channels[0]);
    } else {
      setSelectedChannel(null);
    }
  };

  const handleServerCreatedOrJoined = (server: Server) => {
    setServers((prev) => {
      if (prev.some((s) => s.id === server.id)) return prev;
      return [...prev, server];
    });
    setActiveServer(server);
    if (server.channels.length > 0) {
      setSelectedChannel(server.channels[0]);
    }
  };

  const handleServerUpdated = (updatedServer: Server) => {
    setActiveServer(updatedServer);
    setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
  };

  const handleServerDeleted = (deletedServerId: string) => {
    const remaining = servers.filter((s) => s.id !== deletedServerId);
    setServers(remaining);
    if (remaining.length > 0) {
      setActiveServer(remaining[0]);
      setSelectedChannel(remaining[0].channels[0] || null);
    } else {
      setActiveServer(null);
      setSelectedChannel(null);
    }
  };

  const handleChannelCreated = (newChannel: Channel) => {
    if (activeServer) {
      const updatedServer = {
        ...activeServer,
        channels: [...activeServer.channels, newChannel],
      };
      setActiveServer(updatedServer);
      setSelectedChannel(newChannel);
      setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    }
  };

  const handleChannelDeleted = (channelId: string) => {
    if (activeServer) {
      const updatedChannels = activeServer.channels.filter((c) => c.id !== channelId);
      const updatedServer = { ...activeServer, channels: updatedChannels };
      setActiveServer(updatedServer);
      if (selectedChannel?.id === channelId) {
        setSelectedChannel(updatedChannels[0] || null);
      }
      setServers((prev) => prev.map((s) => (s.id === updatedServer.id ? updatedServer : s)));
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-vocalis-bg flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-vocalis-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold tracking-wider uppercase text-gray-400">Carregando Vocalis RTC Engine...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="w-screen h-screen flex bg-vocalis-bg overflow-hidden select-none font-['Inter',sans-serif]">
      {/* 1. Leftmost Server Icons Sidebar */}
      <ServerSidebar
        servers={servers}
        activeServerId={activeServer?.id || null}
        onSelectServer={handleSelectServer}
        onOpenCreateServer={() => setShowCreateServer(true)}
        onOpenJoinServer={() => setShowJoinServerModal(true)}
      />

      {/* 2. Secondary Channel Sidebar & Bottom User Footer */}
      <div className="flex flex-col h-full">
        <ChannelSidebar
          server={activeServer}
          activeChannel={selectedChannel}
          onSelectChannel={(ch) => setSelectedChannel(ch)}
          onOpenCreateChannel={() => setShowCreateChannel(true)}
          onOpenInviteModal={() => setShowInviteModal(true)}
          onOpenServerSettings={() => setShowServerSettings(true)}
        />
        <UserFooterBar />
      </div>

      {/* 3. Central Media Stage / Viewport or Text Chat */}
      <MediaStage selectedChannel={selectedChannel} />

      {/* 4. Floating Call Controls Bar (when inside voice room) */}
      <FloatingControlBar />

      {/* 5. Modals */}
      {showCreateServer && (
        <CreateServerModal
          onClose={() => setShowCreateServer(false)}
          onServerCreated={handleServerCreatedOrJoined}
        />
      )}

      {showJoinServerModal && (
        <JoinServerModal
          onClose={() => setShowJoinServerModal(false)}
          onServerJoined={handleServerCreatedOrJoined}
        />
      )}

      {showCreateChannel && activeServer && (
        <CreateChannelModal
          serverId={activeServer.id}
          onClose={() => setShowCreateChannel(false)}
          onChannelCreated={handleChannelCreated}
        />
      )}

      {showInviteModal && activeServer && (
        <InviteModal
          serverId={activeServer.id}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showServerSettings && activeServer && (
        <ServerSettingsModal
          server={activeServer}
          currentUserId={user.id}
          onClose={() => setShowServerSettings(false)}
          onServerUpdated={handleServerUpdated}
          onServerDeleted={handleServerDeleted}
          onChannelDeleted={handleChannelDeleted}
        />
      )}

      {/* 6. Media Permission Error Modal */}
      <MediaPermissionModal
        error={mediaDevices.mediaError}
        onClose={mediaDevices.clearMediaError}
      />
    </div>
  );
};
