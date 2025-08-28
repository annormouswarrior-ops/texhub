import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Package, MapPin, Phone, Calendar, DollarSign, Weight, Ruler } from 'lucide-react';
import { ShipmentDetails } from '../types/order';
import { Input } from './ui/input';
import { TypedMemoryInput } from './TypedMemoryInput';

interface ShipmentTrackerProps {
  shipmentDetails: ShipmentDetails | undefined;
  onShipmentChange: (details: ShipmentDetails) => void;
}

export const ShipmentTracker: React.FC<ShipmentTrackerProps> = ({
  shipmentDetails,
  onShipmentChange,
}) => {
  const handleChange = (field: keyof ShipmentDetails, value: string | number) => {
    const updatedDetails = {
      ...shipmentDetails,
      [field]: value,
    } as ShipmentDetails;
    onShipmentChange(updatedDetails);
  };

  const inputClasses = "mt-1 block w-full rounded-lg border border-border shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 bg-surface text-text py-2 px-3 transition-all duration-200 hover:border-primary/50";
  const labelClasses = "block text-sm font-semibold text-textSecondary mb-1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-6 rounded-lg border border-border"
    >
      <div className="flex items-center gap-2 mb-6">
        <Truck className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Shipment Details</h3>
      </div>

      <div className="space-y-6">
        {/* Tracking Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>Tracking Number</label>
            <Input
              value={shipmentDetails?.trackingNumber || ''}
              onChange={(e) => handleChange('trackingNumber', e.target.value)}
              className={inputClasses}
              placeholder="TRK123456789"
            />
          </div>
          <div>
            <label className={labelClasses}>Carrier</label>
            <TypedMemoryInput
              value={shipmentDetails?.carrier || ''}
              onChange={(e) => handleChange('carrier', e.target.value)}
              className={inputClasses}
              storageKey="shipmentCarrier"
              placeholder="DHL, FedEx, Local Courier"
            />
          </div>
          <div>
            <label className={labelClasses}>Shipping Method</label>
            <TypedMemoryInput
              value={shipmentDetails?.shippingMethod || ''}
              onChange={(e) => handleChange('shippingMethod', e.target.value)}
              className={inputClasses}
              storageKey="shipmentMethod"
              placeholder="Express, Standard, Economy"
            />
          </div>
        </div>

        {/* Delivery Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Estimated Delivery</label>
            <input
              type="date"
              value={shipmentDetails?.estimatedDelivery || ''}
              onChange={(e) => handleChange('estimatedDelivery', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Actual Delivery</label>
            <input
              type="date"
              value={shipmentDetails?.actualDelivery || ''}
              onChange={(e) => handleChange('actualDelivery', e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Package Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>Shipping Cost</label>
            <input
              type="number"
              value={shipmentDetails?.shippingCost || ''}
              onChange={(e) => handleChange('shippingCost', parseFloat(e.target.value) || 0)}
              className={inputClasses}
              placeholder="0.00"
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className={labelClasses}>Package Weight (kg)</label>
            <input
              type="number"
              value={shipmentDetails?.packageWeight || ''}
              onChange={(e) => handleChange('packageWeight', parseFloat(e.target.value) || 0)}
              className={inputClasses}
              placeholder="0.00"
              min="0"
              step="any"
            />
          </div>
          <div>
            <label className={labelClasses}>Package Dimensions</label>
            <Input
              value={shipmentDetails?.packageDimensions || ''}
              onChange={(e) => handleChange('packageDimensions', e.target.value)}
              className={inputClasses}
              placeholder="L x W x H (cm)"
            />
          </div>
        </div>

        {/* Delivery Information */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Delivery Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Contact Person</label>
              <TypedMemoryInput
                value={shipmentDetails?.contactPerson || ''}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                className={inputClasses}
                storageKey="shipmentContactPerson"
                placeholder="Contact Person Name"
              />
            </div>
            <div>
              <label className={labelClasses}>Contact Phone</label>
              <TypedMemoryInput
                type="tel"
                value={shipmentDetails?.contactPhone || ''}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                className={inputClasses}
                storageKey="shipmentContactPhone"
                placeholder="Contact Phone Number"
              />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Delivery Address</label>
            <textarea
              value={shipmentDetails?.deliveryAddress || ''}
              onChange={(e) => handleChange('deliveryAddress', e.target.value)}
              className={`${inputClasses} min-h-[80px]`}
              rows={3}
              placeholder="Complete delivery address"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};