"use client";

import { useState } from 'react';
import { useSignInEmailPassword } from '@nhost/nextjs';

export default function Login({ onSimulatorClick }: { onSimulatorClick: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { signInEmailPassword, isLoading, isError, error } = useSignInEmailPassword();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInEmailPassword(email, password);
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md p-8 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Sign In</h2>
        <p className="text-slate-400 mb-6">Authenticate via Nhost to secure your GraphQL requests.</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {isError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error?.message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4 before:flex-1 before:h-px before:bg-white/10 after:flex-1 after:h-px after:bg-white/10">
          <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
        </div>

        <button 
          onClick={onSimulatorClick}
          className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg border border-white/10 transition-colors"
        >
          Continue with Simulator Mode
        </button>
      </div>
    </div>
  );
}
