import WorkflowEditor from '../../../components/WorkflowEditor';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateWorkflowPage() {
  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors self-start"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <WorkflowEditor />
      </div>
    </div>
  );
}
