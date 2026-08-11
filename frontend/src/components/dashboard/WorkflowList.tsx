import { Plus, Trash2, Play, Settings, ShieldAlert, Zap } from 'lucide-react';
import Link from 'next/link';
import { Workflow, WorkflowStep } from '../../types';

interface WorkflowListProps {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  setActiveWorkflowId: (id: string) => void;
  userRole?: string;
  runStatus: string;
  handleRun: () => void;
  mappedSteps: WorkflowStep[];
  isAuthenticated: boolean;
}

export default function WorkflowList({
  workflows,
  activeWorkflowId,
  setActiveWorkflowId,
  userRole,
  runStatus,
  handleRun,
  mappedSteps,
  isAuthenticated
}: WorkflowListProps) {
  const activeWorkflow = workflows.find(w => w.id === activeWorkflowId);

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold font-heading text-stone-900">Workflows</h2>
          {isAuthenticated && workflows.length > 0 && (
            <select 
              className="bg-white border border-stone-200 text-stone-900 text-sm rounded-xl focus:ring-2 focus:ring-pink-400 p-2 shadow-sm"
              value={activeWorkflowId || ''}
              onChange={(e) => setActiveWorkflowId(e.target.value)}
            >
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {userRole !== 'viewer' && (
            <Link href="/workflows/create" className="flex items-center gap-1 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm">
              <Plus className="w-4 h-4" /> New
            </Link>
          )}
          {(userRole !== 'viewer') ? (
            <>
              {activeWorkflowId && (
                <>
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
      {activeWorkflow?.description && (
        <p className="text-sm text-stone-500 mt-2 mb-4 leading-relaxed max-w-2xl">{activeWorkflow.description}</p>
      )}
      
      <div className="glass-panel p-2 rounded-3xl">
        <div className="bg-white/50 rounded-[1.25rem] p-6 min-h-[400px] border border-stone-200/50 flex flex-col gap-5 relative">
          {mappedSteps.length > 0 ? (
            <>
              <div className="absolute left-[45px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-pink-400/50 via-stone-200 to-transparent" />
              
              {mappedSteps.map((step, idx) => (
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
                    <div className="text-sm text-stone-500 mt-1.5 font-medium line-clamp-2">
                      {step.type === 'llm_call' ? (step.config?.prompt || 'Call external LLM API') : 
                        step.type === 'http_request' ? (step.config?.url || 'Fetch data from endpoint') : 
                        step.type === 'approval_gate' ? (step.config?.message || 'Pause for human review') : 
                        (step.config?.condition_variable ? `Branch on ${step.config.condition_variable}` : 'Branch conditionally')}
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
              <Link href="/workflows/create" className="text-pink-500 hover:text-pink-400 font-medium">Create your first workflow &rarr;</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
