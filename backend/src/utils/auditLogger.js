import { AuditLog } from '../models/AuditLog.js';

/**
 * Creates and saves an audit log entry in the database.
 * @param {Object} params - The log details.
 * @param {string} params.userId - ID of the user performing the action.
 * @param {string} params.action - Action label (e.g. 'LOGIN', 'CHECK_IN').
 * @param {Object} params.req - Express request object to extract IP.
 * @param {string} params.details - String description of the event details.
 */
export const logAudit = async ({ userId, action, req, details }) => {
  try {
    const ipAddress = req 
      ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') 
      : 'System';
      
    const auditLog = new AuditLog({
      userId,
      action,
      ipAddress,
      details
    });
    
    await auditLog.save();
    console.log(`[AUDIT LOG]: ${action} by user ${userId || 'Guest'} from IP ${ipAddress}`);
  } catch (error) {
    console.error('Audit logging error:', error.message);
  }
};
