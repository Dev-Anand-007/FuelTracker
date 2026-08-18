import { Router } from 'express';
import { getFuelTypes, createFuelType, updateFuelType, deleteFuelType } from '../controllers/fuelTypeController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getFuelTypes);
router.post('/', createFuelType);
router.put('/:id', updateFuelType);
router.delete('/:id', deleteFuelType);

export default router;
