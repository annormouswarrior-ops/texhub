import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Printer, 
  Clock, 
  Package, 
  Truck,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { OrderForm } from '../components/OrderForm';
import { OrderItemsTable } from '../components/OrderItemsTable';
import { ProductionTracker } from '../components/ProductionTracker';
import { ShipmentTracker } from '../components/ShipmentTracker';
import { OrderStatusTimeline } from '../components/OrderStatusTimeline';
import { PrintableOrder } from '../components/PrintableOrder';
import { SaveRecipeDialog } from '../components/SaveRecipeDialog';
import { ViewRecipesDialog } from '../components/ViewRecipesDialog';
import { AlertDialog } from '../components/AlertDialog';
import { SaveOptionsDialog } from '../components/SaveOptionsDialog';
import { PasswordInputDialog } from '../components/PasswordInputDialog';
import { useToast } from '../components/ui/ToastProvider';
import { useReactToPrint } from 'react-to-print';
import { Order, OrderItem, initialOrderData, generateOrderNumber, ORDER_STATUSES, PRIORITY_LEVELS } from '../types/order';
import type { Recipe } from '../types';
import { db } from '../lib/firebaseConfig';
import { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import * as Select from '@radix-ui/react-select';

interface OrderManagementProps {
  user: any;
}

export function OrderManagement({ user }: OrderManagementProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'dashboard'>('form');
  const [activeFormTab, setActiveFormTab] = useState<'details' | 'items' | 'production' | 'shipment'>('details');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  
  // Form state
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isSaveOptionsOpen, setIsSaveOptionsOpen] = useState(false);
  const [isViewOrdersOpen, setIsViewOrdersOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadedOrderId, setLoadedOrderId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Delete confirmation
  const [isPasswordInputOpen, setIsPasswordInputOpen] = useState(false);
  const [isAuthenticatingPassword, setIsAuthenticatingPassword] = useState(false);
  const [passwordAuthError, setPasswordAuthError] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    isAuthenticating?: boolean;
  } | null>(null);

  const { showToast } = useToast();

  const [orderData, setOrderData] = useState<Order>({
    ...initialOrderData,
    id: '',
    orderNumber: generateOrderNumber(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: user?.uid || '',
  });

  // Fetch user-specific orders from Firebase
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const ordersCollectionRef = collection(db, "users", user.uid, "orders");
    const q = query(ordersCollectionRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: Order[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(fetchedOrders);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      showToast({
        message: "Error fetching orders from cloud. Please try again.",
        type: 'error',
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, showToast]);

  // Calculate totals when items change
  useEffect(() => {
    const subtotal = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subtotal - orderData.discount + orderData.tax + orderData.shippingCost;
    
    setOrderData(prev => ({
      ...prev,
      subtotal,
      totalAmount,
    }));
  }, [orderData.items, orderData.discount, orderData.tax, orderData.shippingCost]);

  // Track form changes
  useEffect(() => {
    if (loadedOrderId) {
      setHasUnsavedChanges(true);
    }
  }, [orderData, loadedOrderId]);

  const handleSaveOrder = async (orderName: string) => {
    if (!user) {
      setAlertDialog({
        isOpen: true,
        title: "Authentication Required",
        message: "Please ensure you are authenticated to save orders.",
        type: 'warning',
      });
      return;
    }

    setIsSaving(true);

    const orderDataToSave = {
      ...orderData,
      customerName: orderName,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (loadedOrderId) {
        await updateDoc(doc(db, "users", user.uid, "orders", loadedOrderId), orderDataToSave);
        showToast({
          message: `Order "${orderName}" updated successfully!`,
          type: 'success',
        });
      } else {
        const docRef = await addDoc(collection(db, "users", user.uid, "orders"), {
          ...orderDataToSave,
          createdAt: new Date().toISOString(),
        });
        setLoadedOrderId(docRef.id);
        showToast({
          message: `Order "${orderName}" saved successfully!`,
          type: 'success',
        });
      }
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save order:", error);
      showToast({
        message: "Error saving order. Check console for details.",
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      setIsSaveDialogOpen(false);
    }
  };

  const handleLoadOrder = (recipe: Recipe) => {
    const order = recipe.formData as Order;
    setOrderData({
      ...order,
      orderNumber: generateOrderNumber(),
      orderDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    });
    setLoadedOrderId(recipe.id);
    setHasUnsavedChanges(false);
    showToast({
      message: `Order "${recipe.name}" loaded successfully!`,
      type: 'success',
    });
  };

  const handleDeleteOrder = async (orderId: string, orderName: string) => {
    if (!user) {
      showToast({
        message: "Please log in to delete orders.",
        type: 'error',
      });
      return;
    }

    try {
      await deleteDoc(doc(db, "users", user.uid, "orders", orderId));
      showToast({
        message: `Order "${orderName}" deleted successfully!`,
        type: 'success',
      });
    } catch (error) {
      console.error("Failed to delete order:", error);
      showToast({
        message: "Error deleting order. Please try again.",
        type: 'error',
      });
      throw error;
    }
  };

  const handlePasswordAuthorization = async (password: string) => {
    if (!user || !user.email || !orderToDelete) {
      return;
    }

    setIsAuthenticatingPassword(true);
    setPasswordAuthError(null);

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      setIsPasswordInputOpen(false);
      setAlertDialog({
        isOpen: true,
        title: "Confirm Deletion",
        message: `Password authorized. Are you sure you want to delete the order "${orderToDelete.name}"? This action cannot be undone.`,
        type: 'confirm',
        onConfirm: async () => {
          setIsConfirmingDelete(true);
          try {
            await handleDeleteOrder(orderToDelete.id, orderToDelete.name);
            setOrderToDelete(null);
            setAlertDialog(null);
          } catch (error) {
            showToast({
              message: `Error deleting order: ${error instanceof Error ? error.message : 'Unknown error'}`,
              type: 'error',
            });
          } finally {
            setIsConfirmingDelete(false);
          }
        },
        onCancel: () => {
          setAlertDialog(null);
          setOrderToDelete(null);
        },
        confirmText: "Delete",
        cancelText: "Cancel",
        isAuthenticating: isConfirmingDelete,
      });

    } catch (error: any) {
      let errorMessage = "Password authorization failed. Please try again.";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      }
      setPasswordAuthError(errorMessage);
    } finally {
      setIsAuthenticatingPassword(false);
    }
  };

  const handleClear = () => {
    setOrderData({
      ...initialOrderData,
      id: '',
      orderNumber: generateOrderNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: user?.uid || '',
    });
    setLoadedOrderId(null);
    setHasUnsavedChanges(false);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Order_${orderData.orderNumber}`,
  });

  const handleItemsChange = useCallback((newItems: OrderItem[]) => {
    setOrderData(prev => ({ ...prev, items: newItems }));
  }, []);

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    
    const newItems = Array.from(orderData.items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    
    setOrderData(prev => ({ ...prev, items: newItems }));
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerCompany.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Calculate dashboard stats
  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0),
    pendingOrders: orders.filter(o => o.status === 'received').length,
    inProduction: orders.filter(o => o.status === 'in-production').length,
  };

  const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
    <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card text-card-foreground border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Order Management</h1>
              <p className="text-muted-foreground mt-1">Manage textile orders from receipt to delivery</p>
            </div>
            {activeTab === 'form' && (
              <div className="flex items-center space-x-6">
                <span className="text-sm font-medium text-muted-foreground">Order No:</span>
                <span className="ml-2 text-lg font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {orderData.orderNumber}
                </span>
              </div>
            )}
          </div>

          {/* Main Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mt-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'form'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              New Order
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-4 w-4" />
              Orders ({orders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={ShoppingCart}
                label="Total Orders"
                value={stats.totalOrders}
                color="bg-blue-500"
              />
              <StatCard
                icon={Clock}
                label="Active Orders"
                value={stats.activeOrders}
                color="bg-orange-500"
              />
              <StatCard
                icon={CheckCircle}
                label="Completed"
                value={stats.completedOrders}
                color="bg-green-500"
              />
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={`₹${stats.totalRevenue.toFixed(0)}`}
                color="bg-purple-500"
              />
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Order Status Distribution</h3>
                <div className="space-y-3">
                  {ORDER_STATUSES.slice(0, 6).map(status => {
                    const count = orders.filter(o => o.status === status.value).length;
                    const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                    return (
                      <div key={status.value} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{status.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Priority Distribution</h3>
                <div className="space-y-3">
                  {PRIORITY_LEVELS.map(priority => {
                    const count = orders.filter(o => o.priority === priority.value).length;
                    const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                    return (
                      <div key={priority.value} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{priority.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-foreground w-8">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ORDER_STATUSES.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {ORDER_STATUSES.find(s => s.value === order.status)?.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'form' && (
          <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 border border-border">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Order Processing</h2>
                <p className="text-muted-foreground">Create and manage textile orders</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  ORDER_STATUSES.find(s => s.value === orderData.status)?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {ORDER_STATUSES.find(s => s.value === orderData.status)?.label}
                </span>
              </div>
            </div>

            {/* Form Tabs */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mb-6">
              <button
                onClick={() => setActiveFormTab('details')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeFormTab === 'details'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Order Details
              </button>
              <button
                onClick={() => setActiveFormTab('items')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeFormTab === 'items'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Package className="h-4 w-4" />
                Items ({orderData.items.length})
              </button>
              <button
                onClick={() => setActiveFormTab('production')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeFormTab === 'production'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                Production
              </button>
              <button
                onClick={() => setActiveFormTab('shipment')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  activeFormTab === 'shipment'
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Truck className="h-4 w-4" />
                Shipment
              </button>
            </div>

            {/* Form Content */}
            {activeFormTab === 'details' && (
              <OrderForm data={orderData} onChange={setOrderData} />
            )}

            {activeFormTab === 'items' && (
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <OrderItemsTable
                  items={orderData.items}
                  onItemsChange={handleItemsChange}
                />
              </DragDropContext>
            )}

            {activeFormTab === 'production' && (
              <div className="space-y-6">
                <OrderStatusTimeline order={orderData} />
                <ProductionTracker
                  stages={orderData.productionStages}
                  qualityChecks={orderData.qualityChecks}
                  onStagesChange={(stages) => setOrderData(prev => ({ ...prev, productionStages: stages }))}
                  onQualityChecksChange={(checks) => setOrderData(prev => ({ ...prev, qualityChecks: checks }))}
                />
              </div>
            )}

            {activeFormTab === 'shipment' && (
              <ShipmentTracker
                shipmentDetails={orderData.shipmentDetails}
                onShipmentChange={(details) => setOrderData(prev => ({ ...prev, shipmentDetails: details }))}
              />
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap justify-end gap-3 pt-6 border-t border-border">
              <Button variant="outline" onClick={handleClear}>Clear Form</Button>
              <Button 
                onClick={() => setIsSaveDialogOpen(true)} 
                className="bg-[#1A3636] hover:bg-green-900 text-white"
              >
                {loadedOrderId && hasUnsavedChanges ? 'Save Changes' : 'Save Order'}
              </Button>
              <Button 
                onClick={() => setIsViewOrdersOpen(true)} 
                className="bg-[#1A3636] hover:bg-green-900 text-white flex items-center"
              >
                <FolderOpen className="h-5 w-5 mr-2" />
                View Orders
              </Button>
              <Button 
                onClick={handlePrint} 
                className="bg-[#FF9900] hover:bg-orange-500 text-white flex items-center"
              >
                <Printer className="h-5 w-5 mr-2" />
                Print Order
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-card text-card-foreground rounded-lg shadow-sm p-6 border border-border">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by order number, customer, or company..."
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
                      {ORDER_STATUSES.map(status => (
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

            {/* Orders Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium text-foreground">Loading orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-foreground">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                      ? 'No orders found matching your filters' 
                      : 'No orders yet'
                    }
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first order to get started'
                    }
                  </p>
                </div>
              ) : (
                <table className="min-w-full border-collapse border border-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="border border-border px-4 py-3 text-left text-sm font-medium text-foreground">Order #</th>
                      <th className="border border-border px-4 py-3 text-left text-sm font-medium text-foreground">Customer</th>
                      <th className="border border-border px-4 py-3 text-left text-sm font-medium text-foreground">Company</th>
                      <th className="border border-border px-4 py-3 text-center text-sm font-medium text-foreground">Status</th>
                      <th className="border border-border px-4 py-3 text-center text-sm font-medium text-foreground">Priority</th>
                      <th className="border border-border px-4 py-3 text-right text-sm font-medium text-foreground">Total Amount</th>
                      <th className="border border-border px-4 py-3 text-center text-sm font-medium text-foreground">Order Date</th>
                      <th className="border border-border px-4 py-3 text-center text-sm font-medium text-foreground">Delivery Date</th>
                      <th className="border border-border px-4 py-3 text-center text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="border border-border px-4 py-3 text-sm font-mono text-foreground">
                          {order.orderNumber}
                        </td>
                        <td className="border border-border px-4 py-3 text-sm text-foreground">
                          {order.customerName}
                        </td>
                        <td className="border border-border px-4 py-3 text-sm text-foreground">
                          {order.customerCompany}
                        </td>
                        <td className="border border-border px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ORDER_STATUSES.find(s => s.value === order.status)?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {ORDER_STATUSES.find(s => s.value === order.status)?.label}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            PRIORITY_LEVELS.find(p => p.value === order.priority)?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            {PRIORITY_LEVELS.find(p => p.value === order.priority)?.label}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-3 text-sm text-foreground text-right">
                          ₹{order.totalAmount.toFixed(2)}
                        </td>
                        <td className="border border-border px-4 py-3 text-sm text-foreground text-center">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </td>
                        <td className="border border-border px-4 py-3 text-sm text-foreground text-center">
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'TBD'}
                        </td>
                        <td className="border border-border px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setOrderData(order);
                                setLoadedOrderId(order.id);
                                setHasUnsavedChanges(false);
                                setActiveTab('form');
                              }}
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit Order"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentData = orderData;
                                setOrderData(order);
                                setTimeout(() => {
                                  handlePrint();
                                  setOrderData(currentData);
                                }, 100);
                              }}
                              className="text-green-600 hover:text-green-700"
                              title="Print Order"
                            >
                              <Printer className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setOrderToDelete({ id: order.id, name: order.orderNumber });
                                setIsPasswordInputOpen(true);
                                setPasswordAuthError(null);
                              }}
                              className="text-red-600 hover:text-red-700"
                              title="Delete Order"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Print Component */}
      <div style={{ display: 'none' }}>
        <PrintableOrder ref={printRef} data={orderData} />
      </div>

      {/* Dialogs */}
      <SaveRecipeDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setIsSaveDialogOpen(false)}
        onSave={handleSaveOrder}
        isSaving={isSaving}
      />

      <ViewRecipesDialog
        isOpen={isViewOrdersOpen}
        onClose={() => setIsViewOrdersOpen(false)}
        onRetrieve={handleLoadOrder}
        onDelete={(id, name) => {
          setOrderToDelete({ id, name });
          setIsPasswordInputOpen(true);
          setPasswordAuthError(null);
        }}
        user={user}
        collectionPath="orders"
        itemType="recipe"
      />

      {alertDialog && (
        <AlertDialog
          isOpen={alertDialog.isOpen}
          onClose={() => setAlertDialog(null)}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
          onConfirm={alertDialog.onConfirm}
          onCancel={alertDialog.onCancel}
          confirmText={alertDialog.confirmText}
          cancelText={alertDialog.cancelText}
          isAuthenticating={alertDialog.isAuthenticating}
        />
      )}

      {isPasswordInputOpen && (
        <PasswordInputDialog
          isOpen={isPasswordInputOpen}
          onClose={() => {
            setIsPasswordInputOpen(false);
            setOrderToDelete(null);
            setPasswordAuthError(null);
          }}
          onConfirm={handlePasswordAuthorization}
          title="Authorize Deletion"
          message="Please enter your password to authorize the deletion of this order."
          isAuthenticating={isAuthenticatingPassword}
          error={passwordAuthError}
        />
      )}
    </div>
  );
}