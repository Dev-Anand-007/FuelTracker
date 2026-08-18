import { Router } from 'express';
import { getDailySales, getShiftSales, getCollectionReport, getCreditReport, getPaymentReport, getAttendanceReport, getExtraShortReport } from '../controllers/reportController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/daily-sales', getDailySales);
router.get('/shift-sales', getShiftSales);
router.get('/collection', getCollectionReport);
router.get('/credit', getCreditReport);
router.get('/payments', getPaymentReport);
router.get('/attendance', getAttendanceReport);
router.get('/extra-short', getExtraShortReport);

export default router;
