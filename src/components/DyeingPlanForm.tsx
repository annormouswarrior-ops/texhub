import React from 'react';
import { DyeingPlan, DYEING_METHODS, DYEING_TYPES, PLAN_STATUSES, PRIORITY_LEVELS } from '../types/planning';
import { TypedMemoryInput } from './TypedMemoryInput';
import * as Select from '@radix-ui/react-select';

interface DyeingPlanFormProps {
  data: DyeingPlan;
  onChange: (data: DyeingPlan) => void;
}

export function DyeingPlanForm({ data, onChange }: DyeingPlanFormProps) {
  const handleChange = (field: keyof DyeingPlan, value: string | number) => {
    const newData = {
      ...data,
      [field]: value,
    };

    // Auto-calculate total water when fabric weight or liquor ratio changes
    if (field === 'fabricWeight' || field === 'liquorRatio') {
      const fabricWeight = field === 'fabricWeight' ? (value as number) : data.fabricWeight;
      const liquorRatio = field === 'liquorRatio' ? (value as number) : data.liquorRatio;
      newData.totalWater = fabricWeight * liquorRatio;
    }

    // Auto-calculate scheduled end time when start time or duration changes
    if (field === 'scheduledStartTime' || field === 'estimatedDuration') {
      const startTime = field === 'scheduledStartTime' ? (value as string) : data.scheduledStartTime;
      const duration = field === 'estimatedDuration' ? (value as number) : data.estimatedDuration;
      
      if (startTime && duration) {
        const start = new Date(`${data.planDate}T${startTime}`);
        const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
        newData.scheduledEndTime = end.toTimeString().slice(0, 5);
      }
    }

    onChange(newData);
  };

  const inputClasses = "mt-1 block w-full rounded-lg border border-border shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground py-2 px-3 transition-all duration-200 hover:border-primary/50";
  const selectTriggerClasses = "flex items-center justify-between mt-1 w-full rounded-lg border border-border shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background text-foreground py-2 px-3 transition-all duration-200 hover:border-primary/50";
  const labelClasses = "block text-sm font-semibold text-muted-foreground mb-1";

  const SelectItemContent = ({ children, value }: { children: React.ReactNode; value: string }) => (
    <Select.Item
      value={value}
      className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-foreground text-sm outline-none data-[highlighted]:bg-primary/20"
    >
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );

  return (
    <div className="space-y-8">
      {/* Plan Header */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Plan Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClasses}>Plan Name</label>
            <TypedMemoryInput
              value={data.planName}
              onChange={(e) => handleChange('planName', e.target.value)}
              className={inputClasses}
              storageKey="planName"
              placeholder="Enter plan name"
            />
          </div>
          <div>
            <label className={labelClasses}>Plan Date</label>
            <input
              type="date"
              value={data.planDate}
              onChange={(e) => handleChange('planDate', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Status</label>
            <Select.Root value={data.status} onValueChange={(value) => handleChange('status', value)}>
              <Select.Trigger className={selectTriggerClasses}>
                <Select.Value placeholder="Select Status" />
                <Select.Icon>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden rounded-lg bg-card border border-border shadow-lg z-50">
                  <Select.Viewport className="p-1">
                    {PLAN_STATUSES.map(status => (
                      <SelectItemContent key={status.value} value={status.value}>{status.label}</SelectItemContent>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
          <div>
            <label className={labelClasses}>Priority</label>
            <Select.Root value={data.priority} onValueChange={(value) => handleChange('priority', value)}>
              <Select.Trigger className={selectTriggerClasses}>
                <Select.Value placeholder="Select Priority" />
                <Select.Icon>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="overflow-hidden rounded-lg bg-card border border-border shadow-lg z-50">
                  <Select.Viewport className="p-1">
                    {PRIORITY_LEVELS.map(priority => (
                      <SelectItemContent key={priority.value} value={priority.value}>{priority.label}</SelectItemContent>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </div>

      {/* Customer & Order Details */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Customer & Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClasses}>Customer Name</label>
            <TypedMemoryInput
              value={data.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              className={inputClasses}
              storageKey="planCustomerName"
              placeholder="Customer Name"
            />
          </div>
          <div>
            <label className={labelClasses}>Order Number</label>
            <TypedMemoryInput
              value={data.orderNumber}
              onChange={(e) => handleChange('orderNumber', e.target.value)}
              className={inputClasses}
              storageKey="planOrderNumber"
              placeholder="Order Number"
            />
          </div>
          <div>
            <label className={labelClasses}>Delivery Date</label>
            <input
              type="date"
              value={data.deliveryDate}
              onChange={(e) => handleChange('deliveryDate', e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Fabric & Dyeing Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Fabric Details</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Fabric Type</label>
              <TypedMemoryInput
                value={data.fabricType}
                onChange={(e) => handleChange('fabricType', e.target.value)}
                className={inputClasses}
                storageKey="planFabricType"
                placeholder="e.g., 100% Cotton"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Fabric Weight (kg)</label>
                <input
                  type="number"
                  value={data.fabricWeight || ''}
                  onChange={(e) => handleChange('fabricWeight', parseFloat(e.target.value) || 0)}
                  className={inputClasses}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className={labelClasses}>Fabric Width</label>
                <TypedMemoryInput
                  value={data.fabricWidth || ''}
                  onChange={(e) => handleChange('fabricWidth', e.target.value)}
                  className={inputClasses}
                  storageKey="planFabricWidth"
                  placeholder="e.g., 60 inches"
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>GSM</label>
              <TypedMemoryInput
                value={data.gsm || ''}
                onChange={(e) => handleChange('gsm', e.target.value)}
                className={inputClasses}
                storageKey="planGsm"
                placeholder="e.g., 180"
              />
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Dyeing Specifications</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Color</label>
                <TypedMemoryInput
                  value={data.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className={inputClasses}
                  storageKey="planColor"
                  placeholder="Color name"
                />
              </div>
              <div>
                <label className={labelClasses}>Color Code</label>
                <TypedMemoryInput
                  value={data.colorCode || ''}
                  onChange={(e) => handleChange('colorCode', e.target.value)}
                  className={inputClasses}
                  storageKey="planColorCode"
                  placeholder="e.g., #FF5733"
                />
              </div>
            </div>
            <div>
              <label className={labelClasses}>Dyeing Method</label>
              <Select.Root value={data.dyeingMethod} onValueChange={(value) => handleChange('dyeingMethod', value)}>
                <Select.Trigger className={selectTriggerClasses}>
                  <Select.Value placeholder="Select Method" />
                  <Select.Icon>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden rounded-lg bg-card border border-border shadow-lg z-50">
                    <Select.Viewport className="p-1 max-h-48 overflow-y-auto">
                      {DYEING_METHODS.map(method => (
                        <SelectItemContent key={method} value={method}>{method}</SelectItemContent>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            <div>
              <label className={labelClasses}>Dyeing Type</label>
              <Select.Root value={data.dyeingType} onValueChange={(value) => handleChange('dyeingType', value)}>
                <Select.Trigger className={selectTriggerClasses}>
                  <Select.Value placeholder="Select Type" />
                  <Select.Icon>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden rounded-lg bg-card border border-border shadow-lg z-50">
                    <Select.Viewport className="p-1">
                      {DYEING_TYPES.map(type => (
                        <SelectItemContent key={type} value={type}>{type}</SelectItemContent>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Liquor Ratio</label>
                <input
                  type="number"
                  value={data.liquorRatio || ''}
                  onChange={(e) => handleChange('liquorRatio', parseFloat(e.target.value) || 0)}
                  className={inputClasses}
                  placeholder="8"
                  min="1"
                  step="0.1"
                />
              </div>
              <div>
                <label className={labelClasses}>Total Water (L)</label>
                <input
                  type="number"
                  value={data.totalWater || ''}
                  readOnly
                  className={`${inputClasses} bg-muted/30`}
                  placeholder="Auto-calculated"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Machine & Scheduling */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Machine & Scheduling</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClasses}>Machine No</label>
            <TypedMemoryInput
              value={data.machineNo}
              onChange={(e) => handleChange('machineNo', e.target.value)}
              className={inputClasses}
              storageKey="planMachineNo"
              placeholder="Machine Number"
            />
          </div>
          <div>
            <label className={labelClasses}>Machine Capacity (kg)</label>
            <input
              type="number"
              value={data.machineCapacity || ''}
              onChange={(e) => handleChange('machineCapacity', parseFloat(e.target.value) || 0)}
              className={inputClasses}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
          <div>
            <label className={labelClasses}>Estimated Duration (hours)</label>
            <input
              type="number"
              value={data.estimatedDuration || ''}
              onChange={(e) => handleChange('estimatedDuration', parseFloat(e.target.value) || 0)}
              className={inputClasses}
              placeholder="8"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label className={labelClasses}>Assigned To</label>
            <TypedMemoryInput
              value={data.assignedTo || ''}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
              className={inputClasses}
              storageKey="planAssignedTo"
              placeholder="Operator Name"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className={labelClasses}>Scheduled Start Time</label>
            <input
              type="time"
              value={data.scheduledStartTime}
              onChange={(e) => handleChange('scheduledStartTime', e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Scheduled End Time</label>
            <input
              type="time"
              value={data.scheduledEndTime}
              readOnly
              className={`${inputClasses} bg-muted/30`}
              placeholder="Auto-calculated"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Special Instructions</h3>
          <textarea
            value={data.specialInstructions || ''}
            onChange={(e) => handleChange('specialInstructions', e.target.value)}
            className={`${inputClasses} min-h-[100px]`}
            rows={4}
            placeholder="Any special requirements or instructions for this dyeing plan..."
          />
        </div>
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Internal Notes</h3>
          <textarea
            value={data.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            className={`${inputClasses} min-h-[100px]`}
            rows={4}
            placeholder="Internal notes for production team..."
          />
        </div>
      </div>
    </div>
  );
}