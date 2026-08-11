"use client";

import { useState, useEffect } from 'react';
import { useAuthenticationStatus, useUserData } from '@nhost/nextjs';
import Dashboard from "@/components/Dashboard";
import Login from "@/components/Login";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus();
  const userData = useUserData();

  const [mounted, setMounted] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && userData) {
      const pendingOrg = localStorage.getItem('pendingOrgName');
      if (pendingOrg) {
        setIsCreatingOrg(true);
        fetch('/api/org/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData.id, orgName: pendingOrg })
        }).then(async (res) => {
          if (!res.ok) {
             const data = await res.json();
             console.error("Org creation failed:", data);
             alert("Failed to setup organization: " + (data.message || 'Unknown error'));
          }
          localStorage.removeItem('pendingOrgName');
          setIsCreatingOrg(false);
        }).catch(err => {
          console.error("Org creation error:", err);
          localStorage.removeItem('pendingOrgName');
          setIsCreatingOrg(false);
        });
      }
    }
  }, [isAuthenticated, userData]);

  if (!mounted || isCreatingOrg) {
    return (
      <main className="min-h-screen flex flex-col bg-slate-950 text-slate-50 overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-slate-400 font-medium tracking-wide">
            {isCreatingOrg ? 'Setting up your organization...' : 'Loading...'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-slate-950 font-sans">
      {/* Dynamic Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px] mix-blend-screen" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen" />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
          <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-emerald-500 p-[1px] shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 font-heading">
                Aiva Builder
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs font-medium text-slate-300">
                  {isAuthenticated ? 'Connected to Nhost' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-4 md:p-8 flex-1 flex flex-col">

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">Loading...</div>
        ) : (!isAuthenticated) ? (
          <Login />
        ) : (
          <Dashboard />
        )}
        </div>
      </div>
    </main>
  );
}
