import { Appointment } from '../models/Appointment.js';
import { Visitor } from '../models/Visitor.js';
import { User } from '../models/User.js';
import { Pass } from '../models/Pass.js';
import { generateQRCode } from '../services/qrService.js';
import { generatePassPDF } from '../services/pdfService.js';
import { sendAppointmentApprovedEmail, sendAppointmentRejectedEmail } from '../services/emailService.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Request Appointment
 * POST /api/appointments
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { visitorId, employeeId, visitDate, visitTime, purpose } = req.body;

    if (!visitorId || !employeeId || !visitDate || !visitTime) {
      return res.status(400).json({ success: false, message: 'Please provide visitor ID, host ID, date, and time.' });
    }

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor profile not found' });
    }

    const host = await User.findById(employeeId);
    if (!host || (host.role !== 'EMPLOYEE' && host.role !== 'ADMIN')) {
      return res.status(404).json({ success: false, message: 'Host not found' });
    }

    const appointment = new Appointment({
      visitorId,
      employeeId,
      visitDate: new Date(visitDate),
      visitTime,
      purpose,
      approvalStatus: 'PENDING'
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully.',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Appointments
 * GET /api/appointments
 */
export const getAppointments = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'EMPLOYEE') {
      query.employeeId = req.user._id;
    } else if (req.user.role === 'VISITOR') {
      // Find all visitors registered by this User
      const visitorProfiles = await Visitor.find({ userId: req.user._id });
      const visitorIds = visitorProfiles.map(vp => vp._id);
      query.visitorId = { $in: visitorIds };
    }

    // Admins and Security can see all appointments
    const appointments = await Appointment.find(query)
      .populate('visitorId')
      .populate('employeeId', 'name email department phone')
      .sort({ visitDate: -1, visitTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve Appointment (Triggers QR Code, PDF Generation, and Email delivery)
 * PUT /api/appointments/:id/approve
 */
export const approveAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('visitorId')
      .populate('employeeId', 'name email department phone');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Only host or admin can approve
    if (req.user.role === 'EMPLOYEE' && appointment.employeeId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You are not the host of this appointment' });
    }

    if (appointment.approvalStatus === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Appointment already approved' });
    }

    // 1. Update status
    appointment.approvalStatus = 'APPROVED';
    await appointment.save();

    // Sync visitor status
    const visitor = await Visitor.findById(appointment.visitorId._id);
    if (visitor) {
      visitor.status = 'APPROVED';
      await visitor.save();
    }

    // 2. Generate unique pass number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const passNumber = `VP-${dateStr}-${randomNum}`;

    // 3. Generate QR Code containing security credentials
    const qrData = {
      passNumber,
      visitorName: visitor.fullName,
      visitDate: appointment.visitDate,
      hostName: appointment.employeeId.name
    };
    const qrCodeBase64 = await generateQRCode(qrData);

    // 4. Generate PDF Badge
    const relativePdfPath = await generatePassPDF(
      { passNumber, expiryDate: appointment.visitDate },
      visitor,
      appointment.employeeId,
      appointment,
      qrCodeBase64
    );

    // 5. Create Pass Document in Database
    const pass = new Pass({
      passNumber,
      visitorId: visitor._id,
      appointmentId: appointment._id,
      qrCode: qrCodeBase64,
      pdfPath: relativePdfPath,
      issueDate: new Date(),
      expiryDate: new Date(appointment.visitDate),
      status: 'APPROVED',
      active: true
    });
    await pass.save();

    // Log approval audit action
    await logAudit({
      userId: req.user._id,
      action: 'APPOINTMENT_APPROVAL',
      req,
      details: `Approved appointment ID ${appointment._id} for visitor ${visitor.fullName} (Pass: ${passNumber})`
    });

    // 6. Send Email Notification with attached PDF
    await sendAppointmentApprovedEmail(
      visitor,
      appointment.employeeId,
      appointment,
      relativePdfPath,
      passNumber
    );

    res.status(200).json({
      success: true,
      message: 'Appointment approved. Pass generated and emailed successfully.',
      appointment,
      pass
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject Appointment
 * PUT /api/appointments/:id/reject
 */
export const rejectAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('visitorId')
      .populate('employeeId', 'name email department');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Only host or admin can reject
    if (req.user.role === 'EMPLOYEE' && appointment.employeeId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You are not the host of this appointment' });
    }

    if (appointment.approvalStatus === 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Appointment already rejected' });
    }

    // Update statuses
    appointment.approvalStatus = 'REJECTED';
    await appointment.save();

    const visitor = await Visitor.findById(appointment.visitorId._id);
    if (visitor) {
      visitor.status = 'REJECTED';
      await visitor.save();
    }

    // Log rejection audit action
    await logAudit({
      userId: req.user._id,
      action: 'APPOINTMENT_REJECTION',
      req,
      details: `Rejected appointment ID ${appointment._id} for visitor ${visitor?.fullName}`
    });

    // Send Rejection Email
    await sendAppointmentRejectedEmail(visitor, appointment.employeeId, appointment);

    res.status(200).json({
      success: true,
      message: 'Appointment declined successfully.',
      appointment
    });
  } catch (error) {
    next(error);
  }
};
