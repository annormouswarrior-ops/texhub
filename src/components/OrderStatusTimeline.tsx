import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Package, 
  Truck, 
  MapPin,
  Calendar
} from 'lucide-react';
import { Order, ORDER_STATUSES } from '../types/order';

interface OrderStatusTimelineProps {
  order: Order;
}

const statusIcons = {
  received: Clock,
  confirmed: CheckCircle,
  'in-production': AlertTriangle,
  'quality-check': CheckCircle,
  'ready-to-ship': Package,
  shipped: Truck,
  delivered: MapPin,
  cancelled: AlertTriangle,
};

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({ order }) => {
  const getStatusIndex = (status: string) => {
    return ORDER_STATUSES.findIndex(s => s.value === status);
  };

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-6">Order Status Timeline</h3>
      
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
        
        <div className="space-y-6">
          {ORDER_STATUSES.filter(s => s.value !== 'cancelled').map((status, index) => {
            const Icon = statusIcons[status.value];
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const isPending = index > currentStatusIndex;
            
            return (
              <motion.div
                key={status.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center"
              >
                {/* Timeline Dot */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  isCompleted ? 'bg-green-100 border-green-500' :
                  isCurrent ? 'bg-blue-100 border-blue-500' :
                  'bg-gray-100 border-gray-300'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    isCompleted ? 'text-green-600' :
                    isCurrent ? 'text-blue-600' :
                    'text-gray-400'
                  }`} />
                </div>
                
                {/* Status Content */}
                <div className="ml-6 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${
                        isCompleted ? 'text-green-600' :
                        isCurrent ? 'text-blue-600' :
                        'text-gray-400'
                      }`}>
                        {status.label}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {isCompleted ? 'Completed' :
                         isCurrent ? 'In Progress' :
                         'Pending'}
                      </p>
                    </div>
                    
                    {/* Estimated/Actual Dates */}
                    <div className="text-right">
                      {index === 0 && (
                        <div className="text-sm text-muted-foreground">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          {new Date(order.orderDate).toLocaleDateString()}
                        </div>
                      )}
                      {status.value === 'delivered' && order.deliveryDate && (
                        <div className="text-sm text-muted-foreground">
                          <Calendar className="inline h-4 w-4 mr-1" />
                          {new Date(order.deliveryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Additional Status Information */}
                  {isCurrent && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        {status.value === 'received' && 'Order has been received and is being reviewed.'}
                        {status.value === 'confirmed' && 'Order confirmed and ready for production planning.'}
                        {status.value === 'in-production' && 'Order is currently in production.'}
                        {status.value === 'quality-check' && 'Order is undergoing quality inspection.'}
                        {status.value === 'ready-to-ship' && 'Order is ready for shipment.'}
                        {status.value === 'shipped' && 'Order has been shipped to customer.'}
                        {status.value === 'delivered' && 'Order has been delivered successfully.'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* Cancelled Status (if applicable) */}
        {order.status === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative flex items-center mt-6"
          >
            <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 bg-red-100 border-red-500">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-6 flex-1">
              <h4 className="font-medium text-red-600">Order Cancelled</h4>
              <p className="text-sm text-muted-foreground">This order has been cancelled</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};