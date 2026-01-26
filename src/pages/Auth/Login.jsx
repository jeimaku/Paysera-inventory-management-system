import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/Auth/LoginForm';
import { sessionManager } from '../../auth/SessionManager';
import logo from '../../assets/logo.png';
import '../../styles/login.css';

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // If user lands on /login but has a valid session in manager, 
    // bounce them to their dashboard immediately.
    const currentRole = sessionManager.getCurrentRole();
    
    if (currentRole) {
      const routes = {
        'ADMIN': '/admin',
        'IT': '/it',
        'EMPLOYEE': '/employee'
      };
      const target = routes[currentRole] || '/admin';
      navigate(target, { replace: true });
    }
  }, [navigate]);

  return (
    <div className="login-page">
      <div className="login-left">
        <LoginForm />
      </div>

      <div className="login-right">
        {/* Logo is now standalone without the card container */}
        <img
          src={logo}
          alt="Paysera"
          className="paysera-logo"
        />
      </div>
    </div>
  );
}