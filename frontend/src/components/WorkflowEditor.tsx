"use client";

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
        <div className="p-2 bg-pink-100 rounded-xl border border-pink-200">
          <Plus className="w-5 h-5 text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold text-stone-900 font-heading">Create New Workflow</h2>
      </div>

      <div className="flex flex-col gap-5 mb-8">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Workflow Name</label>
          <input
            className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all placeholder:text-stone-400 shadow-sm"
            placeholder="e.g. Lead Qualification Agent"
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Description <span className="text-stone-400 font-normal lowercase tracking-normal">(optional)</span></label>
          <textarea
            className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all placeholder:text-stone-400 shadow-sm resize-none"
            placeholder="What does this workflow do?"
            rows={2}
            value={workflowDesc}
            onChange={e => setWorkflowDesc(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-8">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-3">Add Steps</label>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => addStep('llm_call')}
            className="flex items-center gap-2 bg-white hover:bg-yellow-50 text-stone-600 hover:text-yellow-600 border border-stone-200 hover:border-yellow-300 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <Plus size={16} /> LLM Call
          </button>
          <button
            onClick={() => addStep('http_request')}
            className="flex items-center gap-2 bg-white hover:bg-yellow-50 text-stone-600 hover:text-yellow-600 border border-stone-200 hover:border-yellow-300 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <Plus size={16} /> HTTP Request
          </button>
          <button
            onClick={() => addStep('conditional_branch')}
            className="flex items-center gap-2 bg-white hover:bg-yellow-50 text-stone-600 hover:text-yellow-600 border border-stone-200 hover:border-yellow-300 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <Plus size={16} /> Branch
          </button>
          <button
            onClick={() => addStep('approval_gate')}
            className="flex items-center gap-2 bg-white hover:bg-yellow-50 text-stone-600 hover:text-yellow-600 border border-stone-200 hover:border-yellow-300 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            <Plus size={16} /> Approval Gate
          </button>
        </div>
      </div>

      {steps.length > 0 && (
        <div className="space-y-3 mb-8">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block mb-1">Workflow Sequence</label>
          <div className="bg-stone-50/50 rounded-2xl p-2 border border-stone-200/50">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col bg-white p-3 mb-3 last:mb-0 rounded-xl border border-stone-200 group shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-stone-50 flex items-center justify-center text-xs text-stone-500 font-bold border border-stone-200">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-stone-800 capitalize tracking-wide">{step.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveStep(idx, 'up')}
                      className="w-7 h-7 flex items-center justify-center bg-stone-50 hover:bg-pink-50 text-stone-400 hover:text-pink-500 border border-transparent hover:border-pink-200 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-stone-50 disabled:hover:text-stone-400 disabled:hover:border-transparent"
                      disabled={idx === 0}
                      aria-label="Move up"
                    >↑</button>
                    <button
                      onClick={() => moveStep(idx, 'down')}
                      className="w-7 h-7 flex items-center justify-center bg-stone-50 hover:bg-pink-50 text-stone-400 hover:text-pink-500 border border-transparent hover:border-pink-200 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-stone-50 disabled:hover:text-stone-400 disabled:hover:border-transparent"
                      disabled={idx === steps.length - 1}
                      aria-label="Move down"
                    >↓</button>
                  </div>
                </div>
                
                {/* Config JSON Input */}
                <div className="mt-3 pl-9">
                  <label className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">JSON Config</label>
                  <textarea
                    className="w-full bg-stone-50 border border-stone-200 text-stone-600 font-mono text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-400 focus:border-pink-400 transition-all resize-none shadow-inner"
                    rows={2}
                    value={JSON.stringify(step.config, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, config: parsed } : s));
                      } catch (err) {
                        // Allow invalid JSON while typing, but ideally keep valid state.
                        // Since this is a simple editor, we'll just not update state if invalid,
                        // or we can store a string state. For simplicity, we just catch the error.
                      }
                    }}
                    onBlur={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setSteps(prev => prev.map((s, i) => i === idx ? { ...s, config: parsed } : s));
                      } catch(err) {
                        alert("Invalid JSON in step config");
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger configuration */}
      <div className="mb-6 space-y-1.5">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">Trigger Mechanism</label>
        <select
          value={triggerType}
          onChange={e => setTriggerType(e.target.value as 'manual' | 'webhook')}
          className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all shadow-sm cursor-pointer"
        >
          <option value="manual">Manual Trigger</option>
          <option value="webhook">Webhook Trigger</option>
        </select>
      </div>

      {triggerType === 'webhook' && (
        <div className="mb-8 space-y-1.5">
          <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">Webhook Endpoint URL</label>
          <input
            className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all placeholder:text-stone-400 shadow-sm font-mono text-sm"
            placeholder="https://<your-app>.vercel.app/api/webhook/..."
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
          />
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-300 hover:to-pink-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save size={18} /> Save Workflow Configuration
        </button>
      </div>
    </div>
  );
}
