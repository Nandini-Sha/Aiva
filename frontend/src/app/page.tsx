"use client";

import { useState, useEffect } from 'react';
import { useAuthenticationStatus } from '@nhost/nextjs';
import Dashboard from "@/components/Dashboard";
import Login from "@/components/Login";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const [useSimulator, setUseSimulator] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden relative">
      {/* Background Gradients */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 container mx-auto p-4 md:p-8 flex-1 flex flex-col">
        <header className="flex items-center justify-between py-6 mb-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              AI Agent Workflow Builder
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400">
              {isAuthenticated ? 'Authenticated via Nhost' : useSimulator ? 'Simulator Mode' : 'Not Authenticated'}
            </div>
            <div className={`w-8 h-8 rounded-full border border-white/10 ${isAuthenticated ? 'bg-green-500' : 'bg-slate-800'}`} />
          </div>
        </header>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">Loading...</div>
        ) : (!isAuthenticated && !useSimulator) ? (
          <Login onSimulatorClick={() => setUseSimulator(true)} />
        ) : (
          <Dashboard />
        )}
      </div>
    </main>
  );
}
