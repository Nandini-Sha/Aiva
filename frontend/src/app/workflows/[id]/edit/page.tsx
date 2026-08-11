"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { gql, useQuery } from '@apollo/client';
import WorkflowEditor from '../../../../components/WorkflowEditor';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

const GET_WORKFLOW = gql`
  query GetWorkflow($id: uuid!) {
    workflows_by_pk(id: $id) {
      id
      name
      description
      steps(order_by: { order_index: asc }) {
        id
        type
        config
        order_index
      }
    }
  }
`;

export default function EditWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data, loading, error } = useQuery(GET_WORKFLOW, {
    variables: { id },
    skip: !id,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  if (error || !data?.workflows_by_pk) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Workflow not found</h1>
        <Link href="/" className="text-pink-500 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  const workflow = data.workflows_by_pk;
  const initialWorkflow = {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    steps: workflow.steps.map((s: any) => ({ type: s.type, config: s.config }))
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors self-start"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <WorkflowEditor initialWorkflow={initialWorkflow} />
      </div>
    </div>
  );
}
