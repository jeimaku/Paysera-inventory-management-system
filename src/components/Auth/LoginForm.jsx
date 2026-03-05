import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { getUserRole } from '../../auth/getUserRole';
import { sessionManager } from '../../auth/SessionManager';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (sessionManager.isValid()) {
       const role = sessionManager.getCurrentRole();
       // NEW: Added 'HR': '/hr' to the routes object
       const routes = { 'ADMIN': '/admin', 'IT': '/it', 'HR': '/hr', 'EMPLOYEE': '/employee' };
       if (routes[role]) navigate(routes[role], { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (authError) throw authError;

      // 2. Get User Role
      const role = await getUserRole(data.user.email);
      if (!role) throw new Error('Role not found for user');

      // 3. Initialize Session Manager
      const sessionResult = sessionManager.initializeSession(data.user.email, role);
      if (!sessionResult.success) throw new Error(sessionResult.error);

      console.log(`✅ Login success: ${role}`);

      // 4. Redirect based on role
      setTimeout(() => {
        const routes = {
          'ADMIN': '/admin',
          'IT': '/it',
          'HR': '/hr',             // <-- Added HR here!
          'EMPLOYEE': '/employee'
        };
        // Changed fallback to /login just in case a role is missing
        navigate(routes[role] || '/login', { replace: true }); 
      }, 500);
      
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      sessionManager.clearSession(); // Clean up if failed
      await supabase.auth.signOut();
      setLoading(false); 
    }
  };

  return (
    <form className="login-card" onSubmit={handleLogin}>
      {/* Icon removed as requested */}
      <h2>Inventory System</h2>

      <div className="form-group">
        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="Enter your email"
        />
      </div>

      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          placeholder="Enter your password"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className={`login-button ${loading ? 'loading' : ''}`} disabled={loading}>
        {loading ? (
          <>
            <div className="loading-spinner"></div>
            <span>Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}