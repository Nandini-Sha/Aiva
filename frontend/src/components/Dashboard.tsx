"use client";

import { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, Clock, Settings, Zap, Users, ShieldAlert, Key, Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuthenticationStatus, useAccessToken, useUserData, useSignOut, useChangePassword } from '@nhost/nextjs';
import { gql, useQuery, useSubscription, useMutation } from '@apollo/client';



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
        output
        error
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
  const { changePassword } = useChangePassword();



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

  // Derived state
  const userRole = workflowsData?.org_members?.[0]?.role;
  const activeWorkflow = workflowsData?.workflows.find((w: any) => w.id === activeWorkflowId);
  const latestRun = runData?.workflow_runs?.[0];
  const runStatus = latestRun?.status || 'idle';
  
  const steps = activeWorkflow?.steps || [];
  const mappedSteps = steps.map((s: any) => {
    const sRun = latestRun?.step_runs?.find((sr: any) => sr.step_id === s.id);
    return {
      ...s,
      status: sRun ? sRun.status : 'pending',
      stepRunId: sRun ? sRun.id : null,
      output: sRun ? sRun.output : null,
      error: sRun ? sRun.error : null,
    };
  });

  const handleRun = async () => {
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
  };

  const handleApprove = async () => {
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
  };

  // Fetch members for table
  const [members, setMembers] = useState<any[]>([]);
  const orgId = workflowsData?.org_members?.[0]?.org_id;

  useEffect(() => {
    if (orgId && userRole === 'owner') {
      fetch(`/api/org/members?orgId=${orgId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setMembers(data.members);
        });
    }
  }, [orgId, userRole]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col gap-8">
      {/* Top Bar / Context Switcher or Real Auth */}
      <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-100 rounded-lg border border-pink-200">
                <Key className="w-5 h-5 text-pink-500" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <span className="text-sm font-medium text-stone-600">
                  Logged in as <strong className="text-stone-900 text-base ml-1">{userData?.displayName || userData?.email}</strong>
                </span>
                {workflowsData?.org_members?.[0]?.organization?.name && (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-bold rounded-lg tracking-wide uppercase inline-flex self-start">
                      {workflowsData.org_members[0].organization.name}
                    </span>
                    <span className="px-2.5 py-1 bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold rounded-lg tracking-wide uppercase inline-flex self-start">
                      {userRole}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-xs text-stone-500">
              Manage your workflows and view real-time execution status below.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={async () => {
                const newPass = prompt("Enter your new password (min 9 chars):");
                if (newPass && newPass.length >= 9) {
                  const { isError, error } = await changePassword(newPass);
                  if (isError) alert("Error changing password: " + error?.message);
                  else alert("Password successfully updated!");
                } else if (newPass) {
                  alert("Password must be at least 9 characters long.");
                }
              }} 
              className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600 transition-colors shadow-sm"
            >
              Change Password
            </button>
            <button onClick={() => signOut()} className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600 transition-colors shadow-sm">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Workflow Builder */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {workflowsData && workflowsData.org_members?.length === 0 ? (
            <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 border border-yellow-200">
              <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                <Users className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 font-heading">You need an Organization</h3>
              <p className="text-stone-500 max-w-md">
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
                  className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <button name="submitBtn" type="submit" className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-300 hover:to-pink-400 text-white font-semibold py-3 rounded-xl transition-all shadow-md">
                  Create Organization
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold font-heading text-stone-900">Workflows</h2>
                  {isAuthenticated && workflowsData?.workflows?.length > 0 && (
                    <select 
                      className="bg-white border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-2 focus:ring-pink-400 p-2 shadow-sm"
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
                  <a href="/workflows/create" className="flex items-center gap-1 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
                    <Plus className="w-4 h-4" /> New
                  </a>
                  {(userRole !== 'viewer') ? (
                    <>
                      {activeWorkflowId && (
                        <>
                          <a href={`/workflows/${activeWorkflowId}/edit`} className="flex items-center justify-center p-2.5 bg-white hover:bg-blue-50 text-stone-400 hover:text-blue-500 border border-stone-200 hover:border-blue-200 rounded-xl transition-all shadow-sm">
                            <Pencil className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this workflow?')) {
                                const res = await fetch('/api/workflows/delete', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ workflowId: activeWorkflowId })
                                });
                                if (res.ok) window.location.reload();
                                else alert('Failed to delete workflow');
                              }
                            }}
                            className="flex items-center justify-center p-2.5 bg-white hover:bg-red-50 text-stone-400 hover:text-red-500 border border-stone-200 hover:border-red-200 rounded-xl transition-all shadow-sm">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button onClick={handleRun} disabled={runStatus === 'running'} className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-300 hover:to-pink-400 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]">
                        <Play className="w-4 h-4 fill-current" /> Run
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-stone-500 bg-stone-100 px-4 py-2 rounded-xl text-sm border border-stone-200 font-medium shadow-sm">
                      <ShieldAlert className="w-4 h-4" /> Viewer Mode
                    </div>
                  )}
                </div>
              </div>
              
              <div className="glass-panel p-2 rounded-3xl">
            <div className="bg-white/50 rounded-[1.25rem] p-6 min-h-[400px] border border-stone-200/50 flex flex-col gap-5 relative">
              {mappedSteps.length > 0 ? (
                <>
                  <div className="absolute left-[45px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-pink-400/50 via-stone-200 to-transparent" />
                  
                  {mappedSteps.map((step: any, idx: number) => (
                    <div key={step.id} className="relative flex items-start gap-5 p-5 rounded-2xl border border-stone-200 bg-white hover:bg-stone-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-stone-300 group shadow-sm">
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 z-10 text-sm font-bold shadow-lg transition-all duration-500 ${
                        step.status === 'completed' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                        step.status === 'running' ? 'bg-yellow-50 border-yellow-200 text-yellow-600 animate-pulse' :
                        step.status === 'paused' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        'bg-stone-50 border-stone-200 text-stone-400'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <Zap className={`w-4 h-4 ${step.status === 'running' ? 'text-pink-500 animate-pulse' : 'text-stone-400'}`} />
                            <span className="font-semibold text-stone-800 tracking-wide">{step.type.replace('_', ' ').toUpperCase()}</span>
                          </div>
                        </div>
                        <div className="text-sm text-stone-500 mt-1.5 font-medium">
                          {step.type === 'llm_call' ? 'Call external LLM API' : 
                          step.type === 'http_request' ? 'Fetch data from endpoint' : 
                          step.type === 'approval_gate' ? 'Pause for human review' : 'Branch conditionally'}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-stone-500 gap-2">
                  <div className="p-4 bg-stone-100 rounded-full mb-2">
                    <Settings className="w-8 h-8 opacity-50" />
                  </div>
                  <p>No workflows found.</p>
                  <a href="/workflows/create" className="text-pink-500 hover:text-pink-400 font-medium">Create your first workflow &rarr;</a>
                </div>
              )}
            </div>
          </div>
          </>
          )}
        </div>

        {/* Right Column - Live Run Viewer */}
        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-bold font-heading text-stone-900">Live Run Status</h2>
          
          <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="p-5 border-b border-stone-200/50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
              <span className="text-sm font-semibold tracking-wide text-stone-700">Status</span>
              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm ${
                runStatus === 'idle' ? 'bg-stone-100 text-stone-500 border border-stone-200' :
                runStatus === 'running' ? 'bg-yellow-100 text-yellow-600 border border-yellow-200' :
                runStatus === 'paused' ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
                {runStatus === 'running' && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping" />}
                {runStatus === 'paused' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                {runStatus}
              </span>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-3">
              {mappedSteps.map((step: any, idx: number) => (
                <div key={step.id} className="flex flex-col p-4 rounded-xl bg-white border border-stone-200 hover:border-stone-300 transition-colors shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-700">Step {idx + 1}</span>
                    <div className="flex items-center gap-2.5">
                      {step.status === 'pending' && <Clock className="w-4 h-4 text-stone-400" />}
                      {step.status === 'running' && (
                        <svg className="animate-spin w-4 h-4 text-yellow-500" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                      {step.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      {step.status === 'paused' && <Pause className="w-4 h-4 text-amber-500" />}
                      
                      <span className={`text-xs uppercase font-bold tracking-wider ${
                        step.status === 'completed' ? 'text-emerald-500' :
                        step.status === 'running' ? 'text-yellow-600' :
                        step.status === 'paused' ? 'text-amber-500' :
                        step.status === 'failed' ? 'text-red-500' :
                        'text-stone-400'
                      }`}>{step.status}</span>
                    </div>
                  </div>
                  
                  {/* Step Output / Error Display */}
                  {(step.output || step.error) && (
                    <div className="mt-3 bg-stone-50 rounded-lg p-3 border border-stone-100 overflow-x-auto">
                      {step.error && (
                        <div className="text-xs text-red-600 font-mono whitespace-pre-wrap">
                          {typeof step.error === 'object' ? JSON.stringify(step.error, null, 2) : step.error}
                        </div>
                      )}
                      {step.output && !step.error && (
                        <div className="text-xs text-stone-600 font-mono whitespace-pre-wrap">
                          {typeof step.output === 'object' ? JSON.stringify(step.output, null, 2) : step.output}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {runStatus === 'paused' && (
              <div className="p-5 bg-amber-50 border-t border-amber-200 flex flex-col gap-4 backdrop-blur-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-3 relative z-10">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-sm font-medium text-amber-800 leading-relaxed">
                    Run is paused at an Approval Gate. Requires Owner or Editor approval to proceed.
                  </div>
                </div>
                <button 
                  onClick={handleApprove}
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-white font-bold rounded-xl text-sm transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 active:scale-[0.98] relative z-10"
                >
                  Approve & Resume
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Settings (Owner Only) */}
      {userRole === 'owner' && (
        <div className="mt-4 border-t border-stone-200/50 pt-8">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-xl border border-pink-200">
                <Users className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-heading text-stone-900">Team Settings</h2>
                <p className="text-sm text-stone-500">Manage your organization's members.</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const confirmOrg = prompt('DANGER: Deleting your organization will remove all workflows and members. Type your org name to confirm:');
                if (confirmOrg === workflowsData?.org_members?.[0]?.organization?.name) {
                  const res = await fetch('/api/org/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orgId })
                  });
                  if (res.ok) window.location.reload();
                  else alert('Failed to delete organization');
                } else if (confirmOrg !== null) {
                  alert('Organization name did not match.');
                }
              }}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-semibold transition-colors"
            >
              Delete Organization
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel rounded-3xl p-6 bg-white/50 h-fit">
              <h3 className="text-lg font-bold text-stone-900 mb-4 font-heading">Invite Member</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const email = (form.elements.namedItem('inviteEmail') as HTMLInputElement).value;
                  const password = (form.elements.namedItem('invitePassword') as HTMLInputElement).value;
                  const role = (form.elements.namedItem('inviteRole') as HTMLSelectElement).value;
                  const btn = form.elements.namedItem('inviteBtn') as HTMLButtonElement;
                  
                  if (!orgId) return alert("Organization ID not found");
                  if (password.length < 9) return alert("Password must be at least 9 characters");
                  
                  btn.disabled = true;
                  btn.textContent = 'Inviting...';
                  
                  try {
                    const res = await fetch('/api/org/invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email, password, role, orgId })
                    });
                    const data = await res.json();
                    if (data.success) {
                      alert('User invited successfully!');
                      form.reset();
                      // Refresh members
                      fetch(`/api/org/members?orgId=${orgId}`)
                        .then(r => r.json())
                        .then(d => { if(d.success) setMembers(d.members) });
                    } else {
                      alert('Error: ' + data.message);
                    }
                  } catch (err) {
                    alert('Error inviting user');
                  } finally {
                    btn.disabled = false;
                    btn.textContent = 'Invite Member';
                  }
                }}
                className="flex flex-col gap-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Email Address</label>
                  <input
                    name="inviteEmail"
                    type="email"
                    required
                    placeholder="teammate@example.com"
                    className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Initial Password</label>
                  <input
                    name="invitePassword"
                    type="text"
                    required
                    placeholder="Min 9 characters"
                    className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">Role</label>
                  <select
                    name="inviteRole"
                    className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="viewer">Viewer (Read Only)</option>
                    <option value="editor">Editor (Can edit & run workflows)</option>
                    <option value="owner">Owner (Full Admin Access)</option>
                  </select>
                </div>
                <div className="pt-2">
                  <button name="inviteBtn" type="submit" className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-xl transition-all shadow-md">
                    <Plus className="w-4 h-4" /> Send Invite
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-panel rounded-3xl p-6 bg-white/50 h-fit">
              <h3 className="text-lg font-bold text-stone-900 mb-4 font-heading">Current Members</h3>
              {members.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {members.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-stone-900">{member.email}</span>
                        <span className="text-xs text-stone-500 capitalize">{member.role}</span>
                      </div>
                      {member.user_id !== userData?.id && (
                        <button 
                          onClick={async () => {
                            if (confirm(`Remove ${member.email} from the organization?`)) {
                              const res = await fetch('/api/org/members/delete', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orgId, userId: member.user_id })
                              });
                              if (res.ok) {
                                setMembers(prev => prev.filter(m => m.user_id !== member.user_id));
                              } else {
                                alert('Failed to remove member');
                              }
                            }
                          }}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-stone-500 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  Loading members...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
