import { Key } from 'lucide-react';
import { useSignOut, useChangePassword } from '@nhost/nextjs';
import { UserData } from '../../types';

interface HeaderProps {
  userData: UserData | null;
  orgName?: string;
  userRole?: string;
}

export default function Header({ userData, orgName, userRole }: HeaderProps) {
  const { signOut } = useSignOut();
  const { changePassword } = useChangePassword();

  return (
    <div className="glass-panel p-5 rounded-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-pink-100 rounded-lg border border-pink-200">
              <Key className="w-5 h-5 text-pink-500" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
              <span className="text-sm font-medium text-stone-600">
                Logged in as <strong className="text-stone-900 text-base ml-1">{userData?.displayName || userData?.email}</strong>
              </span>
              {orgName && (
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-bold rounded-lg tracking-wide uppercase inline-flex self-start">
                    {orgName}
                  </span>
                  <span className="px-2.5 py-1 bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold rounded-lg tracking-wide uppercase inline-flex self-start">
                    {userRole}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-stone-500">
            Manage your workflows and view real-time execution status below.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              const newPass = prompt("Enter your new password (min 9 chars):");
              if (newPass && newPass.length >= 9) {
                const { isError, error } = await changePassword(newPass);
                if (isError) alert("Error changing password: " + error?.message);
                else alert("Password successfully updated!");
              } else if (newPass) {
                alert("Password must be at least 9 characters long.");
              }
            }} 
            className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600 transition-colors shadow-sm"
          >
            Change Password
          </button>
          <button onClick={() => signOut()} className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-600 transition-colors shadow-sm">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
