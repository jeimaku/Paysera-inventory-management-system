/**
 * Supabase Data Security & Validation Library
 * 
 * This library provides comprehensive security measures for all Supabase operations:
 * - Input sanitization and validation
 * - SQL injection prevention 
 * - XSS protection
 * - Rate limiting
 * - Role-based access control
 * - Audit logging
 * - Data encryption helpers
 */

import { supabase } from '../supabase/client';

// ==================== SECURITY CONSTANTS ====================
const SECURITY_CONFIG = {
  MAX_STRING_LENGTH: 1000,
  MAX_SEARCH_LENGTH: 100,
  MAX_REQUEST_SIZE: 10000, // bytes
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  MAX_REQUESTS_PER_WINDOW: 100,
  SENSITIVE_FIELDS: ['password', 'email', 'employee_code', 'serial_number'],
  ALLOWED_ROLES: ['ADMIN', 'IT', 'EMPLOYEE'],
  AUDIT_ENABLED: true
};

// In-memory rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();

// ==================== INPUT VALIDATION & SANITIZATION ====================

/**
 * Sanitizes and validates user input to prevent injection attacks
 */
export class DataValidator {
  
  /**
   * Sanitizes string input by removing/escaping dangerous characters
   */
  static sanitizeString(input) {
    if (!input || typeof input !== 'string') return null;
    
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>"']/g, (match) => { // Escape HTML entities
        const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
        return entities[match] || match;
      })
      .slice(0, SECURITY_CONFIG.MAX_STRING_LENGTH); // Limit length
  }

  /**
   * Validates and sanitizes search queries
   */
  static sanitizeSearchQuery(query) {
    if (!query || typeof query !== 'string') return '';
    
    return query
      .trim()
      .replace(/[%_\\]/g, '\\$&') // Escape SQL LIKE wildcards
      .replace(/[^\w\s\-@.]/g, '') // Only allow alphanumeric, spaces, hyphens, @ and dots
      .slice(0, SECURITY_CONFIG.MAX_SEARCH_LENGTH);
  }

  /**
   * Validates email format
   */
  static validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  /**
   * Validates asset ID format (alphanumeric with hyphens)
   */
  static validateAssetId(assetId) {
    if (!assetId) return false;
    const assetRegex = /^[A-Z0-9\-]{3,20}$/;
    return assetRegex.test(assetId);
  }

  /**
   * Validates employee code format
   */
  static validateEmployeeCode(code) {
    if (!code) return false;
    const codeRegex = /^[A-Z0-9]{3,10}$/;
    return codeRegex.test(code);
  }

  /**
   * Validates numeric input
   */
  static validateNumber(num, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const parsed = parseFloat(num);
    return !isNaN(parsed) && parsed >= min && parsed <= max;
  }

  /**
   * Validates date format (YYYY-MM-DD)
   */
  static validateDate(dateString) {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && 
           dateString.match(/^\d{4}-\d{2}-\d{2}$/);
  }

  /**
   * Comprehensive data object validation
   */
  static validateDataObject(data, schema) {
    const errors = [];
    const sanitizedData = {};

    Object.keys(schema).forEach(field => {
      const rules = schema[field];
      const value = data[field];

      // Required field validation
      if (rules.required && (!value || value.toString().trim() === '')) {
        errors.push(`${field} is required`);
        return;
      }

      // Skip validation for optional empty fields
      if (!value && !rules.required) {
        sanitizedData[field] = null;
        return;
      }

      // Type-specific validation
      switch (rules.type) {
        case 'string':
          sanitizedData[field] = this.sanitizeString(value);
          if (rules.maxLength && sanitizedData[field]?.length > rules.maxLength) {
            errors.push(`${field} exceeds maximum length of ${rules.maxLength}`);
          }
          break;

        case 'email':
          if (!this.validateEmail(value)) {
            errors.push(`${field} must be a valid email address`);
          } else {
            sanitizedData[field] = value.toLowerCase().trim();
          }
          break;

        case 'assetId':
          if (!this.validateAssetId(value)) {
            errors.push(`${field} must be a valid asset ID (3-20 alphanumeric characters with hyphens)`);
          } else {
            sanitizedData[field] = value.toUpperCase();
          }
          break;

        case 'employeeCode':
          if (!this.validateEmployeeCode(value)) {
            errors.push(`${field} must be a valid employee code (3-10 alphanumeric characters)`);
          } else {
            sanitizedData[field] = value.toUpperCase();
          }
          break;

        case 'number':
          if (!this.validateNumber(value, rules.min, rules.max)) {
            errors.push(`${field} must be a valid number between ${rules.min || 0} and ${rules.max || 'unlimited'}`);
          } else {
            sanitizedData[field] = parseFloat(value);
          }
          break;

        case 'date':
          if (!this.validateDate(value)) {
            errors.push(`${field} must be a valid date in YYYY-MM-DD format`);
          } else {
            sanitizedData[field] = value;
          }
          break;

        case 'enum':
          if (!rules.values.includes(value)) {
            errors.push(`${field} must be one of: ${rules.values.join(', ')}`);
          } else {
            sanitizedData[field] = value;
          }
          break;

        default:
          sanitizedData[field] = value;
      }

      // Custom validation function
      if (rules.validate && typeof rules.validate === 'function') {
        const customError = rules.validate(sanitizedData[field]);
        if (customError) {
          errors.push(customError);
        }
      }
    });

    return { isValid: errors.length === 0, errors, sanitizedData };
  }
}

