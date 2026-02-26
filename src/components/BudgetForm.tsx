import React, { useState, useEffect } from "react";
import { PieChart, Tag, DollarSign, Loader2, ChevronDown } from "lucide-react";
import { DEFAULT_EXPENSE_CATEGORIES } from "../constants";

interface Category {
  id: number;
  name: string;
}

interface BudgetFormProps {
  onSet: (category_id: number, amount: number) => Promise<void>;
}

export default function BudgetForm({ onSet }: BudgetFormProps) {
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("gasto_rapido_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?type=expense", {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setCategories(data);
        if (data.length > 0) setCategoryId(data[0].id);
      } else {
        const fallback = DEFAULT_EXPENSE_CATEGORIES.map((name, index) => ({ id: -(index + 1), name }));
        setCategories(fallback);
        setCategoryId(fallback[0].id);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      const fallback = DEFAULT_EXPENSE_CATEGORIES.map((name, index) => ({ id: -(index + 1), name }));
      setCategories(fallback);
      setCategoryId(fallback[0].id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    setLoading(true);
    await onSet(Number(categoryId), parseFloat(amount));
    setAmount("");
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-600">
        <PieChart className="w-5 h-5" />
        Definir Presupuesto
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            required
          >
            {categories.map((cat, index) => (
              <option key={cat.id || `cat-${index}`} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            step="0.01"
            placeholder="Límite Mensual"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Presupuesto"}
        </button>
      </form>
    </div>
  );
}
