import { Pass } from '../models/Pass.js';
import { Appointment } from '../models/Appointment.js';
import { Visitor } from '../models/Visitor.js';
import { User } from '../models/User.js';
import { generateQRCode } from '../services/qrService.js';
import { generatePassPDF } from '../services/pdfService.js';
import { sendPassGeneratedEmail } from '../services/emailService.js';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';

/**
 * Generate Pass Manually (Admin / Security)
 * POST /api/pass/generate
 */
export const generatePass = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Please provide appointment ID' });
    }

    // Check if pass already exists
    const existingPass = await Pass.findOne({ appointmentId })
      .populate('visitorId')
      .populate('appointmentId');
    if (existingPass) {
      return res.status(200).json({
        success: true,
        message: 'Pass already exists for this appointment',
        pass: existingPass
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate('visitorId')
      .populate('employeeId');
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Ensure appointment is approved before pass generation
    if (appointment.approvalStatus !== 'APPROVED') {
      appointment.approvalStatus = 'APPROVED';
      await appointment.save();
      
      const visitor = await Visitor.findById(appointment.visitorId._id);
      if (visitor) {
        visitor.status = 'APPROVED';
        await visitor.save();
      }
    }

    const visitor = appointment.visitorId;
    const host = appointment.employeeId;

    // Generate credentials
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const passNumber = `VP-${dateStr}-${randomNum}`;

    const qrData = {
      passNumber,
      visitorName: visitor.fullName,
      visitDate: appointment.visitDate,
      hostName: host.name
    };
    const qrCodeBase64 = await generateQRCode(qrData);

    const relativePdfPath = await generatePassPDF(
      { passNumber, expiryDate: appointment.visitDate },
      visitor,
      host,
      appointment,
      qrCodeBase64
    );

    const pass = new Pass({
      passNumber,
      visitorId: visitor._id,
      appointmentId: appointment._id,
      qrCode: qrCodeBase64,
      pdfPath: relativePdfPath,
      issueDate: new Date(),
      expiryDate: new Date(appointment.visitDate),
      active: true
    });
    await pass.save();

    await sendPassGeneratedEmail(visitor, host, pass, relativePdfPath);

    res.status(201).json({
      success: true,
      message: 'Pass generated successfully',
      pass
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Pass by ID (Pass Number or Object ID)
 * GET /api/pass/:id
 */
export const getPassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Look up either by mongoose ObjectId or by passNumber
    let query = {};
    if (id.startsWith('VP-')) {
      query = { passNumber: id };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      query = { 
        $or: [
          { _id: id },
          { appointmentId: id },
          { visitorId: id }
        ]
      };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const pass = await Pass.findOne(query)
      .populate({
        path: 'visitorId',
        populate: { path: 'hostId', select: 'name email department phone' }
      })
      .populate('appointmentId');

    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    // Role access control checks
    if (req.user.role === 'EMPLOYEE') {
      if (pass.visitorId.hostId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this pass' });
      }
    } else if (req.user.role === 'VISITOR') {
      if (pass.visitorId.userId && pass.visitorId.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized access to this pass' });
      }
    }

    res.status(200).json({
      success: true,
      pass
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download Pass PDF
 * GET /api/pass/download/:id
 */
export const downloadPassPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (id.startsWith('VP-')) {
      query = { passNumber: id };
    } else {
      query = { _id: id };
    }

    const pass = await Pass.findOne(query).populate('visitorId');
    if (!pass) {
      return res.status(404).json({ success: false, message: 'Pass not found' });
    }

    // Helper to search and resolve absolute path with/without "src" prefix
    const getAbsolutePath = (relPath) => {
      let absPath = path.resolve(relPath);
      if (fs.existsSync(absPath)) return absPath;

      if (!relPath.startsWith('src/')) {
        let absPathWithSrc = path.resolve(path.join('src', relPath));
        if (fs.existsSync(absPathWithSrc)) return absPathWithSrc;
      }

      if (relPath.startsWith('src/')) {
        let absPathWithoutSrc = path.resolve(relPath.substring(4));
        if (fs.existsSync(absPathWithoutSrc)) return absPathWithoutSrc;
      }

      return absPath;
    };

    let absolutePath = getAbsolutePath(pass.pdfPath);
    if (!fs.existsSync(absolutePath)) {
      // Self-healing: Regenerate PDF pass badge if it is missing from disk
      const appointment = await Appointment.findById(pass.appointmentId).populate('employeeId');
      if (appointment) {
        const relativePdfPath = await generatePassPDF(
          { passNumber: pass.passNumber, expiryDate: pass.expiryDate },
          pass.visitorId,
          appointment.employeeId,
          appointment,
          pass.qrCode
        );
        pass.pdfPath = relativePdfPath;
        await pass.save();
        absolutePath = getAbsolutePath(relativePdfPath);
      } else {
        return res.status(404).json({ success: false, message: 'PDF file not found on disk and associated appointment record is missing' });
      }
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Pass-${pass.passNumber}.pdf"`);
    res.sendFile(absolutePath);
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Passes (Admin/Security)
 * GET /api/pass
 */
export const getAllPasses = async (req, res, next) => {
  try {
    const passes = await Pass.find({})
      .populate({
        path: 'visitorId',
        populate: { path: 'hostId', select: 'name email department' }
      })
      .populate('appointmentId')
      .sort({ issueDate: -1 });
    
    res.status(200).json({
      success: true,
      passes
    });
  } catch (error) {
    next(error);
  }
};