// ==================== ROLE-BASED ACCESS CONTROL ====================

export class AccessControl {
  
  /**
   * Gets current user's role and permissions
   */
  static async getCurrentUserRole() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select(`
          role_id,
          employee_id,
          roles (
            role_name
          )
        `)
        .eq('account_id', user.id)
        .single();

      if (accountError || !accountData) return null;

      return {
        userId: user.id,
        roleId: accountData.role_id,
        roleName: accountData.roles?.role_name,
        employeeId: accountData.employee_id,
        email: user.email
      };
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  /**
   * Checks if user has required role
   */
  static async requireRole(requiredRoles) {
    const userRole = await this.getCurrentUserRole();
    
    if (!userRole) {
      throw new Error('Authentication required');
    }

    if (!requiredRoles.includes(userRole.roleName)) {
      throw new Error(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
    }

    return userRole;
  }

  /**
   * Checks if user can access specific employee data
   */
  static async canAccessEmployeeData(employeeId, userRole = null) {
    if (!userRole) {
      userRole = await this.getCurrentUserRole();
    }

    if (!userRole) return false;

    // Admin and IT can access all employee data
    if (['ADMIN', 'IT'].includes(userRole.roleName)) {
      return true;
    }

    // Employees can only access their own data
    return userRole.employeeId === employeeId;
  }

  /**
   * Checks if user can modify device data
   */
  static async canModifyDevices(userRole = null) {
    if (!userRole) {
      userRole = await this.getCurrentUserRole();
    }

    return userRole && ['ADMIN', 'IT'].includes(userRole.roleName);
  }
}

// ==================== RATE LIMITING ====================

export class RateLimiter {
  
  /**
   * Checks if request is within rate limits
   */
  static checkRateLimit(userId, action = 'general') {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW;

    // Get or create request log for this user/action
    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const requests = rateLimitStore.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: windowStart + SECURITY_CONFIG.RATE_LIMIT_WINDOW
      };
    }

    // Add current request
    validRequests.push(now);
    rateLimitStore.set(key, validRequests);

    return {
      allowed: true,
      remaining: SECURITY_CONFIG.MAX_REQUESTS_PER_WINDOW - validRequests.length,
      resetTime: windowStart + SECURITY_CONFIG.RATE_LIMIT_WINDOW
    };
  }

  /**
   * Enforces rate limits with automatic error throwing
   */
  static async enforceRateLimit(userId, action = 'general') {
    const result = this.checkRateLimit(userId, action);
    
    if (!result.allowed) {
      const resetDate = new Date(result.resetTime);
      throw new Error(`Rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}`);
    }

    return result;
  }
}

// ==================== AUDIT LOGGING ====================

export class AuditLogger {
  
  /**
   * Logs user actions for audit trail
   */
  static async logAction(action, details = {}) {
    if (!SECURITY_CONFIG.AUDIT_ENABLED) return;

    try {
      const userRole = await AccessControl.getCurrentUserRole();
      
      const auditEntry = {
        action,
        user_id: userRole?.userId || null,
        user_role: userRole?.roleName || null,
        user_email: userRole?.email || null,
        details: JSON.stringify(details),
        ip_address: await this.getClientIP(),
        user_agent: navigator?.userAgent || null,
        timestamp: new Date().toISOString()
      };

      // In a real application, you would store this in an audit_logs table
      console.log('🔍 AUDIT LOG:', auditEntry);

      // You can also send to an external logging service
      // await this.sendToExternalLogger(auditEntry);

    } catch (error) {
      console.error('Audit logging failed:', error);
      // Don't throw - audit logging shouldn't break normal operations
    }
  }

