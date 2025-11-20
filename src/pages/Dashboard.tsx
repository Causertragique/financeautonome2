import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import { useUsageMode } from "../contexts/UsageModeContext";
import { 
  getTransactions, 
  type Transaction,
  getVehicleAnnualProfiles,
  getHomeOfficeExpenses,
  getTechExpenses,
} from "../lib/db";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Filter,
  Calendar,
} from "lucide-react";

export default function Dashboard() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { selectedYear } = useFiscalYearContext();
  const { currentMode, usageType } = useUsageMode();
  const [selectedPeriod, setSelectedPeriod] = useState("ytd");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vehicleExpenses, setVehicleExpenses] = useState<any[]>([]);
  const [homeOfficeExpenses, setHomeOfficeExpenses] = useState<any[]>([]);
  const [techExpenses, setTechExpenses] = useState<any[]>([]);
  
  // Les données mock sont uniquement pour la démo quand l'utilisateur n'est pas connecté
  // Si l'utilisateur est connecté, on utilise les vraies données depuis Firestore
  const shouldShowMockData = !currentUser;

  // Charger les transactions et toutes les dépenses depuis la base de données
  React.useEffect(() => {
    const loadAllData = async () => {
      if (!currentUser) {
        setTransactions([]);
        setVehicleExpenses([]);
        setHomeOfficeExpenses([]);
        setTechExpenses([]);
        return;
      }
      try {
        // Déterminer le mode à utiliser (si usageType est "both", utiliser currentMode, sinon utiliser usageType)
        const mode = usageType === "both" ? currentMode : (usageType || "business");
        
        const [transactionsData, vehicleData, homeOfficeData, techData] = await Promise.all([
          getTransactions(selectedYear, mode),
          getVehicleAnnualProfiles(selectedYear, mode),
          getHomeOfficeExpenses(selectedYear, mode),
          getTechExpenses(selectedYear, mode),
        ]);
        setTransactions(transactionsData);
        setVehicleExpenses(vehicleData);
        setHomeOfficeExpenses(homeOfficeData);
        setTechExpenses(techData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setTransactions([]);
        setVehicleExpenses([]);
        setHomeOfficeExpenses([]);
        setTechExpenses([]);
      }
    };

    loadAllData();
    
    // Écouter les événements personnalisés pour les changements
    const handleTransactionsUpdate = () => {
      loadAllData();
    };
    const handleVehicleExpensesUpdate = () => {
      loadAllData();
    };
    const handleHomeOfficeExpensesUpdate = () => {
      loadAllData();
    };
    const handleTechExpensesUpdate = () => {
      loadAllData();
    };
    
    window.addEventListener("transactionsUpdated", handleTransactionsUpdate);
    window.addEventListener("vehicleExpensesUpdated", handleVehicleExpensesUpdate);
    window.addEventListener("homeOfficeExpensesUpdated", handleHomeOfficeExpensesUpdate);
    window.addEventListener("techExpensesUpdated", handleTechExpensesUpdate);

    return () => {
      window.removeEventListener("transactionsUpdated", handleTransactionsUpdate);
      window.removeEventListener("vehicleExpensesUpdated", handleVehicleExpensesUpdate);
      window.removeEventListener("homeOfficeExpensesUpdated", handleHomeOfficeExpensesUpdate);
      window.removeEventListener("techExpensesUpdated", handleTechExpensesUpdate);
    };
  }, [selectedYear, currentUser, currentMode, usageType]);

  // Calculer les statistiques réelles à partir des transactions et des dépenses spéciales
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Dépenses des transactions
  const transactionExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Dépenses véhicule (deductibleTotal est déjà calculé et enregistré dans la DB)
  const vehicleExpensesTotal = vehicleExpenses
    .reduce((sum, ve) => sum + (ve.deductibleTotal || 0), 0);

  // Dépenses bureau à domicile (totalExpenses est déjà calculé et enregistré dans la DB)
  const homeOfficeExpensesTotal = homeOfficeExpenses
    .reduce((sum, ho) => sum + (ho.totalExpenses || 0), 0);

  // Dépenses techno (totalExpenses est déjà calculé et enregistré dans la DB)
  const techExpensesTotal = techExpenses
    .reduce((sum, te) => sum + (te.totalExpenses || 0), 0);

  // Total de toutes les dépenses
  const totalExpenses = transactionExpenses + vehicleExpensesTotal + homeOfficeExpensesTotal + techExpensesTotal;

  const netIncome = totalIncome - totalExpenses;
  const margin = totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(1) : "0";

  // Calculer les données mensuelles à partir des transactions réelles
  const calculateMonthlyData = () => {
    if (shouldShowMockData) {
      return [
        { month: t("dashboard.monthJan"), revenue: 4000, expenses: 2400 },
        { month: t("dashboard.monthFeb"), revenue: 3000, expenses: 1398 },
        { month: t("dashboard.monthMar"), revenue: 2000, expenses: 9800 },
        { month: t("dashboard.monthApr"), revenue: 2780, expenses: 3908 },
        { month: t("dashboard.monthMay"), revenue: 1890, expenses: 4800 },
        { month: t("dashboard.monthJun"), revenue: 2390, expenses: 3800 },
        { month: t("dashboard.monthJul"), revenue: 3490, expenses: 4300 },
      ];
    }

    // Grouper les transactions par mois
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {};
    const monthNames = [
      t("dashboard.monthJan"), t("dashboard.monthFeb"), t("dashboard.monthMar"),
      t("dashboard.monthApr"), t("dashboard.monthMay"), t("dashboard.monthJun"),
      t("dashboard.monthJul"), t("dashboard.monthAug"), t("dashboard.monthSep"),
      t("dashboard.monthOct"), t("dashboard.monthNov"), t("dashboard.monthDec"),
    ];

    transactions.forEach((transaction) => {
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
          console.warn("Date invalide:", transaction.date);
          return;
        }
        const monthIndex = date.getMonth();
        const monthKey = monthNames[monthIndex];
        
        if (!monthKey) {
          console.warn("Mois invalide pour l'index:", monthIndex);
          return;
        }

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { revenue: 0, expenses: 0 };
        }

        if (transaction.type === "income") {
          monthlyData[monthKey].revenue += transaction.amount;
        } else {
          monthlyData[monthKey].expenses += transaction.amount;
        }
      } catch (error) {
        console.error("Erreur lors du traitement de la transaction:", transaction, error);
      }
    });

    // Convertir en tableau et trier par mois
    return monthNames.map((month) => ({
      month,
      revenue: monthlyData[month]?.revenue || 0,
      expenses: monthlyData[month]?.expenses || 0,
    }));
  };

  const revenueData = calculateMonthlyData();

  // Calculer les données de catégories à partir des transactions réelles
  const calculateCategoryData = () => {
    if (shouldShowMockData) {
      return [
        { name: t("dashboard.categorySalaries"), value: 35, fill: "#2E5DB8" },
        { name: t("dashboard.categoryOfficeSupplies"), value: 25, fill: "#0EA752" },
        { name: t("dashboard.categoryTravel"), value: 20, fill: "#F59E0B" },
        { name: t("dashboard.categoryEquipment"), value: 15, fill: "#EF4444" },
        { name: t("dashboard.categoryOther"), value: 5, fill: "#60A5FA" },
      ];
    }

    // Grouper les dépenses par catégorie
    const categoryTotals: { [key: string]: number } = {};
    // Couleurs par défaut pour les catégories (utiliser les noms réels des catégories)
    const categoryColors: { [key: string]: string } = {
      "Salaires": "#2E5DB8",
      "Fournitures de bureau": "#0EA752",
      "Voyage": "#F59E0B",
      "Équipement": "#EF4444",
      "Autre": "#60A5FA",
      // Catégories en anglais aussi
      "Salaries": "#2E5DB8",
      "Office Supplies": "#0EA752",
      "Travel": "#F59E0B",
      "Equipment": "#EF4444",
      "Other": "#60A5FA",
    };

    transactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        // Utiliser la catégorie telle quelle (pas de traduction pour éviter les clés)
        const category = transaction.category || "Autre";
        categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
      });

    // Calculer le total pour les pourcentages
    const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    if (totalExpenses === 0) {
      return [];
    }

    // Convertir en tableau avec pourcentages
    return Object.entries(categoryTotals)
      .map(([name, amount]) => ({
        name,
        value: Math.round((amount / totalExpenses) * 100),
        fill: categoryColors[name] || "#60A5FA",
      }))
      .sort((a, b) => b.value - a.value);
  };

  const categoryData = calculateCategoryData();
  
  const stats = [
    {
      label: `${t("dashboard.revenue")} ${selectedYear}`,
      value: shouldShowMockData ? "24,590 $" : `${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} $`,
      change: shouldShowMockData ? "+12.5%" : "0%",
      positive: true,
      icon: TrendingUp,
    },
    {
      label: `${t("dashboard.expenses")} ${selectedYear}`,
      value: shouldShowMockData ? "18,420 $" : `${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })} $`,
      change: shouldShowMockData ? "-5.2%" : "0%",
      positive: true,
      icon: TrendingDown,
    },
    {
      label: `${t("dashboard.income")} ${selectedYear}`,
      value: shouldShowMockData ? "6,170 $" : `${netIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} $`,
      change: shouldShowMockData ? "+8.3%" : "0%",
      positive: netIncome >= 0,
      icon: DollarSign,
    },
    {
      label: t("dashboard.margin"),
      value: shouldShowMockData ? "25.1%" : `${margin}%`,
      change: shouldShowMockData ? "+2.1%" : "0%",
      positive: true,
      icon: TrendingUp,
    },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                {t("dashboard.title")}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {t("dashboard.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-1.5">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <select
            id="dashboard-period"
            name="period"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-transparent border-none text-foreground text-sm font-medium focus:outline-none cursor-pointer"
            aria-label="Sélectionner la période"
          >
            <option value="mtd">{t("dashboard.periodThisMonth")}</option>
            <option value="qtd">{t("dashboard.periodThisQuarter")}</option>
            <option value="ytd">{t("dashboard.periodYearToDate")}</option>
            <option value="all">{t("dashboard.periodAllTime")}</option>
          </select>
        </div>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg text-foreground hover:bg-card hover:border-primary/50 transition-all text-sm font-medium">
          <Filter className="w-4 h-4" />
          <span>{t("dashboard.moreFilters")}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = [
            "from-blue-400/30 via-blue-500/20 to-blue-600/10",
            "from-emerald-400/30 via-emerald-500/20 to-emerald-600/10",
            "from-sky-400/30 via-sky-500/20 to-sky-600/10",
            "from-amber-400/30 via-amber-500/20 to-amber-600/10",
          ];
          const borderColors = [
            "border-blue-200/50",
            "border-emerald-200/50",
            "border-sky-200/50",
            "border-amber-200/50",
          ];
          return (
            <div
              key={index}
              className={`group relative bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-xl border ${borderColors[index]} p-4 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {stat.value}
                    </h3>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${
                          stat.positive 
                            ? "text-success bg-success/10" 
                            : "text-destructive bg-destructive/10"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{t("dashboard.vsLastPeriod")}</span>
                    </div>
                  </div>
                  <div
                    className={`bg-gradient-to-br ${colors[index]} p-2.5 rounded-lg shadow-sm transform group-hover:scale-105 transition-transform duration-300`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        stat.positive ? "text-success" : "text-destructive"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue vs Expenses */}
        <div className="lg:col-span-2 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-xl border border-primary/10 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">{t("dashboard.revenueVsExpenses")}</h3>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span className="text-muted-foreground">{t("dashboard.revenueLabel")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-muted-foreground">{t("dashboard.expensesLabel")}</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `${value.toLocaleString()} $`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString("en-US", { minimumFractionDigits: 2 })} $`, ""]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name={t("dashboard.revenueLabel")}
                stroke="hsl(var(--success))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--success))", r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name={t("dashboard.expensesLabel")}
                stroke="hsl(var(--destructive))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--destructive))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Categories */}
        <div className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-xl border border-accent/10 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-accent/20">
          <h3 className="text-base font-semibold text-foreground mb-4">{t("dashboard.expenseCategories")}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="45%"
                labelLine={true}
                label={({ name, percent }) => {
                  // Tronquer les noms longs pour éviter les débordements
                  const shortName = name.length > 15 ? name.substring(0, 12) + "..." : name;
                  return `${shortName}: ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={90}
                innerRadius={30}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Pourcentage"]}
                labelFormatter={(label) => {
                  // Trouver le nom complet depuis les données
                  const entry = categoryData.find((d) => d.name === label || d.name.startsWith(label));
                  return entry ? entry.name : label;
                }}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  padding: "8px 12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => {
                  const entry = categoryData.find((d) => d.name === value);
                  return entry ? (entry.name.length > 20 ? entry.name.substring(0, 17) + "..." : entry.name) : value;
                }}
                wrapperStyle={{
                  fontSize: "12px",
                  paddingTop: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-xl border border-info/10 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-info/20 mb-6">
        <h3 className="text-base font-semibold text-foreground mb-4">{t("dashboard.monthlyBreakdown")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${value.toLocaleString()} $`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString("en-US", { minimumFractionDigits: 2 })} $`, ""]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend />
            <Bar
              dataKey="revenue"
              name={t("dashboard.revenueLabel")}
              fill="hsl(var(--success))"
              radius={[8, 8, 0, 0]}
              opacity={0.9}
            />
            <Bar
              dataKey="expenses"
              name={t("dashboard.expensesLabel")}
              fill="hsl(var(--destructive))"
              radius={[8, 8, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-xl border border-border/30 p-4 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">{t("dashboard.recentTransactions")}</h3>
          <button 
            onClick={() => navigate("/transactions")}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t("dashboard.viewAll")} →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.date")}
                </th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.description")}
                </th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.category")}
                </th>
                <th className="text-left py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.type")}
                </th>
                <th className="text-right py-2 px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {shouldShowMockData ? [
                {
                  date: "2025-01-15",
                  description: `${t("dashboard.transactionClientInvoice")} #2025-001`,
                  category: t("dashboard.transactionCategoryConsulting"),
                  type: "Income",
                  amount: "+$5,000",
                  positive: true,
                },
                {
                  date: "2025-01-14",
                  description: t("dashboard.transactionOfficeSupplies"),
                  category: t("dashboard.transactionCategoryOfficeSupplies"),
                  type: "Expense",
                  amount: "-$245.50",
                  positive: false,
                },
                {
                  date: "2025-01-12",
                  description: t("dashboard.transactionTeamLunch"),
                  category: t("dashboard.transactionCategoryMealsEntertainment"),
                  type: "Expense",
                  amount: "-$125.75",
                  positive: false,
                },
                {
                  date: "2025-01-10",
                  description: t("dashboard.transactionSoftwareLicense"),
                  category: t("dashboard.transactionCategorySoftware"),
                  type: "Expense",
                  amount: "-$99.99",
                  positive: false,
                },
                {
                  date: "2025-01-08",
                  description: t("dashboard.transactionFreelancePayment"),
                  category: t("dashboard.transactionCategoryConsulting"),
                  type: "Income",
                  amount: "+$2,500",
                  positive: true,
                },
              ].map((transaction, index) => (
                <tr
                  key={index}
                  className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2 px-3 text-xs text-foreground font-medium">
                    {transaction.date}
                  </td>
                  <td className="py-2 px-3 text-xs text-foreground">
                    {transaction.description}
                  </td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">
                    {transaction.category}
                  </td>
                  <td className="py-2 px-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        transaction.type === "Income"
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {transaction.type === "Income" ? t("dashboard.incomeType") : t("dashboard.expenseType")}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-3 text-xs font-semibold text-right ${
                      transaction.positive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {transaction.amount}
                  </td>
                </tr>
              )) : transactions.length > 0 ? (
                transactions.slice(0, 5).map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2 px-3 text-xs text-foreground font-medium">
                      {transaction.date}
                    </td>
                    <td className="py-2 px-3 text-xs text-foreground">
                      {transaction.description}
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">
                      {transaction.category}
                    </td>
                    <td className="py-2 px-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          transaction.type === "income"
                            ? "bg-success/10 text-success border border-success/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                      >
                        {transaction.type === "income" ? t("dashboard.incomeType") : t("dashboard.expenseType")}
                      </span>
                    </td>
                    <td
                      className={`py-2 px-3 text-xs font-semibold text-right ${
                        transaction.type === "income" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}${transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 px-4 text-center text-xs text-muted-foreground">
                    Aucune transaction pour cette année
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
