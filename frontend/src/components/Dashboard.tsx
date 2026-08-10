"use client";

import { useState } from 'react';
import { Play, Pause, CheckCircle, XCircle, Clock, Settings, Zap, Users, ShieldAlert, Key } from 'lucide-react';
import { useAuthenticationStatus, useAccessToken, useUserData, useSignOut } from '@nhost/nextjs';

const mockUsers = [
  { id: 'user-1', name: 'Alice (Org A - Owner)', role: 'owner', org: 'Org A' },
  { id: 'user-2', name: 'Bob (Org A - Viewer)', role: 'viewer', org: 'Org A' },
  { id: 'user-3', name: 'Charlie (Org B - Owner)', role: 'owner', org: 'Org B' },
];

export default function Dashboard() {
  const { isAuthenticated } = useAuthenticationStatus();
  const accessToken = useAccessToken();
  const userData = useUserData();
  const { signOut } = useSignOut();

  const [currentUser, setCurrentUser] = useState(mockUsers[0]);
  const [runStatus, setRunStatus] = useState<string>('idle');
  const [steps, setSteps] = useState<any[]>([
    { id: 's1', type: 'llm_call', status: 'pending' },
    { id: 's2', type: 'http_request', status: 'pending' },
    { id: 's3', type: 'approval_gate', status: 'pending' },
    { id: 's4', type: 'conditional_branch', status: 'pending' },
  ]);

  const handleRun = () => {
    // If using simulator, check mock user role
    if (!isAuthenticated && currentUser.role === 'viewer') {
      alert("Permission Denied: Viewers cannot trigger runs.");
      return;
    }
    setRunStatus('running');
    setSteps(steps.map((s, i) => i === 0 ? { ...s, status: 'running' } : s));
    
    // Simulate progression
    setTimeout(() => {
      setSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'completed' } : (i === 1 ? { ...s, status: 'running' } : s)));
      setTimeout(() => {
        setSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'completed' } : (i === 2 ? { ...s, status: 'paused' } : s)));
        setRunStatus('paused');
      }, 1500);
    }, 1500);
  };

const handleApprove = async () => {
  // Real permission check – only owners or editors can approve
  if (!isAuthenticated || (currentUser.role !== 'owner' && currentUser.role !== 'editor')) {
    alert('Permission Denied: Only owners/editors can approve steps.');
    return;
  }

  // Optimistically set UI to running
  setRunStatus('running');

  try {
    const response = await fetch('/api/actions/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ input: { step_run_id: steps[2].id } })
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.message || 'Approve failed');
      setRunStatus('paused');
      return;
    }

    // Backend approved – advance the workflow UI
    setSteps(prev =>
      prev.map((s, i) =>
        i === 2 ? { ...s, status: 'completed' } :
        i === 3 ? { ...s, status: 'running' } : s
      )
    );
    setTimeout(() => {
      setSteps(prev =>
        prev.map((s, i) => (i === 3 ? { ...s, status: 'completed' } : s))
      );
      setRunStatus('completed');
    }, 1500);
  } catch (err) {
    console.error('Approve error:', err);
    alert('Network error while approving step');
    setRunStatus('paused');
  }
};

  return (
    <div className="flex flex-col gap-6">
      {/* Top Bar / Context Switcher or Real Auth */}
      {isAuthenticated ? (
        <div className="flex flex-col p-4 rounded-2xl bg-indigo-900/20 border border-indigo-500/30 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-slate-300">
                Logged in as <strong className="text-white">{userData?.displayName || userData?.email}</strong>
              </span>
            </div>
            <button onClick={() => signOut()} className="text-xs text-slate-400 hover:text-white transition-colors">Sign Out</button>
          </div>
          <div className="text-xs text-slate-400 mb-2">
            Use this JWT to directly query Hasura via Postman/GraphQL console. Row-Level Security will automatically restrict your access to your organization's data.
          </div>
          <div className="relative group">
            <div className="p-3 bg-slate-950/80 rounded-lg border border-white/5 break-all font-mono text-[10px] text-slate-500 max-h-24 overflow-y-auto">
              {accessToken}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(accessToken || '')}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-2 py-1 rounded"
            >
              Copy JWT
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-medium text-slate-300">Simulate User Context:</span>
            <select 
              className="bg-slate-900 border border-white/10 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
              value={currentUser.id}
              onChange={(e) => setCurrentUser(mockUsers.find(u => u.id === e.target.value)!)}
            >
              {mockUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 uppercase tracking-wider">Quota Used</span>
              <span className="text-lg font-bold text-white">45 <span className="text-sm text-slate-500 font-normal">/ 100</span></span>
            </div>
            <div className="w-12 h-12 rounded-full relative">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-indigo-500" strokeWidth="3" strokeDasharray="45, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Workflow Builder */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Workflow Editor</h2>
            {currentUser.role !== 'viewer' ? (
              <button onClick={handleRun} disabled={runStatus === 'running'} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20">
                <Play className="w-4 h-4" /> Run Workflow
              </button>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 bg-white/5 px-4 py-2 rounded-xl text-sm border border-white/10">
                <ShieldAlert className="w-4 h-4" /> Viewer Mode
              </div>
            )}
          </div>
          
          <div className="p-1 rounded-2xl bg-gradient-to-b from-white/10 to-transparent">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl p-6 min-h-[400px] border border-white/5 flex flex-col gap-4">
              {steps.map((step, idx) => (
                <div key={step.id} className="relative flex items-start gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0 z-10 text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-400" />
                        <span className="font-medium text-slate-200">{step.type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <Settings className="w-4 h-4 text-slate-500 hover:text-slate-300 cursor-pointer" />
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      {step.type === 'llm_call' ? 'Call external LLM API' : 
                       step.type === 'http_request' ? 'Fetch data from endpoint' : 
                       step.type === 'approval_gate' ? 'Pause for human review' : 'Branch conditionally'}
                    </div>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="absolute left-[31px] top-12 bottom-[-16px] w-[2px] bg-white/10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Live Run Viewer */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Live Run Status</h2>
          
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <span className="text-sm font-medium">Status</span>
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                runStatus === 'idle' ? 'bg-slate-800 text-slate-400' :
                runStatus === 'running' ? 'bg-indigo-500/20 text-indigo-400' :
                runStatus === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {runStatus}
              </span>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-sm text-slate-300">Step {idx + 1}</span>
                  <div className="flex items-center gap-2">
                    {step.status === 'pending' && <Clock className="w-4 h-4 text-slate-600" />}
                    {step.status === 'running' && (
                      <svg className="animate-spin w-4 h-4 text-indigo-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    {step.status === 'paused' && <Pause className="w-4 h-4 text-amber-500" />}
                    
                    <span className={`text-xs uppercase ${
                      step.status === 'completed' ? 'text-emerald-500' :
                      step.status === 'paused' ? 'text-amber-500' :
                      'text-slate-500'
                    }`}>{step.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {runStatus === 'paused' && (
              <div className="p-4 bg-amber-500/10 border-t border-amber-500/20 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-200/80">
                    Run is paused at an Approval Gate. Requires Owner or Editor approval to proceed.
                  </div>
                </div>
                <button 
                  onClick={handleApprove}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-lg text-sm transition-colors"
                >
                  Approve & Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
