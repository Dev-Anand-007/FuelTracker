import { Router } from 'express';
import { getShifts, getShiftById, createShift, addSale, updateSale, removeSale, updateSettlement, finalizeShift, reopenShift } from '../controllers/shiftController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getShifts);
router.get('/:id', getShiftById);
router.post('/', createShift);
router.post('/:shiftId/sales', addSale);
router.put('/:shiftId/sales/:saleId', updateSale);
router.delete('/:shiftId/sales/:saleId', removeSale);
router.put('/:shiftId/settlement', updateSettlement);
router.put('/:shiftId/finalize', finalizeShift);
router.put('/:shiftId/reopen', reopenShift);

export default router;
