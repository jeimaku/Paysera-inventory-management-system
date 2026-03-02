// /components/Team/TeamProfileCard.jsx

import React from 'react';

const TeamProfileCard = ({ member }) => {
  const handleLinkClick = (e, url) => {
    e.stopPropagation(); // Prevent card click when clicking links
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="team-profile-card">
      <div className="profile-header">
        <img
          src={member.image}
          alt={member.name}
          className="profile-image"
          onError={(e) => {
            // Fallback to a placeholder if image fails to load
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=64&background=0a0aa6&color=ffffff`;
          }}
        />
        <div className="profile-info">
          <h3>{member.name}</h3>
          <p className="profile-role">{member.role}</p>
        </div>
      </div>

      <p className="profile-description">
        {member.description}
      </p>

      <div className="profile-skills">
        <div className="skills-list">
          {member.skills.map((skill, index) => (
            <span key={index} className="skill-tag">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="profile-links">
        {member.github && (
          <a
            href={member.github}
            className="profile-link"
            onClick={(e) => handleLinkClick(e, member.github)}
            title="GitHub Profile"
            aria-label={`${member.name}'s GitHub Profile`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        )}
        
        {member.linkedin && (
          <a
            href={member.linkedin}
            className="profile-link"
            onClick={(e) => handleLinkClick(e, member.linkedin)}
            title="LinkedIn Profile"
            aria-label={`${member.name}'s LinkedIn Profile`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        )}

        {/* --- NEW: PERSONAL WEBSITE LINK --- */}
        {member.website && (
          <a
            href={member.website}
            className="profile-link"
            onClick={(e) => handleLinkClick(e, member.website)}
            title="Personal Website"
            aria-label={`${member.name}'s Website`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.905 8.236h-3.461c-.24-1.68-.694-3.253-1.32-4.664 1.947.886 3.514 2.502 4.781 4.664zM12 2.146c1.118 1.447 1.968 3.258 2.422 5.257H9.578C10.032 5.404 10.882 3.593 12 2.146zm-3.344 1.426c-.626 1.411-1.08 2.984-1.32 4.664H3.875c1.267-2.162 2.834-3.778 4.781-4.664zM2.616 10.39h3.765c-.066.822-.105 1.664-.105 2.527 0 .863.039 1.705.105 2.527H2.616C2.392 14.39 2.263 13.226 2.263 12s.129-2.39.353-3.61zm1.259 6.845h3.461c.24 1.68.694 3.253 1.32 4.664-1.947-.886-3.514-2.502-4.781-4.664zm4.781 4.664c.626-1.411 1.08-2.984 1.32-4.664h4.844c-.24 1.68-.694 3.253-1.32 4.664-1.447.659-3.072 1.028-4.781 1.028s-3.334-.369-4.781-1.028zM12 21.854c-1.118-1.447-1.968-3.258-2.422-5.257h4.844c-.454 1.999-1.304 3.81-2.422 5.257zm2.76-6.669H9.24c-.066-.822-.105-1.664-.105-2.527 0-.863.039-1.705.105-2.527h5.52c.066.822.105 1.664.105 2.527 0 .863-.039 1.705-.105 2.527zm.584-6.845h3.765c.224 1.22.353 2.384.353 3.61s-.129 2.39-.353 3.61h-3.765c.066-.822.105-1.664.105-2.527 0-.863-.039-1.705-.105-2.527z"/>
            </svg>
          </a>
        )}

        {/* --- NEW: FACEBOOK LINK --- */}
        {member.facebook && (
          <a
            href={member.facebook}
            className="profile-link"
            onClick={(e) => handleLinkClick(e, member.facebook)}
            title="Facebook Profile"
            aria-label={`${member.name}'s Facebook Profile`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.675 0h-21.35C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z"/>
            </svg>
          </a>
        )}

        {/* --- NEW: INSTAGRAM LINK --- */}
        {member.instagram && (
          <a
            href={member.instagram}
            className="profile-link"
            onClick={(e) => handleLinkClick(e, member.instagram)}
            title="Instagram Profile"
            aria-label={`${member.name}'s Instagram Profile`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
        )}
        
        {member.email && (
          <a
            href={`mailto:${member.email}`}
            className="profile-link"
            onClick={(e) => handleLinkClick(e, `mailto:${member.email}`)}
            title="Send Email"
            aria-label={`Email ${member.name}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z"/>
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};

export default TeamProfileCard;