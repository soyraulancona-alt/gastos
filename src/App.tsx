import React, { useState, useEffect } from "react";
import { Wallet, LogOut, User } from "lucide-react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import ExpenseChart from "./components/ExpenseChart";
import IncomeForm from "./components/IncomeForm";
import IncomeList from "./components/IncomeList";
import BudgetForm from "./components/BudgetForm";
import BudgetList from "./components/BudgetList";
import Auth from "./components/Auth";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";

interface Expense {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  category_name: string;
  date: string;
}

interface Income {
  id: number;
  amount: number;
  description: string;
  category_id: number;
  category_name: string;
  date: string;
}

interface Budget {
  id: number;
  category_id: number;
  category_name: string;
  amount: number;
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState<"expenses" | "income" | "budgets">("expenses");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("gasto_rapido_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("gasto_rapido_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        localStorage.removeItem("gasto_rapido_token");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    fetchExpenses();
    fetchIncome();
    fetchBudgets();
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expenses", {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setExpenses(data);
      } else {
        setExpenses([]);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setExpenses([]);
    }
  };

  const fetchIncome = async () => {
    try {
      const response = await fetch("/api/income", {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setIncome(data);
      } else {
        setIncome([]);
      }
    } catch (error) {
      console.error("Error fetching income:", error);
      setIncome([]);
    }
  };

  const fetchBudgets = async () => {
    try {
      const response = await fetch("/api/budgets", {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setBudgets(data);
      } else {
        setBudgets([]);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      setBudgets([]);
    }
  };

  const handleAddExpense = async (newExpense: {
    amount: number;
    description: string;
    category_id: number;
  }) => {
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newExpense),
      });
      const data = await response.json();
      setExpenses([data, ...expenses]);
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleAddIncome = async (newIncome: { amount: number; description: string; category_id: number }) => {
    try {
      const response = await fetch("/api/income", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newIncome),
      });
      const data = await response.json();
      setIncome([data, ...income]);
    } catch (error) {
      console.error("Error adding income:", error);
    }
  };

  const handleSetBudget = async (category_id: number, amount: number) => {
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ category_id, amount }),
      });
      const data = await response.json();
      setBudgets(prev => {
        const existing = prev.findIndex(b => b.category_id === category_id);
        if (existing > -1) {
          const next = [...prev];
          next[existing] = data;
          return next;
        }
        return [...prev, data];
      });
    } catch (error) {
      console.error("Error setting budget:", error);
    }
  };

  const handleUpdateExpense = async (id: number, updatedExpense: {
    amount: number;
    description: string;
    category_id: number;
  }) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedExpense),
      });
      const data = await response.json();
      setExpenses(expenses.map(e => e.id === id ? data : e));
      setEditingExpense(null);
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const handleDeleteIncome = async (id: number) => {
    try {
      await fetch(`/api/income/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      setIncome(income.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting income:", error);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      headers: getAuthHeaders(),
    });
    localStorage.removeItem("gasto_rapido_token");
    setUser(null);
    setExpenses([]);
    setIncome([]);
    setBudgets([]);
  };

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
  const balance = totalIncome - totalSpent;

  const formatCurrency = (value: number) => {
    return (value || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 });
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gray-50 flex items-center justify-center"
        >
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-emerald-200 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </motion.div>
      ) : !user ? (
        <motion.div
          key="auth-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="w-full"
        >
          <Auth onLogin={setUser} />
        </motion.div>
      ) : (
        <motion.div
          key="app-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-emerald-100 selection:text-emerald-900"
        >
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">GastoRápido</h1>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Control Personal</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <p className="text-sm font-medium text-gray-500">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-emerald-600">${formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <p className="text-sm font-medium text-gray-500">Gastos Totales</p>
                  <p className="text-2xl font-bold text-red-600">${formatCurrency(totalSpent)}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-black/5">
                  <p className="text-sm font-medium text-gray-500">Balance Actual</p>
                  <p className={cn("text-2xl font-bold", balance >= 0 ? "text-blue-600" : "text-red-600")}>
                    ${formatCurrency(balance)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "expenses" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700")}
                >
                  Gastos
                </button>
                <button
                  onClick={() => setActiveTab("income")}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "income" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700")}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setActiveTab("budgets")}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "budgets" ? "bg-white shadow-sm text-emerald-600" : "text-gray-500 hover:text-gray-700")}
                >
                  Presupuestos
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-8">
                  {activeTab === "expenses" && (
                    <>
                      <ExpenseForm 
                        onAdd={handleAddExpense} 
                        onUpdate={handleUpdateExpense}
                        editingExpense={editingExpense}
                        onCancelEdit={() => setEditingExpense(null)}
                      />
                      <ExpenseChart expenses={expenses} />
                    </>
                  )}
                  {activeTab === "income" && (
                    <IncomeForm onAdd={handleAddIncome} />
                  )}
                  {activeTab === "budgets" && (
                    <BudgetForm onSet={handleSetBudget} />
                  )}
                </div>

                <div className="lg:col-span-8">
                  {activeTab === "expenses" && (
                    <ExpenseList 
                      expenses={expenses} 
                      onDelete={handleDeleteExpense} 
                      onEdit={setEditingExpense}
                    />
                  )}
                  {activeTab === "income" && (
                    <IncomeList income={income} onDelete={handleDeleteIncome} />
                  )}
                  {activeTab === "budgets" && (
                    <BudgetList budgets={budgets} expenses={expenses} />
                  )}
                </div>
              </div>
            </motion.div>
          </main>

          <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} GastoRápido • Control de gastos inteligente</p>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
