import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { useRTC } from './context/RTCContext.js';
import { api } from './services/api.js';
import { Server, Channel } from './types/index.js';

import { ServerSidebar } from './components/sidebar/ServerSidebar.js';
import { ChannelSidebar } from './components/sidebar/ChannelSidebar.js';
import { MembersSidebar } from './components/sidebar/MembersSidebar.js';
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
  const { activeChannel, mediaDevices } = useRTC();

  const [servers, setServers] = useState<Server[]>([]);
  const [activeServer, setActiveServer] = useState<Server | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Auto switch selectedChannel back to text channel when leaving voice call
  useEffect(() => {
    if (!activeChannel && selectedChannel?.type === 'VOICE') {
      if (activeServer) {
        const defaultTextChannel = activeServer.channels.find((c) => c.type === 'TEXT');
        if (defaultTextChannel) {
          setSelectedChannel(defaultTextChannel);
        }
      }
    }
  }, [activeChannel]);

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

  const [mobileTab, setMobileTab] = useState<'sidebar' | 'stage' | 'members'>('sidebar');
  const [showMembersList, setShowMembersList] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Trigger swipe only if horizontal delta is larger than vertical delta and exceeds 40px
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // Swiped left -> Advance to next tab
        if (mobileTab === 'sidebar') setMobileTab('stage');
        else if (mobileTab === 'stage') setMobileTab('members');
      } else {
        // Swiped right -> Go back to previous tab
        if (mobileTab === 'members') setMobileTab('stage');
        else if (mobileTab === 'stage') setMobileTab('sidebar');
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleSelectChannelAndSwitchTab = (ch: Channel) => {
    setSelectedChannel(ch);
    setMobileTab('stage');
  };

  const handleToggleMembersList = () => {
    setShowMembersList((prev) => !prev);
    setMobileTab((prev) => (prev === 'members' ? 'stage' : 'members'));
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
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
      className="w-screen h-screen max-w-full overflow-hidden select-none font-['Inter',sans-serif] bg-vocalis-bg relative touch-pan-y"
    >
      {/* 3-Panel Sliding Container: 300% width on mobile (300ms CSS slide), w-full on desktop */}
      <div
        className={`w-[300%] md:w-full h-full flex flex-row transition-transform duration-300 ease-in-out ${
          mobileTab === 'members'
            ? '-translate-x-2/3 md:translate-x-0'
            : mobileTab === 'stage'
            ? '-translate-x-1/3 md:translate-x-0'
            : 'translate-x-0'
        }`}
      >
        {/* Panel 1: Mobile Sidebar View (33.333% of 300% = 100% viewport on mobile, w-auto on desktop) */}
        <div className="w-1/3 md:w-auto h-full flex flex-row shrink-0 md:shrink-0">
          <ServerSidebar
            servers={servers}
            activeServerId={activeServer?.id || null}
            onSelectServer={handleSelectServer}
            onOpenCreateServer={() => setShowCreateServer(true)}
            onOpenJoinServer={() => setShowJoinServerModal(true)}
          />

          <div className="flex flex-col h-full flex-1 md:w-64">
            <ChannelSidebar
              server={activeServer}
              activeChannel={selectedChannel}
              onSelectChannel={handleSelectChannelAndSwitchTab}
              onOpenCreateChannel={() => setShowCreateChannel(true)}
              onOpenInviteModal={() => setShowInviteModal(true)}
              onOpenServerSettings={() => setShowServerSettings(true)}
              onToggleMobileStage={() => setMobileTab('stage')}
            />
            <UserFooterBar />
          </div>
        </div>

        {/* Panel 2: Mobile Main Stage / Chat View (33.333% of 300% = 100% viewport on mobile, flex-1 on desktop) */}
        <div className="w-1/3 md:w-full h-full flex-1 shrink-0 md:shrink flex flex-col min-w-0 overflow-hidden">
          <MediaStage
            selectedChannel={selectedChannel}
            activeServer={activeServer}
            showMembersList={showMembersList}
            onToggleMobileMenu={() => setMobileTab('sidebar')}
            onToggleMembersList={handleToggleMembersList}
          />
        </div>

        {/* Panel 3: Mobile Members View (33.333% of 300% = 100% viewport on mobile, w-64 on desktop) */}
        <div className={`w-1/3 md:w-auto h-full shrink-0 flex flex-col ${showMembersList ? 'md:flex' : 'hidden md:hidden'}`}>
          {activeServer && (
            <MembersSidebar
              server={activeServer}
              isOpen={true}
              onClose={() => {
                setShowMembersList(false);
                setMobileTab('stage');
              }}
            />
          )}
        </div>
      </div>

      {/* Floating Call Controls Bar (when inside voice room) */}
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
