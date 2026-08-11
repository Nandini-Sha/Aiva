import { Users } from 'lucide-react';
import { UserData } from '../../types';

interface OrganizationSetupProps {
  userData: UserData | null;
}

export default function OrganizationSetup({ userData }: OrganizationSetupProps) {
  const handleCreateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const input = form.elements.namedItem('orgName') as HTMLInputElement;
    const btn = form.elements.namedItem('submitBtn') as HTMLButtonElement;
    if (!input.value) return;
    
    btn.disabled = true;
    btn.textContent = 'Creating...';
    try {
      const res = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData?.id, orgName: input.value })
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to create organization');
        btn.disabled = false;
        btn.textContent = 'Create Organization';
      }
    } catch (err) {
      alert('Error creating organization');
      btn.disabled = false;
      btn.textContent = 'Create Organization';
    }
  };

  return (
    <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center text-center gap-4 border border-yellow-200">
      <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
        <Users className="w-8 h-8 text-yellow-500" />
      </div>
      <h3 className="text-2xl font-bold text-stone-900 font-heading">You need an Organization</h3>
      <p className="text-stone-500 max-w-md">
        To create and run workflows, you must belong to an organization. Create one below to get started as an owner.
      </p>
      <form 
        className="w-full max-w-sm mt-4 flex flex-col gap-3"
        onSubmit={handleCreateOrg}
      >
        <input 
          name="orgName"
          type="text" 
          required
          placeholder="My Company Name" 
          className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
        />
        <button name="submitBtn" type="submit" className="w-full bg-gradient-to-r from-yellow-400 to-pink-500 hover:from-yellow-300 hover:to-pink-400 text-white font-semibold py-3 rounded-xl transition-all shadow-md">
          Create Organization
        </button>
      </form>
    </div>
  );
}
