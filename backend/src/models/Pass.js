import mongoose from 'mongoose';

const PassSchema = new mongoose.Schema({
  passNumber: { type: String, required: true, unique: true },
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  qrCode: { type: String }, // Base64 representation or path
  pdfPath: { type: String }, // Relative local path to generated PDF
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT', 'EXPIRED', 'CANCELLED'],
    default: 'APPROVED'
  },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  active: { type: Boolean, default: true }
});

export const Pass = mongoose.model('Pass', PassSchema);
