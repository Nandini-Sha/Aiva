import WorkflowEditor from '@/components/WorkflowEditor';

export default function CreateWorkflowPage() {
  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <WorkflowEditor />
      </div>
    </div>
  );
}
