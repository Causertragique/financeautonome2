import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, Filter, Download, Edit2, Trash2, Search, Calendar, X, Printer } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useFiscalYear, getFiscalYearStartMonth } from "../hooks/use-fiscal-year";
import { getTransactions, addTransaction, type Transaction } from "../lib/db";
import React from "react";

// Transactions mock uniquement pour 2025
const mockTransactions2025 = [
  {
    id: 1,
    date: "2025-01-15",
    description: "Client Invoice #2025-001",
    category: "Consulting",
    tags: ["Project A"],
    company: "Tech Solutions Inc",
    type: "income",
    amount: 5000,
  },
  {
    id: 2,
    date: "2025-01-14",
    description: "Office Supplies - Staples",
    category: "Office Supplies",
    tags: ["Operations"],
    company: "Tech Solutions Inc",
    type: "expense",
    amount: 245.5,
  },
  {
    id: 3,
    date: "2025-01-12",
    description: "Team Lunch Meeting",
    category: "Meals & Entertainment",
    tags: ["Team", "Client Meeting"],
    company: "Creative Agency",
    type: "expense",
    amount: 125.75,
  },
  {
    id: 4,
    date: "2025-01-10",
    description: "Software License - Adobe Creative Suite",
    category: "Software",
    tags: ["Subscriptions"],
    company: "Creative Agency",
    type: "expense",
    amount: 99.99,
  },
  {
    id: 5,
    date: "2025-01-08",
    description: "Freelance Payment - Design Work",
    category: "Consulting",
    tags: ["Project B"],
    company: "Tech Solutions Inc",
    type: "income",
    amount: 2500,
  },
  {
    id: 6,
    date: "2025-01-07",
    description: "Internet & Phone",
    category: "Utilities",
    tags: ["Monthly"],
    company: "Tech Solutions Inc",
    type: "expense",
    amount: 156.25,
  },
  {
    id: 7,
    date: "2025-01-05",
    description: "Client Payment - Retainer",
    category: "Consulting",
    tags: ["Recurring", "Client X"],
    company: "Creative Agency",
    type: "income",
    amount: 3000,
  },
  {
    id: 8,
    date: "2025-01-03",
    description: "Taxi/Uber Expenses",
    category: "Travel",
    tags: ["Business Trip"],
    company: "Tech Solutions Inc",
    type: "expense",
    amount: 87.45,
  },
];

