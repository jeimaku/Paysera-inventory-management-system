import { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { getUserRole } from '../../auth/getUserRole';
import { sessionManager } from '../../auth/SessionManager';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png'; 

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // NEW: State to toggle the forgot password message
  const [showForgotMsg, setShowForgotMsg] = useState(false);

  useEffect(() => {
    if (sessionManager.isValid()) {
       const role = sessionManager.getCurrentRole();
       const routes = { 'ADMIN': '/admin', 'IT': '/it', 'HR': '/hr', 'EMPLOYEE': '/employee' };
       if (routes[role]) navigate(routes[role], { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (authError) throw authError;

      const role = await getUserRole(data.user.email);
      if (!role) throw new Error('Role not found for user');

      const sessionResult = sessionManager.initializeSession(data.user.email, role);
      if (!sessionResult.success) throw new Error(sessionResult.error);

      setTimeout(() => {
        const routes = {
          'ADMIN': '/admin',
          'IT': '/it',
          'HR': '/hr',
          'EMPLOYEE': '/employee'
        };
        navigate(routes[role] || '/login', { replace: true }); 
      }, 500);
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid login credentials'); 
      sessionManager.clearSession(); 
      await supabase.auth.signOut();
      setLoading(false); 
    }
  };

  return (
    <div className="modern-login-card">
      <img src={logo} alt="Paysera Logo" className="login-logo" />
      <h2 className="login-title">Inventory System</h2>

      <form className="login-form-wrapper" onSubmit={handleLogin}>
        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="hr@paysera.com"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '8px' }}>
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

        {/* --- NEW: Forgot Password Link --- */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button 
            type="button" 
            onClick={() => setShowForgotMsg(!showForgotMsg)}
            style={{ 
              background: 'none', border: 'none', color: '#0ea5e9', 
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* --- NEW: Forgot Password Alert Box --- */}
        {showForgotMsg && (
          <div style={{ 
            background: '#f0fdfa', border: '1px solid #ccfbf1', color: '#0f766e', 
            padding: '12px', borderRadius: '8px', fontSize: '12px', 
            textAlign: 'center', marginBottom: '12px', animation: 'slideUp 0.3s ease' 
          }}>
            Please contact your <strong>IT Administrator</strong> to request a secure password reset for your account.
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="login-submit-btn" disabled={loading}>
          {loading ? (
            <><span className="loading-spinner"></span> Signing in...</>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
}