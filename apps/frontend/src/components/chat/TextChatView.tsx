import React, { useState, useEffect, useRef } from 'react';
import { Channel, Message } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { getSocket } from '../../services/socket.js';
import { Hash, Send, Sparkles } from 'lucide-react';

interface TextChatViewProps {
  channel: Channel;
}

export const TextChatView: React.FC<TextChatViewProps> = ({ channel }) => {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load message history from Supabase
  useEffect(() => {
    fetchMessages();
  }, [channel.id]);

  // Listen for real-time WebSocket new-message events
  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handleNewMessage = ({ channelId, message }: { channelId: string; message: Message }) => {
      if (channelId === channel.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    socket.on('new-message', handleNewMessage);
    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [accessToken, channel.id]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/channels/${channel.id}/messages`);
      setMessages(res.data.messages);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const messageContent = content;
    setContent('');

    try {
      await api.post(`/channels/${channel.id}/messages`, { content: messageContent });
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  return (
    <div className="flex-1 bg-vocalis-bg flex flex-col h-full overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto scrollbar-thin space-y-4">
        {/* Welcome Header */}
        <div className="py-6 space-y-2 border-b border-gray-800/80 mb-4">
          <div className="w-14 h-14 bg-vocalis-card border border-gray-800 rounded-2xl flex items-center justify-center text-vocalis-accent shadow-sm">
            <Hash className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Bem-vindo a #{channel.name}!</h2>
          <p className="text-xs text-gray-400">
            Este é o início do canal de texto #{channel.name}. Mensagens são salvas com criptografia e persistidas.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-xs text-gray-500">Carregando mensagens...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-10 text-xs text-gray-500">Nenhuma mensagem ainda. Envie a primeira!</div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.userId === user?.id;
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={msg.id} className="flex items-start space-x-3 group hover:bg-vocalis-card/30 p-2 rounded-xl transition-colors">
                <img
                  src={msg.user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.user?.username}`}
                  alt={msg.user?.username}
                  className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 object-cover mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold truncate ${isSelf ? 'text-vocalis-accent' : 'text-gray-200'}`}>
                      {msg.user?.username}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">{timeStr}</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1 leading-relaxed break-words">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-4 bg-vocalis-sidebar border-t border-gray-800/80">
        <div className="relative flex items-center">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Conversar em #${channel.name}...`}
            className="w-full pl-4 pr-12 py-3 bg-vocalis-card border border-gray-700/80 rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-vocalis-accent transition-all"
          />
          <button
            type="submit"
            disabled={!content.trim()}
            className="absolute right-2 p-2 bg-vocalis-accent hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-vocalis-accent text-white rounded-xl transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

