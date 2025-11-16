import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import {
  Plus,
  FileText,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import React from "react";

const taxFilings = [
  {
    id: 1,
    company: "Tech Solutions Inc",
    year: 2023,
    type: "federal",
    jurisdiction: "Canada - T1 General (Self-Employment)",
    status: "completed",
    filedDate: "2024-01-15",
    deadline: "2024-06-15",
    income: 85000,
    expenses: 32000,
    netIncome: 53000,
    taxOwed: 12700,
  },
  {
    id: 2,
    company: "Tech Solutions Inc",
    year: 2023,
    type: "provincial",
    jurisdiction: "Quebec - TP-1 (Declaration of Income)",
    status: "completed",
    filedDate: "2024-01-15",
    deadline: "2024-06-15",
    income: 85000,
    expenses: 32000,
    netIncome: 53000,
    taxOwed: 8100,
  },
  {
    id: 3,
    company: "Creative Agency",
    year: 2023,
    type: "federal",
    jurisdiction: "Canada - T1 General (Self-Employment)",
    status: "pending",
    filedDate: null,
    deadline: "2024-06-15",
    income: 92000,
    expenses: 28500,
    netIncome: 63500,
    taxOwed: 15200,
  },
  {
    id: 4,
    company: "Creative Agency",
    year: 2024,
    type: "quarterly",
    jurisdiction: "Canada - GST/HST Quarterly Return (Q1 2024)",
    status: "pending",
    filedDate: null,
    deadline: "2024-05-15",
    income: 22500,
    expenses: 7200,
    netIncome: 15300,
    taxOwed: 3825,
  },
];

const importantDates = [
  {
    date: "2024-03-31",
    event: "Q4 2023 Tax Filing Deadline",
    type: "federal",
  },
  {
    date: "2024-04-30",
    event: "Q1 2024 GST/HST Return Due",
    type: "federal",
  },
  {
    date: "2024-06-15",
    event: "2023 Tax Return Filing Deadline",
    type: "both",
  },
  {
    date: "2024-07-31",
    event: "Q2 2024 GST/HST Return Due",
    type: "federal",
  },
];

export default function TaxFiling() {
  const { t } = useLanguage();
  const [showNewFilingModal, setShowNewFilingModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2023);

  const filteredFilings = taxFilings.filter((f) => f.year === selectedYear);
  const completedFilings = filteredFilings.filter((f) => f.status === "completed");
  const pendingFilings = filteredFilings.filter((f) => f.status === "pending");

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("taxFiling.title")}</h1>
          <p className="text-muted-foreground">
            {t("taxFiling.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowNewFilingModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>{t("taxFiling.newFiling")}</span>
        </button>
      </div>

      {/* Year Filter */}
      <div className="mb-8 flex items-center gap-4">
        <p className="text-sm font-medium text-foreground">{t("taxFiling.taxYear")}:</p>
        <div className="flex gap-2">
          {[2023, 2024].map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedYear === year
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:border-primary"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">{t("taxFiling.totalFilings")}</p>
          <p className="text-3xl font-bold text-foreground">
            {filteredFilings.length}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">{t("taxFiling.completed")}</p>
          <p className="text-3xl font-bold text-success">{completedFilings.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">{t("taxFiling.pending")}</p>
          <p className="text-3xl font-bold text-warning">{pendingFilings.length}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-2">{t("taxFiling.totalTaxOwing")}</p>
          <p className="text-3xl font-bold text-destructive">
            ${filteredFilings.reduce((sum, f) => sum + f.taxOwed, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Tax Filings */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-foreground mb-4">{t("taxFiling.taxFilings")}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFilings.map((filing) => (
            <div
              key={filing.id}
              className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {filing.company}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {filing.jurisdiction}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-medium ${
                    filing.status === "completed"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  }`}
                >
                  {filing.status === "completed" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span className="capitalize">
                    {filing.status === "completed" ? t("taxFiling.completed") : t("taxFiling.pending")}
                  </span>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-border mb-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {t("taxFiling.income")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    ${filing.income.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {t("taxFiling.expenses")}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    ${filing.expenses.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    {t("taxFiling.netIncome")}
                  </p>
                  <p className="text-sm font-semibold text-success">
                    ${filing.netIncome.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Deadlines & Tax Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("taxFiling.deadline")}:</p>
                  <p className="text-sm font-medium text-foreground">
                    {filing.deadline}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("taxFiling.taxOwing")}:</p>
                  <p className="text-sm font-bold text-destructive">
                    ${filing.taxOwed.toLocaleString()}
                  </p>
                </div>
                {filing.status === "completed" && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t("taxFiling.filed")}:</p>
                    <p className="text-sm font-medium text-success">
                      {filing.filedDate}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-sm">
                  <FileText className="w-4 h-4" />
                  <span>{t("taxFiling.viewDetails")}</span>
                </button>
                <button className="px-3 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Dates */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {t("taxFiling.importantDates")}
        </h2>
        <div className="space-y-3">
          {importantDates.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{item.event}</p>
                <p className="text-sm text-muted-foreground">{item.date}</p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${
                  item.type === "both"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {item.type === "both"
                  ? t("taxFiling.federalProvincial")
                  : t("taxFiling.federalOnly")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showNewFilingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t("taxFiling.createNewFiling")}
            </h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    {t("taxFiling.company")}
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Tech Solutions Inc</option>
                    <option>Creative Agency</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    {t("taxFiling.taxYear")}
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>2024</option>
                    <option>2023</option>
                    <option>2022</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    {t("taxFiling.filingType")}
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Annual Return (Federal)</option>
                    <option>Annual Return (Provincial)</option>
                    <option>Quarterly GST/HST</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    {t("taxFiling.jurisdiction")}
                  </label>
                  <select className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Canada (Federal)</option>
                    <option>Quebec</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    {t("taxFiling.totalIncome")}
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    {t("taxFiling.totalExpenses")}
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewFilingModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  {t("companies.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  {t("taxFiling.createFiling")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
