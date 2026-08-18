import { Router } from 'express';
import { getRates, getCurrentRate, getCurrentRatesAll, addRate, getRateForDate } from '../controllers/fuelRateController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/current-all', getCurrentRatesAll);
router.get('/:fuelTypeId', getRates);
router.get('/:fuelTypeId/current', getCurrentRate);
router.post('/:fuelTypeId', addRate);
router.get('/:fuelTypeId/for-date', getRateForDate);

export default router;
