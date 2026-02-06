import { useState, useEffect, useRef } from 'react'; // ✅ FIXED: Missing React hooks
import { useSafeNavigate } from '../routing';
import { adminVerify, adminLogout } from '../api';

/**
 * Hook zur Verwaltung der Admin-Authentifizierung
 * Prüft automatisch die Session und leitet zu /sys-mgmt-xK9/login um, wenn nicht authentifiziert
 * 🔒 SECURITY: Auto-logout nach 30 Minuten Inaktivität
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 Minuten in Millisekunden
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Prüfe jede Minute

export function useAdminAuth() {
  const navigate = useSafeNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAuth();
    setupActivityMonitoring();
    
    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, []);

  // 🔒 SECURITY: Monitor user activity and auto-logout on inactivity
  const setupActivityMonitoring = () => {
    // Update last activity on user interaction
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      localStorage.setItem('admin_last_activity', String(Date.now()));
    };

    // Listen to user events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Check for inactivity every minute
    activityTimerRef.current = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem('admin_last_activity') || '0');
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity > SESSION_TIMEOUT && isAuthenticated) {
        console.warn('🔒 Session timeout due to inactivity');
        logout(true); // Pass true to indicate auto-logout
      }
    }, ACTIVITY_CHECK_INTERVAL);

    // Set initial activity timestamp
    updateActivity();
  };

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('admin_token');
    
    console.log('🔍 Checking auth... Token exists:', !!storedToken);
    
    if (!storedToken) {
      console.warn('❌ No token found, redirecting to login');
      setIsAuthenticated(false);
      setIsLoading(false);
      navigate('/sys-mgmt-xK9/login');
      return;
    }

    // Verify token with backend
    console.log('🔍 Verifying token with backend...');
    const isValid = await adminVerify(storedToken);
    console.log('🔍 Token verification result:', isValid);
    
    if (isValid) {
      console.log('✅ Token valid, user authenticated');
      setIsAuthenticated(true);
      setToken(storedToken);
    } else {
      // Token is invalid or expired
      console.error('❌ Token invalid or expired, clearing localStorage');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_last_activity');
      setIsAuthenticated(false);
      navigate('/sys-mgmt-xK9/login');
    }
    
    setIsLoading(false);
  };

  const logout = async (autoLogout: boolean = false) => {
    if (token) {
      await adminLogout(token);
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_last_activity');
    setIsAuthenticated(false);
    setToken(null);
    navigate('/sys-mgmt-xK9/login' + (autoLogout ? '?reason=timeout' : ''));
  };

  return {
    isAuthenticated,
    isLoading,
    token,
    logout,
    checkAuth
  };
}