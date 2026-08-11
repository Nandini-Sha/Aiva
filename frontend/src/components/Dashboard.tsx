"use client";

import { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, Clock, Settings, Zap, Users, ShieldAlert, Key, Plus } from 'lucide-react';
import { useAuthenticationStatus, useAccessToken, useUserData, useSignOut } from '@nhost/nextjs';
import { gql, useQuery, useSubscription } from '@apollo/client';

const mockUsers = [
  { id: 'user-1', name: 'Alice (Org A - Owner)', role: 'owner', org: 'Org A' },
  { id: 'user-2', name: 'Bob (Org A - Viewer)', role: 'viewer', org: 'Org A' },
  { id: 'user-3', name: 'Charlie (Org B - Owner)', role: 'owner', org: 'Org B' },
];

const GET_WORKFLOWS = gql`
  query GetWorkflows {
    workflows {
      id
      name
      steps(order_by: {order_index: asc}) {
        id
        type
        config
      }
    }
    org_members {
      org_id
      role
      organization {
        name
      }
    }
  }
`;

const SUBSCRIBE_RUN = gql`
  subscription SubscribeRun($workflow_id: uuid!) {
    workflow_runs(
      where: {workflow_id: {_eq: $workflow_id}}, 
      order_by: {started_at: desc}, 
      limit: 1
    ) {
      id
      status
      step_runs(order_by: {started_at: asc}) {
        id
        step_id
        status
      }
    }
  }
`;

const TRIGGER_RUN = gql`
  mutation TriggerWorkflowRun($workflow_id: uuid!) {
    triggerWorkflowRun(workflow_id: $workflow_id) {
      success
      message
      run_id
    }
  }
`;

const APPROVE_STEP = gql`
  mutation ApproveStep($step_run_id: uuid!) {
    approveStep(step_run_id: $step_run_id) {
      success
      message
    }
  }
`;

