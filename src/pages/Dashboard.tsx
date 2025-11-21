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
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
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
  const [budgetData, setBudgetData] = useState<{
    salaryType: "annual" | "biweekly";
    salary: number;
    salaryStartDate: string;
    fixedExpenses: Array<{ id: string; name: string; amount: number; startDate: string; endDate?: string; recurrence: string }>;
    variableExpenses: Array<{ id: string; name: string; amount: number; date: string }>;
  } | null>(null);
  
  // Cache pour les données des deux modes (pour basculement instantané)
  const [dataCache, setDataCache] = useState<{
    business: {
      transactions: Transaction[];
      vehicleExpenses: any[];
      homeOfficeExpenses: any[];
      techExpenses: any[];
    };
    personal: {
      transactions: Transaction[];
      vehicleExpenses: any[];
      homeOfficeExpenses: any[];
      techExpenses: any[];
    };
  }>({
    business: { transactions: [], vehicleExpenses: [], homeOfficeExpenses: [], techExpenses: [] },
    personal: { transactions: [], vehicleExpenses: [], homeOfficeExpenses: [], techExpenses: [] },
  });

  // Fonction pour charger les données du budget
  const loadBudgetData = async (userId: string, mode: "business" | "personal") => {
    if (!db || !userId) return null;
    
    try {
      const modeName = mode === "business" ? "entreprise" : "personnelle";
      const budgetRef = collection(db, "Users", userId, "data", modeName, "budget");
      const snapshot = await getDocs(budgetRef);
      
      const budget: any = {
        salaryType: "annual" as "annual" | "biweekly",
        salary: 0,
        salaryStartDate: "",
        fixedExpenses: [] as any[],
        variableExpenses: [] as any[],
      };
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (docSnap.id === "settings") {
          budget.salaryType = data.salaryType || "annual";
          budget.salary = data.salary || 0;
          budget.salaryStartDate = data.salaryStartDate || "";
        } else if (data.type === "fixed") {
          budget.fixedExpenses.push({ ...data, id: docSnap.id });
        } else if (data.type === "variable") {
          budget.variableExpenses.push({ ...data, id: docSnap.id });
        }
      });
      
      return budget;
    } catch (error) {
      console.error("Erreur lors du chargement du budget:", error);
      return null;
    }
  };
  
  // Les données mock sont uniquement pour la démo quand l'utilisateur n'est pas connecté
  // Si l'utilisateur est connecté, on utilise les vraies données depuis Firestore
  const shouldShowMockData = !currentUser;

  // Charger les données dans le cache pour les deux modes (si usageType === "both")
  React.useEffect(() => {
    const loadAllData = async () => {
      if (!currentUser) {
        setTransactions([]);
        setVehicleExpenses([]);
        setHomeOfficeExpenses([]);
        setTechExpenses([]);
        setDataCache({
          business: { transactions: [], vehicleExpenses: [], homeOfficeExpenses: [], techExpenses: [] },
          personal: { transactions: [], vehicleExpenses: [], homeOfficeExpenses: [], techExpenses: [] },
        });
        return;
      }
      
      try {
        // Si usageType === "both", charger les données des deux modes en parallèle
        if (usageType === "both") {
          const [businessData, personalData] = await Promise.all([
            Promise.all([
              getTransactions(selectedYear, "business"),
              getVehicleAnnualProfiles(selectedYear, "business"),
              getHomeOfficeExpenses(selectedYear, "business"),
              getTechExpenses(selectedYear, "business"),
            ]),
            Promise.all([
              getTransactions(selectedYear, "personal"),
              getVehicleAnnualProfiles(selectedYear, "personal"),
              getHomeOfficeExpenses(selectedYear, "personal"),
              getTechExpenses(selectedYear, "personal"),
            ]),
          ]);
          
          const newCache = {
            business: {
              transactions: businessData[0],
              vehicleExpenses: businessData[1],
              homeOfficeExpenses: businessData[2],
              techExpenses: businessData[3],
            },
            personal: {
              transactions: personalData[0],
              vehicleExpenses: personalData[1],
              homeOfficeExpenses: personalData[2],
              techExpenses: personalData[3],
            },
          };
          
          setDataCache(newCache);
          
          // Afficher les données du mode actuel
          const mode = currentMode;
          setTransactions(newCache[mode].transactions);
          setVehicleExpenses(newCache[mode].vehicleExpenses);
          setHomeOfficeExpenses(newCache[mode].homeOfficeExpenses);
          setTechExpenses(newCache[mode].techExpenses);
          
          // Charger le budget pour le mode actuel
          const budget = await loadBudgetData(currentUser.uid, mode);
          setBudgetData(budget);
        } else {
          // Si un seul mode, charger normalement
          const mode = usageType || "business";
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
        
        // Charger le budget
        const budget = await loadBudgetData(currentUser.uid, mode);
        setBudgetData(budget);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setTransactions([]);
        setVehicleExpenses([]);
        setHomeOfficeExpenses([]);
        setTechExpenses([]);
        setBudgetData(null);
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
    
    // Écouter les mises à jour du budget
    const handleBudgetUpdate = async () => {
      if (currentUser) {
        const mode = usageType === "both" ? currentMode : (usageType || "business");
        const budget = await loadBudgetData(currentUser.uid, mode);
        setBudgetData(budget);
      }
    };
    window.addEventListener("budgetUpdated", handleBudgetUpdate);

    return () => {
      window.removeEventListener("transactionsUpdated", handleTransactionsUpdate);
      window.removeEventListener("vehicleExpensesUpdated", handleVehicleExpensesUpdate);
      window.removeEventListener("homeOfficeExpensesUpdated", handleHomeOfficeExpensesUpdate);
      window.removeEventListener("techExpensesUpdated", handleTechExpensesUpdate);
      window.removeEventListener("budgetUpdated", handleBudgetUpdate);
    };
  }, [selectedYear, currentUser, usageType, currentMode]);

  // Quand le mode change (pour usageType === "both"), basculer instantanément depuis le cache
  React.useEffect(() => {
    if (usageType === "both" && currentUser) {
      const mode = currentMode;
      setTransactions(dataCache[mode].transactions);
      setVehicleExpenses(dataCache[mode].vehicleExpenses);
      setHomeOfficeExpenses(dataCache[mode].homeOfficeExpenses);
      setTechExpenses(dataCache[mode].techExpenses);
      
      // Charger le budget pour le nouveau mode
      loadBudgetData(currentUser.uid, mode).then((budget) => {
        setBudgetData(budget);
      });
    }
  }, [currentMode, usageType, dataCache, currentUser]);

  // Calculer les revenus planifiés depuis le budget
  const calculateBudgetedIncome = () => {
    if (!budgetData || !budgetData.salary) return 0;
    const annualIncome = budgetData.salaryType === "annual"
      ? budgetData.salary
      : budgetData.salary * 26; // 26 périodes aux 2 semaines
    return annualIncome;
  };

  const budgetedIncome = calculateBudgetedIncome();
  const budgetedMonthlyIncome = budgetedIncome / 12;

  // Calculer les dépenses planifiées depuis le budget
  const calculateBudgetedExpenses = () => {
    if (!budgetData) return 0;
    
    // Calculer les dépenses fixes pour l'année
    let fixedTotal = 0;
    budgetData.fixedExpenses.forEach((exp) => {
      const startDate = new Date(exp.startDate);
      const endDate = exp.endDate ? new Date(exp.endDate) : new Date(selectedYear, 11, 31);
      const yearStart = new Date(selectedYear, 0, 1);
      const yearEnd = new Date(selectedYear, 11, 31);
      
      // Vérifier si la dépense est dans l'année sélectionnée
      if (endDate >= yearStart && startDate <= yearEnd) {
        let occurrences = 0;
        const recurrenceMap: { [key: string]: number } = {
          weekly: 52,
          biweekly: 26,
          monthly: 12,
          bimonthly: 6,
          quarterly: 4,
          yearly: 1,
          none: 1,
        };
        occurrences = recurrenceMap[exp.recurrence] || 12;
        fixedTotal += exp.amount * occurrences;
      }
    });
    
    // Calculer les dépenses variables pour l'année
    const variableTotal = budgetData.variableExpenses
      .filter((exp) => {
        const expDate = new Date(exp.date);
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        return expDate >= yearStart && expDate <= yearEnd;
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
    
    return fixedTotal + variableTotal;
  };

  const budgetedExpenses = calculateBudgetedExpenses();

  // Calculer les statistiques réelles à partir des transactions et des dépenses spéciales
  // En mode personnel, gérer les nouveaux types et exclure les transferts entre comptes
  const isPersonalMode = usageType === "personal" || (usageType === "both" && currentMode === "personal");
  
  const totalIncome = transactions
    .filter((t) => {
      if (isPersonalMode) {
        // En mode personnel : revenu = "revenue"
        // Exclure les transferts entre comptes (transferType === "between_accounts")
        if (t.type === "revenue") return true;
        if (t.type === "transfert" && t.transferType === "between_accounts") return false;
        return false;
      } else {
        return t.type === "income";
      }
    })
    .reduce((sum, t) => sum + t.amount, 0);

  // Dépenses des transactions
  const transactionExpenses = transactions
    .filter((t) => {
      if (isPersonalMode) {
        // En mode personnel : dépenses = "depense", "remboursement", "paiement_facture", "transfert" (entre personnes)
        // Exclure les transferts entre comptes (transferType === "between_accounts")
        if (t.type === "transfert" && t.transferType === "between_accounts") return false;
        return t.type === "depense" || t.type === "remboursement" || t.type === "paiement_facture" || 
               (t.type === "transfert" && t.transferType === "between_persons");
      } else {
        return t.type === "expense";
      }
    })
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

  // Comparaison budget vs réel
  const incomeVsBudget = budgetedIncome > 0 ? ((totalIncome / budgetedIncome) * 100).toFixed(1) : "0";
  const expensesVsBudget = budgetedExpenses > 0 ? ((totalExpenses / budgetedExpenses) * 100).toFixed(1) : "0";
  const budgetVariance = budgetedIncome - budgetedExpenses;
  const actualVariance = totalIncome - totalExpenses;

  // Calculer les données mensuelles à partir des transactions réelles et du budget
  const calculateMonthlyData = () => {
    if (shouldShowMockData) {
      return [
        { month: t("dashboard.monthJan"), revenue: 4000, expenses: 2400, budgetRevenue: 4000, budgetExpenses: 2500 },
        { month: t("dashboard.monthFeb"), revenue: 3000, expenses: 1398, budgetRevenue: 4000, budgetExpenses: 2500 },
        { month: t("dashboard.monthMar"), revenue: 2000, expenses: 9800, budgetRevenue: 4000, budgetExpenses: 2500 },
        { month: t("dashboard.monthApr"), revenue: 2780, expenses: 3908, budgetRevenue: 4000, budgetExpenses: 2500 },
        { month: t("dashboard.monthMay"), revenue: 1890, expenses: 4800, budgetRevenue: 4000, budgetExpenses: 2500 },
        { month: t("dashboard.monthJun"), revenue: 2390, expenses: 3800, budgetRevenue: 4000, budgetExpenses: 2500 },
        { month: t("dashboard.monthJul"), revenue: 3490, expenses: 4300, budgetRevenue: 4000, budgetExpenses: 2500 },
      ];
    }

    // Grouper les transactions par mois
    const monthlyData: { [key: string]: { revenue: number; expenses: number; budgetRevenue: number; budgetExpenses: number } } = {};
    const monthNames = [
      t("dashboard.monthJan"), t("dashboard.monthFeb"), t("dashboard.monthMar"),
      t("dashboard.monthApr"), t("dashboard.monthMay"), t("dashboard.monthJun"),
      t("dashboard.monthJul"), t("dashboard.monthAug"), t("dashboard.monthSep"),
      t("dashboard.monthOct"), t("dashboard.monthNov"), t("dashboard.monthDec"),
    ];

    // Initialiser tous les mois
    monthNames.forEach((month) => {
      monthlyData[month] = { revenue: 0, expenses: 0, budgetRevenue: 0, budgetExpenses: 0 };
    });

    // Calculer les revenus réels par mois
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

        // Gérer les types selon le mode
        if (isPersonalMode) {
          // Mode personnel
          if (transaction.type === "revenue") {
            monthlyData[monthKey].revenue += transaction.amount;
          } else if (transaction.type === "depense" || transaction.type === "remboursement" || 
                     transaction.type === "paiement_facture" || 
                     (transaction.type === "transfert" && transaction.transferType === "between_persons")) {
            // Exclure les transferts entre comptes
            if (!(transaction.type === "transfert" && transaction.transferType === "between_accounts")) {
              monthlyData[monthKey].expenses += transaction.amount;
        }
          }
        } else {
          // Mode business
        if (transaction.type === "income") {
          monthlyData[monthKey].revenue += transaction.amount;
        } else {
          monthlyData[monthKey].expenses += transaction.amount;
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement de la transaction:", transaction, error);
      }
    });

    // Calculer les données du budget par mois
    if (budgetData) {
      // Revenus planifiés par mois (salaire mensuel)
      const monthlyBudgetRevenue = budgetedMonthlyIncome;
      monthNames.forEach((month) => {
        monthlyData[month].budgetRevenue = monthlyBudgetRevenue;
      });

      // Dépenses planifiées par mois
      // 1. Dépenses fixes récurrentes
      if (budgetData.fixedExpenses) {
        budgetData.fixedExpenses.forEach((exp) => {
          const startDate = new Date(exp.startDate);
          const endDate = exp.endDate ? new Date(exp.endDate) : new Date(selectedYear, 11, 31);
          const yearStart = new Date(selectedYear, 0, 1);
          const yearEnd = new Date(selectedYear, 11, 31);
          
          // Vérifier si la dépense est dans l'année sélectionnée
          if (endDate >= yearStart && startDate <= yearEnd) {
            // Calculer les occurrences par mois selon la récurrence
            const recurrenceMap: { [key: string]: number } = {
              weekly: 4.33, // ~4.33 semaines par mois
              biweekly: 2.17, // ~2.17 périodes de 2 semaines par mois
              monthly: 1,
              bimonthly: 0.5,
              quarterly: 0.33,
              yearly: 0.083,
              none: 0,
            };
            
            const monthlyOccurrences = recurrenceMap[exp.recurrence] || 0;
            const monthlyAmount = exp.amount * monthlyOccurrences;
            
            // Ajouter cette dépense à chaque mois de l'année
            monthNames.forEach((month, index) => {
              const monthDate = new Date(selectedYear, index, 1);
              const monthEnd = new Date(selectedYear, index + 1, 0);
              
              // Vérifier si la dépense est active ce mois
              if (monthDate >= startDate && monthDate <= endDate) {
                monthlyData[month].budgetExpenses += monthlyAmount;
              }
            });
          }
        });
      }

      // 2. Dépenses variables (ajoutées au mois spécifique)
      if (budgetData.variableExpenses) {
        budgetData.variableExpenses.forEach((exp) => {
          try {
            const expDate = new Date(exp.date);
            if (isNaN(expDate.getTime())) {
              console.warn("Date invalide pour dépense variable:", exp.date);
              return;
            }
            
            const yearStart = new Date(selectedYear, 0, 1);
            const yearEnd = new Date(selectedYear, 11, 31);
            
            // Vérifier si la dépense est dans l'année sélectionnée
            if (expDate >= yearStart && expDate <= yearEnd) {
              const monthIndex = expDate.getMonth();
              const monthKey = monthNames[monthIndex];
              
              if (monthKey) {
                monthlyData[monthKey].budgetExpenses += exp.amount;
              }
            }
          } catch (error) {
            console.error("Erreur lors du traitement de la dépense variable:", exp, error);
          }
        });
      }
    }

    // Convertir en tableau et trier par mois
    return monthNames.map((month) => ({
      month,
      revenue: monthlyData[month]?.revenue || 0,
      expenses: monthlyData[month]?.expenses || 0,
      budgetRevenue: monthlyData[month]?.budgetRevenue || 0,
      budgetExpenses: monthlyData[month]?.budgetExpenses || 0,
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
  
  // Déterminer si on est en mode personnel (déjà défini plus haut)
  
  // Formater le salaire pour l'affichage
  const formatSalary = () => {
    if (!budgetData || !budgetData.salary) return null;
    const salaryValue = budgetData.salaryType === "annual"
      ? budgetData.salary
      : budgetData.salary * 26; // 26 périodes aux 2 semaines
    return {
      annual: salaryValue,
      display: budgetData.salaryType === "annual"
        ? `${budgetData.salary.toLocaleString("en-US", { minimumFractionDigits: 2 })} $/an`
        : `${budgetData.salary.toLocaleString("en-US", { minimumFractionDigits: 2 })} $/2 sem. (${salaryValue.toLocaleString("en-US", { minimumFractionDigits: 2 })} $/an)`,
    };
  };
  
  const salaryInfo = formatSalary();
  
  const stats = [
    {
      label: `${t("dashboard.revenue")} ${selectedYear}`,
      value: shouldShowMockData ? "24,590 $" : `${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} $`,
      change: shouldShowMockData ? "+12.5%" : budgetedIncome > 0 ? `${incomeVsBudget}% vs budget` : "0%",
      positive: true,
      icon: TrendingUp,
      budget: budgetedIncome > 0 ? `Budget: ${budgetedIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} $` : undefined,
    },
    // Afficher le salaire uniquement en mode personnel et si un salaire est défini
    ...(isPersonalMode && salaryInfo ? [{
      label: "Salaire",
      value: salaryInfo.annual.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " $",
      change: salaryInfo.display,
      positive: true,
      icon: DollarSign,
    }] : []),
    {
      label: `${t("dashboard.expenses")} ${selectedYear}`,
      value: shouldShowMockData ? "18,420 $" : `${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })} $`,
      change: shouldShowMockData ? "-5.2%" : budgetedExpenses > 0 ? `${expensesVsBudget}% vs budget` : "0%",
      positive: true,
      icon: TrendingDown,
      budget: budgetedExpenses > 0 ? `Budget: ${budgetedExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })} $` : undefined,
    },
    {
      label: `${t("dashboard.income")} ${selectedYear}`,
      value: shouldShowMockData ? "6,170 $" : `${netIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} $`,
      change: shouldShowMockData ? "+8.3%" : budgetVariance !== 0 ? `Budget: ${budgetVariance.toLocaleString("en-US", { minimumFractionDigits: 2 })} $` : "0%",
      positive: netIncome >= 0,
      icon: DollarSign,
    },
    // Ne pas afficher la marge bénéficiaire en mode personnel
    ...(isPersonalMode ? [] : [{
      label: t("dashboard.margin"),
      value: shouldShowMockData ? "25.1%" : `${margin}%`,
      change: shouldShowMockData ? "+2.1%" : "0%",
      positive: true,
      icon: TrendingUp,
    }]),
  ];

  return (
    <MainLayout>
      {/* Header avec stats en haut à droite */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
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
          
          {/* Stats compactes en haut à droite */}
          <div className="flex gap-2 flex-shrink-0">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const colors = [
                "from-blue-400/30 via-blue-500/20 to-blue-600/10",
                "from-emerald-400/30 via-emerald-500/20 to-emerald-600/10",
                "from-sky-400/30 via-sky-500/20 to-sky-600/10",
                "from-amber-400/30 via-amber-500/20 to-amber-600/10",
                "from-purple-400/30 via-purple-500/20 to-purple-600/10",
              ];
              const borderColors = [
                "border-blue-200/50",
                "border-emerald-200/50",
                "border-sky-200/50",
                "border-amber-200/50",
                "border-purple-200/50",
              ];
              const colorIndex = index % colors.length;
              return (
                <div
                  key={index}
                  className={`group relative bg-gradient-to-br from-card via-card to-card/80 backdrop-blur-sm rounded-lg border ${borderColors[colorIndex]} p-2.5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden min-w-[140px]`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors[colorIndex]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide truncate">
                          {stat.label}
                        </p>
                        <h3 className="text-sm font-bold text-foreground truncate">
                          {stat.value}
                        </h3>
                        {stat.budget && (
                          <p className="text-[9px] text-muted-foreground mt-0.5 truncate">
                            {stat.budget}
                          </p>
                        )}
                      </div>
                      <div
                        className={`bg-gradient-to-br ${colors[colorIndex]} p-1.5 rounded-md shadow-sm flex-shrink-0`}
                      >
                        <Icon
                          className={`w-3.5 h-3.5 ${
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

      {/* Charts Grid */}
      <div className={`grid grid-cols-1 ${isPersonalMode ? "lg:grid-cols-2" : "lg:grid-cols-3"} gap-4 mb-6`}>
        {/* Revenue vs Expenses - Ne pas afficher en mode personnel */}
        {!isPersonalMode && (
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
              <Legend />
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
              {budgetData && (budgetedIncome > 0 || budgetedExpenses > 0) && (
                <>
                  <Line
                    type="monotone"
                    dataKey="budgetRevenue"
                    name={t("dashboard.revenueLabel") + " (prévision)"}
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    opacity={0.6}
                  />
                  <Line
                    type="monotone"
                    dataKey="budgetExpenses"
                    name={t("dashboard.expensesLabel") + " (prévision)"}
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    opacity={0.6}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
        )}

        {/* Expense Categories */}
        <div className={`bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-xl border border-accent/10 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-accent/20 ${isPersonalMode ? "lg:col-span-1" : ""}`}>
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

        {/* Monthly Breakdown - Côte à côte avec Expense Categories en mode personnel */}
        <div className={`bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm rounded-xl border border-info/10 p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:border-info/20 ${isPersonalMode ? "lg:col-span-1" : "lg:col-span-3"}`}>
        <h3 className="text-base font-semibold text-foreground mb-4">{t("dashboard.monthlyBreakdown")}</h3>
          <ResponsiveContainer width="100%" height={isPersonalMode ? 320 : 240}>
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
            {budgetData && (budgetedIncome > 0 || budgetedExpenses > 0) && (
              <>
                <Bar
                  dataKey="budgetRevenue"
                  name={t("dashboard.revenueLabel") + " (prévision)"}
                  fill="hsl(var(--success))"
                  radius={[8, 8, 0, 0]}
                  opacity={0.3}
                />
                <Bar
                  dataKey="budgetExpenses"
                  name={t("dashboard.expensesLabel") + " (prévision)"}
                  fill="hsl(var(--destructive))"
                  radius={[8, 8, 0, 0]}
                  opacity={0.3}
                />
              </>
            )}
          </BarChart>
        </ResponsiveContainer>
        </div>
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
