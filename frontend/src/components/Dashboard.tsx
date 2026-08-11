"use client";

import { useState, useEffect } from 'react';
import { useAuthenticationStatus, useUserData } from '@nhost/nextjs';
import { gql, useQuery, useSubscription, useMutation } from '@apollo/client';
import { Workflow, OrgMember } from '../types';

import Header from './dashboard/Header';
import OrganizationSetup from './dashboard/OrganizationSetup';
import WorkflowList from './dashboard/WorkflowList';
import LiveRunViewer from './dashboard/LiveRunViewer';
import TeamSettings from './dashboard/TeamSettings';

const GET_WORKFLOWS = gql`
  query GetWorkflows {
    workflows {
      id
      name
      description
      steps(order_by: {order_index: asc}) {
        id
        type
        config
      }
    }
    org_members {
      org_id
      user_id
      role
      organization {
        name
      }
    }
  }
`;

const SUBSCRIBE_RUN = gql`
  subscription SubscribeRun($workflow_id: uuid!) {
    workflow_runs(
      where: {workflow_id: {_eq: $workflow_id}}, 
      order_by: {started_at: desc}, 
      limit: 1
    ) {
      id
      status
      step_runs(order_by: {started_at: asc}) {
        id
        step_id
        status
        output
        error
      }
    }
  }
`;

const TRIGGER_RUN = gql`
  mutation TriggerWorkflowRun($workflow_id: uuid!) {
    triggerWorkflowRun(workflow_id: $workflow_id) {
      success
      message
      run_id
    }
  }
`;

const APPROVE_STEP = gql`
  mutation ApproveStep($step_run_id: uuid!) {
    approveStep(step_run_id: $step_run_id) {
      success
      message
    }
  }
`;

export default function Dashboard() {
  const { isAuthenticated } = useAuthenticationStatus();
  const userData = useUserData();

  // Apollo queries (only run when authenticated)
  const { data: workflowsData } = useQuery(GET_WORKFLOWS, { skip: !isAuthenticated });
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  const [triggerRun] = useMutation(TRIGGER_RUN);
  const [approveStep] = useMutation(APPROVE_STEP);

  useEffect(() => {
    if (workflowsData?.workflows?.length > 0 && !activeWorkflowId) {
      setActiveWorkflowId(workflowsData.workflows[0].id);
    }
  }, [workflowsData, activeWorkflowId]);

  const { data: runData } = useSubscription(SUBSCRIBE_RUN, {
    variables: { workflow_id: activeWorkflowId },
    skip: !activeWorkflowId || !isAuthenticated,
  });

  // Derived state
  const currentMember = workflowsData?.org_members?.find((m: OrgMember) => m.user_id === userData?.id);
  const userRole = currentMember?.role;
  const orgName = currentMember?.organization?.name;
  const orgId = currentMember?.org_id;
  
  const workflows: Workflow[] = workflowsData?.workflows || [];
  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId);
  
  const latestRun = runData?.workflow_runs?.[0];
  const runStatus = latestRun?.status || 'idle';
  
  const steps = activeWorkflow?.steps || [];
  const mappedSteps = steps.map((s) => {
    const sRun = latestRun?.step_runs?.find((sr: any) => sr.step_id === s.id);
    return {
      ...s,
      status: sRun ? sRun.status : 'pending',
      stepRunId: sRun ? sRun.id : null,
      output: sRun ? sRun.output : null,
      error: sRun ? sRun.error : null,
    };
  });

  const handleRun = async () => {
    if (!activeWorkflowId) return;
    try {
      const { data } = await triggerRun({ variables: { workflow_id: activeWorkflowId } });
      if (!data?.triggerWorkflowRun?.success) {
        alert(data?.triggerWorkflowRun?.message || 'Trigger failed');
      }
    } catch(e: any) { 
      console.error(e); 
      alert(e.message || 'Error triggering run'); 
    }
  };

  const handleApprove = async () => {
    const pausedStep = mappedSteps.find((s) => s.status === 'paused');
    if (!pausedStep || !pausedStep.stepRunId) return;
    try {
      const { data } = await approveStep({ variables: { step_run_id: pausedStep.stepRunId } });
      if (!data?.approveStep?.success) {
        alert(data?.approveStep?.message || 'Approve failed');
      }
    } catch(e: any) { 
      console.error(e); 
      alert(e.message || 'Error approving step'); 
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col gap-8">
      <Header 
        userData={userData as any} 
        orgName={orgName} 
        userRole={userRole} 
      />

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {workflowsData && workflowsData.org_members?.length === 0 ? (
            <OrganizationSetup userData={userData as any} />
          ) : (
            <WorkflowList 
              workflows={workflows}
              activeWorkflowId={activeWorkflowId}
              setActiveWorkflowId={setActiveWorkflowId}
              userRole={userRole}
              runStatus={runStatus}
              handleRun={handleRun}
              mappedSteps={mappedSteps}
              isAuthenticated={isAuthenticated}
            />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <LiveRunViewer 
            runStatus={runStatus}
            mappedSteps={mappedSteps}
            handleApprove={handleApprove}
          />
        </div>
      </div>

      <TeamSettings 
        userRole={userRole}
        orgId={orgId}
        orgName={orgName}
        currentUserId={userData?.id}
      />
    </div>
  );
}