export default function Dashboard() {
  const { isAuthenticated } = useAuthenticationStatus();
  const accessToken = useAccessToken();
  const userData = useUserData();
  const { signOut } = useSignOut();

  const [currentUser, setCurrentUser] = useState(mockUsers[0]);

  // Apollo queries (only run when authenticated)
  const { data: workflowsData, loading: workflowsLoading } = useQuery(GET_WORKFLOWS, { skip: !isAuthenticated });
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  const [triggerRun] = useMutation(TRIGGER_RUN);
  const [approveStep] = useMutation(APPROVE_STEP);

  useEffect(() => {
    if (workflowsData?.workflows?.length > 0 && !activeWorkflowId) {
      setActiveWorkflowId(workflowsData.workflows[0].id);
    }
  }, [workflowsData, activeWorkflowId]);

  const { data: runData } = useSubscription(SUBSCRIBE_RUN, {
    variables: { workflow_id: activeWorkflowId },
    skip: !activeWorkflowId || !isAuthenticated,
  });

  // Mock states for Simulator
  const [mockRunStatus, setMockRunStatus] = useState<string>('idle');
  const [mockSteps, setMockSteps] = useState<any[]>([
    { id: 's1', type: 'llm_call', status: 'pending' },
    { id: 's2', type: 'http_request', status: 'pending' },
    { id: 's3', type: 'approval_gate', status: 'pending' },
    { id: 's4', type: 'conditional_branch', status: 'pending' },
  ]);

  // Derived state
  const isMock = !isAuthenticated;
  const activeWorkflow = isMock ? null : workflowsData?.workflows.find((w: any) => w.id === activeWorkflowId);
  const latestRun = isMock ? null : runData?.workflow_runs?.[0];
  const runStatus = isMock ? mockRunStatus : (latestRun?.status || 'idle');
  
  const steps = isMock ? mockSteps : (activeWorkflow?.steps || []);
  const mappedSteps = isMock ? mockSteps : steps.map((s: any) => {
    const sRun = latestRun?.step_runs?.find((sr: any) => sr.step_id === s.id);
    return {
      ...s,
      status: sRun ? sRun.status : 'pending',
      stepRunId: sRun ? sRun.id : null,
    };
  });

  const handleRun = async () => {
    if (isMock) {
      if (currentUser.role === 'viewer') return alert("Permission Denied: Viewers cannot trigger runs.");
      setMockRunStatus('running');
      setMockSteps(mockSteps.map((s, i) => i === 0 ? { ...s, status: 'running' } : s));
      setTimeout(() => {
        setMockSteps(prev => prev.map((s, i) => i === 0 ? { ...s, status: 'completed' } : (i === 1 ? { ...s, status: 'running' } : s)));
        setTimeout(() => {
          setMockSteps(prev => prev.map((s, i) => i === 1 ? { ...s, status: 'completed' } : (i === 2 ? { ...s, status: 'paused' } : s)));
          setMockRunStatus('paused');
        }, 1500);
      }, 1500);
    } else {
      if (!activeWorkflowId) return;
      try {
        const { data } = await triggerRun({ variables: { workflow_id: activeWorkflowId } });
        if (!data?.triggerWorkflowRun?.success) {
          alert(data?.triggerWorkflowRun?.message || 'Trigger failed');
        }
      } catch(e: any) { 
        console.error(e); 
        alert(e.message || 'Error triggering run'); 
      }
    }
  };

  const handleApprove = async () => {
    if (isMock) {
      if (currentUser.role !== 'owner' && currentUser.role !== 'editor') return alert('Permission Denied.');
      setMockRunStatus('running');
      setMockSteps(prev => prev.map((s, i) => i === 2 ? { ...s, status: 'completed' } : i === 3 ? { ...s, status: 'running' } : s));
      setTimeout(() => {
        setMockSteps(prev => prev.map((s, i) => i === 3 ? { ...s, status: 'completed' } : s));
        setMockRunStatus('completed');
      }, 1500);
    } else {
      const pausedStep = mappedSteps.find((s: any) => s.status === 'paused');
      if (!pausedStep || !pausedStep.stepRunId) return;
      try {
        const { data } = await approveStep({ variables: { step_run_id: pausedStep.stepRunId } });
        if (!data?.approveStep?.success) {
          alert(data?.approveStep?.message || 'Approve failed');
        }
      } catch(e: any) { 
        console.error(e); 
        alert(e.message || 'Error approving step'); 
      }
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Bar / Context Switcher or Real Auth */}
      {isAuthenticated ? (
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                  <Key className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">
                  Logged in as <strong className="text-white text-base ml-1">{userData?.displayName || userData?.email}</strong>
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Use this JWT to query Hasura. Row-Level Security automatically restricts access to your org's data.
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group/jwt flex-1 md:w-64">
                <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/10 font-mono text-[10px] text-slate-500 truncate cursor-default">
                  {accessToken}
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(accessToken || '')}
                  className="absolute inset-y-0 right-0 flex items-center px-3 bg-gradient-to-l from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs rounded-r-xl opacity-0 group-hover/jwt:opacity-100 transition-all font-medium"
                >
                  Copy JWT
                </button>
              </div>
              <button onClick={() => signOut()} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-slate-300 transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Users className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulate Context</span>
              <select 
                className="bg-slate-950/80 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-2 min-w-[200px] shadow-inner"
                value={currentUser.id}
                onChange={(e) => setCurrentUser(mockUsers.find(u => u.id === e.target.value)!)}
              >
                {mockUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-5 relative z-10 bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Quota Used</span>
              <span className="text-xl font-bold text-white leading-none mt-1">45 <span className="text-xs text-slate-500 font-normal">/ 100</span></span>
            </div>
            <div className="w-12 h-12 rounded-full relative">
              <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" viewBox="0 0 36 36">
                <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-indigo-500" strokeWidth="3" strokeDasharray="45, 100" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Workflow Builder */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {!isMock && workflowsData && workflowsData.org_members?.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 border border-indigo-500/20">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white font-heading">You need an Organization</h3>
              <p className="text-slate-400 max-w-md">
                To create and run workflows, you must belong to an organization. Create one below to get started as an owner.
              </p>
              <form 
                className="w-full max-w-sm mt-4 flex flex-col gap-3"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = form.elements.namedItem('orgName') as HTMLInputElement;
                  const btn = form.elements.namedItem('submitBtn') as HTMLButtonElement;
                  if (!input.value) return;
                  btn.disabled = true;
                  btn.textContent = 'Creating...';
                  try {
                    const res = await fetch('/api/org/create', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: userData?.id, orgName: input.value })
                    });
                    if (res.ok) {
                      window.location.reload();
                    } else {
                      const data = await res.json();
                      alert(data.message || 'Failed to create organization');
                      btn.disabled = false;
                      btn.textContent = 'Create Organization';
                    }
                  } catch (err) {
                    alert('Error creating organization');
                    btn.disabled = false;
                    btn.textContent = 'Create Organization';
                  }
                }}
              >
                <input 
                  name="orgName"
                  type="text" 
                  required
                  placeholder="My Company Name" 
                  className="w-full bg-slate-950/50 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button name="submitBtn" type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all">
                  Create Organization
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold font-heading">Workflows</h2>
                  {isAuthenticated && workflowsData?.workflows?.length > 0 && (
                    <select 
                      className="bg-slate-950/80 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 p-2 shadow-inner"
                      value={activeWorkflowId || ''}
                      onChange={(e) => setActiveWorkflowId(e.target.value)}
                    >
                      {workflowsData.workflows.map((w: any) => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a href="/workflows/create" className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                    <Plus className="w-4 h-4" /> New
                  </a>
                  {(!isMock && currentUser.role !== 'viewer') || (isMock && currentUser.role !== 'viewer') ? (
                    <button onClick={handleRun} disabled={runStatus === 'running'} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98]">
                      <Play className="w-4 h-4 fill-current" /> Run
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 bg-white/5 px-4 py-2 rounded-xl text-sm border border-white/10 font-medium">
                      <ShieldAlert className="w-4 h-4" /> Viewer Mode
                    </div>
                  )}
                </div>
              </div>
              
              <div className="glass-panel p-2 rounded-3xl">
            <div className="bg-slate-950/80 rounded-[1.25rem] p-6 min-h-[400px] border border-white/5 flex flex-col gap-5 relative">
              {mappedSteps.length > 0 ? (
                <>
                  <div className="absolute left-[45px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-indigo-500/50 via-white/10 to-transparent" />
                  
                  {mappedSteps.map((step: any, idx: number) => (
                    <div key={step.id} className="relative flex items-start gap-5 p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-white/10 group">
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 z-10 text-sm font-bold shadow-lg transition-all duration-500 ${
                        step.status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]' :
                        step.status === 'running' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.4)] animate-pulse' :
                        step.status === 'paused' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.4)]' :
                        'bg-slate-900 border-white/10 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Zap className={`w-4 h-4 ${step.status === 'running' ? 'text-indigo-400 animate-pulse' : 'text-slate-400'}`} />
                            <span className="font-semibold text-slate-200 tracking-wide">{step.type.replace('_', ' ').toUpperCase()}</span>
                          </div>
                          <Settings className="w-4 h-4 text-slate-500 hover:text-white cursor-pointer transition-colors" />
                        </div>
                        <div className="text-sm text-slate-400 mt-1.5 font-medium">
                          {step.type === 'llm_call' ? 'Call external LLM API' : 
                          step.type === 'http_request' ? 'Fetch data from endpoint' : 
                          step.type === 'approval_gate' ? 'Pause for human review' : 'Branch conditionally'}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-2">
                  <div className="p-4 bg-white/5 rounded-full mb-2">
                    <Settings className="w-8 h-8 opacity-50" />
                  </div>
                  <p>No workflows found.</p>
                  <a href="/workflows/create" className="text-indigo-400 hover:text-indigo-300 font-medium">Create your first workflow &rarr;</a>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>

        {/* Right Column - Live Run Viewer */}
        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-bold font-heading">Live Run Status</h2>
          
          <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-sm">
              <span className="text-sm font-semibold tracking-wide">Status</span>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                runStatus === 'idle' ? 'bg-slate-800/80 text-slate-400 border border-slate-700' :
                runStatus === 'running' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                runStatus === 'paused' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {runStatus === 'running' && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />}
                {runStatus === 'paused' && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                {runStatus}
              </span>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-3">
              {mappedSteps.map((step: any, idx: number) => (
                <div key={step.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition-colors">
                  <span className="text-sm font-medium text-slate-300">Step {idx + 1}</span>
                  <div className="flex items-center gap-2.5">
                    {step.status === 'pending' && <Clock className="w-4 h-4 text-slate-600" />}
                    {step.status === 'running' && (
                      <svg className="animate-spin w-4 h-4 text-indigo-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {step.status === 'paused' && <Pause className="w-4 h-4 text-amber-400" />}
                    
                    <span className={`text-xs uppercase font-bold tracking-wider ${
                      step.status === 'completed' ? 'text-emerald-400' :
                      step.status === 'running' ? 'text-indigo-400' :
                      step.status === 'paused' ? 'text-amber-400' :
                      'text-slate-500'
                    }`}>{step.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {runStatus === 'paused' && (
              <div className="p-5 bg-amber-500/10 border-t border-amber-500/20 flex flex-col gap-4 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-3 relative z-10">
                  <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-sm font-medium text-amber-200/90 leading-relaxed">
                    Run is paused at an Approval Gate. Requires Owner or Editor approval to proceed.
                  </div>
                </div>
                <button 
                  onClick={handleApprove}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-amber-950 font-bold rounded-xl text-sm transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 active:scale-[0.98] relative z-10"
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
