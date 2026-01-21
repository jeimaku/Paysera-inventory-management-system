import { useState } from 'react';
import { supabase } from '../../supabase/client';
import { getUserRole } from '../../auth/getUserRole';
import { useNavigate } from 'react-router-dom';

export default function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      setError('Invalid login credentials');
      setLoading(false);
      return;
    }

    const role = await getUserRole(data.user.email);

    if (!role) {
      setError('Account role not found');
      setLoading(false);
      return;
    }

    // 🔐 ROLE-BASED REDIRECT
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'IT') navigate('/it');
    else navigate('/employee');

    setLoading(false);
  };

  return (
    <form className="login-card" onSubmit={handleLogin}>
      <div className="login-icon"></div>
      
      <h2>Inventory Management System</h2>

      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <button 
        type="submit" 
        className={`login-button ${loading ? 'loading' : ''}`}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="loading-spinner"></span>
            <span className="loading-text">Signing in...</span>
          </>
        ) : (
          'Sign In'
        )}
      </button>
    </form>
  );
}