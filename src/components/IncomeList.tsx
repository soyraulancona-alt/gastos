import React from "react";
import { Trash2, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Income {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  category_name: string;
  date: string;
}

interface IncomeListProps {
  income: Income[];
  onDelete: (id: number) => void;
}

export default function IncomeList({ income, onDelete }: IncomeListProps) {
  if (income.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-12 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-emerald-300" />
        </div>
        <p className="text-gray-500 font-medium">No hay ingresos registrados.</p>
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
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-emerald-50/30">
        <h2 className="text-lg font-semibold text-emerald-900">Historial de Ingresos</h2>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
          {income.length} registros
        </span>
      </div>
      <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto custom-scrollbar">
        {income.map((item, index) => (
          <div
            key={item.id || `inc-${index}`}
            className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{item.description}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                    {item.category_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {safeFormatDate(item.date)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-emerald-600">
                +${(item.amount || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
              <button
                onClick={() => onDelete(item.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
