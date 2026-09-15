import { Router } from 'express';
import {
  getReport,
  updatePartyName,
  updatePumpDetails,
  addVehicle,
  removeVehicle,
  addTransaction,
  removeTransaction,
} from '../controllers/vehicleReportController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getReport);
router.put('/party-name', updatePartyName);
router.put('/pump-details', updatePumpDetails);
router.post('/vehicle', addVehicle);
router.delete('/vehicle/:vehicleId', removeVehicle);
router.post('/vehicle/:vehicleId/transaction', addTransaction);
router.delete('/vehicle/:vehicleId/transaction/:txnId', removeTransaction);

export default router;
