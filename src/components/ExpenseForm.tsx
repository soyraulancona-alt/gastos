import React, { useState, useEffect } from "react";
import { PlusCircle, Tag, DollarSign, FileText, Plus, X, Loader2, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { DEFAULT_EXPENSE_CATEGORIES } from "../constants";

interface Category {
  id: number;
  name: string;
}

interface ExpenseFormProps {
  onAdd: (expense: { amount: number; description: string; category_id: number }) => Promise<void>;
  onUpdate?: (id: number, expense: { amount: number; description: string; category_id: number }) => Promise<void>;
  editingExpense?: any;
  onCancelEdit?: () => void;
}

export default function ExpenseForm({ onAdd, onUpdate, editingExpense, onCancelEdit }: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingExpense) {
      setAmount(editingExpense.amount.toString());
      setDescription(editingExpense.description);
      setCategoryId(editingExpense.category_id);
    } else {
      setAmount("");
      setDescription("");
      setCategoryId(categories.length > 0 ? categories[0].id : "");
    }
  }, [editingExpense, categories]);

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
        if (data.length > 0 && !editingExpense) {
          setCategoryId(data[0].id);
        }
      } else {
        console.error("Categories data is not an array:", data);
        const fallback = DEFAULT_EXPENSE_CATEGORIES.map((name, index) => ({ id: -(index + 1), name }));
        setCategories(fallback);
        if (!editingExpense) setCategoryId(fallback[0].id);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      const fallback = DEFAULT_EXPENSE_CATEGORIES.map((name, index) => ({ id: -(index + 1), name }));
      setCategories(fallback);
      if (!editingExpense) setCategoryId(fallback[0].id);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newCategoryName, type: "expense" }),
      });
      const data = await response.json();
      setCategories([...categories, data]);
      setCategoryId(data.id);
      setNewCategoryName("");
      setIsAddingCategory(false);
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !categoryId) return;

    setLoading(true);
    const payload = {
      amount: parseFloat(amount),
      description,
      category_id: Number(categoryId),
    };

    if (editingExpense && onUpdate) {
      await onUpdate(editingExpense.id, payload);
    } else {
      await onAdd(payload);
    }

    setAmount("");
    setDescription("");
    setCategoryId(categories.length > 0 ? categories[0].id : "");
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
        </h2>
        {editingExpense && onCancelEdit && (
          <button
            onClick={onCancelEdit}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            step="0.01"
            placeholder="Monto"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            required
          />
        </div>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
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
            <button
              type="button"
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="p-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
              title="Añadir Categoría"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {isAddingCategory && (
            <div className="flex gap-2 animate-in slide-in-from-top-2 duration-200">
              <input
                type="text"
                placeholder="Nueva categoría..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Añadir"}
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm shadow-emerald-200 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingExpense ? "Guardar Cambios" : "Agregar Gasto")}
        </button>
      </form>
    </div>
  );
}
