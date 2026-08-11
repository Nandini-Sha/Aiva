const fs = require('fs');
const path = require('path');

const dir = 'nhost/metadata/databases/default/tables';

// Overwrite public_workflows.yaml
const workflows = `table:
  name: workflows
  schema: public
object_relationships:
  - name: organization
    using:
      foreign_key_constraint_on: org_id
array_relationships:
  - name: runs
    using:
      foreign_key_constraint_on:
        column: workflow_id
        table:
          name: workflow_runs
          schema: public
  - name: steps
    using:
      foreign_key_constraint_on:
        column: workflow_id
        table:
          name: workflow_steps
          schema: public
  - name: triggers
    using:
      foreign_key_constraint_on:
        column: workflow_id
        table:
          name: workflow_triggers
          schema: public
insert_permissions:
  - role: user
    permission:
      check:
        organization:
          org_members:
            role:
              _in:
                - editor
                - owner
            user_id:
              _eq: X-Hasura-User-Id
      columns:
        - name
        - description
        - org_id
        - status
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - org_id
        - name
        - description
        - status
        - created_at
        - updated_at
      filter:
        organization:
          org_members:
            user_id:
              _eq: X-Hasura-User-Id
update_permissions:
  - role: user
    permission:
      columns:
        - name
        - description
        - status
      filter:
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
        organization:
          org_members:
            role:
              _eq: owner
            user_id:
              _eq: X-Hasura-User-Id
`;
fs.writeFileSync(path.join(dir, 'public_workflows.yaml'), workflows);

// Overwrite public_organizations.yaml
const organizations = `table:
  name: organizations
  schema: public
array_relationships:
  - name: org_members
    using:
      foreign_key_constraint_on:
        column: org_id
        table:
          name: org_members
          schema: public
  - name: workflows
    using:
      foreign_key_constraint_on:
        column: org_id
        table:
          name: workflows
          schema: public
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - name
        - quota_allowed
        - quota_used
        - created_at
        - updated_at
      filter:
        org_members:
          user_id:
            _eq: X-Hasura-User-Id
update_permissions:
  - role: user
    permission:
      columns:
        - name
        - quota_used
      filter:
        org_members:
          role:
            _in:
              - editor
              - owner
          user_id:
            _eq: X-Hasura-User-Id
      check: null
`;
fs.writeFileSync(path.join(dir, 'public_organizations.yaml'), organizations);

// Overwrite public_org_members.yaml
const orgMembers = `table:
  name: org_members
  schema: public
object_relationships:
  - name: organization
    using:
      foreign_key_constraint_on: org_id
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - org_id
        - user_id
        - role
        - created_at
      filter:
        organization:
          org_members:
            user_id:
              _eq: X-Hasura-User-Id
insert_permissions:
  - role: user
    permission:
      check:
        organization:
          org_members:
            role:
              _eq: owner
            user_id:
              _eq: X-Hasura-User-Id
      columns:
        - org_id
        - user_id
        - role
update_permissions:
  - role: user
    permission:
      columns:
        - role
      filter:
        organization:
          org_members:
            role:
              _eq: owner
            user_id:
              _eq: X-Hasura-User-Id
      check: null
delete_permissions:
  - role: user
    permission:
      filter:
        organization:
          org_members:
            role:
              _eq: owner
            user_id:
              _eq: X-Hasura-User-Id
`;
fs.writeFileSync(path.join(dir, 'public_org_members.yaml'), orgMembers);

// Overwrite public_workflow_steps.yaml
const steps = `table:
  name: workflow_steps
  schema: public
object_relationships:
  - name: workflow
    using:
      foreign_key_constraint_on: workflow_id
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - workflow_id
        - type
        - config
        - order_index
        - created_at
        - updated_at
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
        - type
        - config
        - order_index
update_permissions:
  - role: user
    permission:
      columns:
        - type
        - config
        - order_index
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
fs.writeFileSync(path.join(dir, 'public_workflow_steps.yaml'), steps);

console.log("Rewrote permissions");
