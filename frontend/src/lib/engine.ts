import { NextResponse } from 'next/server';

const HASURA_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL!;
const HASURA_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET!;

export async function executeGraphQL(query: string, variables: any = {}) {
  const res = await fetch(HASURA_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error('GraphQL Error:', json.errors);
    throw new Error(json.errors[0].message);
  }
  return json.data;
}

export async function executeWorkflowSteps(workflow: any, runId: string, startIndex: number, initialOutput: any) {
  let currentStatus = 'running';
  let previousOutput = initialOutput;

  for (let i = startIndex; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    
    // Create Step Run
    const stepRunData = await executeGraphQL(`
      mutation CreateStepRun($run_id: uuid!, $step_id: uuid!, $input: jsonb) {
        insert_step_runs_one(object: {workflow_run_id: $run_id, step_id: $step_id, status: "running", input: $input}) {
          id
        }
      }
    `, { run_id: runId, step_id: step.id, input: previousOutput || {} });

    const stepRunId = stepRunData.insert_step_runs_one.id;
    let stepResult = null;
    let stepStatus = 'completed';
    let maxRetries = step.config?.max_retries ?? 1; // 1 retry by default
    let attemptCount = 1;
    let success = false;

    while (attemptCount <= maxRetries + 1) {
      try {
        if (step.type === 'llm_call') {
          const apiKey = process.env.LLM_API_KEY;
          const baseUrl = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1/chat/completions';
          const model = process.env.LLM_MODEL || 'llama3-8b-8192';

          if (!apiKey) {
            throw new Error("LLM_API_KEY environment variable is missing.");
          }

          const llmResponse: any = await fetch(baseUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { role: 'system', content: 'You are an AI agent in a workflow step. Process the input provided.' },
                { role: 'user', content: JSON.stringify(previousOutput || step.config?.prompt || 'Hello') }
              ]
            })
          });

          if (!llmResponse.ok) {
            const errBody = await llmResponse.text();
            throw new Error(`LLM API Error: ${llmResponse.status} - ${errBody}`);
          }

          const llmData: any = await llmResponse.json();
          stepResult = { text: llmData.choices?.[0]?.message?.content || "No content returned" };

        } else if (step.type === 'db_write') {
          // Expect config: { key: string, value: string }
          const key = step.config?.key;
          const value = step.config?.value;
          if (key === undefined || value === undefined) {
            throw new Error('db_write step requires key and value in config');
          }
          const insertRes = await executeGraphQL(`
            mutation InsertOutput($runId: uuid!, $key: text!, $value: text!) {
              insert_workflow_outputs_one(object: {workflow_run_id: $runId, key: $key, value: $value}) { id }
            }
          `, { runId, key, value });
          stepResult = { insertedId: insertRes.insert_workflow_outputs_one.id, key, value };
        } else if (step.type === 'http_request') {
          const url = step.config?.url || 'https://httpbin.org/get';
          const method = step.config?.method || 'GET';
          const headers = step.config?.headers || {};
          
          const httpRes = await fetch(url, { method, headers });
          const responseText = await httpRes.text();
          
          let parsedData = responseText;
          try {
            parsedData = JSON.parse(responseText);
          } catch (e) {
            // Not JSON
          }
          
          stepResult = {
            status: httpRes.status,
            response: parsedData
          };
          
          if (!httpRes.ok) {
            throw new Error(`HTTP ${httpRes.status}: ${responseText.substring(0, 100)}`);
          }

        } else if (step.type === 'conditional_branch') {
          let branchResult = false;
          let prevText = "";
          if (previousOutput?.text) prevText = previousOutput.text;
          else if (typeof previousOutput?.response === 'string') prevText = previousOutput.response;
          else if (previousOutput?.response) prevText = JSON.stringify(previousOutput.response);
          else prevText = JSON.stringify(previousOutput || "");
          
          const targetValue = step.config?.value || step.config?.keyword;
          
          if (targetValue) {
            const op = step.config?.operator || 'contains';
            if (op === 'equals') {
              branchResult = prevText.trim().toLowerCase() === String(targetValue).trim().toLowerCase();
            } else {
              branchResult = prevText.toLowerCase().includes(String(targetValue).toLowerCase());
            }
          } else {
            const lowerText = prevText.toLowerCase();
            branchResult = lowerText.includes("yes") || lowerText.includes("true") || lowerText.includes("approve");
          }
          
          const nextAction = branchResult ? step.config?.if_true : step.config?.if_false;
          
          stepResult = { 
            branched: branchResult, 
            evaluated_text: prevText,
            reason: `Evaluated against previous output`,
            next_action: nextAction || 'continue sequentially'
          };
          
          if (nextAction === 'end' || nextAction === 'finish') {
            i = workflow.steps.length; 
          } else if (nextAction) {
             const targetIndex = workflow.steps.findIndex((s: any) => s.type === nextAction || s.id === nextAction);
             if (targetIndex !== -1) {
                i = targetIndex - 1;
             }
          }

        } else if (step.type === 'approval_gate') {
          stepStatus = 'paused';
          currentStatus = 'paused';
        }

        // Update Step Run success
        await executeGraphQL(`
          mutation UpdateStepRun($id: uuid!, $status: String!, $output: jsonb, $attempts: Int!) {
            update_step_runs_by_pk(pk_columns: {id: $id}, _set: {status: $status, output: $output, attempt_count: $attempts, completed_at: "now()"}) {
              id
            }
          }
        `, { id: stepRunId, status: stepStatus, output: stepResult, attempts: attemptCount });

        success = true;
        break; // Break out of retry loop

      } catch (err: any) {
        if (attemptCount <= maxRetries) {
          attemptCount++;
          console.log(`Step ${step.id} failed. Retrying... (Attempt ${attemptCount})`);
        } else {
          stepStatus = 'failed';
          currentStatus = 'failed';
          await executeGraphQL(`
            mutation UpdateStepRunFail($id: uuid!, $status: String!, $error: String!, $attempts: Int!) {
              update_step_runs_by_pk(pk_columns: {id: $id}, _set: {status: $status, error: $error, attempt_count: $attempts, completed_at: "now()"}) {
                id
              }
            }
          `, { id: stepRunId, status: stepStatus, error: err.message, attempts: attemptCount });
          break; // Break out of retry loop on total failure
        }
      }
    }

    if (!success && currentStatus === 'failed') {
      break; // Stop workflow execution loop
    }

    if (stepStatus === 'paused') {
      break; // Stop workflow execution loop, workflow is paused
    }
    previousOutput = stepResult;

  }

  if (currentStatus !== 'paused' && currentStatus !== 'failed') {
    currentStatus = 'completed';
    // Increment quota
    await executeGraphQL(`
      mutation UpdateQuota($org_id: uuid!) {
        update_organizations_by_pk(pk_columns: {id: $org_id}, _inc: {quota_used: 1}) {
          id
        }
      }
    `, { org_id: workflow.org_id });
  }

  // Update overall run status
  await executeGraphQL(`
    mutation UpdateRunStatus($id: uuid!, $status: String!) {
      update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {status: $status}) {
        id
      }
    }
  `, { id: runId, status: currentStatus });

  return { status: currentStatus };
}
