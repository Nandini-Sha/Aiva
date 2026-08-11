import { Clock, CheckCircle, Pause, ShieldAlert } from 'lucide-react';
import { WorkflowStep } from '../../types';

interface LiveRunViewerProps {
  runStatus: string;
  mappedSteps: WorkflowStep[];
  handleApprove: () => void;
}

export default function LiveRunViewer({
  runStatus,
  mappedSteps,
  handleApprove
}: LiveRunViewerProps) {
  return (
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
          {mappedSteps.map((step, idx) => (
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
                    <div className="text-xs text-stone-600 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {step.output.text 
                        ? step.output.text 
                        : step.output.response 
                          ? (typeof step.output.response === 'object' ? JSON.stringify(step.output.response, null, 2) : step.output.response) 
                          : (typeof step.output === 'object' ? JSON.stringify(step.output, null, 2) : step.output)
                      }
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
                <span className="block font-bold mb-1">Approval Required</span>
                {mappedSteps.find((s) => s.status === 'paused')?.config?.message || 
                 'Run is paused at an Approval Gate. Requires Owner or Editor approval to proceed.'}
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
  );
}
