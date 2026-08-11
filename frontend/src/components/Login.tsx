"use client";

import { useState } from 'react';
import { useSignInEmailPassword, useSignUpEmailPassword } from '@nhost/nextjs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [setupError, setSetupError] = useState('');
  
  const { signInEmailPassword, isLoading: isSigningIn, isError: isSignInError, error: signInError } = useSignInEmailPassword();
  const { signUpEmailPassword, isLoading: isSigningUp, isError: isSignUpError, error: signUpError } = useSignUpEmailPassword();

  const isLoading = isSigningIn || isSigningUp;
  const isError = isSignInError || isSignUpError || !!setupError;
  const errorMessage = signInError?.message || signUpError?.message || setupError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');

    if (isSignUp) {
      try {
        if (orgName) {
          localStorage.setItem('pendingOrgName', orgName);
        }
        const result = await signUpEmailPassword(email, password);
        if ((result as any)?.isError) {
           setSetupError((result as any)?.error?.message || 'Signup failed');
           localStorage.removeItem('pendingOrgName');
        }
      } catch (err: any) {
        setSetupError('Signup failed. Please try again.');
        localStorage.removeItem('pendingOrgName');
      }
    } else {
      await signInEmailPassword(email, password);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md p-8 sm:p-10 bg-white/80 backdrop-blur-2xl border border-stone-200 rounded-[2rem] shadow-2xl shadow-pink-500/5 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-stone-900 mb-2 font-heading tracking-tight">
            {isSignUp ? 'Create account' : 'Welcome back'}
          </h2>
          <p className="text-stone-500 mb-8 text-sm">
            {isSignUp ? 'Sign up to start orchestrating AI workflows.' : 'Sign in to orchestrate your AI workflows.'}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-stone-700">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all placeholder:text-stone-400"
                required
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-stone-700">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all placeholder:text-stone-400"
                required
                minLength={isSignUp ? 9 : undefined}
              />
              {isSignUp && <p className="text-xs text-stone-400">Minimum 9 characters</p>}
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-stone-700">Organization Name</label>
                <input 
                  type="text" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="My Company"
                  className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500 transition-all placeholder:text-stone-400"
                  required={isSignUp}
                />
                <p className="text-xs text-stone-400">You'll be the owner of this organization</p>
              </div>
            )}

            {isError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {errorMessage}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-pink-500 hover:from-yellow-300 hover:via-amber-300 hover:to-pink-400 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/25 active:scale-[0.98]"
            >
              {isLoading ? (isSignUp ? 'Creating account...' : 'Authenticating...') : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-stone-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setEmail(''); setPassword(''); setOrgName(''); setSetupError(''); }}
              className="text-pink-500 hover:text-pink-400 font-medium transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>


        </div>
      </div>
    </div>
  );
}
