import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useFiscalYear, getFiscalYearStartMonth } from "../hooks/use-fiscal-year";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Building2, FileText } from "lucide-react";
import { getTransactions, type Transaction } from "../lib/db";

export default function Accounting() {
  const { t } = useLanguage();
  const fiscalYearStartMonth = getFiscalYearStartMonth();
  const fiscalYear = useFiscalYear(fiscalYearStartMonth);
  const [selectedYear, setSelectedYear] = useState(fiscalYear);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const availableYears = Array.from({ length: 6 }, (_, i) => fiscalYear - i);

  // Charger les transactions depuis la base de données
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const data = await getTransactions(selectedYear);
        setTransactions(data);
      } catch (error) {
        console.error("Erreur lors du chargement des transactions:", error);
        setTransactions([]);
      }
    };

    loadTransactions();
    
    // Écouter les événements personnalisés pour les changements
    const handleCustomStorageChange = () => {
      loadTransactions();
    };
    window.addEventListener("transactionsUpdated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("transactionsUpdated", handleCustomStorageChange);
    };
  }, [selectedYear]);

  // Données mock pour les années autres que 2020-2024
  const shouldShowMockData = selectedYear < 2020 || selectedYear > 2024;

  // Calculer les comptes à recevoir à partir des transactions de revenus
  const accountsReceivable = shouldShowMockData 
    ? transactions.filter(t => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0)
    : 0;

  // Calculer les dettes fournisseurs à partir des transactions de dépenses
  const accountsPayable = shouldShowMockData
    ? transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0)
    : 0;

  const assets = shouldShowMockData ? {
    current: [
      { name: "Comptes bancaires", amount: 25000 },
      { name: "Comptes clients (à recevoir)", amount: accountsReceivable, fromTransactions: true },
      { name: "Inventaire", amount: 3200 },
    ],
    nonCurrent: [
      { name: "Équipement", amount: 15000 },
      { name: "Amortissement cumulé", amount: -2500 },
    ],
  } : { current: [], nonCurrent: [] };

  const liabilities = shouldShowMockData ? {
    current: [
      { name: "Dettes fournisseurs", amount: accountsPayable, fromTransactions: true },
      { name: "Prêts à court terme", amount: 5000 },
    ],
    nonCurrent: [
      { name: "Prêts à long terme", amount: 10000 },
    ],
  } : { current: [], nonCurrent: [] };

  const equity = shouldShowMockData ? [
    { name: "Capital", amount: 25000 },
    { name: "Bénéfices non répartis", amount: 6000 },
  ] : [];

  const investments = shouldShowMockData ? [
    { name: "Achat d'équipement", amount: 5000, date: "2024-01-10" },
    { name: "Immobilier", amount: 150000, date: "2023-06-15" },
  ] : [];

  const loans = shouldShowMockData ? [
    { name: "Prêt bancaire", amount: 10000, date: "2024-01-05", type: "Long terme", interest: 5.5 },
    { name: "Ligne de crédit", amount: 5000, date: "2023-12-01", type: "Court terme", interest: 7.0 },
  ] : [];

  const totalAssets = assets.current.reduce((sum, a) => sum + a.amount, 0) + 
                      assets.nonCurrent.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = liabilities.current.reduce((sum, l) => sum + l.amount, 0) + 
                           liabilities.nonCurrent.reduce((sum, l) => sum + l.amount, 0);
  const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0);

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Comptabilité</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos actifs, passifs, capitaux propres et investissements
          </p>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-3xl border-2 border-blue-200/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-400/30 p-4 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2 font-semibold uppercase">Total Actifs</p>
          <h3 className="text-3xl font-extrabold text-foreground">
            ${shouldShowMockData ? totalAssets.toLocaleString() : "0"}
          </h3>
        </div>

        <div className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-3xl border-2 border-red-200/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-400/30 p-4 rounded-2xl">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2 font-semibold uppercase">Total Passifs</p>
          <h3 className="text-3xl font-extrabold text-foreground">
            ${shouldShowMockData ? totalLiabilities.toLocaleString() : "0"}
          </h3>
        </div>

        <div className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-3xl border-2 border-green-200/50 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-400/30 p-4 rounded-2xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-2 font-semibold uppercase">Capitaux Propres</p>
          <h3 className="text-3xl font-extrabold text-foreground">
            ${shouldShowMockData ? totalEquity.toLocaleString() : "0"}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Actifs */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Actifs
          </h2>
          
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Actifs courants</h3>
            {shouldShowMockData && assets.current.length > 0 ? (
              <div className="space-y-2">
                {assets.current.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{asset.name}</span>
                      {asset.fromTransactions && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Depuis transactions
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-blue-600">${asset.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                  <span>Total Actifs courants</span>
                  <span className="text-blue-600">
                    ${assets.current.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun actif courant pour cette année</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Actifs non courants</h3>
            {shouldShowMockData && assets.nonCurrent.length > 0 ? (
              <div className="space-y-2">
                {assets.nonCurrent.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-foreground">{asset.name}</span>
                    <span className={`font-semibold ${asset.amount < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      ${asset.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                  <span>Total Actifs non courants</span>
                  <span className="text-blue-600">
                    ${assets.nonCurrent.reduce((sum, a) => sum + a.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun actif non courant pour cette année</p>
            )}
          </div>
        </div>

        {/* Passifs */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Passifs
          </h2>
          
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Passifs courants</h3>
            {shouldShowMockData && liabilities.current.length > 0 ? (
              <div className="space-y-2">
                {liabilities.current.map((liability, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{liability.name}</span>
                      {liability.fromTransactions && (
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                          Depuis transactions
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-red-600">${liability.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                  <span>Total Passifs courants</span>
                  <span className="text-red-600">
                    ${liabilities.current.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun passif courant pour cette année</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Passifs non courants</h3>
            {shouldShowMockData && liabilities.nonCurrent.length > 0 ? (
              <div className="space-y-2">
                {liabilities.nonCurrent.map((liability, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-foreground">{liability.name}</span>
                    <span className="font-semibold text-red-600">${liability.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                  <span>Total Passifs non courants</span>
                  <span className="text-red-600">
                    ${liabilities.nonCurrent.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun passif non courant pour cette année</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Capitaux Propres */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Capitaux Propres
          </h2>
          {shouldShowMockData && equity.length > 0 ? (
            <div className="space-y-2">
              {equity.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-foreground">{item.name}</span>
                  <span className="font-semibold text-green-600">${item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                <span>Total Capitaux propres</span>
                <span className="text-green-600">
                  ${totalEquity.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucun capital pour cette année</p>
          )}
        </div>

        {/* Investissements */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            Investissements
          </h2>
          {shouldShowMockData && investments.length > 0 ? (
            <div className="space-y-3">
              {investments.map((investment, idx) => (
                <div key={idx} className="border-b border-border/30 pb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-foreground font-medium">{investment.name}</span>
                    <span className="font-semibold text-purple-600">${investment.amount.toLocaleString()}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{investment.date}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                <span>Total Investissements</span>
                <span className="text-purple-600">
                  ${investments.reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucun investissement pour cette année</p>
          )}
        </div>

        {/* Prêts */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-600" />
            Prêts
          </h2>
          {shouldShowMockData && loans.length > 0 ? (
            <div className="space-y-3">
              {loans.map((loan, idx) => (
                <div key={idx} className="border-b border-border/30 pb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-foreground font-medium">{loan.name}</span>
                    <span className="font-semibold text-orange-600">${loan.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{loan.type}</span>
                    <span>Taux: {loan.interest}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{loan.date}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                <span>Total Prêts</span>
                <span className="text-orange-600">
                  ${loans.reduce((sum, l) => sum + l.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucun prêt pour cette année</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

