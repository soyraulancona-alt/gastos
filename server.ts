import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("expenses.db");
const JWT_SECRET = "gasto-rapido-jwt-secret-2026-v1";

// Migration: Drop old table if it doesn't have user_id (from previous version)
try {
  const tableInfo = db.prepare("PRAGMA table_info(expenses)").all() as any[];
  const hasUserId = tableInfo.some(col => col.name === "user_id");
  if (tableInfo.length > 0 && !hasUserId) {
    db.exec("DROP TABLE expenses");
  }
} catch (e) {
  // Table might not exist yet
}

// Initialize database with users, categories and expenses
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense',
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  );

  CREATE TABLE IF NOT EXISTS income (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER UNIQUE NOT NULL,
    amount REAL NOT NULL,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    date TEXT DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );
`);

// Migration: Add type column to categories if it doesn't exist
try {
  db.exec("ALTER TABLE categories ADD COLUMN type TEXT NOT NULL DEFAULT 'expense'");
} catch (e) {
  // Column already exists
}

// Migration: Add category_id to income if it doesn't exist
try {
  db.exec("ALTER TABLE income ADD COLUMN category_id INTEGER");
} catch (e) {
  // Column already exists
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", true);
  app.use(express.json());

  // Auth Middleware (JWT)
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.userId = decoded.userId;
      next();
    } catch (error) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  // Auth Routes
  app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, hashedPassword);
      const userId = info.lastInsertRowid;
      
      // Seed default categories for new user
      const defaultExpenses = ["Comida", "Transporte", "Vivienda", "Entretenimiento", "Salud", "Otros"];
      const defaultIncome = ["Sueldo", "Venta", "Inversión", "Regalo", "Otros"];
      
      const insertCat = db.prepare("INSERT INTO categories (name, type, user_id) VALUES (?, ?, ?)");
      defaultExpenses.forEach(cat => insertCat.run(cat, 'expense', userId));
      defaultIncome.forEach(cat => insertCat.run(cat, 'income', userId));

      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
      res.json({ id: userId, email, token });
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(400).json({ error: "Email already exists" });
      } else {
        res.status(500).json({ error: "Server error" });
      }
    }
  });

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
      res.json({ id: user.id, email: user.email, token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.json({ success: true });
  });

  app.get("/api/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(req.userId) as any;
    res.json(user);
  });

  // Income Routes
  app.get("/api/income", authenticate, (req: any, res) => {
    const income = db.prepare(`
      SELECT i.*, c.name as category_name 
      FROM income i 
      JOIN categories c ON i.category_id = c.id 
      WHERE i.user_id = ? 
      ORDER BY i.date DESC
    `).all(req.userId);
    res.json(income);
  });

  app.post("/api/income", authenticate, (req: any, res) => {
    const { amount, description, category_id } = req.body;
    const info = db.prepare(
      "INSERT INTO income (amount, description, category_id, user_id) VALUES (?, ?, ?, ?)"
    ).run(amount, description, category_id, req.userId);
    
    const newIncome = db.prepare(`
      SELECT i.*, c.name as category_name 
      FROM income i 
      JOIN categories c ON i.category_id = c.id 
      WHERE i.id = ?
    `).get(info.lastInsertRowid);
    res.json(newIncome);
  });

  app.delete("/api/income/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM income WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  // Budget Routes
  app.get("/api/budgets", authenticate, (req: any, res) => {
    const budgets = db.prepare(`
      SELECT b.*, c.name as category_name 
      FROM budgets b 
      JOIN categories c ON b.category_id = c.id 
      WHERE b.user_id = ?
    `).all(req.userId);
    res.json(budgets);
  });

  app.post("/api/budgets", authenticate, (req: any, res) => {
    const { category_id, amount } = req.body;
    try {
      const info = db.prepare(
        "INSERT INTO budgets (category_id, amount, user_id) VALUES (?, ?, ?) " +
        "ON CONFLICT(category_id) DO UPDATE SET amount = excluded.amount"
      ).run(category_id, amount, req.userId);
      
      const budget = db.prepare(`
        SELECT b.*, c.name as category_name 
        FROM budgets b 
        JOIN categories c ON b.category_id = c.id 
        WHERE b.category_id = ? AND b.user_id = ?
      `).get(category_id, req.userId);
      res.json(budget);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Category Routes
  app.get("/api/categories", authenticate, (req: any, res) => {
    const type = req.query.type || 'expense';
    let categories = db.prepare("SELECT * FROM categories WHERE user_id = ? AND type = ?").all(req.userId, type);
    
    // Auto-seed if empty
    if (categories.length === 0) {
      const defaultExpenses = ["Comida", "Transporte", "Vivienda", "Entretenimiento", "Salud", "Otros"];
      const defaultIncome = ["Sueldo", "Venta", "Inversión", "Regalo", "Otros"];
      
      const insertCat = db.prepare("INSERT INTO categories (name, type, user_id) VALUES (?, ?, ?)");
      if (type === 'expense') {
        defaultExpenses.forEach(cat => insertCat.run(cat, 'expense', req.userId));
      } else {
        defaultIncome.forEach(cat => insertCat.run(cat, 'income', req.userId));
      }
      categories = db.prepare("SELECT * FROM categories WHERE user_id = ? AND type = ?").all(req.userId, type);
    }
    
    res.json(categories);
  });

  app.post("/api/categories", authenticate, (req: any, res) => {
    const { name, type } = req.body;
    const info = db.prepare("INSERT INTO categories (name, type, user_id) VALUES (?, ?, ?)").run(name, type || 'expense', req.userId);
    res.json({ id: info.lastInsertRowid, name, type: type || 'expense' });
  });

  // Expense Routes
  app.get("/api/expenses", authenticate, (req: any, res) => {
    const expenses = db.prepare(`
      SELECT e.*, c.name as category_name 
      FROM expenses e 
      JOIN categories c ON e.category_id = c.id 
      WHERE e.user_id = ? 
      ORDER BY e.date DESC
    `).all(req.userId);
    res.json(expenses);
  });

  app.post("/api/expenses", authenticate, (req: any, res) => {
    const { amount, description, category_id } = req.body;
    const info = db.prepare(
      "INSERT INTO expenses (amount, description, category_id, user_id) VALUES (?, ?, ?, ?)"
    ).run(amount, description, category_id, req.userId);
    
    const newExpense = db.prepare(`
      SELECT e.*, c.name as category_name 
      FROM expenses e 
      JOIN categories c ON e.category_id = c.id 
      WHERE e.id = ?
    `).get(info.lastInsertRowid);
    res.json(newExpense);
  });

  app.put("/api/expenses/:id", authenticate, (req: any, res) => {
    const { amount, description, category_id } = req.body;
    db.prepare(
      "UPDATE expenses SET amount = ?, description = ?, category_id = ? WHERE id = ? AND user_id = ?"
    ).run(amount, description, category_id, req.params.id, req.userId);
    
    const updated = db.prepare(`
      SELECT e.*, c.name as category_name 
      FROM expenses e 
      JOIN categories c ON e.category_id = c.id 
      WHERE e.id = ?
    `).get(req.params.id);
    res.json(updated);
  });

  app.delete("/api/expenses/:id", authenticate, (req: any, res) => {
    db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?").run(req.params.id, req.userId);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
