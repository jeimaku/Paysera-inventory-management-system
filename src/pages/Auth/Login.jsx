import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/Auth/LoginForm';
import TeamModal from '../../components/Team/TeamModal';
import { sessionManager } from '../../auth/SessionManager';
import logo from '../../assets/logo.png';
import '../../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

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
    } else {
      // Show team modal automatically when page loads (and user is not authenticated)
      setIsTeamModalOpen(true);
    }
  }, [navigate]);

  const handleTeamModalOpen = () => {
    setIsTeamModalOpen(true);
  };

  const handleTeamModalClose = () => {
    setIsTeamModalOpen(false);
  };

  return (
    <>
      <div className="login-page">
        <div className="login-left">
          <LoginForm />
          
          {/* Team Credits Button */}
          <div className="team-credits-section">
            <button
              onClick={handleTeamModalOpen}
              className="team-credits-button"
              type="button"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                className="team-icon"
              >
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8c-.8 0-1.54.5-1.85 1.26l-1.92 5.76A2 2 0 0 0 16.67 18H20zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zm1.5 1h-2c-1.1 0-2 .9-2 2v7h6v-7c0-1.1-.9-2-2-2zM6 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm1.85 6.26c.31-.76 1.05-1.26 1.85-1.26.93 0 1.73.64 1.96 1.37L14.2 15H12v7H4v-6h2.5l1.35-5.74z"/>
              </svg>
              Know more about us
            </button>
          </div>
        </div>

        <div className="login-right">
          <img
            src={logo}
            alt="Paysera"
            className="paysera-logo"
          />
        </div>
      </div>

      {/* Team Modal */}
      <TeamModal 
        isOpen={isTeamModalOpen} 
        onClose={handleTeamModalClose} 
      />
    </>
  );
}