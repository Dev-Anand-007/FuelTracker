import { Router } from 'express';
import { getAttendance, markAttendance, getMonthlySummary } from '../controllers/attendanceController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getAttendance);
router.post('/mark', markAttendance);
router.get('/summary', getMonthlySummary);

export default router;
