import { useState } from 'react';
import { useAccessToken, useAuthenticationStatus } from '@nhost/nextjs';
import { Plus, Save } from 'lucide-react';

export default function WorkflowEditor() {
  const { isAuthenticated } = useAuthenticationStatus();
  const accessToken = useAccessToken();
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDesc, setWorkflowDesc] = useState('');
  const [steps, setSteps] = useState<Array<{ type: string; config: any }>>([]);
  // Trigger configuration
  const [triggerType, setTriggerType] = useState<'manual' | 'webhook'>('manual');
  const [webhookUrl, setWebhookUrl] = useState('');
  const moveStep = (fromIndex: number, direction: 'up' | 'down') => {
    setSteps(prev => {
      const newSteps = [...prev];
      const target = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (target < 0 || target >= newSteps.length) return prev;
      const temp = newSteps[target];
      newSteps[target] = newSteps[fromIndex];
      newSteps[fromIndex] = temp;
      return newSteps;
    });
  };

  const addStep = (type: string) => {
    setSteps(prev => [...prev, { type, config: {} }]);
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      alert('You must be logged in to save a workflow');
      return;
    }
    if (!workflowName) {
      alert('Workflow name is required');
      return;
    }
    try {
      const response = await fetch('/api/workflows/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          input: {
            name: workflowName,
            description: workflowDesc,
            steps: steps.map((s, idx) => ({ type: s.type, config: s.config, order_index: idx })),
          }
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        alert(result.message || 'Failed to save workflow');
        return;
      }
      alert(`Workflow saved! ID: ${result.workflowId}`);
      // Reset form
      setWorkflowName('');
      setWorkflowDesc('');
      setSteps([]);
    } catch (err) {
      console.error(err);
      alert('Network error while saving workflow');
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
          <Plus className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white font-heading">Create New Workflow</h2>
      </div>

      <div className="flex flex-col gap-5 mb-8">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workflow Name</label>
          <input
            className="w-full bg-slate-950/50 border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 shadow-inner"
            placeholder="e.g. Lead Qualification Agent"
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description <span className="text-slate-500 font-normal lowercase tracking-normal">(optional)</span></label>
          <textarea
            className="w-full bg-slate-950/50 border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 shadow-inner resize-none"
            placeholder="What does this workflow do?"
            rows={2}
            value={workflowDesc}
            onChange={e => setWorkflowDesc(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">Add Steps</label>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => addStep('llm_call')}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} /> LLM Call
          </button>
          <button
            onClick={() => addStep('http_request')}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} /> HTTP Request
          </button>
          <button
            onClick={() => addStep('conditional_branch')}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} /> Branch
          </button>
          <button
            onClick={() => addStep('approval_gate')}
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-indigo-500/20 text-slate-300 hover:text-indigo-400 border border-white/5 hover:border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} /> Approval Gate
          </button>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="space-y-3 mb-8">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Workflow Sequence</label>
          <div className="bg-slate-950/30 rounded-2xl p-2 border border-white/5">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-900/80 p-3 mb-2 last:mb-0 rounded-xl border border-white/5 group">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-md bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold border border-white/5">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-slate-200 capitalize tracking-wide">{step.type.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveStep(idx, 'up')}
                    className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 border border-transparent hover:border-indigo-500/30 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 disabled:hover:border-transparent"
                    disabled={idx === 0}
                    aria-label="Move up"
                  >↑</button>
                  <button
                    onClick={() => moveStep(idx, 'down')}
                    className="w-7 h-7 flex items-center justify-center bg-slate-800 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 border border-transparent hover:border-indigo-500/30 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-slate-800 disabled:hover:text-slate-400 disabled:hover:border-transparent"
                    disabled={idx === steps.length - 1}
                    aria-label="Move down"
                  >↓</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger configuration */}
      <div className="mb-6 space-y-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Trigger Mechanism</label>
        <select
          value={triggerType}
          onChange={e => setTriggerType(e.target.value as 'manual' | 'webhook')}
          className="w-full bg-slate-950/50 border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner cursor-pointer"
        >
          <option value="manual">Manual Trigger</option>
          <option value="webhook">Webhook Trigger</option>
        </select>
      </div>

      {triggerType === 'webhook' && (
        <div className="mb-8 space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Webhook Endpoint URL</label>
          <input
            className="w-full bg-slate-950/50 border border-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-600 shadow-inner font-mono text-sm"
            placeholder="https://<your-app>.vercel.app/api/webhook/..."
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
          />
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save size={18} /> Save Workflow Configuration
        </button>
      </div>
    </div>
  );
}
