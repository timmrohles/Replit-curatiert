import { useState, useEffect } from 'react';
import { useSafeNavigate } from '../../utils/routing';
import { Lock } from 'lucide-react';

export function AdminLogin() {
  const [status, setStatus] = useState<'checking' | 'redirecting'>('checking');
  const navigate = useSafeNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/user', { credentials: 'include' });
        if (res.ok) {
          const user = await res.json();
          if (user && (user.role === 'admin' || user.role === 'super_admin')) {
            navigate('/sys-mgmt-xK9/content-manager');
            return;
          }
        }
      } catch {
      }
      setStatus('redirecting');
      window.location.href = '/api/login?returnTo=/sys-mgmt-xK9/content-manager';
    };
    checkSession();
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-admin-gradient"
      data-testid="admin-login-page"
    >
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-coral">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1
              className="text-3xl mb-2 font-headline text-[#1a1a2e]"
              data-testid="text-login-title"
            >
              Admin Login
            </h1>
            <p className="text-gray-500 text-sm">
              {status === 'checking' ? 'Session wird geprüft...' : 'Weiterleitung zum Login...'}
            </p>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="link-back-home"
            >
              Zurueck zur Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
