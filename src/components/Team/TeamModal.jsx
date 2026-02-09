// /components/Team/TeamModal.jsx

import React, { useEffect } from 'react';
import TeamProfileCard from './TeamProfileCard';
import { teamMembers } from './teamData';
import '../../styles/teamModal.css';

const TeamModal = ({ isOpen, onClose }) => {
  
  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="team-modal-overlay" onClick={handleBackdropClick}>
      <div className="team-modal" role="dialog" aria-modal="true" aria-labelledby="team-modal-title">
        <div className="team-modal-header">
          <button
            className="team-modal-close"
            onClick={onClose}
            aria-label="Close team modal"
            title="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          
          <h2 id="team-modal-title" className="team-modal-title">
            Meet Our Development Team
          </h2>
          <p className="team-modal-subtitle">
            The Intern Students who built Paysera's Inventory management system
          </p>
        </div>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <TeamProfileCard key={member.id} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamModal;