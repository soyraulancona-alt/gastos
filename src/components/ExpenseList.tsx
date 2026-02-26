import React from "react";
import { Trash2, Calendar, ShoppingBag, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Expense {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  category_name: string;
  date: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: number) => void;
  onEdit: (expense: Expense) => void;
}

export default function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-gray-500 font-medium">No hay gastos registrados aún.</p>
        <p className="text-gray-400 text-sm mt-1">¡Comienza agregando tu primer gasto!</p>
      </div>
    );
  }

  const safeFormatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Fecha inválida";
      return format(date, "d MMM, HH:mm", { locale: es });
    } catch (e) {
      return "Fecha inválida";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-lg font-semibold">Historial de Gastos</h2>
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {expenses.length} registros
        </span>
      </div>
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
        {expenses.map((expense, index) => (
          <div
            key={expense.id || `exp-${index}`}
            className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-sm">
                {expense.category_name ? expense.category_name[0] : "?"}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                    {expense.category_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {safeFormatDate(expense.date)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-900">
                ${(expense.amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(expense)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(expense.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