  /**
   * Gets client IP (simplified for browser environment)
   */
  static async getClientIP() {
    try {
      // In a real app, you'd get this from your backend
      return 'client-ip-unknown';
    } catch {
      return null;
    }
  }

  /**
   * Logs data access operations
   */
  static async logDataAccess(table, operation, recordId = null, filters = {}) {
    await this.logAction(`${operation.toUpperCase()}_${table.toUpperCase()}`, {
      table,
      operation,
      record_id: recordId,
      filters: Object.keys(filters).length > 0 ? filters : null
    });
  }

  /**
   * Logs authentication events
   */
  static async logAuthEvent(event, details = {}) {
    await this.logAction(`AUTH_${event.toUpperCase()}`, details);
  }
}

// ==================== SECURE QUERY BUILDER ====================

export class SecureQueryBuilder {
  
  /**
   * Builds a secure Supabase query with automatic sanitization
   */
  static buildSecureQuery(table, operation = 'select') {
    const query = supabase.from(table);
    
    return {
      // Secure select with automatic sanitization
      selectSecure: (columns = '*', options = {}) => {
        const sanitizedColumns = typeof columns === 'string' ? 
          columns.replace(/[^\w,\s\(\)]/g, '') : columns;
        return query.select(sanitizedColumns, options);
      },

      // Secure filter with input validation
      filterSecure: (column, operator, value) => {
        const sanitizedColumn = column.replace(/[^\w]/g, '');
        const sanitizedValue = DataValidator.sanitizeString(value?.toString());
        return query.filter(sanitizedColumn, operator, sanitizedValue);
      },

      // Secure text search
      textSearchSecure: (column, query) => {
        const sanitizedColumn = column.replace(/[^\w]/g, '');
        const sanitizedQuery = DataValidator.sanitizeSearchQuery(query);
        return query.textSearch(sanitizedColumn, sanitizedQuery);
      },

      // Secure range filter
      rangeSecure: (from, to, options = {}) => {
        const numFrom = parseInt(from, 10);
        const numTo = parseInt(to, 10);
        if (isNaN(numFrom) || isNaN(numTo)) {
          throw new Error('Range values must be numbers');
        }
        return query.range(numFrom, numTo, options);
      }
    };
  }
}

// ==================== ENCRYPTION HELPERS ====================

export class EncryptionHelper {
  
  /**
   * Simple base64 encoding for non-sensitive data obfuscation
   */
  static encode(data) {
    try {
      return btoa(JSON.stringify(data));
    } catch (error) {
      console.error('Encoding failed:', error);
      return null;
    }
  }

  /**
   * Decode base64 encoded data
   */
  static decode(encodedData) {
    try {
      return JSON.parse(atob(encodedData));
    } catch (error) {
      console.error('Decoding failed:', error);
      return null;
    }
  }

  /**
   * Generate a secure random ID
   */
  static generateSecureId(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    
    return result;
  }

  /**
   * Hash sensitive data (client-side hashing for additional security)
   */
  static async hashData(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Hashing failed:', error);
      return null;
    }
  }
}

// ==================== SECURITY DECORATOR ====================

/**
 * Decorator function to add security to service methods
 */
export function withSecurity(requiredRoles = [], options = {}) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args) {
      try {
        // Check authentication and authorization
        const userRole = await AccessControl.requireRole(requiredRoles);
        
        // Rate limiting
        if (options.rateLimit !== false) {
          await RateLimiter.enforceRateLimit(userRole.userId, propertyName);
        }

        // Input validation if schema provided
        if (options.inputSchema && args[0]) {
          const validation = DataValidator.validateDataObject(args[0], options.inputSchema);
          if (!validation.isValid) {
            throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
          }
          args[0] = validation.sanitizedData;
        }

        // Audit logging
        await AuditLogger.logAction(propertyName, {
          args: args.length,
          user_role: userRole.roleName
        });

        // Execute original method
        const result = await method.apply(this, args);

        return result;

      } catch (error) {
        // Log security violations
        await AuditLogger.logAction('SECURITY_VIOLATION', {
          method: propertyName,
          error: error.message
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// ==================== EXPORT ALL UTILITIES ====================

export default {
  DataValidator,
  AccessControl,
  RateLimiter,
  AuditLogger,
  SecureQueryBuilder,
  EncryptionHelper,
  withSecurity,
  SECURITY_CONFIG
};