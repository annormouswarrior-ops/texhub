import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Eye,
  Printer,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DyeingPlanForm } from '../components/DyeingPlanForm';
import { ChemicalRequirementsTable } from '../components/ChemicalRequirementsTable';
import { MachineScheduleView } from '../components/MachineScheduleView';
import { PlanningDashboard } from '../components/PlanningDashboard';
import { AlertDialog } from '../components/AlertDialog';
import { 
  DyeingPlan, 
  MachineSchedule, 
  ChemicalRequirement,
  generatePlanId, 
  initialDyeingPlan,
  PLAN_STATUSES,
  PRIORITY_LEVELS
} from '../types/planning';
import { db } from '../lib/firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  doc 
} from 'firebase/firestore';
import { useToast } from '../components/ui/ToastProvider';
import * as Select from '@radix-ui/react-select';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';

interface DyeingPlanningProps {
  user: any;
}

export function DyeingPlanning({ user }: DyeingPlanningProps) {
  const [activeTab, setActiveTab] = useState<'planning' | 'schedule' | 'dashboard' | 'history'>('planning');
  const [plans, setPlans] = useState<DyeingPlan[]>([]);
  const [machines, setMachines] = useState<MachineSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [editingPlan, setEditingPlan] = useState<DyeingPlan | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [formData, setFormData] = useState<DyeingPlan>({
    ...initialDyeingPlan,
    id: generatePlanId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: user?.uid || '',
    createdBy: user?.displayName || user?.email || 'Unknown User',
  });

  const { showToast } = useToast();

  // Fetch user-specific dyeing plans from Firebase
  useEffect(() => {
    if (!user) {
      setPlans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const plansCollectionRef = collection(db, "users", user.uid, "dyeingPlans");
    const q = query(plansCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPlans: DyeingPlan[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DyeingPlan[];
      setPlans(fetchedPlans);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching dyeing plans:", error);
      showToast({
        message: "Error fetching dyeing plans from cloud. Please try again.",
        type: 'error',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, showToast]);

  // Mock machine data - in a real app, this would come from Firebase
  useEffect(() => {
    const mockMachines: MachineSchedule[] = [
      {
        id: '1',
        machineNo: 'JET-001',
        machineType: 'Jet Dyeing Machine',
        capacity: 500,
        status: 'available',
        scheduledPlans: [],
      },
      {
        id: '2',
        machineNo: 'JET-002',
        machineType: 'Jet Dyeing Machine',
        capacity: 750,
        status: 'occupied',
        scheduledPlans: [
          {
            planId: 'plan1',
            planName: 'Cotton Red Batch',
            startTime: '08:00',
            endTime: '16:00',
            color: '#EF4444',
            priority: 'high',
          }
        ],
      },
      {
        id: '3',
        machineNo: 'JIG-001',
        machineType: 'Jigger',
        capacity: 300,
        status: 'maintenance',
        scheduledPlans: [],
      },
    ];
    setMachines(mockMachines);
  }, []);

  // Filter plans
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = searchTerm === '' ||
      plan.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.machineNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || plan.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSavePlan = async () => {
    if (!user) {
      showToast({ message: "Please log in to save dyeing plans.", type: 'warning' });
      return;
    }

    try {
      const planData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      if (editingPlan) {
        await updateDoc(doc(db, "users", user.uid, "dyeingPlans", editingPlan.id), planData);
        showToast({ message: "Dyeing plan updated successfully!", type: 'success' });
      } else {
        await addDoc(collection(db, "users", user.uid, "dyeingPlans"), planData);
        showToast({ message: "Dyeing plan created successfully!", type: 'success' });
      }
      
      setIsFormOpen(false);
      setEditingPlan(null);
      resetForm();
    } catch (error) {
      console.error("Error saving dyeing plan:", error);
      showToast({ message: "Error saving dyeing plan. Check console for details.", type: 'error' });
    }
  };

  const handleEditPlan = (plan: DyeingPlan) => {
    setFormData(plan);
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleDeletePlan = async (planId: string) => {
    if (!user) {
      showToast({ message: "Please log in to delete dyeing plans.", type: 'warning' });
      return;
    }

    try {
      await deleteDoc(doc(db, "users", user.uid, "dyeingPlans", planId));
      showToast({ message: "Dyeing plan deleted successfully!", type: 'success' });
    } catch (error) {
      console.error("Error deleting dyeing plan:", error);
      showToast({ message: "Error deleting dyeing plan. Check console for details.", type: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleStatusChange = async (planId: string, newStatus: string) => {
    if (!user) return;

    try {
      const updateData: any = { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      // Set actual times when status changes
      if (newStatus === 'in-progress') {
        updateData.actualStartTime = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.actualEndTime = new Date().toISOString();
        
        // Calculate actual duration if start time exists
        const plan = plans.find(p => p.id === planId);
        if (plan?.actualStartTime) {
          const start = new Date(plan.actualStartTime);
          const end = new Date();
          updateData.actualDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        }
      }

      await updateDoc(doc(db, "users", user.uid, "dyeingPlans", planId), updateData);
      showToast({ message: "Plan status updated successfully!", type: 'success' });
    } catch (error) {
      console.error("Error updating plan status:", error);
      showToast({ message: "Error updating plan status.", type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      ...initialDyeingPlan,
      id: generatePlanId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.uid || '',
      createdBy: user?.displayName || user?.email || 'Unknown User',
    });
  };

  const handleChemicalRequirementsChange = (requirements: ChemicalRequirement[]) => {
    const totalCost = requirements.reduce((sum, req) => sum + req.totalCost, 0);
    setFormData(prev => ({
      ...prev,
      chemicalRequirements: requirements,
      estimatedCost: totalCost,
    }));
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reorderedRequirements = Array.from(formData.chemicalRequirements);
    const [movedItem] = reorderedRequirements.splice(result.source.index, 1);
    reorderedRequirements.splice(result.destination.index, 0, movedItem);

    setFormData(prev => ({ ...prev, chemicalRequirements: reorderedRequirements }));
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = PLAN_STATUSES.find(s => s.value === status);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusInfo?.label || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityInfo = PRIORITY_LEVELS.find(p => p.value === priority);
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityInfo?.color || 'bg-gray-100 text-gray-800'}`}>
        {priorityInfo?.label || priority}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card text-card-foreground border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dyeing Planning</h1>
              <p className="text-muted-foreground mt-1">Plan, schedule, and manage your dyeing operations</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  resetForm();
                  setEditingPlan(null);
                  setIsFormOpen(true);
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Plan
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mt-4">
            <button
              onClick={() => setActiveTab('planning')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'planning'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Planning ({plans.length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'schedule'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-4 w-4" />
              Machine Schedule
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-4 w-4" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {isFormOpen ? (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-foreground">
                      {editingPlan ? 'Edit Dyeing Plan' : 'Create New Dyeing Plan'}
                    </h2>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsFormOpen(false);
                          setEditingPlan(null);
                          resetForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSavePlan}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                      </Button>
                    </div>
                  </div>

                  <DyeingPlanForm data={formData} onChange={setFormData} />

                  <DragDropContext onDragEnd={handleDragEnd}>
                    <ChemicalRequirementsTable
                      requirements={formData.chemicalRequirements}
                      onRequirementsChange={handleChemicalRequirementsChange}
                      fabricWeight={formData.fabricWeight}
                      totalWater={formData.totalWater}
                    />
                  </DragDropContext>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search by plan name, customer, order, color..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
                        <Select.Trigger className="flex items-center justify-between w-48 rounded-md border border-border shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground py-2 px-3">
                          <Select.Value placeholder="All Statuses" />
                          <Select.Icon>
                            <Filter className="h-4 w-4" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="overflow-hidden rounded-lg bg-card border border-border shadow-lg z-50">
                            <Select.Viewport className="p-1">
                              <Select.Item value="all" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-foreground text-sm outline-none data-[highlighted]:bg-primary/20">
                                <Select.ItemText>All Statuses</Select.ItemText>
                              </Select.Item>
                              {PLAN_STATUSES.map(status => (
                                <Select.Item key={status.value} value={status.value} className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-foreground text-sm outline-none data-[highlighted]:bg-primary/20">
                                  <Select.ItemText>{status.label}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>

                      <Select.Root value={priorityFilter} onValueChange={setPriorityFilter}>
                        <Select.Trigger className="flex items-center justify-between w-48 rounded-md border border-border shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground py-2 px-3">
                          <Select.Value placeholder="All Priorities" />
                          <Select.Icon>
                            <Filter className="h-4 w-4" />
                          </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className="overflow-hidden rounded-lg bg-card border border-border shadow-lg z-50">
                            <Select.Viewport className="p-1">
                              <Select.Item value="all" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-foreground text-sm outline-none data-[highlighted]:bg-primary/20">
                                <Select.ItemText>All Priorities</Select.ItemText>
                              </Select.Item>
                              {PRIORITY_LEVELS.map(priority => (
                                <Select.Item key={priority.value} value={priority.value} className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-foreground text-sm outline-none data-[highlighted]:bg-primary/20">
                                  <Select.ItemText>{priority.label}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    </div>
                  </div>

                  {/* Plans List */}
                  <div className="bg-card rounded-lg border border-border">
                    <div className="p-6">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                          <p className="text-lg font-medium">Loading dyeing plans...</p>
                        </div>
                      ) : filteredPlans.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                          <p className="text-lg font-medium text-foreground">
                            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                              ? 'No plans found matching your filters' 
                              : 'No dyeing plans yet'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                              ? 'Try adjusting your search or filters'
                              : 'Create your first dyeing plan to get started'
                            }
                          </p>
                          {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                            <Button
                              onClick={() => {
                                resetForm();
                                setIsFormOpen(true);
                              }}
                              className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                              Create First Plan
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {filteredPlans.map((plan) => (
                            <motion.div
                              key={plan.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-6 border border-border rounded-lg hover:shadow-md transition-all duration-300"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-foreground">{plan.planName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {plan.customerName} • Order: {plan.orderNumber}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {getStatusBadge(plan.status)}
                                    {getPriorityBadge(plan.priority)}
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Select.Root 
                                    value={plan.status} 
                                    onValueChange={(value) => handleStatusChange(plan.id, value)}
                                  >
                                    <Select.Trigger className="flex items-center justify-between w-32 rounded-md border border-border bg-background text-foreground py-1 px-2 text-sm">
                                      <Select.Value />
                                      <Select.Icon>
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                      <Select.Content className="overflow-hidden rounded-lg bg-card border border-border shadow-lg z-50">
                                        <Select.Viewport className="p-1">
                                          {PLAN_STATUSES.map(status => (
                                            <Select.Item key={status.value} value={status.value} className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-foreground text-sm outline-none data-[highlighted]:bg-primary/20">
                                              <Select.ItemText>{status.label}</Select.ItemText>
                                            </Select.Item>
                                          ))}
                                        </Select.Viewport>
                                      </Select.Content>
                                    </Select.Portal>
                                  </Select.Root>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditPlan(plan)}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirm(plan.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Fabric:</span>
                                  <p className="font-medium text-foreground">{plan.fabricType}</p>
                                  <p className="text-muted-foreground">{plan.fabricWeight}kg</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Color:</span>
                                  <p className="font-medium text-foreground">{plan.color}</p>
                                  <p className="text-muted-foreground">{plan.dyeingMethod}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Machine:</span>
                                  <p className="font-medium text-foreground">{plan.machineNo}</p>
                                  <p className="text-muted-foreground">{plan.estimatedDuration}h estimated</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Schedule:</span>
                                  <p className="font-medium text-foreground">{new Date(plan.planDate).toLocaleDateString()}</p>
                                  <p className="text-muted-foreground">{plan.scheduledStartTime} - {plan.scheduledEndTime}</p>
                                </div>
                              </div>

                              {plan.specialInstructions && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800">
                                    <strong>Special Instructions:</strong> {plan.specialInstructions}
                                  </p>
                                </div>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'schedule' && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <MachineScheduleView
                machines={machines}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <PlanningDashboard plans={plans} />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-xl font-bold text-foreground mb-6">Planning History</h3>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium">Loading history...</p>
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground">No planning history yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create dyeing plans to see them in your history
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-border">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="border border-border px-4 py-3 text-left text-sm font-medium text-foreground">Plan Name</th>
                          <th className="border border-border px-4 py-3 text-left text-sm font-medium text-foreground">Customer</th>
                          <th className="border border-border px-4 py-3 text-left text-sm font-medium text-foreground">Date</th>
                          <th className="border border-border px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
                          <th className="border border-border px-4 py-3 text-center text-sm font-medium text-foreground">Priority</th>
                          <th className="border border-border px-4 py-3 text-right text-sm font-medium text-foreground">Est. Cost</th>
                          <th className="border border-border px-4 py-3 text-center text-sm font-medium text-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlans.map((plan) => (
                          <tr key={plan.id} className="hover:bg-muted/30 transition-colors">
                            <td className="border border-border px-4 py-3 text-sm text-foreground font-medium">
                              {plan.planName}
                            </td>
                            <td className="border border-border px-4 py-3 text-sm text-foreground">
                              {plan.customerName}
                            </td>
                            <td className="border border-border px-4 py-3 text-sm text-foreground">
                              {new Date(plan.planDate).toLocaleDateString()}
                            </td>
                            <td className="border border-border px-4 py-3 text-center">
                              {getStatusBadge(plan.status)}
                            </td>
                            <td className="border border-border px-4 py-3 text-center">
                              {getPriorityBadge(plan.priority)}
                            </td>
                            <td className="border border-border px-4 py-3 text-sm text-foreground text-right">
                              ₹{plan.estimatedCost.toFixed(2)}
                            </td>
                            <td className="border border-border px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPlan(plan)}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Edit Plan"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm(plan.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Delete Plan"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <AlertDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Dyeing Plan"
          message="Are you sure you want to delete this dyeing plan? This action cannot be undone."
          type="confirm"
          onConfirm={() => handleDeletePlan(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}