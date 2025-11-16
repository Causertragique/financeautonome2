import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useFiscalYear, getFiscalYearStartMonth } from "../hooks/use-fiscal-year";
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
  const navigate = useNavigate();
  const fiscalYearStartMonth = getFiscalYearStartMonth();
  const fiscalYear = useFiscalYear(fiscalYearStartMonth);
  const [selectedPeriod, setSelectedPeriod] = useState("ytd");
  const [selectedYear, setSelectedYear] = useState(fiscalYear);
  
  // Données vides pour les années 2020-2024
  const shouldShowMockData = selectedYear < 2020 || selectedYear > 2024;
  
  const revenueData = shouldShowMockData ? [
    { month: t("dashboard.monthJan"), revenue: 4000, expenses: 2400 },
    { month: t("dashboard.monthFeb"), revenue: 3000, expenses: 1398 },
    { month: t("dashboard.monthMar"), revenue: 2000, expenses: 9800 },
    { month: t("dashboard.monthApr"), revenue: 2780, expenses: 3908 },
    { month: t("dashboard.monthMay"), revenue: 1890, expenses: 4800 },
    { month: t("dashboard.monthJun"), revenue: 2390, expenses: 3800 },
    { month: t("dashboard.monthJul"), revenue: 3490, expenses: 4300 },
  ] : [];

  const categoryData = shouldShowMockData ? [
    { name: t("dashboard.categorySalaries"), value: 35, fill: "#2E5DB8" },
    { name: t("dashboard.categoryOfficeSupplies"), value: 25, fill: "#0EA752" },
    { name: t("dashboard.categoryTravel"), value: 20, fill: "#F59E0B" },
    { name: t("dashboard.categoryEquipment"), value: 15, fill: "#EF4444" },
    { name: t("dashboard.categoryOther"), value: 5, fill: "#8B5CF6" },
  ] : [];
  
  // Générer la liste des années (année fiscale actuelle et 5 années précédentes)
  const availableYears = Array.from({ length: 6 }, (_, i) => fiscalYear - i);

  const stats = [
    {
      label: `${t("dashboard.revenue")} ${selectedYear}`,
      value: shouldShowMockData ? "$24,590" : "$0",
      change: shouldShowMockData ? "+12.5%" : "0%",
      positive: true,
      icon: TrendingUp,
    },
    {
      label: `${t("dashboard.expenses")} ${selectedYear}`,
      value: shouldShowMockData ? "$18,420" : "$0",
      change: shouldShowMockData ? "-5.2%" : "0%",
      positive: true,
      icon: TrendingDown,
    },
    {
      label: `${t("dashboard.income")} ${selectedYear}`,
      value: shouldShowMockData ? "$6,170" : "$0",
      change: shouldShowMockData ? "+8.3%" : "0%",
      positive: true,
      icon: DollarSign,
    },
    {
      label: t("dashboard.margin"),
      value: shouldShowMockData ? "25.1%" : "0%",
      change: shouldShowMockData ? "+2.1%" : "0%",
      positive: true,
      icon: TrendingUp,
    },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                {t("dashboard.title")}
              </h1>
            </div>
            <p className="text-muted-foreground text-xl font-medium">
              {t("dashboard.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2.5">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-transparent border-none text-foreground font-medium focus:outline-none cursor-pointer"
          >
            <option value="mtd">{t("dashboard.periodThisMonth")}</option>
            <option value="qtd">{t("dashboard.periodThisQuarter")}</option>
            <option value="ytd">{t("dashboard.periodYearToDate")}</option>
            <option value="all">{t("dashboard.periodAllTime")}</option>
          </select>
        </div>
        <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-2.5">
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
        <button className="flex items-center gap-2 px-5 py-2.5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl text-foreground hover:bg-card hover:border-primary/50 transition-all font-medium">
          <Filter className="w-4 h-4" />
          <span>{t("dashboard.moreFilters")}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = [
            "from-blue-400/30 via-blue-500/20 to-blue-600/10",
            "from-emerald-400/30 via-emerald-500/20 to-emerald-600/10",
            "from-violet-400/30 via-violet-500/20 to-violet-600/10",
            "from-amber-400/30 via-amber-500/20 to-amber-600/10",
          ];
          const borderColors = [
            "border-blue-200/50",
            "border-emerald-200/50",
            "border-violet-200/50",
            "border-amber-200/50",
          ];
          return (
            <div
              key={index}
              className={`group relative bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-3xl border-2 ${borderColors[index]} p-7 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors[index]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4 font-semibold uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <h3 className="text-2xl font-extrabold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                      {stat.value}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <span
                        className={`text-base font-bold px-2.5 py-1 rounded-lg w-fit ${
                          stat.positive 
                            ? "text-success bg-success/10" 
                            : "text-destructive bg-destructive/10"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">{t("dashboard.vsLastPeriod")}</span>
                    </div>
                  </div>
                  <div
                    className={`bg-gradient-to-br ${colors[index]} p-4 rounded-2xl shadow-xl transform group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon
                      className={`w-7 h-7 ${
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue vs Expenses */}
        <div className="lg:col-span-2 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-3xl border-2 border-primary/10 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">{t("dashboard.revenueVsExpenses")}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">{t("dashboard.revenueLabel")}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">{t("dashboard.expensesLabel")}</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
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
              />
              <Tooltip
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
        <div className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-3xl border-2 border-accent/10 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-accent/20">
          <h3 className="text-xl font-bold text-foreground mb-6">{t("dashboard.expenseCategories")}</h3>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-3xl border-2 border-info/10 p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:border-info/20 mb-8">
        <h3 className="text-xl font-bold text-foreground mb-6">{t("dashboard.monthlyBreakdown")}</h3>
        <ResponsiveContainer width="100%" height={320}>
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
            />
            <Tooltip
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
      <div className="bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-3xl border-2 border-border/30 p-8 shadow-xl hover:shadow-2xl transition-all duration-500">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">{t("dashboard.recentTransactions")}</h3>
          <button 
            onClick={() => navigate("/transactions")}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            {t("dashboard.viewAll")} →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.date")}
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.description")}
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.category")}
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("dashboard.type")}
                </th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                  <td className="py-4 px-4 text-sm text-foreground font-medium">
                    {transaction.date}
                  </td>
                  <td className="py-4 px-4 text-sm text-foreground">
                    {transaction.description}
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {transaction.category}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <span
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        transaction.type === "Income"
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {transaction.type === "Income" ? t("dashboard.incomeType") : t("dashboard.expenseType")}
                    </span>
                  </td>
                  <td
                    className={`py-4 px-4 text-sm font-bold text-right ${
                      transaction.positive ? "text-success" : "text-destructive"
                    }`}
                  >
                    {transaction.amount}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-8 px-4 text-center text-muted-foreground">
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
