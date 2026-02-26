import React from "react";
import { PieChart, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

interface Budget {
  category_id: number;
  category_name: string;
  amount: number;
}

interface Expense {
  category_id: number;
  amount: number;
}

interface BudgetListProps {
  budgets: Budget[];
  expenses: Expense[];
}

export default function BudgetList({ budgets, expenses }: BudgetListProps) {
  if (budgets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-12 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <PieChart className="w-8 h-8 text-blue-300" />
        </div>
        <p className="text-gray-500 font-medium">No has definido presupuestos aún.</p>
      </div>
    );
  }

  const getSpentForCategory = (categoryId: number) => {
    return expenses
      .filter((e) => e.category_id === categoryId)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-blue-50/30">
        <h2 className="text-lg font-semibold text-blue-900">Estado de Presupuestos</h2>
      </div>
      <div className="p-6 space-y-6">
        {budgets.map((budget, index) => {
          const spent = getSpentForCategory(budget.category_id);
          const percent = Math.min((spent / budget.amount) * 100, 100);
          const isOver = spent > budget.amount;

          return (
            <div key={budget.category_id || `bud-${index}`} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="font-semibold text-gray-900">{budget.category_name}</h3>
                  <p className="text-xs text-gray-500">
                    Gastado: ${(spent || 0).toLocaleString()} de ${(budget.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn("text-sm font-bold", isOver ? "text-red-600" : "text-emerald-600")}>
                    {Math.round((spent / budget.amount) * 100)}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500",
                    isOver ? "bg-red-500" : percent > 80 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {isOver && (
                <div className="flex items-center gap-1.5 text-red-600 text-[10px] font-medium uppercase tracking-wider">
                  <AlertCircle className="w-3 h-3" />
                  Presupuesto excedido
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
