import { Visitor } from '../models/Visitor.js';
import { User } from '../models/User.js';

/**
 * Create Visitor Profile
 * POST /api/visitors
 */
export const createVisitor = async (req, res, next) => {
  try {
    const { fullName, email, phone, company, purpose, hostId } = req.body;

    if (!fullName || !email || !hostId) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and host details.' });
    }

    // Verify host exists and is indeed an employee/admin
    const host = await User.findById(hostId);
    if (!host || (host.role !== 'EMPLOYEE' && host.role !== 'ADMIN')) {
      return res.status(404).json({ success: false, message: 'Designated Host (Employee) not found.' });
    }

    let photo = '';
    if (req.file) {
      photo = `src/uploads/${req.file.filename}`;
    }

    const visitor = new Visitor({
      fullName,
      email,
      phone,
      photo,
      company,
      purpose,
      hostId,
      status: 'PENDING',
      userId: req.user.role === 'VISITOR' ? req.user._id : undefined
    });

    await visitor.save();

    res.status(201).json({
      success: true,
      message: 'Visitor profile created successfully.',
      visitor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Visitors
 * GET /api/visitors
 */
export const getVisitors = async (req, res, next) => {
  try {
    let query = {};

    // Role-based filtering
    if (req.user.role === 'EMPLOYEE') {
      // Host can only see their own visitor requests
      query.hostId = req.user._id;
    } else if (req.user.role === 'VISITOR') {
      // Registered Visitor can see their own visitor profiles
      query.userId = req.user._id;
    }

    // Admins and Security can see all visitors
    const visitors = await Visitor.find(query)
      .populate('hostId', 'name email department phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: visitors.length,
      visitors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Visitor
 * GET /api/visitors/:id
 */
export const getVisitorById = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id).populate('hostId', 'name email department phone');
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    // Authorization checks
    if (req.user.role === 'EMPLOYEE' && visitor.hostId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this visitor profile' });
    }
    if (req.user.role === 'VISITOR' && visitor.userId && visitor.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied to this visitor profile' });
    }

    res.status(200).json({
      success: true,
      visitor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Visitor Profile
 * PUT /api/visitors/:id
 */
export const updateVisitor = async (req, res, next) => {
  try {
    const { fullName, email, phone, company, purpose, status } = req.body;
    
    let visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    // Authorization check (only host, admin, or the registered visitor user can update)
    const isHost = req.user.role === 'EMPLOYEE' && visitor.hostId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';
    const isSelf = req.user.role === 'VISITOR' && visitor.userId && visitor.userId.toString() === req.user._id.toString();

    if (!isHost && !isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Unauthorized to update this profile' });
    }

    // Status can only be updated by Host or Admin
    if (status && !isHost && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to change visitor approval status' });
    }

    visitor.fullName = fullName || visitor.fullName;
    visitor.email = email || visitor.email;
    visitor.phone = phone || visitor.phone;
    visitor.company = company || visitor.company;
    visitor.purpose = purpose || visitor.purpose;
    visitor.status = status || visitor.status;

    if (req.file) {
      visitor.photo = `src/uploads/${req.file.filename}`;
    }

    await visitor.save();

    res.status(200).json({
      success: true,
      message: 'Visitor profile updated successfully',
      visitor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Visitor
 * DELETE /api/visitors/:id
 */
export const deleteVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    const isAdmin = req.user.role === 'ADMIN';
    const isSelf = req.user.role === 'VISITOR' && visitor.userId && visitor.userId.toString() === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this profile' });
    }

    await Visitor.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Visitor profile deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
