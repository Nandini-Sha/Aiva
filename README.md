# Aiva - AI Agent Workflow Builder

A full-stack application for building, running, and managing AI agent workflows. Built with Next.js, Nhost (PostgreSQL + Hasura + GraphQL), and TailwindCSS.

## Live Demo
**Deployed URL:** [Your Vercel URL here]

## Features
- **Visual Workflow Builder:** Chain together LLM calls, HTTP requests, conditional branches, and approval gates.
- **Real-time Execution Tracking:** Watch your workflows execute step-by-step with live GraphQL subscriptions.
- **Strict Role-based Access Control (RBAC):** Two-layer security ensuring data isolation between organizations and role-based permissions (Owner, Editor, Viewer) within them.
- **Approval Gates:** Pause workflows mid-execution for human review and approval.
- **Event-driven Triggers:** Trigger workflows manually, via scheduled cron jobs, or inbound webhooks.

## Tech Stack
- **Frontend:** Next.js 14, React, TailwindCSS, Apollo GraphQL Client
- **Backend:** Nhost (Hasura GraphQL Engine, PostgreSQL, Serverless Functions)
- **AI Integration:** Groq API (Llama 3) for fast LLM inference.

## Local Setup Instructions

### Prerequisites
- Node.js (v18+)
- Nhost CLI installed (`npm install -g nhost-cli`)
- Docker (required for running Nhost locally)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Aiva
```

### 2. Start the local Nhost backend
Ensure Docker is running, then start the Nhost local environment:
```bash
nhost up
```
This will spin up Postgres, Hasura, and the Auth/Storage services. It will also automatically apply all database migrations and Hasura metadata to configure the schema and permissions.

### 3. Setup Frontend Environment Variables
Navigate to the `frontend` directory and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
# Nhost local environment variables
NEXT_PUBLIC_NHOST_SUBDOMAIN=local
NEXT_PUBLIC_NHOST_REGION=

# Hasura Admin Secret for local backend execution
HASURA_GRAPHQL_ADMIN_SECRET=nhost-admin-secret

# Nhost GraphQL URL for the serverless functions
NHOST_GRAPHQL_URL=http://localhost:1337/v1/graphql

# LLM API Configuration
LLM_API_KEY=your_groq_or_openai_api_key
LLM_BASE_URL=https://api.groq.com/openai/v1/chat/completions
LLM_MODEL=llama-3.1-8b-instant
```

*Note: If you do not provide an `LLM_API_KEY`, the `llm_call` steps will fail during execution.*

### 4. Run the Development Server
```bash
npm run dev
```
The frontend will be available at `http://localhost:3000`.

## Submission Details
Please refer to `WRITEUP.md` for a detailed architectural breakdown regarding schema design, the two-layer permission system, and the implementation of the approval gate logic.

<!-- 
# Aiva – AI Agent Workflow Builder

A role-based AI workflow automation platform where organizations can build, trigger, and manage AI agent steps in real time — built with Next.js, Nhost, Hasura, and PostgreSQL.

**?? Live Demo:** [Your Vercel URL here]

---

## ?? Tech Stack
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![Nhost](https://img.shields.io/badge/Nhost-blue?logo=nhost)
![Hasura](https://img.shields.io/badge/Hasura-GraphQL-purple?logo=hasura)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-blue?logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-teal?logo=tailwind-css)

- **Frontend**: React, Next.js (App Router), TailwindCSS, Apollo Client
- **Backend**: Nhost (Hasura GraphQL Engine, PostgreSQL, Serverless Functions)
- **Database**: PostgreSQL (via Nhost)
- **AI Integration**: Groq API (Llama 3) for LLM steps

---

## ?? Features

### ?? Organization & Role Management
- Register and login with Nhost Auth
- Multi-tenant organization structure with usage quotas
- 3-tier Role-Based Access Control (Owner, Editor, Viewer)
- Strict cross-org data isolation

### ?? Workflow Builder
- Build workflows with diverse step types (LLM, HTTP, Branching)
- Implement Approval Gates for human-in-the-loop validation
- Trigger workflows manually, via Webhook, or Database Events

### ?? Execution Engine
- Real-time step-by-step UI updates via GraphQL Subscriptions
- Mid-execution pause/resume state management
- Clean glassmorphism UI with responsive design

---

## ?? Folder Structure
\\\
aiva/
+-- frontend/
¦ +-- src/
¦ ¦ +-- app/
¦ ¦ ¦ +-- api/ (Serverless Functions / Hasura Actions)
¦ ¦ ¦ +-- workflows/
¦ ¦ ¦ +-- page.tsx
¦ ¦ ¦ +-- layout.tsx
¦ ¦ +-- components/
¦ ¦ ¦ +-- dashboard/
¦ ¦ ¦ ¦ +-- Header.tsx
¦ ¦ ¦ ¦ +-- LiveRunViewer.tsx
¦ ¦ ¦ ¦ +-- OrganizationSetup.tsx
¦ ¦ ¦ ¦ +-- TeamSettings.tsx
¦ ¦ ¦ ¦ +-- WorkflowList.tsx
¦ ¦ ¦ +-- Dashboard.tsx
¦ ¦ ¦ +-- WorkflowEditor.tsx
¦ ¦ +-- lib/
¦ ¦ ¦ +-- engine/ (Execution Strategy Handlers)
¦ ¦ ¦ +-- graphql/
¦ ¦ +-- types/
¦ +-- .env.local
¦ +-- package.json
¦ +-- tailwind.config.ts
¦
+-- nhost/
¦ +-- metadata/ (Hasura Permissions & Actions)
¦ +-- migrations/ (PostgreSQL Schema)
¦ +-- config.toml
¦
+-- WRITEUP.md
+-- README.md
\\\

---

## ??? Setup Instructions

### ?? Backend (Nhost)

\\\ash
# Start local Nhost environment (requires Docker)
nhost up
\\\
*This automatically applies migrations and Hasura metadata.*

### ?? Frontend

\\\ash
cd frontend
npm install
npm run dev
\\\

Make sure you have a \.env.local\ file in your \rontend\ folder with:
\\\env
NEXT_PUBLIC_NHOST_SUBDOMAIN=local
NEXT_PUBLIC_NHOST_REGION=
HASURA_GRAPHQL_ADMIN_SECRET=nhost-admin-secret
NHOST_GRAPHQL_URL=http://localhost:1337/v1/graphql
LLM_API_KEY=your_groq_or_openai_api_key
LLM_BASE_URL=https://api.groq.com/openai/v1/chat/completions
LLM_MODEL=llama-3.1-8b-instant
\\\

---

## ?? UI / UX Designs

A quick visual walkthrough of **Aiva**, showcasing key screens and user flows.

### ?? Dashboard & ?? Authentication
| Dashboard | Auth/Login |
|------------|------------|
| ![Dashboard](./public/dashboard.png) | ![Login Page](./public/login.png) |

---

### ?? Workflow Building
| Editor | Approval Gates |
|------------------|------------|
| ![Workflow Editor](./public/editor.png) | ![Approval Flow](./public/approval.png) |


---

## ?? Future Enhancements
- Expand LLM integrations (OpenAI, Gemini, Anthropic)
- Add more pre-built trigger types (Slack, Discord, Email)
- Introduce workflow templates and sharing
- Advanced usage analytics dashboard
  
## ???? Author
- **Nandini** – [GitHub Profile](https://github.com/Nandini-Sha)
  
## ?? License
This project is licensed under the [MIT License](LICENSE).
-->
