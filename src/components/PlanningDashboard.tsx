import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Users,
  Settings,
  BarChart3
} from 'lucide-react';
import { DyeingPlan } from '../types/planning';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface PlanningDashboardProps {
  plans: DyeingPlan[];
}

export const PlanningDashboard: React.FC<PlanningDashboardProps> = ({ plans }) => {
  // Calculate statistics
  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter(p => p.status === 'in-progress').length,
    completedPlans: plans.filter(p => p.status === 'completed').length,
    urgentPlans: plans.filter(p => p.priority === 'urgent').length,
    totalEstimatedCost: plans.reduce((sum, p) => sum + p.estimatedCost, 0),
    avgDuration: plans.length > 0 ? plans.reduce((sum, p) => sum + p.estimatedDuration, 0) / plans.length : 0,
  };

  // Prepare chart data
  const statusData = [
    { name: 'Draft', value: plans.filter(p => p.status === 'draft').length, color: '#6B7280' },
    { name: 'Scheduled', value: plans.filter(p => p.status === 'scheduled').length, color: '#3B82F6' },
    { name: 'In Progress', value: plans.filter(p => p.status === 'in-progress').length, color: '#F59E0B' },
    { name: 'Completed', value: plans.filter(p => p.status === 'completed').length, color: '#10B981' },
    { name: 'Cancelled', value: plans.filter(p => p.status === 'cancelled').length, color: '#EF4444' },
  ];

  const priorityData = [
    { name: 'Low', value: plans.filter(p => p.priority === 'low').length, color: '#6B7280' },
    { name: 'Medium', value: plans.filter(p => p.priority === 'medium').length, color: '#3B82F6' },
    { name: 'High', value: plans.filter(p => p.priority === 'high').length, color: '#F59E0B' },
    { name: 'Urgent', value: plans.filter(p => p.priority === 'urgent').length, color: '#EF4444' },
  ];

  // Weekly planning data
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateStr,
      plans: plans.filter(p => p.planDate === dateStr).length,
      completed: plans.filter(p => p.planDate === dateStr && p.status === 'completed').length,
    };
  });

  const StatCard = ({ icon: Icon, label, value, unit, color }: { 
    icon: React.ElementType, 
    label: string, 
    value: string | number, 
    unit?: string,
    color: string 
  }) => (
    <motion.div
      className="bg-card p-6 rounded-xl border border-border shadow-sm"
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground">
            {value}{unit && <span className="text-lg text-muted-foreground ml-1">{unit}</span>}
          </p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard
          icon={Calendar}
          label="Total Plans"
          value={stats.totalPlans}
          color="bg-blue-500"
        />
        <StatCard
          icon={Clock}
          label="Active Plans"
          value={stats.activePlans}
          color="bg-yellow-500"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={stats.completedPlans}
          color="bg-green-500"
        />
        <StatCard
          icon={AlertTriangle}
          label="Urgent Plans"
          value={stats.urgentPlans}
          color="bg-red-500"
        />
        <StatCard
          icon={DollarSign}
          label="Est. Cost"
          value={`₹${stats.totalEstimatedCost.toFixed(0)}`}
          color="bg-purple-500"
        />
        <StatCard
          icon={Settings}
          label="Avg Duration"
          value={stats.avgDuration.toFixed(1)}
          unit="hrs"
          color="bg-indigo-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Planning Overview */}
        <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border shadow-sm">
          <h4 className="text-lg font-semibold text-foreground mb-4">Weekly Planning Overview</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Bar dataKey="plans" fill="hsl(var(--primary))" name="Total Plans" radius={[2, 2, 0, 0]} />
                <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h4 className="text-lg font-semibold text-foreground mb-4">Status Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
        <h4 className="text-lg font-semibold text-foreground mb-4">Priority Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};