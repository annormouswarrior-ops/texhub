export interface DyeingPlan {
  id: string;
  planName: string;
  planDate: string;
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Customer & Order Details
  customerName: string;
  orderNumber: string;
  deliveryDate: string;
  
  // Fabric Details
  fabricType: string;
  fabricWeight: number;
  fabricWidth?: string;
  gsm?: string;
  
  // Dyeing Details
  color: string;
  colorCode?: string;
  dyeingMethod: string;
  dyeingType: string;
  liquorRatio: number;
  totalWater: number;
  
  // Machine & Resources
  machineNo: string;
  machineCapacity: number;
  estimatedDuration: number; // in hours
  actualDuration?: number;
  
  // Chemical Requirements
  chemicalRequirements: ChemicalRequirement[];
  
  // Scheduling
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  
  // Quality & Testing
  labDipNo?: string;
  qualityChecks: QualityCheck[];
  
  // Cost Estimation
  estimatedCost: number;
  actualCost?: number;
  
  // Notes & Instructions
  specialInstructions?: string;
  notes?: string;
  
  // Tracking
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ChemicalRequirement {
  id: string;
  chemicalName: string;
  dosing?: number; // g/l
  shade?: number; // %
  requiredQuantity: number; // in kg
  availableStock: number;
  needToPurchase: number;
  unitPrice: number;
  totalCost: number;
  supplier?: string;
  notes?: string;
}

export interface QualityCheck {
  id: string;
  checkType: 'pre-dyeing' | 'during-dyeing' | 'post-dyeing';
  parameter: string;
  expectedValue: string;
  actualValue?: string;
  status: 'pending' | 'passed' | 'failed';
  checkedBy?: string;
  checkDate?: string;
  notes?: string;
}

export interface MachineSchedule {
  id: string;
  machineNo: string;
  machineType: string;
  capacity: number; // in kg
  status: 'available' | 'occupied' | 'maintenance' | 'breakdown';
  currentPlan?: string; // Plan ID
  scheduledPlans: ScheduledSlot[];
  maintenanceSchedule?: MaintenanceSchedule[];
}

export interface ScheduledSlot {
  planId: string;
  planName: string;
  startTime: string;
  endTime: string;
  color: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface MaintenanceSchedule {
  id: string;
  type: 'routine' | 'repair' | 'calibration';
  scheduledDate: string;
  estimatedDuration: number;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

export const DYEING_METHODS = [
  'Reactive Pad-Batch',
  'Reactive Exhaust',
  'Disperse Dyeing',
  'Acid Dyeing',
  'Direct Dyeing',
  'Vat Dyeing',
  'Pigment Dyeing',
  'Cold Pad-Batch',
  'Hot Brand',
  'Continuous Dyeing',
] as const;

export const DYEING_TYPES = [
  'Fresh Dyeing',
  'Reprocess',
  'Shade Matching',
  'Bulk Production',
  'Sample Development',
  'Color Correction',
] as const;

export const PLAN_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
] as const;

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
] as const;

export const MACHINE_TYPES = [
  'Jet Dyeing Machine',
  'Jigger',
  'Winch',
  'Beam Dyeing',
  'Package Dyeing',
  'Hank Dyeing',
  'Continuous Range',
  'Pad-Batch',
] as const;

export const generatePlanId = (): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const day = new Date().getDate().toString().padStart(2, '0');
  const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DP${year}${month}${day}${randomId}`;
};

export const initialDyeingPlan: Omit<DyeingPlan, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
  planName: '',
  planDate: new Date().toISOString().split('T')[0],
  status: 'draft',
  priority: 'medium',
  customerName: '',
  orderNumber: '',
  deliveryDate: '',
  fabricType: '',
  fabricWeight: 0,
  fabricWidth: '',
  gsm: '',
  color: '',
  colorCode: '',
  dyeingMethod: 'Reactive Exhaust',
  dyeingType: 'Fresh Dyeing',
  liquorRatio: 8,
  totalWater: 0,
  machineNo: '',
  machineCapacity: 0,
  estimatedDuration: 8,
  chemicalRequirements: [],
  scheduledStartTime: '',
  scheduledEndTime: '',
  qualityChecks: [],
  estimatedCost: 0,
  specialInstructions: '',
  notes: '',
  createdBy: '',
  assignedTo: '',
};