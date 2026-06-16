import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visitDate: { type: Date, required: true },
  visitTime: { type: String, required: true }, // Format "HH:MM"
  purpose: { type: String },
  approvalStatus: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED'], 
    default: 'PENDING' 
  },
  createdAt: { type: Date, default: Date.now }
});

export const Appointment = mongoose.model('Appointment', AppointmentSchema);
