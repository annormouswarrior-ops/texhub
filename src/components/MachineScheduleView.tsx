import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Settings, 
  AlertTriangle, 
  CheckCircle, 
  Wrench,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { MachineSchedule, ScheduledSlot } from '../types/planning';
import { Button } from './ui/button';

interface MachineScheduleViewProps {
  machines: MachineSchedule[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const MachineScheduleView: React.FC<MachineScheduleViewProps> = ({
  machines,
  selectedDate,
  onDateChange,
}) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'breakdown': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'occupied': return <Play className="h-4 w-4" />;
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'breakdown': return <AlertTriangle className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getSlotForTime = (machine: MachineSchedule, time: string): ScheduledSlot | null => {
    const currentDateTime = new Date(`${selectedDate}T${time}`);
    
    return machine.scheduledPlans.find(slot => {
      const slotStart = new Date(`${selectedDate}T${slot.startTime}`);
      const slotEnd = new Date(`${selectedDate}T${slot.endTime}`);
      return currentDateTime >= slotStart && currentDateTime < slotEnd;
    }) || null;
  };

  return (
    <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-foreground">Machine Schedule</h3>
            <p className="text-muted-foreground">View and manage machine availability and scheduling</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-lg border border-border bg-background text-foreground py-2 px-3"
          />
          
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week View
            </button>
          </div>
        </div>
      </div>

      {/* Machine Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {['available', 'occupied', 'maintenance', 'breakdown'].map((status) => {
          const count = machines.filter(m => m.status === status).length;
          return (
            <div key={status} className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground capitalize">{status}</p>
                  <p className="text-xl font-bold text-foreground">{count}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid grid-cols-25 gap-1 mb-2">
            <div className="col-span-3 p-2 bg-muted/50 rounded-lg font-medium text-center text-foreground">
              Machine
            </div>
            {timeSlots.map((time) => (
              <div key={time} className="p-1 text-xs text-center text-muted-foreground">
                {time}
              </div>
            ))}
          </div>

          {/* Machine Rows */}
          <div className="space-y-2">
            {machines.map((machine) => (
              <motion.div
                key={machine.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-25 gap-1"
              >
                {/* Machine Info */}
                <div className="col-span-3 p-3 bg-card border border-border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{machine.machineNo}</p>
                      <p className="text-xs text-muted-foreground">{machine.machineType}</p>
                      <p className="text-xs text-muted-foreground">{machine.capacity}kg capacity</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(machine.status)}`}>
                      {machine.status}
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                {timeSlots.map((time) => {
                  const slot = getSlotForTime(machine, time);
                  return (
                    <div
                      key={time}
                      className={`h-16 rounded border border-border relative ${
                        slot 
                          ? `${getPriorityColor(slot.priority)} text-white` 
                          : machine.status === 'available' 
                            ? 'bg-green-50 hover:bg-green-100' 
                            : 'bg-gray-50'
                      } transition-colors cursor-pointer`}
                      title={slot ? `${slot.planName} (${slot.priority} priority)` : `${time} - Available`}
                    >
                      {slot && (
                        <div className="absolute inset-0 p-1 flex flex-col justify-center">
                          <p className="text-xs font-medium truncate">{slot.planName}</p>
                          <p className="text-xs opacity-90">{slot.startTime}-{slot.endTime}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
          <span className="text-sm text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Urgent</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <span className="text-sm text-muted-foreground">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Medium Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span className="text-sm text-muted-foreground">Low Priority</span>
        </div>
      </div>
    </div>
  );
};