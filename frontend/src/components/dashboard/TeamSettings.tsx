import { useState, useEffect } from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { OrgMember } from '../../types';

interface TeamSettingsProps {
  userRole?: string;
  orgId?: string;
  orgName?: string;
  currentUserId?: string;
}

export default function TeamSettings({
  userRole,
  orgId,
  orgName,
  currentUserId
}: TeamSettingsProps) {
  const [members, setMembers] = useState<OrgMember[]>([]);

  useEffect(() => {
    if (orgId && userRole === 'owner') {
      fetch(`/api/org/members?orgId=${orgId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setMembers(data.members);
        });
    }
  }, [orgId, userRole]);

  if (userRole !== 'owner') return null;

  return (
    <div className="mt-4 border-t border-stone-200/50 pt-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-xl border border-pink-200">
            <Users className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-stone-900">Team Settings</h2>
            <p className="text-sm text-stone-500">Manage your organization's members.</p>
          </div>
        </div>
        <button
          onClick={async () => {
            const confirmOrg = prompt('DANGER: Deleting your organization will remove all workflows and members. Type your org name to confirm:');
            if (confirmOrg === orgName) {
              const res = await fetch('/api/org/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orgId })
              });
              if (res.ok) window.location.reload();
              else alert('Failed to delete organization');
            } else if (confirmOrg !== null) {
              alert('Organization name did not match.');
            }
          }}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-semibold transition-colors"
        >
          Delete Organization
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel rounded-3xl p-6 bg-white/50 h-fit">
          <h3 className="text-lg font-bold text-stone-900 mb-4 font-heading">Invite Member</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const email = (form.elements.namedItem('inviteEmail') as HTMLInputElement).value;
              const password = (form.elements.namedItem('invitePassword') as HTMLInputElement).value;
              const role = (form.elements.namedItem('inviteRole') as HTMLSelectElement).value;
              const btn = form.elements.namedItem('inviteBtn') as HTMLButtonElement;
              
              if (!orgId) return alert("Organization ID not found");
              if (password.length < 9) return alert("Password must be at least 9 characters");
              
              btn.disabled = true;
              btn.textContent = 'Inviting...';
              
              try {
                const res = await fetch('/api/org/invite', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password, role, orgId })
                });
                const data = await res.json();
                if (data.success) {
                  alert('User invited successfully!');
                  form.reset();
                  // Refresh members
                  fetch(`/api/org/members?orgId=${orgId}`)
                    .then(r => r.json())
                    .then(d => { if(d.success) setMembers(d.members) });
                } else {
                  alert('Error: ' + data.message);
                }
              } catch (err) {
                alert('Error inviting user');
              } finally {
                btn.disabled = false;
                btn.textContent = 'Invite Member';
              }
            }}
            className="flex flex-col gap-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Email Address</label>
              <input
                name="inviteEmail"
                type="email"
                required
                placeholder="teammate@example.com"
                className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Initial Password</label>
              <input
                name="invitePassword"
                type="text"
                required
                placeholder="Min 9 characters"
                className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">Role</label>
              <select
                name="inviteRole"
                className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all shadow-sm cursor-pointer"
              >
                <option value="viewer">Viewer (Read Only)</option>
                <option value="editor">Editor (Can edit & run workflows)</option>
                <option value="owner">Owner (Full Admin Access)</option>
              </select>
            </div>
            <div className="pt-2">
              <button name="inviteBtn" type="submit" className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-xl transition-all shadow-md">
                <Plus className="w-4 h-4" /> Send Invite
              </button>
            </div>
          </form>
        </div>

        <div className="glass-panel rounded-3xl p-6 bg-white/50 h-fit">
          <h3 className="text-lg font-bold text-stone-900 mb-4 font-heading">Current Members</h3>
          {members.length > 0 ? (
            <div className="flex flex-col gap-3">
              {members.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-stone-900">{member.email}</span>
                    <span className="text-xs text-stone-500 capitalize">{member.role}</span>
                  </div>
                  {member.user_id !== currentUserId && (
                    <button 
                      onClick={async () => {
                        if (confirm(`Remove ${member.email} from the organization?`)) {
                          const res = await fetch('/api/org/members/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orgId, userId: member.user_id })
                          });
                          if (res.ok) {
                            setMembers(prev => prev.filter(m => m.user_id !== member.user_id));
                          } else {
                            alert('Failed to remove member');
                          }
                        }
                      }}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-stone-500 p-4 bg-stone-50 rounded-xl border border-stone-200">
              Loading members...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
