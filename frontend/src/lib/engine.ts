import { executeLlmStep } from './engine/steps/llm';
import { executeHttpStep } from './engine/steps/http';
import { executeBranchStep } from './engine/steps/branch';
import { Workflow, WorkflowStep } from '../types';

const HASURA_GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL || process.env.NHOST_GRAPHQL_URL || 'https://local.hasura.dev/v1/graphql';
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || process.env.NHOST_ADMIN_SECRET || '';

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

export async function executeWorkflowSteps(workflow: Workflow, runId: string, startIndex: number, initialOutput: any) {
  let currentStatus = 'running';
  let previousOutput = initialOutput;

  for (let i = startIndex; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    
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
    let maxRetries = step.config?.max_retries ?? 1;
    let attemptCount = 1;
    let success = false;

    while (attemptCount <= maxRetries + 1) {
      try {
        if (step.type === 'llm_call') {
          stepResult = await executeLlmStep(step.config, previousOutput);
        } else if (step.type === 'http_request') {
          stepResult = await executeHttpStep(step.config);
        } else if (step.type === 'conditional_branch') {
          const res = executeBranchStep(step.config, previousOutput, i, workflow.steps);
          stepResult = res.stepResult;
          i = res.nextIndex;
        } else if (step.type === 'db_write') {
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
        } else if (step.type === 'notify') {
          const message = step.config?.message || 'Workflow notification';
          const to = step.config?.to || 'admin@example.com';
          stepResult = { to, message, sent: true };
        } else if (step.type === 'approval_gate') {
          stepStatus = 'paused';
          currentStatus = 'paused';
        }

        await executeGraphQL(`
          mutation UpdateStepRun($id: uuid!, $status: String!, $output: jsonb, $attempts: Int!) {
            update_step_runs_by_pk(pk_columns: {id: $id}, _set: {status: $status, output: $output, attempt_count: $attempts, completed_at: "now()"}) {
              id
            }
          }
        `, { id: stepRunId, status: stepStatus, output: stepResult, attempts: attemptCount });

        success = true;
        break;

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
          break;
        }
      }
    }

    if (!success && currentStatus === 'failed') break;
    if (stepStatus === 'paused') break;
    previousOutput = stepResult;
  }

  if (currentStatus !== 'paused' && currentStatus !== 'failed') {
    currentStatus = 'completed';
    await executeGraphQL(`
      mutation UpdateQuota($org_id: uuid!) {
        update_organizations_by_pk(pk_columns: {id: $org_id}, _inc: {quota_used: 1}) {
          id
        }
      }
    `, { org_id: (workflow as any).org_id });
  }

  await executeGraphQL(`
    mutation UpdateRunStatus($id: uuid!, $status: String!) {
      update_workflow_runs_by_pk(pk_columns: {id: $id}, _set: {status: $status}) {
        id
      }
    }
  `, { id: runId, status: currentStatus });

  return { status: currentStatus };
}