export default function Transactions() {
  const { t } = useLanguage();
  const fiscalYearStartMonth = getFiscalYearStartMonth();
  const fiscalYear = useFiscalYear(fiscalYearStartMonth);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [selectedYear, setSelectedYear] = useState(fiscalYear);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("customCategories");
    return saved ? JSON.parse(saved) : [];
  });
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Charger les transactions depuis la base de données
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const data = await getTransactions(selectedYear);
        setTransactions(data);
      } catch (error) {
        console.error("Erreur lors du chargement des transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTransactions();
    
    // Écouter les mises à jour
    const handleUpdate = () => {
      loadTransactions();
    };
    window.addEventListener("transactionsUpdated", handleUpdate);
    
    return () => {
      window.removeEventListener("transactionsUpdated", handleUpdate);
    };
  }, [selectedYear]);
  
  // Catégories par défaut avec traductions
  const defaultCategories = [
    { key: "consulting", label: t("dashboard.transactionCategoryConsulting") },
    { key: "officeSupplies", label: t("dashboard.transactionCategoryOfficeSupplies") },
    { key: "mealsEntertainment", label: t("dashboard.transactionCategoryMealsEntertainment") },
    { key: "software", label: t("dashboard.transactionCategorySoftware") },
    { key: "travel", label: t("dashboard.categoryTravel") },
    { key: "utilities", label: t("transactions.categoryUtilities") },
    { key: "salaries", label: t("dashboard.categorySalaries") },
    { key: "equipment", label: t("dashboard.categoryEquipment") },
    { key: "other", label: t("dashboard.categoryOther") },
  ];
  
  // Toutes les catégories (défaut + personnalisées)
  const allCategories = [
    ...defaultCategories.map(cat => cat.label),
    ...customCategories
  ];
  
  // Sauvegarder les catégories personnalisées
  useEffect(() => {
    localStorage.setItem("customCategories", JSON.stringify(customCategories));
  }, [customCategories]);
  
  const addCustomCategory = () => {
    if (newCategory.trim() && !customCategories.includes(newCategory.trim())) {
      setCustomCategories([...customCategories, newCategory.trim()]);
      setNewCategory("");
      setShowAddCategory(false);
    }
  };
  
  // Fonction pour ajouter une nouvelle transaction
  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newTransaction: Omit<Transaction, "id"> = {
      date: (formData.get("date") as string) || new Date().toISOString().split('T')[0],
      description: (formData.get("description") as string) || "",
      category: (formData.get("category") as string) || allCategories[0],
      type: (formData.get("type") as "income" | "expense") || "expense",
      amount: parseFloat((formData.get("amount") as string) || "0"),
      company: "Tech Solutions Inc", // Par défaut, peut être modifié plus tard
      tags: [],
    };
    
    if (newTransaction.amount > 0 && newTransaction.description) {
      const id = await addTransaction(newTransaction);
      if (id) {
        setShowAddModal(false);
        form.reset();
        // Les transactions seront rechargées automatiquement via l'événement
      }
    }
  };
  
  // Fonction pour exporter les transactions en CSV
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      return;
    }
    
    // En-têtes CSV
    const headers = [
      t("transactions.date"),
      t("transactions.description"),
      t("transactions.category"),
      t("transactions.company"),
      t("transactions.type"),
      t("transactions.amount"),
    ];
    
    // Convertir les transactions en lignes CSV
    const csvRows = [
      headers.join(","),
      ...filteredTransactions.map((transaction) => {
        const tags = transaction.tags ? transaction.tags.join("; ") : "";
        const typeLabel = transaction.type === "income" 
          ? t("transactions.income") 
          : t("transactions.expense");
        const amount = transaction.type === "income" 
          ? `+$${transaction.amount.toFixed(2)}` 
          : `-$${transaction.amount.toFixed(2)}`;
        
        return [
          transaction.date,
          `"${transaction.description.replace(/"/g, '""')}"`,
          `"${transaction.category}"`,
          `"${transaction.company || ""}"`,
          typeLabel,
          amount,
        ].join(",");
      }),
    ];
    
    // Créer le contenu CSV
    const csvContent = csvRows.join("\n");
    
    // Créer un blob et télécharger
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Fonction pour imprimer les transactions
  const handlePrint = () => {
    if (filteredTransactions.length === 0) {
      return;
    }
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const typeLabel = filterType === "all" 
      ? t("transactions.allTransactions")
      : filterType === "income"
      ? t("transactions.incomeOnly")
      : t("transactions.expensesOnly");
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${t("transactions.title")} - ${selectedYear}</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
              }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #000;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 10px;
            }
            .info {
              margin-bottom: 20px;
              font-size: 14px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .income {
              color: #059669;
              font-weight: bold;
            }
            .expense {
              color: #dc2626;
              font-weight: bold;
            }
            .summary {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #000;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin: 5px 0;
              font-size: 14px;
            }
            .summary-total {
              font-weight: bold;
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <h1>${t("transactions.title")}</h1>
          <div class="info">
            <p><strong>Année:</strong> ${selectedYear}</p>
            <p><strong>${t("transactions.type")}:</strong> ${typeLabel}</p>
            <p><strong>Date d'impression:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
            <p><strong>Nombre de transactions:</strong> ${filteredTransactions.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t("transactions.date")}</th>
                <th>${t("transactions.description")}</th>
                <th>${t("transactions.category")}</th>
                <th>${t("transactions.company")}</th>
                <th>${t("transactions.type")}</th>
                <th>${t("transactions.amount")}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map((transaction) => {
                const typeLabel = transaction.type === "income" 
                  ? t("transactions.income") 
                  : t("transactions.expense");
                const amount = transaction.type === "income" 
                  ? `+$${transaction.amount.toFixed(2)}` 
                  : `-$${transaction.amount.toFixed(2)}`;
                const amountClass = transaction.type === "income" ? "income" : "expense";
                
                return `
                  <tr>
                    <td>${transaction.date}</td>
                    <td>${transaction.description}</td>
                    <td>${transaction.category}</td>
                    <td>${transaction.company || ""}</td>
                    <td>${typeLabel}</td>
                    <td class="${amountClass}">${amount}</td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row">
              <span>${t("transactions.totalIncome")}:</span>
              <span class="income">$${totalIncome.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>${t("transactions.totalExpenses")}:</span>
              <span class="expense">$${totalExpenses.toFixed(2)}</span>
            </div>
            <div class="summary-row summary-total">
              <span>${t("transactions.net")}:</span>
              <span class="${totalIncome - totalExpenses >= 0 ? 'income' : 'expense'}">
                $${(totalIncome - totalExpenses).toFixed(2)}
              </span>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Attendre que le contenu soit chargé avant d'imprimer
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
  
  // Générer la liste des années (année fiscale actuelle et 5 années précédentes)
  const availableYears = Array.from({ length: 6 }, (_, i) => fiscalYear - i);

  // Filtrer les transactions par recherche et type
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("transactions.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("transactions.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>{t("transactions.addTransaction")}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">{t("transactions.totalIncome")}</p>
          <p className="text-3xl font-bold text-success">
            ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">{t("transactions.totalExpenses")}</p>
          <p className="text-3xl font-bold text-destructive">
            ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">{t("transactions.net")}</p>
          <p
            className={`text-3xl font-bold ${
              totalIncome - totalExpenses >= 0
                ? "text-success"
                : "text-destructive"
            }`}
          >
            ${(totalIncome - totalExpenses).toLocaleString("en-US", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("transactions.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2.5">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-transparent border-none text-foreground font-medium focus:outline-none cursor-pointer"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg bg-card text-foreground hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t("transactions.allTransactions")}</option>
            <option value="income">{t("transactions.incomeOnly")}</option>
            <option value="expense">{t("transactions.expensesOnly")}</option>
          </select>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>{t("transactions.export")}</span>
        </button>
        <button 
          onClick={handlePrint}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg bg-card text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-5 h-5" />
          <span>{t("transactions.print")}</span>
        </button>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.date")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.description")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.category")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.company")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.tags")}
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.amount")}
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-border hover:bg-secondary/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-foreground">
                    {transaction.date}
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground">
                    {transaction.description}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {transaction.category}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {transaction.company}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {transaction.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-primary/10 text-primary text-xs rounded font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td
                    className={`py-3 px-4 text-sm font-medium text-right ${
                      transaction.type === "income"
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}$
                    {transaction.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1 hover:bg-secondary rounded transition-colors">
                        <Edit2 className="w-4 h-4 text-foreground" />
                      </button>
                      <button className="p-1 hover:bg-destructive/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-muted-foreground">
                    Aucune transaction pour l'année {selectedYear}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t("transactions.addTransactionTitle")}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t("transactions.date")}
                </label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t("transactions.type")}
                </label>
                <select name="type" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required>
                  <option value="income">{t("transactions.income")}</option>
                  <option value="expense">{t("transactions.expense")}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t("transactions.description")}
                </label>
                <input
                  type="text"
                  name="description"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("transactions.descriptionPlaceholder")}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t("transactions.amount")}
                </label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("transactions.amountPlaceholder")}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                  {t("transactions.category")}
                </label>
                  {!showAddCategory && (
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      {t("transactions.addCustomCategory")}
                    </button>
                  )}
                </div>
                {showAddCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                      placeholder={t("transactions.customCategoryPlaceholder")}
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategory("");
                      }}
                      className="px-3 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select name="category" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                </select>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  {t("companies.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  {t("transactions.addTransaction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
