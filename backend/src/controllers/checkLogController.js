import { CheckLog } from '../models/CheckLog.js';
import { Pass } from '../models/Pass.js';
import { Visitor } from '../models/Visitor.js';
import { Appointment } from '../models/Appointment.js';
import { logAudit } from '../utils/auditLogger.js';

/**
 * Check-In Visitor
 * POST /api/checkin
 */
export const checkInVisitor = async (req, res, next) => {
  try {
    const { passNumber } = req.body;
    if (!passNumber) {
      return res.status(400).json({ success: false, message: 'Please provide pass number' });
    }

    const pass = await Pass.findOne({ passNumber })
      .populate('visitorId')
      .populate('appointmentId');
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid Pass: Pass not found' });
    }

    if (!pass.active) {
      return res.status(400).json({ success: false, message: 'This pass is inactive or has already been checked out' });
    }

    // Check expiry
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(pass.expiryDate);
    expiryDate.setHours(23, 59, 59, 999);
    if (today > expiryDate) {
      pass.active = false;
      await pass.save();
      return res.status(400).json({ success: false, message: 'This pass has expired' });
    }

    // Check if already checked in (active log exists where checkOutTime is null)
    const existingLog = await CheckLog.findOne({
      visitorId: pass.visitorId._id,
      checkOutTime: { $exists: false }
    });

    if (existingLog) {
      return res.status(400).json({ 
        success: false, 
        message: 'Visitor is already checked in', 
        log: existingLog 
      });
    }

    // Create CheckLog
    const checkLog = new CheckLog({
      visitorId: pass.visitorId._id,
      appointmentId: pass.appointmentId._id,
      checkInTime: new Date(),
      securityId: req.user._id
    });
    await checkLog.save();

    // Update Pass status to CHECKED_IN
    pass.status = 'CHECKED_IN';
    await pass.save();

    // Log checkin audit
    await logAudit({
      userId: req.user._id,
      action: 'CHECK_IN',
      req,
      details: `Gate Check-In successful for ${pass.visitorId.fullName} (Pass: ${pass.passNumber})`
    });

    res.status(200).json({
      success: true,
      message: `Check-in successful for ${pass.visitorId.fullName}`,
      log: checkLog
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check-Out Visitor
 * POST /api/checkout
 */
export const checkOutVisitor = async (req, res, next) => {
  try {
    const { passNumber } = req.body;
    if (!passNumber) {
      return res.status(400).json({ success: false, message: 'Please provide pass number' });
    }

    const pass = await Pass.findOne({ passNumber }).populate('visitorId');
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Invalid Pass: Pass not found' });
    }

    // Find active log
    const log = await CheckLog.findOne({
      visitorId: pass.visitorId._id,
      checkOutTime: { $exists: false }
    });

    if (!log) {
      return res.status(400).json({ success: false, message: 'Visitor is not checked in' });
    }

    log.checkOutTime = new Date();
    await log.save();

    // Deactivate pass and set status to CHECKED_OUT
    pass.active = false;
    pass.status = 'CHECKED_OUT';
    await pass.save();

    // Update corresponding appointment status to COMPLETED
    if (pass.appointmentId) {
      await Appointment.findByIdAndUpdate(pass.appointmentId, { approvalStatus: 'COMPLETED' });
    }

    // Log checkout audit
    await logAudit({
      userId: req.user._id,
      action: 'CHECK_OUT',
      req,
      details: `Gate Check-Out successful for ${pass.visitorId.fullName} (Pass: ${pass.passNumber})`
    });

    res.status(200).json({
      success: true,
      message: `Check-out successful for ${pass.visitorId.fullName}`,
      log
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Logs (Admin/Security)
 * GET /api/logs
 */
export const getLogs = async (req, res, next) => {
  try {
    // Admin and Security see logs
    const logs = await CheckLog.find()
      .populate({
        path: 'visitorId',
        populate: { path: 'hostId', select: 'name email department' }
      })
      .populate('securityId', 'name email')
      .populate('appointmentId')
      .sort({ checkInTime: -1 });

    res.status(200).json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    next(error);
  }
};
