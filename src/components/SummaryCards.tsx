import React from "react";
import { TrendingUp, CreditCard, PieChart } from "lucide-react";

interface SummaryCardsProps {
  total: number;
  count: number;
  average: number;
}

export default function SummaryCards({ total, count, average }: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Gastado",
      value: `$${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      icon: CreditCard,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Promedio por Gasto",
      value: `$${average.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total de Registros",
      value: count.toString(),
      icon: PieChart,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 flex items-center gap-4"
        >
          <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
