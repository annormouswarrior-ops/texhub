import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { ChemicalRequirement } from '../types/planning';
import { Button } from './ui/button';
import { Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { TypedMemoryInput } from './TypedMemoryInput';

interface ChemicalRequirementsTableProps {
  requirements: ChemicalRequirement[];
  onRequirementsChange: (requirements: ChemicalRequirement[]) => void;
  fabricWeight: number;
  totalWater: number;
}

export const ChemicalRequirementsTable: React.FC<ChemicalRequirementsTableProps> = ({
  requirements,
  onRequirementsChange,
  fabricWeight,
  totalWater,
}) => {
  const addNewRequirement = () => {
    const newRequirement: ChemicalRequirement = {
      id: Date.now().toString(),
      chemicalName: '',
      dosing: undefined,
      shade: undefined,
      requiredQuantity: 0,
      availableStock: 0,
      needToPurchase: 0,
      unitPrice: 0,
      totalCost: 0,
      supplier: '',
      notes: '',
    };
    onRequirementsChange([...requirements, newRequirement]);
  };

  const removeRequirement = (index: number) => {
    onRequirementsChange(requirements.filter((_, i) => i !== index));
  };

  const updateRequirement = (index: number, field: keyof ChemicalRequirement, value: any) => {
    const newRequirements = [...requirements];
    const currentReq = { ...newRequirements[index] };

    if (field === 'dosing') {
      const dosing = value === '' ? undefined : parseFloat(value);
      currentReq.dosing = dosing;
      currentReq.shade = undefined; // Clear shade if dosing is entered
      if (dosing && totalWater) {
        currentReq.requiredQuantity = (dosing * totalWater) / 1000; // Convert g/l to kg
      }
    } else if (field === 'shade') {
      const shade = value === '' ? undefined : parseFloat(value);
      currentReq.shade = shade;
      currentReq.dosing = undefined; // Clear dosing if shade is entered
      if (shade && fabricWeight) {
        currentReq.requiredQuantity = (shade / 100) * fabricWeight;
      }
    } else if (field === 'requiredQuantity' || field === 'availableStock') {
      const numValue = parseFloat(value) || 0;
      currentReq[field] = numValue;
      
      // Calculate need to purchase
      if (field === 'requiredQuantity' || field === 'availableStock') {
        const required = field === 'requiredQuantity' ? numValue : currentReq.requiredQuantity;
        const available = field === 'availableStock' ? numValue : currentReq.availableStock;
        currentReq.needToPurchase = Math.max(0, required - available);
      }
    } else if (field === 'unitPrice') {
      currentReq.unitPrice = parseFloat(value) || 0;
    } else {
      currentReq[field] = value;
    }

    // Recalculate total cost
    currentReq.totalCost = currentReq.needToPurchase * currentReq.unitPrice;

    newRequirements[index] = currentReq;
    onRequirementsChange(newRequirements);
  };

  const borderStyle = "border border-border";
  const headerCellStyle = `${borderStyle} px-3 py-2 text-center bg-muted/50 font-medium text-foreground`;
  const dataCellStyle = `${borderStyle} px-2 py-1.5 text-center bg-background`;

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Chemical Requirements</h3>
        <Button
          onClick={addNewRequirement}
          variant="secondary"
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Chemical
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={headerCellStyle}>Chemical Name</th>
              <th className={headerCellStyle}>Dosing (g/l)</th>
              <th className={headerCellStyle}>Shade (%)</th>
              <th className={headerCellStyle}>Required (kg)</th>
              <th className={headerCellStyle}>Available (kg)</th>
              <th className={headerCellStyle}>Need to Purchase</th>
              <th className={headerCellStyle}>Unit Price</th>
              <th className={headerCellStyle}>Total Cost</th>
              <th className={headerCellStyle}>Supplier</th>
              <th className={headerCellStyle}>Actions</th>
            </tr>
          </thead>
          <Droppable droppableId="chemicalRequirements">
            {(providedDroppable) => (
              <tbody
                className="bg-background"
                ref={providedDroppable.innerRef}
                {...providedDroppable.droppableProps}
              >
                {requirements.map((req, index) => (
                  <Draggable key={req.id} draggableId={req.id} index={index}>
                    {(providedDraggable, snapshot) => (
                      <tr
                        ref={providedDraggable.innerRef}
                        {...providedDraggable.draggableProps}
                        style={{
                          ...providedDraggable.draggableProps.style,
                          backgroundColor: snapshot.isDragging ? 'hsl(var(--muted))' : 'hsl(var(--background))',
                          boxShadow: snapshot.isDragging ? '0 4px 8px rgba(0,0,0,0.1)' : 'none',
                        }}
                        className={`${snapshot.isDragging ? 'shadow-lg' : ''} hover:bg-muted/30 transition-colors`}
                      >
                        <td className={`${borderStyle} px-2 py-1.5 bg-background`}>
                          <TypedMemoryInput
                            value={req.chemicalName}
                            onChange={(e) => updateRequirement(index, 'chemicalName', e.target.value)}
                            className="w-full border border-border bg-background rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                            storageKey="planChemicalName"
                            placeholder="Chemical name"
                          />
                        </td>
                        <td className={dataCellStyle}>
                          <input
                            type="number"
                            value={req.dosing ?? ''}
                            onChange={(e) => updateRequirement(index, 'dosing', e.target.value)}
                            className="w-full border border-border bg-background rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                            placeholder="g/l"
                            min="0"
                            step="any"
                            disabled={req.shade !== undefined && req.shade !== null}
                          />
                        </td>
                        <td className={dataCellStyle}>
                          <input
                            type="number"
                            value={req.shade ?? ''}
                            onChange={(e) => updateRequirement(index, 'shade', e.target.value)}
                            className="w-full border border-border bg-background rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                            placeholder="%"
                            min="0"
                            step="any"
                            disabled={req.dosing !== undefined && req.dosing !== null}
                          />
                        </td>
                        <td className={dataCellStyle}>
                          <input
                            type="number"
                            value={req.requiredQuantity || ''}
                            onChange={(e) => updateRequirement(index, 'requiredQuantity', e.target.value)}
                            className="w-full border border-border bg-background rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                            placeholder="0"
                            min="0"
                            step="any"
                          />
                        </td>
                        <td className={dataCellStyle}>
                          <input
                            type="number"
                            value={req.availableStock || ''}
                            onChange={(e) => updateRequirement(index, 'availableStock', e.target.value)}
                            className="w-full border border-border bg-background rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                            placeholder="0"
                            min="0"
                            step="any"
                          />
                        </td>
                        <td className={dataCellStyle}>
                          <div className="flex items-center justify-center">
                            {req.needToPurchase > 0 && (
                              <AlertTriangle className="h-4 w-4 text-orange-500 mr-1" />
                            )}
                            <span className={`font-medium ${req.needToPurchase > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                              {req.needToPurchase.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className={dataCellStyle}>
                          <input
                            type="number"
                            value={req.unitPrice || ''}
                            onChange={(e) => updateRequirement(index, 'unitPrice', e.target.value)}
                            className="w-full border border-border bg-background rounded-md px-2 py-1 text-sm text-center focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                            placeholder="0"
                            min="0"
                            step="any"
                          />
                        </td>
                        <td className={dataCellStyle}>
                          <span className="font-medium text-foreground">
                            ₹{req.totalCost.toFixed(2)}
                          </span>
                        </td>
                        <td className={`${borderStyle} px-2 py-1.5 bg-background`}>
                          <TypedMemoryInput
                            value={req.supplier || ''}
                            onChange={(e) => updateRequirement(index, 'supplier', e.target.value)}
                            className="w-full border border-border bg-background rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                            storageKey="planSupplier"
                            placeholder="Supplier"
                          />
                        </td>
                        <td className={dataCellStyle}>
                          <div className="flex items-center justify-center space-x-1">
                            <div
                              {...providedDraggable.dragHandleProps}
                              className="cursor-grab text-muted-foreground hover:text-foreground p-0.5"
                              title="Drag to reorder"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRequirement(index)}
                              className="text-red-600 hover:text-red-700 p-0.5"
                              title="Remove requirement"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {providedDroppable.placeholder}
              </tbody>
            )}
          </Droppable>
          <tfoot className="bg-muted/50">
            <tr>
              <td colSpan={7} className="border border-border px-3 py-3 text-right font-medium text-foreground bg-muted/30">
                Total Estimated Cost:
              </td>
              <td className="border border-border px-3 py-3 font-medium text-center text-foreground bg-accent">
                ₹{requirements.reduce((sum, req) => sum + req.totalCost, 0).toFixed(2)}
              </td>
              <td colSpan={2} className="border border-border bg-muted/30"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};