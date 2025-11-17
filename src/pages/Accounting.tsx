import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import { Calendar, TrendingUp, TrendingDown, DollarSign, Building2, FileText } from "lucide-react";
import { getTransactions, type Transaction } from "../lib/db";

export default function Accounting() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { selectedYear } = useFiscalYearContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

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

  // Les données mock sont uniquement pour la démo quand l'utilisateur n'est pas connecté
  // Si l'utilisateur est connecté, on utilise les vraies données depuis Firestore
  const shouldShowMockData = !currentUser;

  // Calculer les comptes à recevoir à partir des transactions de revenus
  const accountsReceivable = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  // Calculer les dettes fournisseurs à partir des transactions de dépenses
  const accountsPayable = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const assets = {
    current: [
      ...(shouldShowMockData ? [
        { name: "Comptes bancaires", amount: 25000 },
        { name: "Inventaire", amount: 3200 },
      ] : []),
      ...(accountsReceivable > 0 ? [
        { name: "Comptes clients (à recevoir)", amount: accountsReceivable, fromTransactions: true },
      ] : []),
    ],
    nonCurrent: shouldShowMockData ? [
      { name: "Équipement", amount: 15000 },
      { name: "Amortissement cumulé", amount: -2500 },
    ] : [],
  };

  const liabilities = {
    current: [
      ...(accountsPayable > 0 ? [
        { name: "Dettes fournisseurs", amount: accountsPayable, fromTransactions: true },
      ] : []),
      ...(shouldShowMockData ? [
        { name: "Prêts à court terme", amount: 5000 },
      ] : []),
    ],
    nonCurrent: shouldShowMockData ? [
      { name: "Prêts à long terme", amount: 10000 },
    ] : [],
  };

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Comptabilité</h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble de vos actifs, passifs, capitaux propres et investissements
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-xl border border-blue-200/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-400/30 p-3 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Total Actifs</p>
          <h3 className="text-2xl font-bold text-foreground">
            {totalAssets.toLocaleString()} $
          </h3>
        </div>

        <div className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-xl border border-red-200/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-400/30 p-3 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Total Passifs</p>
          <h3 className="text-2xl font-bold text-foreground">
            {totalLiabilities.toLocaleString()} $
          </h3>
        </div>

        <div className="bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-xl border border-green-200/50 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-green-400/30 p-3 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">Capitaux Propres</p>
          <h3 className="text-2xl font-bold text-foreground">
            {totalEquity.toLocaleString()} $
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Actifs */}
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Actifs
          </h2>
          
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Actifs courants</h3>
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
                    <span className="font-semibold text-blue-600">{asset.amount.toLocaleString()} $</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                  <span>Total Actifs courants</span>
                  <span className="text-blue-600">
                    {assets.current.reduce((sum, a) => sum + a.amount, 0).toLocaleString()} $
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun actif courant pour cette année</p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Actifs non courants</h3>
            {shouldShowMockData && assets.nonCurrent.length > 0 ? (
              <div className="space-y-2">
                {assets.nonCurrent.map((asset, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-foreground">{asset.name}</span>
                    <span className={`font-semibold ${asset.amount < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {asset.amount.toLocaleString()} $
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                  <span>Total Actifs non courants</span>
                  <span className="text-blue-600">
                    {assets.nonCurrent.reduce((sum, a) => sum + a.amount, 0).toLocaleString()} $
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun actif non courant pour cette année</p>
            )}
          </div>
        </div>

        {/* Passifs */}
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            Passifs
          </h2>
          
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Passifs courants</h3>
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
                    <span className="font-semibold text-red-600">{liability.amount.toLocaleString()} $</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                  <span>Total Passifs courants</span>
                  <span className="text-red-600">
                    {liabilities.current.reduce((sum, l) => sum + l.amount, 0).toLocaleString()} $
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun passif courant pour cette année</p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Passifs non courants</h3>
            {shouldShowMockData && liabilities.nonCurrent.length > 0 ? (
              <div className="space-y-2">
                {liabilities.nonCurrent.map((liability, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-foreground">{liability.name}</span>
                    <span className="font-semibold text-red-600">{liability.amount.toLocaleString()} $</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                  <span>Total Passifs non courants</span>
                  <span className="text-red-600">
                    {liabilities.nonCurrent.reduce((sum, l) => sum + l.amount, 0).toLocaleString()} $
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aucun passif non courant pour cette année</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Capitaux Propres */}
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            Capitaux Propres
          </h2>
          {shouldShowMockData && equity.length > 0 ? (
            <div className="space-y-2">
              {equity.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-border/30">
                  <span className="text-foreground">{item.name}</span>
                  <span className="font-semibold text-green-600">{item.amount.toLocaleString()} $</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                <span>Total Capitaux propres</span>
                <span className="text-green-600">
                  {totalEquity.toLocaleString()} $
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucun capital pour cette année</p>
          )}
        </div>

        {/* Investissements */}
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-600" />
            Investissements
          </h2>
          {shouldShowMockData && investments.length > 0 ? (
            <div className="space-y-3">
              {investments.map((investment, idx) => (
                <div key={idx} className="border-b border-border/30 pb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-foreground font-medium">{investment.name}</span>
                    <span className="font-semibold text-sky-600">{investment.amount.toLocaleString()} $</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{investment.date}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 font-bold text-foreground mt-2">
                <span>Total Investissements</span>
                <span className="text-sky-600">
                  {investments.reduce((sum, i) => sum + i.amount, 0).toLocaleString()} $
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucun investissement pour cette année</p>
          )}
        </div>

        {/* Prêts */}
        <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            Prêts
          </h2>
          {shouldShowMockData && loans.length > 0 ? (
            <div className="space-y-3">
              {loans.map((loan, idx) => (
                <div key={idx} className="border-b border-border/30 pb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-foreground font-medium">{loan.name}</span>
                    <span className="font-semibold text-orange-600">{loan.amount.toLocaleString()} $</span>
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
                  {loans.reduce((sum, l) => sum + l.amount, 0).toLocaleString()} $
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

