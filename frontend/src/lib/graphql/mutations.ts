export const CREATE_WORKFLOW = `
mutation CreateWorkflow($orgId: uuid!, $name: String!, $description: String) {
  insert_workflows_one(object: {org_id: $orgId, name: $name, description: $description}) {
    id
    name
  }
}`;

export const UPDATE_WORKFLOW = `
mutation UpdateWorkflow($id: uuid!, $name: String, $description: String) {
  update_workflows_by_pk(pk_columns: {id: $id}, _set: {name: $name, description: $description}) {
    id
    name
  }
}`;

export const CREATE_STEP = `
mutation CreateStep($workflowId: uuid!, $type: String!, $config: jsonb, $orderIndex: Int!) {
  insert_workflow_steps_one(object: {workflow_id: $workflowId, type: $type, config: $config, order_index: $orderIndex}) {
    id
    type
    config
    order_index
  }
}`;

export const UPDATE_STEP = `
mutation UpdateStep($id: uuid!, $type: String, $config: jsonb, $orderIndex: Int) {
  update_workflow_steps_by_pk(pk_columns: {id: $id}, _set: {type: $type, config: $config, order_index: $orderIndex}) {
    id
    type
    config
    order_index
  }
}`;

export const CREATE_TRIGGER = `
mutation CreateTrigger($workflowId: uuid!, $type: String!, $config: jsonb) {
  insert_workflow_triggers_one(object: {workflow_id: $workflowId, type: $type, config: $config}) {
    id
    type
    config
  }
}`;

export const UPDATE_TRIGGER = `
mutation UpdateTrigger($id: uuid!, $type: String, $config: jsonb) {
  update_workflow_triggers_by_pk(pk_columns: {id: $id}, _set: {type: $type, config: $config}) {
    id
    type
    config
  }
}`;

// Approve step – this is a Hasura Action
export const APPROVE_STEP = `
mutation ApproveStep($stepRunId: uuid!) {
  approveStep(input: {step_run_id: $stepRunId}) {
    success
    resumed
  }
}`;
