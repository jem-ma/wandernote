import { useState } from 'react';
import { supabase } from './supabase';

const BRAND = '#5DD9C1';

export default function Login() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [msg, setMsg] = useState('');

  const send = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) { setStatus('error'); setMsg(error.message); return; }
    setStatus('sent');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Wandernote</h1>
        <p className="text-sm text-black/50 mt-1 mb-8">Your travel memory companion</p>

        {status === 'sent' ? (
          <div className="bg-white rounded-2xl p-5 shadow-soft">
            <div className="text-sm font-medium mb-1">Check your email</div>
            <div className="text-sm text-black/60">We sent a magic link to {email}. Click it to sign in.</div>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full bg-white px-5 py-3 shadow-soft outline-none focus:ring-2 focus:ring-black/10"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-3 rounded-full text-white font-medium disabled:opacity-60"
              style={{ background: BRAND }}
            >
              {status === 'sending' ? 'Sending…' : 'Send magic link'}
            </button>
            {status === 'error' && <div className="text-xs text-red-500">{msg}</div>}
          </form>
        )}
      </div>
    </div>
  );
}
