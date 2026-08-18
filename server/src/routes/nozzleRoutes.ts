import { Router } from 'express';
import { getNozzles, createNozzle, updateNozzle, deleteNozzle } from '../controllers/nozzleController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getNozzles);
router.post('/', createNozzle);
router.put('/:id', updateNozzle);
router.delete('/:id', deleteNozzle);

export default router;
