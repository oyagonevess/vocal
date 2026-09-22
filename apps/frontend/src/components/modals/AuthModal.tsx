import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Radio, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-vocalis-card border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-vocalis-accent/20 border border-vocalis-accent/40 text-vocalis-accent rounded-2xl flex items-center justify-center mx-auto shadow-neon">
            <Radio className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            {isRegister ? 'Criar Conta no Vocalis' : 'Entrar no Vocalis'}
          </h2>
          <p className="text-xs text-gray-400">
            Conecte-se aos seus canais de voz e transmissões criptografadas
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Nome de Usuário
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="SeuNick"
                  className="w-full pl-9 pr-4 py-2.5 bg-vocalis-bg border border-gray-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-9 pr-4 py-2.5 bg-vocalis-bg border border-gray-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-vocalis-bg border border-gray-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-vocalis-accent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-vocalis-accent hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            {loading ? 'Processando...' : isRegister ? 'Cadastrar' : 'Entrar'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-vocalis-accent hover:underline font-medium"
          >
            {isRegister ? 'Já possui uma conta? Faça login' : 'Não tem uma conta? Registre-se'}
          </button>
        </div>
      </div>
    </div>
  );
};

