import { StepConfig, WorkflowStep } from '../../../types';

export function executeBranchStep(config: StepConfig | undefined, previousOutput: any, currentStepIndex: number, workflowSteps: WorkflowStep[]) {
  let branchResult = false;
  let prevText = "";
  if (previousOutput?.text) prevText = previousOutput.text;
  else if (typeof previousOutput?.response === 'string') prevText = previousOutput.response;
  else if (previousOutput?.response) prevText = JSON.stringify(previousOutput.response);
  else prevText = JSON.stringify(previousOutput || "");
  
  const targetValue = config?.value || config?.keyword;
  
  if (targetValue) {
    const op = config?.operator || 'contains';
    if (op === 'equals') {
      branchResult = prevText.trim().toLowerCase() === String(targetValue).trim().toLowerCase();
    } else {
      branchResult = prevText.toLowerCase().includes(String(targetValue).toLowerCase());
    }
  } else {
    const lowerText = prevText.toLowerCase();
    branchResult = lowerText.includes("yes") || lowerText.includes("true") || lowerText.includes("approve");
  }
  
  const nextAction = branchResult ? config?.if_true : config?.if_false;
  
  const stepResult = { 
    branched: branchResult, 
    evaluated_text: prevText,
    reason: `Evaluated against previous output`,
    next_action: nextAction || 'continue sequentially'
  };
  
  let nextIndex = currentStepIndex;
  
  if (nextAction === 'end' || nextAction === 'finish') {
    nextIndex = workflowSteps.length; 
  } else if (nextAction) {
     const targetIndex = workflowSteps.findIndex((s) => s.type === nextAction || s.id === nextAction);
     if (targetIndex !== -1) {
        nextIndex = targetIndex - 1;
     }
  }

  return { stepResult, nextIndex };
}
