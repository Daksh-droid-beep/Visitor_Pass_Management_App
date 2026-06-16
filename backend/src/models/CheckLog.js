import mongoose from 'mongoose';

const CheckLogSchema = new mongoose.Schema({
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  securityId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export const CheckLog = mongoose.model('CheckLog', CheckLogSchema);
