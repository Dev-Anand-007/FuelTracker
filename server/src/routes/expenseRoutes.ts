import { Router } from 'express';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from '../controllers/expenseController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getExpenses);
router.post('/', protect, addExpense);
router.put('/:id', protect, updateExpense);
router.delete('/:id', protect, deleteExpense);

export default router;