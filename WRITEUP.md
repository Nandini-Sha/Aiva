# Architectural Write-up

**🎥 Final Scenario Demo Video:** [https://youtu.be/JVOwcxk4b48](https://youtu.be/JVOwcxk4b48)

This document explains the core design decisions behind the Aiva AI Workflow Builder, specifically focusing on schema design, the two-layer permission model, and the execution engine's handling of approval gates.

## 1. Schema Reasoning & Relationships

The database is built on PostgreSQL (via Hasura) and is normalized to strongly enforce multi-tenant organization isolation and track granular execution history.

- **`organizations` & `org_members`**: The root of the hierarchy. Every workflow belongs to an organization, and every user's access is determined by their entry in `org_members` (linking `user_id`, `org_id`, and `role`). This guarantees that a user cannot access data outside their assigned orgs.
- **`workflows` & `workflow_steps`**: A workflow is a template. The steps are stored in `workflow_steps` with an `order_index` to define sequential execution, a `type` to define the action (e.g., `llm_call`, `http_request`), and a flexible `config` (JSONB) to store arbitrary step-specific parameters (like API URLs, prompts, or branching logic).
- **`workflow_runs` & `step_runs`**: When a workflow executes, a new `workflow_run` is created to track the overall instance. As the engine evaluates each step, it creates a `step_run` associated with that `workflow_run`. This allows the UI to stream real-time execution status (pending, running, paused, completed, failed) and surface exact inputs/outputs for debugging without modifying the underlying workflow template.

## 2. The Two-Layer Permission Model

Security in Aiva is enforced through two distinct layers to ensure both strict data isolation and granular feature control.

### Layer 1: Database-Level Row Security (Hasura Permissions)
This layer ensures cross-org isolation and basic CRUD access rules. It is enforced purely at the database level by Hasura's GraphQL engine.
- **Cross-Org Isolation**: Every `select`, `insert`, `update`, and `delete` operation on a workflow or step has a boolean expression filter: `workflow -> organization -> org_members -> user_id : { _eq: X-Hasura-User-Id }`. This guarantees that an ID-guessing attack across organizations will inherently fail at the database query execution level.
- **Role Scoping**: Hasura permissions restrict operations based on the user's role within that specific organization. For example, `Viewer` roles have `select` permissions but absolutely no `insert`/`update`/`delete` permissions on `workflows` or `workflow_steps`. 

### Layer 2: Execution & Feature Gating (Serverless Action Handlers)
While Hasura protects the data at rest, certain dynamic behaviors (like executing dangerous steps or resuming paused workflows) require mid-execution validation. This is handled by our Next.js API Routes (acting as Hasura Actions).
- **Step-level Feature Gating**: When an Owner or Editor attempts to save a workflow with a restricted step type (e.g., `db_write` or `webhook`), Hasura `insert/update` permissions are configured with a `_check` constraint ensuring that only users with the `owner` role can commit those specific step types to the database.
- **Run Execution Verification**: Before the `triggerWorkflowRun` action executes a workflow, it queries the database on behalf of the caller to verify their exact role in the target org. Viewers are actively rejected by the engine before any API calls are made. 

## 3. Approval Gate Implementation

The `approval_gate` is implemented as an asynchronous pause in the workflow engine, utilizing the statefulness of the `workflow_runs` and `step_runs` tables.

1. **Pausing**: When the serverless workflow engine encounters a step of type `approval_gate`, it does not execute any external actions. Instead, it explicitly sets the `step_run` status to `paused` and the overarching `workflow_run` status to `paused`. It then breaks out of the execution loop and terminates the serverless function gracefully.
2. **Real-time UI**: The frontend utilizes a GraphQL Subscription on the `step_runs` table. The moment the database updates to `paused`, the UI instantly updates to show an Approval prompt, reading the custom message defined in the step's JSON config.
3. **Resumption**: The user clicks "Approve", which calls the `approveStep` Hasura Action. This serverless function first verifies the caller's identity and confirms they hold an `owner` or `editor` role in the organization. If authorized, it updates the step status to `completed` and re-invokes the `executeWorkflowSteps` engine logic, passing the current `order_index` so the workflow seamlessly resumes exactly where it left off.
