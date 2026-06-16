import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., 'LOGIN', 'LOGOUT', 'USER_CREATION', etc.
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  details: { type: String } // Additional details
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
