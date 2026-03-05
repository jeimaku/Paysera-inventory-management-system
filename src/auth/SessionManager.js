// auth/SessionManager.js

class SessionManager {
  constructor() {
    this.storageKey = 'inventory_session';
  }

  // ✅ THIS WAS MISSING
  isValid() {
    const session = this.getSession();
    return !!(session && session.email && session.role && !this.isExpired(session));
  }

  initializeSession(email, role) {
    if (!email || !role) {
      return { success: false, error: 'Invalid session data' };
    }

    const sessionData = {
      email: email,
      role: role,
      timestamp: Date.now(),
      // Set expiration to 24 hours (in milliseconds)
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) 
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
      return { success: true };
    } catch (error) {
      console.error('Session storage error:', error);
      return { success: false, error: 'Failed to save session' };
    }
  }

  getSession() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  clearSession() {
    localStorage.removeItem(this.storageKey);
  }

  validateSession(requiredRole = null) {
    const session = this.getSession();

    if (!session) {
      return { valid: false, error: 'No active session found. Please log in.' };
    }

    if (this.isExpired(session)) {
      this.clearSession();
      return { valid: false, error: 'Session expired. Please log in again.' };
    }

    if (requiredRole && session.role !== requiredRole) {
      return { 
        valid: false, 
        error: `Access denied. Required role: ${requiredRole}`,
        role: session.role
      };
    }

    return { valid: true, role: session.role, email: session.email };
  }

  isExpired(session) {
    if (!session.expiresAt) return true;
    return Date.now() > session.expiresAt;
  }

  getCurrentRole() {
    const session = this.getSession();
    return session ? session.role : null;
  }

  getCurrentEmail() {
    const session = this.getSession();
    return session ? session.email : null;
  }

  // Centralized Route Access Logic
  hasRouteAccess(path, role) {
    if (!role) return false;

    // Define allowed prefixes for each role
    const allowedRoutes = {
      'ADMIN': ['/admin'],
      'IT': ['/it'],
      'HR': ['/hr'],
      'EMPLOYEE': ['/employee']
    };

    const allowedPrefixes = allowedRoutes[role] || [];
    
    // Check if the current path starts with any allowed prefix
    return allowedPrefixes.some(prefix => path.startsWith(prefix));
  }
  
  // Debug helper
  getSessionInfo() {
    return this.getSession() || 'No active session';
  }
}

export const sessionManager = new SessionManager();