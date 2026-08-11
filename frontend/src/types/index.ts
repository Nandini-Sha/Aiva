export interface UserData {
  id: string;
  email: string;
  displayName?: string;
}

export interface Organization {
  id: string;
  name: string;
  quota_used: number;
}

export interface OrgMember {
  org_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  organization?: Organization;
  email?: string; // Appended by API sometimes
}

export interface StepConfig {
  prompt?: string;
  system_prompt?: string;
  model?: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  message?: string;
  condition_variable?: string;
  keyword?: string;
  operator?: string;
  if_true?: string;
  if_false?: string;
  [key: string]: any;
}

export interface WorkflowStep {
  id: string;
  type: string;
  config?: StepConfig;
  order_index: number;
  status?: string;
  stepRunId?: string | null;
  output?: any;
  error?: any;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface StepRun {
  id: string;
  step_id: string;
  status: string;
  output?: any;
  error?: any;
}

export interface WorkflowRun {
  id: string;
  status: string;
  step_runs: StepRun[];
}

export interface GraphQLWorkflowsResponse {
  workflows: Workflow[];
  org_members: OrgMember[];
}
