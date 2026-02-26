import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface Expense {
  category_name: string;
  amount: number;
}

interface ExpenseChartProps {
  expenses: Expense[];
}

const COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#6b7280", // gray-500
];

export default function ExpenseChart({ expenses }: ExpenseChartProps) {
  const data = expenses.reduce((acc: any[], curr) => {
    const existing = acc.find((item) => item.name === curr.category_name);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category_name, value: curr.amount });
    }
    return acc;
  }, []);

  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 h-full min-h-[300px]">
      <h2 className="text-lg font-semibold mb-6">Distribución por Categoría</h2>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              formatter={(value: number) => `$${value.toFixed(2)}`}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
