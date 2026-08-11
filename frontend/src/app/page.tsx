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
      <main className="min-h-screen flex flex-col bg-stone-50 text-stone-900 overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-stone-500 font-medium tracking-wide">
            {isCreatingOrg ? 'Setting up your organization...' : 'Loading...'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden bg-stone-50 font-sans">
      {/* Dynamic Mesh Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-yellow-300/40 blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-pink-300/30 blur-[120px] mix-blend-multiply" />
        <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] rounded-full bg-amber-300/40 blur-[120px] mix-blend-multiply" />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <header className="sticky top-0 z-50 border-b border-stone-200/60 bg-white/60 backdrop-blur-xl shadow-sm">
          <div className="container mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-400 to-pink-500 p-[1px] shadow-lg shadow-pink-500/20">
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                  <img src="/logo.jpg" alt="Aiva Logo" className="w-full h-full object-contain" />
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-stone-900 via-stone-700 to-stone-500 font-heading">
                Aiva
              </h1>
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
