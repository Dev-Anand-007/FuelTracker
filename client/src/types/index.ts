export interface User {
  _id: string;
  pumpName: string;
  address: string;
  pumpCode: string;
  phone: string;
  token: string;
}

export interface FuelType {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface FuelRateHistory {
  _id: string;
  fuelType: string | FuelType;
  rate: number;
  effectiveFrom: string;
}

export interface FuelRateWithType {
  fuelType: FuelType;
  currentRate: number;
  effectiveFrom: string | null;
}

export interface Nozzle {
  _id: string;
  name: string;
  fuelType: FuelType | string;
  openingMeter: number;
  currentMeter: number;
  isActive: boolean;
}

export interface Employee {
  _id: string;
  name: string;
  phone: string;
  address: string;
  joiningDate: string;
  role: string;
  isActive: boolean;
}

export interface Attendance {
  _id: string;
  employee: Employee | string;
  date: string;
  status: 'present' | 'absent' | 'leave';
  shift: 'shift1' | 'shift2' | null;
}

export interface AttendanceSummary {
  employee: Employee;
  present: number;
  absent: number;
  leave: number;
  shift1: number;
  shift2: number;
  totalWorked: number;
}

export interface ShiftSale {
  _id: string;
  nozzle: Nozzle | string;
  fuelType: FuelType | string;
  employee: Employee | string;
  rate: number;
  openingReading: number;
  closingReading: number;
  quantity: number;
  amount: number;
}

export interface MiscExpense {
  purpose: string;
  amount: number;
}

export interface ShiftAdjustment {
  type: 'ADD' | 'SUBTRACT';
  amount: number;
  purpose: string;
}

export interface Shift {
  _id: string;
  shiftNumber: 1 | 2;
  date: string;
  startTime: string;
  endTime: string;
  sales: ShiftSale[];
  totalSalesAmount: number;
  testingAmount: number;
  tiffinAmount: number;
  miscExpenses: MiscExpense[];
  totalMiscExpense: number;
  adjustments: ShiftAdjustment[];
  totalAddAdjustment: number;
  totalSubtractAdjustment: number;
  amountToSubmit: number;
  cashSubmitted: number;
  onlineSubmitted: number;
  totalSubmitted: number;
  difference: number;
  status: 'OPEN' | 'FINALIZED';
}

export interface CreditCustomer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  totalCredit: number;
  totalPaid: number;
  remainingAmount: number;
}

export interface CreditTransaction {
  _id: string;
  customer: CreditCustomer | string;
  fuelType: FuelType | string;
  quantity: number;
  rate: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  date: string;
  status: 'Pending' | 'Partial' | 'Paid';
}

export interface CreditPayment {
  _id: string;
  creditTransaction: string;
  customer: CreditCustomer | string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'Online';
  note: string;
}

export interface DashboardData {
  todaySales: number;
  totalSales: number;
  todayCash: number;
  todayOnline: number;
  todayCredit: number;
  todayPaymentsReceived: number;
  outstandingCredit: number;
  totalEmployees: number;
  presentToday: number;
  totalFuelTypes: number;
  totalNozzles: number;
  todayExtra: number;
  todayShort: number;
  fuelSalesBreakdown: { fuelType: string; quantity: number; amount: number }[];
}
