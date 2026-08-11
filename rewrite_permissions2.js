const fs = require('fs');
const path = require('path');

const dir = 'nhost/metadata/databases/default/tables';

// Overwrite public_workflow_runs.yaml
const workflowRuns = `table:
  name: workflow_runs
  schema: public
object_relationships:
  - name: workflow
    using:
      foreign_key_constraint_on: workflow_id
array_relationships:
  - name: step_runs
    using:
      foreign_key_constraint_on:
        column: workflow_run_id
        table:
          name: step_runs
          schema: public
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - workflow_id
        - status
        - started_at
        - completed_at
      filter:
        workflow:
          organization:
            org_members:
              user_id:
                _eq: X-Hasura-User-Id
insert_permissions:
  - role: user
    permission:
      check:
        workflow:
          organization:
            org_members:
              role:
                _in:
                  - editor
                  - owner
              user_id:
                _eq: X-Hasura-User-Id
      columns:
        - workflow_id
        - status
update_permissions:
  - role: user
    permission:
      columns:
        - status
        - completed_at
      filter:
        workflow:
          organization:
            org_members:
              role:
                _in:
                  - editor
                  - owner
              user_id:
                _eq: X-Hasura-User-Id
      check: null
delete_permissions:
  - role: user
    permission:
      filter:
        workflow:
          organization:
            org_members:
              role:
                _in:
                  - editor
                  - owner
              user_id:
                _eq: X-Hasura-User-Id
`;
fs.writeFileSync(path.join(dir, 'public_workflow_runs.yaml'), workflowRuns);

// Overwrite public_step_runs.yaml
const stepRuns = `table:
  name: step_runs
  schema: public
object_relationships:
  - name: workflow_run
    using:
      foreign_key_constraint_on: workflow_run_id
  - name: workflow_step
    using:
      foreign_key_constraint_on: step_id
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - workflow_run_id
        - step_id
        - status
        - input
        - output
        - error
        - attempt_count
        - approved_by
        - approved_at
        - started_at
        - completed_at
      filter:
        workflow_run:
          workflow:
            organization:
              org_members:
                user_id:
                  _eq: X-Hasura-User-Id
insert_permissions:
  - role: user
    permission:
      check:
        workflow_run:
          workflow:
            organization:
              org_members:
                role:
                  _in:
                    - editor
                    - owner
                user_id:
                  _eq: X-Hasura-User-Id
      columns:
        - workflow_run_id
        - step_id
        - status
        - input
update_permissions:
  - role: user
    permission:
      columns:
        - status
        - output
        - error
        - attempt_count
        - completed_at
        - approved_by
        - approved_at
      filter:
        workflow_run:
          workflow:
            organization:
              org_members:
                role:
                  _in:
                    - editor
                    - owner
                user_id:
                  _eq: X-Hasura-User-Id
      check: null
event_triggers:
  - name: notify_step_trigger
    definition:
      enable_manual: true
      insert:
        columns: '*'
      update:
        columns:
          - status
    retry_conf:
      interval_sec: 10
      num_retries: 0
      timeout_sec: 60
    webhook: '{{FRONTEND_URL}}/api/notify'
`;
fs.writeFileSync(path.join(dir, 'public_step_runs.yaml'), stepRuns);

// Overwrite public_workflow_outputs.yaml
const workflowOutputs = `table:
  name: workflow_outputs
  schema: public
object_relationships:
  - name: workflow_run
    using:
      foreign_key_constraint_on: workflow_run_id
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - workflow_run_id
        - key
        - value
        - created_at
      filter:
        workflow_run:
          workflow:
            organization:
              org_members:
                user_id:
                  _eq: X-Hasura-User-Id
insert_permissions:
  - role: user
    permission:
      check:
        workflow_run:
          workflow:
            organization:
              org_members:
                role:
                  _in:
                    - editor
                    - owner
                user_id:
                  _eq: X-Hasura-User-Id
      columns:
        - workflow_run_id
        - key
        - value
`;
fs.writeFileSync(path.join(dir, 'public_workflow_outputs.yaml'), workflowOutputs);

console.log("Rewrote permissions 2");
