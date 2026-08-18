import { Router } from 'express';
import { getCustomers, createCustomer, updateCustomer, getTransactions, createTransaction, addPayment, getPayments } from '../controllers/creditController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id', updateCustomer);
router.get('/transactions', getTransactions);
router.get('/transactions/:customerId', getTransactions);
router.post('/transactions', createTransaction);
router.post('/transactions/:transactionId/payments', addPayment);
router.get('/transactions/:transactionId/payments', getPayments);

export default router;
