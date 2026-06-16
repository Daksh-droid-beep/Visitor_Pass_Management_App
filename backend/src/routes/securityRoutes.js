import express from 'express';
import { checkInVisitor, checkOutVisitor, getLogs } from '../controllers/checkLogController.js';
import { protect, authorize } from '../middlewares/auth.js';

const checkInRouter = express.Router();
checkInRouter.post('/', protect, authorize('SECURITY', 'ADMIN'), checkInVisitor);

const checkOutRouter = express.Router();
checkOutRouter.post('/', protect, authorize('SECURITY', 'ADMIN'), checkOutVisitor);

const logsRouter = express.Router();
logsRouter.get('/', protect, authorize('SECURITY', 'ADMIN'), getLogs);

export { checkInRouter, checkOutRouter, logsRouter };
