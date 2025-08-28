import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Beaker, 
  Droplets, 
  Sparkles, 
  CheckCircle, 
  Package, 
  Clock, 
  User, 
  Play, 
  Pause, 
  Check,
  AlertTriangle
} from 'lucide-react';
import { ProductionStage, QualityCheck } from '../types/order';
import { Button } from './ui/button';
import { Input } from './ui/input';
import * as Select from '@radix-ui/react-select';

interface ProductionTrackerProps {
  stages: ProductionStage[];
  qualityChecks: QualityCheck[];
  onStagesChange: (stages: ProductionStage[]) => void;
  onQualityChecksChange: (checks: QualityCheck[]) => void;
}

const stageIcons = {
  preparation: Settings,
  dyeing: Beaker,
  washing: Droplets,
  finishing: Sparkles,
  'quality-check': CheckCircle,
  packaging: Package,
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  'on-hold': 'bg-red-100 text-red-800',
};

export const ProductionTracker: React.FC<ProductionTrackerProps> = ({
  stages,
  qualityChecks,
  onStagesChange,
  onQualityChecksChange,
}) => {
  const [activeTab, setActiveTab] = useState<'stages' | 'quality'>('stages');
  const [newQualityCheck, setNewQualityCheck] = useState<Partial<QualityCheck>>({
    checkType: 'in-process',
    inspector: '',
    checkDate: new Date().toISOString().split('T')[0],
    status: 'passed',
    notes: '',
  });

  const updateStage = (stageId: string, field: keyof ProductionStage, value: any) => {
    const updatedStages = stages.map(stage => {
      if (stage.id === stageId) {
        const updatedStage = { ...stage, [field]: value };
        
        // Auto-set dates when status changes
        if (field === 'status') {
          if (value === 'in-progress' && !stage.startDate) {
            updatedStage.startDate = new Date().toISOString();
          } else if (value === 'completed' && !stage.endDate) {
            updatedStage.endDate = new Date().toISOString();
            if (stage.startDate) {
              const start = new Date(stage.startDate);
              const end = new Date();
              updatedStage.actualDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
            }
          }
        }
        
        return updatedStage;
      }
      return stage;
    });
    onStagesChange(updatedStages);
  };

  const addQualityCheck = () => {
    if (!newQualityCheck.inspector || !newQualityCheck.notes) return;
    
    const qualityCheck: QualityCheck = {
      id: Date.now().toString(),
      checkType: newQualityCheck.checkType as 'incoming' | 'in-process' | 'final',
      inspector: newQualityCheck.inspector!,
      checkDate: newQualityCheck.checkDate!,
      status: newQualityCheck.status as 'passed' | 'failed' | 'conditional',
      notes: newQualityCheck.notes!,
    };
    
    onQualityChecksChange([...qualityChecks, qualityCheck]);
    setNewQualityCheck({
      checkType: 'in-process',
      inspector: '',
      checkDate: new Date().toISOString().split('T')[0],
      status: 'passed',
      notes: '',
    });
  };

  const getStageProgress = () => {
    const completedStages = stages.filter(stage => stage.status === 'completed').length;
    return (completedStages / stages.length) * 100;
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">Production Tracking</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Progress: {Math.round(getStageProgress())}%
          </div>
          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${getStageProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'stages'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Production Stages
        </button>
        <button
          onClick={() => setActiveTab('quality')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'quality'
              ? 'bg-card shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Quality Checks ({qualityChecks.length})
        </button>
      </div>

      {activeTab === 'stages' ? (
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stageIcons[stage.stage];
            const isActive = stage.status === 'in-progress';
            const isCompleted = stage.status === 'completed';
            
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  isActive ? 'border-primary bg-primary/5' : 
                  isCompleted ? 'border-green-500 bg-green-50' : 
                  'border-border bg-background'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${
                      isCompleted ? 'bg-green-100 text-green-600' :
                      isActive ? 'bg-primary/10 text-primary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground capitalize">
                        {stage.stage.replace('-', ' ')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Est. {stage.estimatedDuration}h
                        {stage.actualDuration && ` | Actual: ${stage.actualDuration}h`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[stage.status]}`}>
                      {stage.status.replace('-', ' ')}
                    </span>
                    
                    <Select.Root 
                      value={stage.status} 
                      onValueChange={(value) => updateStage(stage.id, 'status', value)}
                    >
                      <Select.Trigger className="flex items-center justify-between w-32 rounded-md border border-border bg-background text-foreground py-1 px-2 text-sm">
                        <Select.Value />
                        <Select.Icon>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden rounded-lg bg-surface border border-border shadow-lg z-50">
                          <Select.Viewport className="p-1">
                            <Select.Item value="pending" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                              <Select.ItemText>Pending</Select.ItemText>
                            </Select.Item>
                            <Select.Item value="in-progress" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                              <Select.ItemText>In Progress</Select.ItemText>
                            </Select.Item>
                            <Select.Item value="completed" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                              <Select.ItemText>Completed</Select.ItemText>
                            </Select.Item>
                            <Select.Item value="on-hold" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                              <Select.ItemText>On Hold</Select.ItemText>
                            </Select.Item>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Assigned To</label>
                    <Input
                      value={stage.assignedTo}
                      onChange={(e) => updateStage(stage.id, 'assignedTo', e.target.value)}
                      placeholder="Operator name"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Machine No</label>
                    <Input
                      value={stage.machineNo || ''}
                      onChange={(e) => updateStage(stage.id, 'machineNo', e.target.value)}
                      placeholder="Machine number"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Batch No</label>
                    <Input
                      value={stage.batchNo || ''}
                      onChange={(e) => updateStage(stage.id, 'batchNo', e.target.value)}
                      placeholder="Batch number"
                      className="text-sm"
                    />
                  </div>
                </div>
                
                {stage.notes !== undefined && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                    <textarea
                      value={stage.notes}
                      onChange={(e) => updateStage(stage.id, 'notes', e.target.value)}
                      placeholder="Stage notes..."
                      className="w-full rounded-md border border-border bg-background text-foreground py-2 px-3 text-sm"
                      rows={2}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Add Quality Check Form */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-4">Add Quality Check</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Select.Root 
                  value={newQualityCheck.checkType} 
                  onValueChange={(value) => setNewQualityCheck(prev => ({ ...prev, checkType: value as any }))}
                >
                  <Select.Trigger className="flex items-center justify-between w-full rounded-md border border-border bg-background text-foreground py-2 px-3 text-sm">
                    <Select.Value placeholder="Check Type" />
                    <Select.Icon>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-lg bg-surface border border-border shadow-lg z-50">
                      <Select.Viewport className="p-1">
                        <Select.Item value="incoming" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                          <Select.ItemText>Incoming</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="in-process" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                          <Select.ItemText>In-Process</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="final" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                          <Select.ItemText>Final</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <div>
                <Input
                  value={newQualityCheck.inspector || ''}
                  onChange={(e) => setNewQualityCheck(prev => ({ ...prev, inspector: e.target.value }))}
                  placeholder="Inspector name"
                />
              </div>
              <div>
                <Select.Root 
                  value={newQualityCheck.status} 
                  onValueChange={(value) => setNewQualityCheck(prev => ({ ...prev, status: value as any }))}
                >
                  <Select.Trigger className="flex items-center justify-between w-full rounded-md border border-border bg-background text-foreground py-2 px-3 text-sm">
                    <Select.Value placeholder="Status" />
                    <Select.Icon>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-lg bg-surface border border-border shadow-lg z-50">
                      <Select.Viewport className="p-1">
                        <Select.Item value="passed" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                          <Select.ItemText>Passed</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="failed" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                          <Select.ItemText>Failed</Select.ItemText>
                        </Select.Item>
                        <Select.Item value="conditional" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                          <Select.ItemText>Conditional</Select.ItemText>
                        </Select.Item>
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
              <div>
                <Button onClick={addQualityCheck} className="w-full">
                  Add Check
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <textarea
                value={newQualityCheck.notes || ''}
                onChange={(e) => setNewQualityCheck(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Quality check notes..."
                className="w-full rounded-md border border-border bg-background text-foreground py-2 px-3 text-sm"
                rows={2}
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('stages')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'stages'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Production Stages
            </button>
            <button
              onClick={() => setActiveTab('quality')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'quality'
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Quality Checks
            </button>
          </div>

          {activeTab === 'stages' ? (
            <div className="space-y-4">
              {stages.map((stage, index) => {
                const Icon = stageIcons[stage.stage];
                const isActive = stage.status === 'in-progress';
                const isCompleted = stage.status === 'completed';
                
                return (
                  <motion.div
                    key={stage.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      isActive ? 'border-primary bg-primary/5' : 
                      isCompleted ? 'border-green-500 bg-green-50' : 
                      'border-border bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          isCompleted ? 'bg-green-100 text-green-600' :
                          isActive ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground capitalize">
                            {stage.stage.replace('-', ' ')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Est. {stage.estimatedDuration}h
                            {stage.actualDuration && ` | Actual: ${stage.actualDuration}h`}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[stage.status]}`}>
                          {stage.status.replace('-', ' ')}
                        </span>
                        
                        <Select.Root 
                          value={stage.status} 
                          onValueChange={(value) => updateStage(stage.id, 'status', value)}
                        >
                          <Select.Trigger className="flex items-center justify-between w-32 rounded-md border border-border bg-background text-foreground py-1 px-2 text-sm">
                            <Select.Value />
                            <Select.Icon>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </Select.Icon>
                          </Select.Trigger>
                          <Select.Portal>
                            <Select.Content className="overflow-hidden rounded-lg bg-surface border border-border shadow-lg z-50">
                              <Select.Viewport className="p-1">
                                <Select.Item value="pending" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                                  <Select.ItemText>Pending</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="in-progress" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                                  <Select.ItemText>In Progress</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="completed" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                                  <Select.ItemText>Completed</Select.ItemText>
                                </Select.Item>
                                <Select.Item value="on-hold" className="relative flex items-center rounded-md py-2 pl-3 pr-9 text-text text-sm outline-none data-[highlighted]:bg-primary/20">
                                  <Select.ItemText>On Hold</Select.ItemText>
                                </Select.Item>
                              </Select.Viewport>
                            </Select.Content>
                          </Select.Portal>
                        </Select.Root>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Assigned To</label>
                        <Input
                          value={stage.assignedTo}
                          onChange={(e) => updateStage(stage.id, 'assignedTo', e.target.value)}
                          placeholder="Operator name"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Machine No</label>
                        <Input
                          value={stage.machineNo || ''}
                          onChange={(e) => updateStage(stage.id, 'machineNo', e.target.value)}
                          placeholder="Machine number"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Batch No</label>
                        <Input
                          value={stage.batchNo || ''}
                          onChange={(e) => updateStage(stage.id, 'batchNo', e.target.value)}
                          placeholder="Batch number"
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    {stage.notes !== undefined && (
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
                        <textarea
                          value={stage.notes}
                          onChange={(e) => updateStage(stage.id, 'notes', e.target.value)}
                          placeholder="Stage notes..."
                          className="w-full rounded-md border border-border bg-background text-foreground py-2 px-3 text-sm"
                          rows={2}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {qualityChecks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>No quality checks recorded yet</p>
                  <p className="text-sm">Add quality checks to track inspection results</p>
                </div>
              ) : (
                qualityChecks.map((check) => (
                  <div key={check.id} className="p-4 rounded-lg border border-border bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          check.status === 'passed' ? 'bg-green-100 text-green-600' :
                          check.status === 'failed' ? 'bg-red-100 text-red-600' :
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {check.status === 'passed' ? <CheckCircle className="h-4 w-4" /> :
                           check.status === 'failed' ? <AlertTriangle className="h-4 w-4" /> :
                           <Clock className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground capitalize">
                            {check.checkType.replace('-', ' ')} Quality Check
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            By {check.inspector} on {new Date(check.checkDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        check.status === 'passed' ? 'bg-green-100 text-green-800' :
                        check.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{check.notes}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};