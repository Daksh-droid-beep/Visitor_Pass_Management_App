import express from 'express';
import { createVisitor, getVisitors, getVisitorById, updateVisitor, deleteVisitor } from '../controllers/visitorController.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

router.use(protect); // All routes require JWT authentication

router.post('/', upload.single('photo'), createVisitor);
router.get('/', getVisitors);
router.get('/:id', getVisitorById);
router.put('/:id', upload.single('photo'), updateVisitor);
router.delete('/:id', deleteVisitor);

export default router;
