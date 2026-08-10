# AI Agent Workflow Builder

A full-stack Nhost + Next.js application that allows chaining AI agents via workflows with complex multi-layer permission gating and external integrations.

## Tech Stack

- **Frontend**: Next.js (App Router), React, TailwindCSS, Lucide Icons.
- **Backend**: Nhost (Hasura GraphQL Engine, PostgreSQL, Nhost Auth, Serverless Functions).
- **API**: GraphQL (Queries, Mutations, Subscriptions).

## Core Architecture

This repository fulfills the architectural requirements of the mini n8n-style agent builder:

1. **Database Schema**: 
   - Found in `nhost/migrations/default/1_init/up.sql`. Includes `organizations`, `workflows`, `workflow_steps`, `workflow_runs`, `step_runs`, and `org_members`.
2. **Hasura Permissions (Layer 1 - Data Isolation)**:
   - Found in `nhost/metadata/databases/default/tables/public_workflows.yaml` and others.
   - Every select/insert/update/delete operation is strictly gated against the `org_members` table using the caller's `X-Hasura-User-Id`.
   - Even if an Editor guesses an ID from another Org, the GraphQL engine denies it at the row level.
3. **Nhost Serverless Functions (Layer 2 - Action Gating)**:
   - Found in `frontend/src/app/api/actions/trigger/route.ts` and `frontend/src/app/api/actions/approve/route.ts`.
   - The handlers explicitly check the caller's role *mid-execution* before proceeding with sensitive operations like resuming an `approval_gate`.

## How to Run Locally

### 1. Nhost Backend

Due to Nhost CLI constraints on Windows without WSL2, the easiest way to run the backend is to link this project to an **Nhost Cloud** project:

1. Create a free project at [Nhost](https://nhost.io/).
2. Run the SQL schema from `nhost/migrations/default/1_init/up.sql` in your Hasura Console (Data -> SQL).
3. Apply the Hasura Metadata using the Hasura CLI (or manually configure the permissions via the UI based on the `.yaml` files).
4. Add the Hasura Actions pointing to your Next.js deployment URL.

*(Note: If you have a Mac/Linux or WSL2 environment, you can simply run `nhost up` from the project root).*

### 2. Next.js Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
3. Set environment variables in `frontend/.env.local`:
   ```
   NEXT_PUBLIC_NHOST_SUBDOMAIN=your-nhost-subdomain
   NEXT_PUBLIC_NHOST_REGION=your-nhost-region
   NHOST_ADMIN_SECRET=your-admin-secret
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` to access the interactive Workflow Builder dashboard. 

## Testing the Final Scenario

The frontend includes a **Simulate User Context** dropdown that mocks the exact final scenario requested:
- Switch to **Alice (Org A - Owner)** and hit "Run Workflow". Watch the live steps execute and pause at the Approval Gate.
- Click "Approve & Resume" to complete the run.
- Switch to **Bob (Org A - Viewer)**. Notice the "Run" button is locked. If Bob tries to approve a paused run, the action handler blocks it.
- Switch to **Charlie (Org B - Owner)**. Notice the workflows isolate cleanly.
