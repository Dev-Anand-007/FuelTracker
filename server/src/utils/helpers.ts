import jwt from 'jsonwebtoken';

export const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, { expiresIn: (process.env.JWT_EXPIRE || '7d') as any });
};

export const calculateAmountToSubmit = (
  salesAmount: number,
  testingAmount: number,
  tiffinAmount: number,
  miscExpenseTotal: number,
  totalAddAdjustment: number,
  totalSubtractAdjustment: number
): number => {
  return salesAmount - testingAmount - tiffinAmount - miscExpenseTotal + totalAddAdjustment - totalSubtractAdjustment;
};
