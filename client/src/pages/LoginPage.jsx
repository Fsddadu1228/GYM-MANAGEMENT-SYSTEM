import React, { useState } from 'react';
import { ArrowRight, CheckCircle, Dumbbell, Lock, ReceiptText, ShieldCheck, Smartphone, UserRound, WalletCards } from 'lucide-react';
import { notify } from '../utils/toast';

export default function LoginPage({ onLogin, requestAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const auth = await requestAuth('/login', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim(), password })
      });
      setStatus('success');
      window.setTimeout(() => {
        onLogin({ ...auth, rememberMe });
      }, 350);
    } catch {
      setStatus('error');
    }
  };

  return (
    <main className="login-page" aria-label="GymFitness login">
      <section className="login-shell" aria-labelledby="loginTitle">
        <aside className="login-hero-panel">
          <div className="login-hero-brand">
            <span className="login-hero-icon">
              <Dumbbell size={30} strokeWidth={2.4} />
            </span>
            <div>
              <h1 id="loginTitle">Gym<span>Fitness</span></h1>
              <p>Member Control System</p>
            </div>
          </div>

          <div className="login-hero-copy">
            <h2>Manage members, payments, and renewals from one calm dashboard.</h2>
            <p>Built for small gym operations with simple daily workflows and clean record keeping.</p>
          </div>

          <div className="login-feature-grid">
            <div>
              <WalletCards size={18} />
              <span>Payment tracking</span>
            </div>
            <div>
              <ReceiptText size={18} />
              <span>Receipts ready</span>
            </div>
            <div>
              <Smartphone size={18} />
              <span>Mobile friendly</span>
            </div>
          </div>
        </aside>

        <div className="login-card">
        <div className="login-subhead">
          <ShieldCheck size={16} />
          <span>Secure staff access</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-input-group">
            <span className="sr-only">Username or email</span>
            <UserRound size={19} />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or email"
              autoComplete="username"
              required
            />
          </label>

          <label className="login-input-group">
            <span className="sr-only">Password</span>
            <Lock size={19} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
          </label>

          <div className="login-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Keep me signed in</span>
            </label>
            <button type="button" className="login-link" onClick={() => notify('Please contact the gym admin to reset your password.', 'info')}>
              Forgot password?
            </button>
          </div>

          {status === 'error' && (
            <p className="login-error">Invalid username or password.</p>
          )}

          <button type="submit" className={`login-submit ${status === 'success' ? 'is-success' : ''}`} disabled={status === 'loading'}>
            {status === 'loading' ? (
              <>
                <span className="login-spinner" />
                Signing in...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle size={19} />
                Welcome back
              </>
            ) : (
              <>
                Access Gym
                <ArrowRight size={19} />
              </>
            )}
          </button>
        </form>
        </div>
      </section>
    </main>
  );
}
