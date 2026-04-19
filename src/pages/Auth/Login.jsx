import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react'; // Using Lucide icon for the bottom button
import LoginForm from '../../components/Auth/LoginForm';
import TeamModal from '../../components/Team/TeamModal';
import { sessionManager } from '../../auth/SessionManager';
import '../../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  useEffect(() => {
    const currentRole = sessionManager.getCurrentRole();
    
    if (currentRole) {
      const routes = {
        'ADMIN': '/admin',
        'IT': '/it',
        'EMPLOYEE': '/employee',
        'HR': '/hr'
      };
      const target = routes[currentRole] || '/admin';
      navigate(target, { replace: true });
    } else {
      setIsTeamModalOpen(true);
    }
  }, [navigate]);

  return (
    <div className="login-container">
      
      {/* The main white card is now handled entirely inside LoginForm */}
      <LoginForm />
      
      {/* Floating Pill Button Below the Card */}
      <button
        onClick={() => setIsTeamModalOpen(true)}
        className="team-credits-pill"
        type="button"
      >
        <Users size={18} />
        <span>Know more about us</span>
      </button>

      {/* Team Modal */}
      <TeamModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)} 
      />
    </div>
  );
}