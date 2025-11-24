import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, Trash2, Calendar, DollarSign, ChevronDown, X, FileText, Building2, Tag, Paperclip, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addWeeks, addMonths, isBefore, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, subMonths } from "date-fns";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useUsageMode } from "../contexts/UsageModeContext";
import { addTransaction, getTransactions, type Transaction } from "../lib/db";
import { classifyTransaction, calculateTaxes, validateExpense } from "../lib/taxRules";

/* -----------------------------------------------------
   Types
----------------------------------------------------- */
type RecurrenceType =
  | "none"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "yearly";

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate?: string;
  recurrence: RecurrenceType;
  category?: string;
}

interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
}

/* -----------------------------------------------------
   Recurrence Logic
----------------------------------------------------- */
function generateRecurrenceEvents(exp: FixedExpense): Array<{ date: string; name: string; amount: number }> {
  const results: any[] = [];
  // Créer la date de début en utilisant les composants pour éviter les problèmes de fuseau horaire
  const startDateParts = exp.startDate.split('-');
  const startDate = new Date(
    parseInt(startDateParts[0]),
    parseInt(startDateParts[1]) - 1,
    parseInt(startDateParts[2])
  );
  startDate.setHours(0, 0, 0, 0);
  
  const end = exp.endDate ? (() => {
    const endParts = exp.endDate.split('-');
    const endDate = new Date(
      parseInt(endParts[0]),
      parseInt(endParts[1]) - 1,
      parseInt(endParts[2])
    );
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  })() : addMonths(new Date(), 6);
  
  // Extraire le jour du mois de la date de début
  const dayOfMonth = startDate.getDate();

  const add = (d: Date) => {
    const dateStr = format(d, "yyyy-MM-dd");
    results.push({ date: dateStr, name: exp.name, amount: exp.amount });
  };

  let current = new Date(startDate);
  add(current);

  while (isBefore(current, end)) {
    switch (exp.recurrence) {
      case "weekly":
        current = addWeeks(current, 1);
        break;
      case "biweekly":
        current = addWeeks(current, 2);
        break;
      case "monthly":
        // Pour mensuel, créer une nouvelle date avec le même jour du mois
        const currentMonth = current.getMonth();
        const currentYear = current.getFullYear();
        // Calculer le mois et l'année suivants
        let nextMonth = currentMonth + 1;
        let nextYearForMonthly = currentYear;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYearForMonthly = currentYear + 1;
        }
        // Calculer le dernier jour valide du mois suivant
        const lastDayOfNextMonth = new Date(nextYearForMonthly, nextMonth + 1, 0).getDate();
        const targetDay = Math.min(dayOfMonth, lastDayOfNextMonth);
        current = new Date(nextYearForMonthly, nextMonth, targetDay);
        current.setHours(0, 0, 0, 0);
        break;
      case "bimonthly":
        // Pour bimestriel, créer une nouvelle date avec le même jour du mois
        const currentMonthBimonthly = current.getMonth();
        const currentYearBimonthly = current.getFullYear();
        let nextBimonth = currentMonthBimonthly + 2;
        let nextBimonthYear = currentYearBimonthly;
        if (nextBimonth > 11) {
          nextBimonth = nextBimonth - 12;
          nextBimonthYear = currentYearBimonthly + 1;
        }
        const lastDayOfBimonth = new Date(nextBimonthYear, nextBimonth + 1, 0).getDate();
        const targetDayBimonthly = Math.min(dayOfMonth, lastDayOfBimonth);
        current = new Date(nextBimonthYear, nextBimonth, targetDayBimonthly);
        current.setHours(0, 0, 0, 0);
        break;
      case "quarterly":
        // Pour trimestriel, créer une nouvelle date avec le même jour du mois
        const currentMonthQuarterly = current.getMonth();
        const currentYearQuarterly = current.getFullYear();
        let nextQuarter = currentMonthQuarterly + 3;
        let nextQuarterYear = currentYearQuarterly;
        if (nextQuarter > 11) {
          nextQuarter = nextQuarter - 12;
          nextQuarterYear = currentYearQuarterly + 1;
        }
        const lastDayOfQuarter = new Date(nextQuarterYear, nextQuarter + 1, 0).getDate();
        const targetDayQuarterly = Math.min(dayOfMonth, lastDayOfQuarter);
        current = new Date(nextQuarterYear, nextQuarter, targetDayQuarterly);
        current.setHours(0, 0, 0, 0);
        break;
      case "yearly":
        // Pour annuel, créer une nouvelle date avec le même jour et mois
        const nextYearForYearly = current.getFullYear() + 1;
        const lastDayOfYear = new Date(nextYearForYearly, current.getMonth() + 1, 0).getDate();
        const targetDayYearly = Math.min(dayOfMonth, lastDayOfYear);
        current = new Date(nextYearForYearly, current.getMonth(), targetDayYearly);
        current.setHours(0, 0, 0, 0);
        break;
      default:
        return results;
    }
    
    // Vérifier qu'on n'a pas dépassé la date de fin
    if (!isBefore(current, end) && current.getTime() !== end.getTime()) {
      break;
    }
    
    add(current);
  }

  return results;
}

/* -----------------------------------------------------
   Firestore Helpers
----------------------------------------------------- */
function getBudgetCollectionRef(userId: string, mode: "business" | "personal") {
  const modeName = mode === "business" ? "entreprise" : "personnelle";
  return collection(db, "Users", userId, "data", modeName, "budget");
}

function getBudgetDocRef(userId: string, mode: "business" | "personal", docId: string) {
  const modeName = mode === "business" ? "entreprise" : "personnelle";
  return doc(db, "Users", userId, "data", modeName, "budget", docId);
}

async function loadBudgetData(userId: string, mode: "business" | "personal") {
  if (!db || !userId) {
    console.warn("❌ Impossible de charger: db ou userId manquant");
    return null;
  }
  
  try {
    const modeName = mode === "business" ? "entreprise" : "personnelle";
    console.log(`📥 Chargement du budget pour Users/${userId}/data/${modeName}/budget`);
    const budgetRef = getBudgetCollectionRef(userId, mode);
    const snapshot = await getDocs(budgetRef);
    console.log(`📊 ${snapshot.size} document(s) trouvé(s) dans la collection budget`);
    
    const budgetData: any = {
      salaryType: "annual" as "annual" | "biweekly",
      salary: 0,
      salaryStartDate: "",
      fixedExpenses: [] as FixedExpense[],
      variableExpenses: [] as VariableExpense[],
    };
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (docSnap.id === "settings") {
        budgetData.salaryType = data.salaryType || "annual";
        budgetData.salary = data.salary || 0;
        budgetData.salaryStartDate = data.salaryStartDate || "";
        console.log("📄 Paramètres chargés:", budgetData.salaryType, budgetData.salary);
      } else if (data.type === "fixed") {
        budgetData.fixedExpenses.push({ ...data, id: docSnap.id } as FixedExpense);
      } else if (data.type === "variable") {
        budgetData.variableExpenses.push({ ...data, id: docSnap.id } as VariableExpense);
      }
    });
    
    console.log(`✅ Budget chargé: ${budgetData.fixedExpenses.length} dépenses fixes, ${budgetData.variableExpenses.length} dépenses variables`);
    return budgetData;
  } catch (error: any) {
    console.error("❌ Erreur lors du chargement du budget:", error);
    console.error("❌ Code:", error?.code);
    console.error("❌ Message:", error?.message);
    return null;
  }
}

async function saveBudgetSettings(userId: string, mode: "business" | "personal", settings: { salaryType: "annual" | "biweekly"; salary: number; salaryStartDate: string }) {
  if (!db || !userId) {
    console.warn("❌ Impossible de sauvegarder: db ou userId manquant");
    return;
  }
  
  try {
    const settingsRef = getBudgetDocRef(userId, mode, "settings");
    const data = {
      ...settings,
      userId,
      mode,
      updatedAt: new Date().toISOString(),
    };
    console.log("💾 Sauvegarde des paramètres du budget:", data);
    await setDoc(settingsRef, data);
    console.log("✅ Paramètres du budget sauvegardés avec succès");
  } catch (error: any) {
    console.error("❌ Erreur lors de la sauvegarde des paramètres du budget:", error);
    console.error("❌ Code:", error?.code);
    console.error("❌ Message:", error?.message);
  }
}

async function saveFixedExpense(userId: string, mode: "business" | "personal", expense: FixedExpense) {
  if (!db || !userId) {
    console.warn("❌ Impossible de sauvegarder: db ou userId manquant");
    return;
  }
  
  try {
    const expenseRef = getBudgetDocRef(userId, mode, expense.id);
    const data: any = {
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      startDate: expense.startDate,
      recurrence: expense.recurrence,
      type: "fixed",
      userId,
      mode,
      updatedAt: new Date().toISOString(),
    };
    
    // Ajouter endDate seulement s'il est défini (Firestore n'accepte pas undefined)
    if (expense.endDate) {
      data.endDate = expense.endDate;
    }
    
    // Ajouter category seulement s'il est défini
    if (expense.category) {
      data.category = expense.category;
    }
    
    console.log("💾 Sauvegarde de la dépense fixe:", data);
    await setDoc(expenseRef, data);
    console.log("✅ Dépense fixe sauvegardée avec succès");
  } catch (error: any) {
    console.error("❌ Erreur lors de la sauvegarde de la dépense fixe:", error);
    console.error("❌ Code:", error?.code);
    console.error("❌ Message:", error?.message);
    throw error;
  }
}

async function saveVariableExpense(userId: string, mode: "business" | "personal", expense: VariableExpense) {
  if (!db || !userId) {
    console.warn("❌ Impossible de sauvegarder: db ou userId manquant");
    return;
  }
  
  try {
    const expenseRef = getBudgetDocRef(userId, mode, expense.id);
    const data = {
      ...expense,
      type: "variable",
      userId,
      mode,
      updatedAt: new Date().toISOString(),
    };
    console.log("💾 Sauvegarde de la dépense variable:", data);
    await setDoc(expenseRef, data);
    console.log("✅ Dépense variable sauvegardée avec succès");
  } catch (error: any) {
    console.error("❌ Erreur lors de la sauvegarde de la dépense variable:", error);
    console.error("❌ Code:", error?.code);
    console.error("❌ Message:", error?.message);
    throw error;
  }
}

async function deleteFixedExpense(userId: string, mode: "business" | "personal", expenseId: string) {
  if (!db || !userId) return;
  
  try {
    const expenseRef = getBudgetDocRef(userId, mode, expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Erreur lors de la suppression de la dépense fixe:", error);
    throw error;
  }
}

async function deleteVariableExpense(userId: string, mode: "business" | "personal", expenseId: string) {
  if (!db || !userId) return;
  
  try {
    const expenseRef = getBudgetDocRef(userId, mode, expenseId);
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error("Erreur lors de la suppression de la dépense variable:", error);
    throw error;
  }
}

/* -----------------------------------------------------
   UI Component
----------------------------------------------------- */
export default function Budget() {
  const { usageType } = useUsageMode();
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const currentMode = usageType === "both" ? (localStorage.getItem(`usageMode_${userId}`) as "business" | "personal" || "business") : (usageType || "business");
  
  const [salaryType, setSalaryType] = useState<"annual" | "biweekly">("annual");
  const [salary, setSalary] = useState(0);
  const [salaryStartDate, setSalaryStartDate] = useState("");

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([]);

  const [showFixedModal, setShowFixedModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);

  const [editFixed, setEditFixed] = useState<FixedExpense | null>(null);
  const [editVariable, setEditVariable] = useState<VariableExpense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showManualTaxes, setShowManualTaxes] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; type: string; institution: string }>>([]);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("customCategories");
    return saved ? JSON.parse(saved) : [];
  });
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  /* -------------------------------
     Derived Calculations
  ------------------------------- */
  const annualIncome =
    salaryType === "annual"
      ? salary
      : ((salary * 26)); // 26 périodes aux 2 semaines

  const monthlyIncome = annualIncome / 12;

  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVariable = variableExpenses.reduce((sum, e) => sum + e.amount, 0);

  const balance = monthlyIncome - (totalFixed + totalVariable);

  /* -------------------------------
     Calendar Generation with revenu and Expenses
  ------------------------------- */
  const calendarEvents = [
    ...fixedExpenses.flatMap((exp) => generateRecurrenceEvents(exp)),
    ...variableExpenses.map((v) => ({ date: v.date, name: v.name, amount: v.amount })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Calculer les revenus et dépenses par jour pour le calendrier
  const dailyData = useMemo(() => {
    const data: { [key: string]: { revenu: number; expenses: number; items: Array<{ name: string; amount: number; type: 'revenu' | 'expense' }> } } = {};

    // Ajouter les revenus planifiés (salaire) selon le type
    if (salary > 0 && salaryStartDate) {
      // Créer la date de début en utilisant uniquement la date (sans heure) pour éviter les problèmes de fuseau horaire
      const startDateParts = salaryStartDate.split('-');
      const startDate = new Date(
        parseInt(startDateParts[0]),
        parseInt(startDateParts[1]) - 1,
        parseInt(startDateParts[2])
      );
      // S'assurer que l'heure est à minuit pour éviter les décalages
      startDate.setHours(0, 0, 0, 0);
      
      const monthStart = startOfMonth(currentMonth);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = endOfMonth(currentMonth);
      monthEnd.setHours(23, 59, 59, 999);
      
      if (salaryType === "biweekly") {
        // Salaire aux 2 semaines : calculer tous les jours de paie dans le mois
        let currentPayDate = new Date(startDate);
        currentPayDate.setHours(0, 0, 0, 0);
        
        // Si la date de début est avant le début du mois, trouver le premier jour de paie dans le mois
        if (currentPayDate < monthStart) {
          // Calculer combien de jours depuis la date de début jusqu'au début du mois
          const daysDiff = Math.floor((monthStart.getTime() - currentPayDate.getTime()) / (1000 * 60 * 60 * 24));
          const periodsToAdd = Math.ceil(daysDiff / 14);
          currentPayDate = addWeeks(startDate, periodsToAdd * 2);
          currentPayDate.setHours(0, 0, 0, 0);
          
          // Si on dépasse le début du mois, reculer d'une période
          if (currentPayDate > monthStart) {
            const prevDate = addWeeks(currentPayDate, -2);
            prevDate.setHours(0, 0, 0, 0);
            if (prevDate >= startDate && prevDate < monthStart) {
              currentPayDate = prevDate;
            }
          }
        }
        
        // S'assurer qu'on commence au moins à la date de début
        if (currentPayDate < startDate) {
          currentPayDate = new Date(startDate);
          currentPayDate.setHours(0, 0, 0, 0);
        }
        
        // Ajouter tous les jours de paie dans le mois
        while (currentPayDate <= monthEnd) {
          if (isSameMonth(currentPayDate, currentMonth) && currentPayDate >= startDate) {
            const dateKey = format(currentPayDate, "yyyy-MM-dd");
            if (!data[dateKey]) {
              data[dateKey] = { revenu: 0, expenses: 0, items: [] };
            }
            data[dateKey].revenu += salary;
            data[dateKey].items.push({
              name: "Salaire (aux 2 semaines)",
              amount: salary,
              type: 'revenu'
            });
          }
          const nextDate = addWeeks(currentPayDate, 2);
          nextDate.setHours(0, 0, 0, 0);
          currentPayDate = nextDate;
        }
      } else {
        // Salaire annuel : mettre le 1er du mois
        const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        firstOfMonth.setHours(0, 0, 0, 0);
        const dateKey = format(firstOfMonth, "yyyy-MM-dd");
        if (!data[dateKey]) {
          data[dateKey] = { revenu: 0, expenses: 0, items: [] };
        }
        data[dateKey].revenu += monthlyIncome;
        data[dateKey].items.push({
          name: "Salaire mensuel",
          amount: monthlyIncome,
          type: 'revenu'
        });
      }
    }

    // Ajouter les dépenses fixes récurrentes
    fixedExpenses.forEach((exp) => {
      const events = generateRecurrenceEvents(exp);
      events.forEach((event) => {
        // Créer la date à partir de la chaîne pour éviter les problèmes de fuseau horaire
        const eventDateParts = event.date.split('-');
        const eventDate = new Date(
          parseInt(eventDateParts[0]),
          parseInt(eventDateParts[1]) - 1,
          parseInt(eventDateParts[2])
        );
        eventDate.setHours(0, 0, 0, 0);
        
        if (isSameMonth(eventDate, currentMonth)) {
          const dateKey = format(eventDate, "yyyy-MM-dd");
          if (!data[dateKey]) {
            data[dateKey] = { revenu: 0, expenses: 0, items: [] };
          }
          data[dateKey].expenses += event.amount;
          data[dateKey].items.push({
            name: event.name,
            amount: event.amount,
            type: 'expense'
          });
        }
      });
    });

    // Ajouter les dépenses variables du budget
    variableExpenses.forEach((v) => {
      // Créer la date à partir des composants pour éviter les problèmes de fuseau horaire
      const expenseDateParts = v.date.split('-');
      const expenseDate = new Date(
        parseInt(expenseDateParts[0]),
        parseInt(expenseDateParts[1]) - 1,
        parseInt(expenseDateParts[2])
      );
      expenseDate.setHours(0, 0, 0, 0);
      
      if (isSameMonth(expenseDate, currentMonth)) {
        const dateKey = format(expenseDate, "yyyy-MM-dd");
        if (!data[dateKey]) {
          data[dateKey] = { revenu: 0, expenses: 0, items: [] };
        }
        data[dateKey].expenses += v.amount;
        data[dateKey].items.push({
          name: v.name,
          amount: v.amount,
          type: 'expense'
        });
      }
    });

    // Ajouter les transactions réelles (revenus et dépenses)
    console.log("📊 Transactions à traiter pour le calendrier:", transactions.length);
    console.log("📅 Mois actuel:", format(currentMonth, "yyyy-MM"));
    console.log("🔍 Mode actuel:", currentMode);
    
    transactions.forEach((transaction) => {
      try {
        // Créer la date à partir des composants pour éviter les problèmes de fuseau horaire
        const transactionDateParts = transaction.date.split('-');
        const transactionDate = new Date(
          parseInt(transactionDateParts[0]),
          parseInt(transactionDateParts[1]) - 1,
          parseInt(transactionDateParts[2])
        );
        transactionDate.setHours(0, 0, 0, 0);
        
        if (isSameMonth(transactionDate, currentMonth)) {
          const dateKey = format(transactionDate, "yyyy-MM-dd");
          if (!data[dateKey]) {
            data[dateKey] = { revenu: 0, expenses: 0, items: [] };
          }

          // Exclure les transferts entre comptes en mode personnel
          const isTransferBetweenAccounts = 
            currentMode === "personal" && 
            transaction.type === "transfert" && 
            transaction.transferType === "between_accounts";

          if (isTransferBetweenAccounts) {
            // Ignorer les transferts entre comptes
            return;
          }

          // Identifier les revenus EN PREMIER
          // "income" et "revenu" sont la même chose (revenu) - "income" est le terme anglais pour "revenu"
          const isrevenu = transaction.type === "income" || transaction.type === "revenu";

          // Identifier les dépenses (seulement si ce n'est PAS un revenu)
          // En mode personnel: "depense", "remboursement", "paiement_facture", "transfert" (between_persons)
          // En mode business: "expense"
          const isExpense = !isrevenu && (
            (currentMode === "personal" && (
              transaction.type === "depense" || 
              transaction.type === "remboursement" || 
              transaction.type === "paiement_facture" ||
              (transaction.type === "transfert" && transaction.transferType === "between_persons")
            )) ||
            (currentMode === "business" && transaction.type === "expense")
          );

          console.log(`🔍 Transaction analysée: date=${transaction.date}, type=${transaction.type}, mode=${currentMode}, amount=${transaction.amount}, isrevenu=${isrevenu}, isExpense=${isExpense}`);

          // Toujours ajouter la transaction aux items pour l'affichage
          if (isrevenu) {
            data[dateKey].revenu += transaction.amount;
            data[dateKey].items.push({
              name: transaction.description || "Revenu",
              amount: transaction.amount,
              type: 'revenu'
            });
            console.log(`✅ Revenu ajouté au calendrier: ${dateKey}, ${transaction.description || "Revenu"}, ${transaction.amount} $`);
          } else if (isExpense) {
            // S'assurer que le montant est positif pour les dépenses (il sera affiché comme négatif)
            const expenseAmount = Math.abs(transaction.amount);
            data[dateKey].expenses += expenseAmount;
            data[dateKey].items.push({
              name: transaction.description || "Dépense",
              amount: expenseAmount,
              type: 'expense'
            });
            console.log(`✅ Dépense ajoutée au calendrier: ${dateKey}, ${transaction.description || "Dépense"}, ${expenseAmount} $ (sera affiché comme -${expenseAmount} $)`);
          } else {
            // Même si non classée, afficher la transaction avec son type réel
            const transactionType = transaction.type === "income" ? "revenu" : 
                                   transaction.type === "expense" ? "expense" : 
                                   transaction.type === "depense" ? "expense" : "expense";
            
            if (transactionType === "revenu") {
              data[dateKey].revenu += transaction.amount;
            } else {
              data[dateKey].expenses += transaction.amount;
            }
            
            data[dateKey].items.push({
              name: transaction.description || `Transaction (${transaction.type})`,
              amount: transaction.amount,
              type: transactionType as 'revenu' | 'expense'
            });
            console.log(`⚠️ Transaction non classée mais affichée: ${transaction.date}, type: ${transaction.type}, mode: ${currentMode}, amount: ${transaction.amount}`);
          }
        }
      } catch (error) {
        console.error("Erreur lors du traitement de la transaction pour le calendrier:", transaction, error);
      }
    });
    
    console.log("📊 Données du calendrier générées:", Object.keys(data).length, "jours");

    return data;
  }, [fixedExpenses, variableExpenses, salary, salaryType, salaryStartDate, monthlyIncome, currentMonth, currentMode, transactions]);

  // Générer les jours du calendrier
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Semaine commence lundi
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  /* -------------------------------
     Load Companies
  ------------------------------- */
  useEffect(() => {
    const loadCompanies = async () => {
      if (!userId || !db) return;
      try {
        const companiesRef = collection(db, "Users", userId, "data", "entreprise", "companies");
        const snapshot = await getDocs(companiesRef);
        const companiesData: Array<{ id: string; name: string }> = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          companiesData.push({ id: doc.id, name: data.name || "" });
        });
        setCompanies(companiesData);
      } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
      }
    };
    loadCompanies();
  }, [userId]);

  /* -------------------------------
     Load Accounts
  ------------------------------- */
  useEffect(() => {
    const loadAccounts = async () => {
      if (!userId || !db) return;
      try {
        const accountsRef = collection(db, "users", userId, "accounts");
        const snapshot = await getDocs(accountsRef);
        const accountsData: Array<{ id: string; name: string; type: string; institution: string }> = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          accountsData.push({
            id: doc.id,
            name: data.name || "",
            type: data.type || "",
            institution: data.institution || "",
          });
        });
        setAccounts(accountsData);
      } catch (error) {
        console.error("Erreur lors du chargement des comptes:", error);
        setAccounts([]);
      }
    };
    loadAccounts();
  }, [userId]);

  /* -------------------------------
     Load Budget Data
  ------------------------------- */
  useEffect(() => {
    if (!userId || !db) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const budgetData = await loadBudgetData(userId, currentMode);
        if (budgetData) {
          setSalaryType(budgetData.salaryType);
          setSalary(budgetData.salary);
          setSalaryStartDate(budgetData.salaryStartDate);
          setFixedExpenses(budgetData.fixedExpenses);
          setVariableExpenses(budgetData.variableExpenses);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du budget:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId, currentMode]);

  /* -------------------------------
     Load Transactions
  ------------------------------- */
  useEffect(() => {
    if (!userId || !db) return;

    const loadTransactions = async () => {
      try {
        const year = currentMonth.getFullYear();
        console.log("📥 Chargement des transactions pour l'année:", year, "mode:", currentMode);
        const allTransactions = await getTransactions(year, currentMode);
        console.log("✅ Transactions chargées:", allTransactions.length);
        console.log("📊 Types de transactions:", allTransactions.map(t => ({ date: t.date, type: t.type, amount: t.amount })));
        setTransactions(allTransactions);
      } catch (error) {
        console.error("Erreur lors du chargement des transactions:", error);
      }
    };

    loadTransactions();
  }, [userId, currentMode, currentMonth]);

  /* -------------------------------
     Save Settings
  ------------------------------- */
  useEffect(() => {
    if (!userId || !db || isLoading) return;
    
    const timeoutId = setTimeout(() => {
      saveBudgetSettings(userId, currentMode, { salaryType, salary, salaryStartDate }).then(() => {
        // Déclencher l'événement pour mettre à jour le Dashboard
        window.dispatchEvent(new Event("budgetUpdated"));
      });
    }, 1000); // Debounce de 1 seconde
    
    return () => clearTimeout(timeoutId);
  }, [salaryType, salary, salaryStartDate, userId, currentMode, isLoading]);

  /* -------------------------------
     Save Fixed Expense
  ------------------------------- */
  const handleSaveFixed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    
    const data = new FormData(e.currentTarget);

    const exp: FixedExpense = {
      id: editFixed?.id || crypto.randomUUID(),
      name: data.get("name") as string,
      amount: parseFloat(data.get("amount") as string),
      startDate: data.get("startDate") as string,
      endDate: data.get("endDate") as string || undefined,
      recurrence: data.get("recurrence") as RecurrenceType,
      category: data.get("category") as string || undefined,
    };

    try {
      await saveFixedExpense(userId, currentMode, exp);
      
      if (editFixed) {
        setFixedExpenses((prev) => prev.map((f) => (f.id === editFixed.id ? exp : f)));
      } else {
        setFixedExpenses((prev) => [...prev, exp]);
      }

      setShowFixedModal(false);
      setEditFixed(null);
      
      // Déclencher l'événement pour mettre à jour le Dashboard
      window.dispatchEvent(new Event("budgetUpdated"));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde. Vérifiez la console pour plus de détails.");
    }
  };

  // Catégories par défaut
  const defaultCategories = [
    { key: "consulting", label: "Consultation" },
    { key: "officeSupplies", label: "Fournitures de bureau" },
    { key: "mealsEntertainment", label: "Repas et divertissement" },
    { key: "software", label: "Logiciels" },
    { key: "travel", label: "Voyage" },
    { key: "utilities", label: "Services publics" },
    { key: "salaries", label: "Salaires" },
    { key: "equipment", label: "Équipement" },
    { key: "other", label: "Autre" },
  ];
  
  const allCategories = [
    ...defaultCategories.map(cat => cat.label),
    ...customCategories
  ];

  const addCustomCategory = () => {
    if (newCategory.trim() && !customCategories.includes(newCategory.trim())) {
      const updated = [...customCategories, newCategory.trim()];
      setCustomCategories(updated);
      localStorage.setItem("customCategories", JSON.stringify(updated));
      setNewCategory("");
      setShowAddCategory(false);
    }
  };

  /* -------------------------------
     Save Variable Expense (avec formulaire complet de transaction)
  ------------------------------- */
  const handleSaveVariable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) return;
    
    const formData = new FormData(e.currentTarget);
    
    const description = (formData.get("description") as string) || "";
    const amount = parseFloat((formData.get("amount") as string) || "0");
    const isPersonalMode = currentMode === "personal" || usageType === "personal";
    
    // En mode personnel, utiliser "depense" comme type, sinon "expense"
    const rawType = isPersonalMode ? "depense" : "expense";
    const type = isPersonalMode ? "depense" : "expense";
    
    // Classification automatique
    let autoClassified = false;
    let classificationConfidence = 0;
    let suggestedCategory = (formData.get("category") as string) || allCategories[0];
    
    try {
      const classification = await classifyTransaction(description, amount);
      if (classification.confidence > 0.6) {
        autoClassified = true;
        classificationConfidence = classification.confidence;
        if (classification.suggestedCategory) {
          suggestedCategory = classification.suggestedCategory;
        }
      }
    } catch (error) {
      console.warn("Erreur lors de la classification automatique:", error);
    }
    
    // Calcul des taxes si applicable (mode business uniquement)
    let gst: number | undefined = undefined;
    let qst: number | undefined = undefined;
    let isTaxable = false;
    let hasReceipt = false;
    let useManualTaxes = false;
    
    if (!isPersonalMode) {
      isTaxable = formData.get("isTaxable") === "true" || formData.get("isTaxable") === "on";
      hasReceipt = formData.get("hasReceipt") === "true" || formData.get("hasReceipt") === "on";
      useManualTaxes = formData.get("useManualTaxes") === "true" || formData.get("useManualTaxes") === "on";
      
      const manualGst = formData.get("manualGst") as string;
      const manualQst = formData.get("manualQst") as string;
      
      if (isTaxable && amount > 0) {
        if (useManualTaxes) {
          if (manualGst && manualGst.trim() !== "") {
            gst = parseFloat(manualGst) || 0;
          }
          if (manualQst && manualQst.trim() !== "") {
            qst = parseFloat(manualQst) || 0;
          }
        } else {
          try {
            const taxes = await calculateTaxes(amount, true);
            gst = taxes.gst;
            qst = taxes.qst;
          } catch (error) {
            console.warn("Erreur lors du calcul des taxes:", error);
          }
        }
      }
    }
    
    // Validation des dépenses (mode business uniquement)
    let deductibleRatio = 1.0;
    if (!isPersonalMode) {
      try {
        const validation = await validateExpense({
          amount,
          category: suggestedCategory,
          description,
          date: (formData.get("date") as string) || new Date().toISOString().split('T')[0],
          hasReceipt,
          businessPurpose: formData.get("businessPurpose") as string || undefined
        });
        deductibleRatio = validation.deductibleRatio;
      } catch (error) {
        console.warn("Erreur lors de la validation de la dépense:", error);
      }
    }
    
    const date = (formData.get("date") as string) || new Date().toISOString().split('T')[0];
    const account = formData.get("account") as string;
    const company = formData.get("company") as string;
    
    // Créer la transaction complète
    const newTransaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt"> = {
      date,
      description,
      category: suggestedCategory,
      type: rawType as any, // Garder le type original
      amount,
      company: isPersonalMode ? undefined : (company || (companies.length > 0 ? companies[0].name : "")),
      account: isPersonalMode ? account : undefined,
      tags: [],
      gst: !isPersonalMode ? (useManualTaxes ? gst : (gst && gst > 0 ? gst : undefined)) : undefined,
      qst: !isPersonalMode ? (useManualTaxes ? qst : (qst && qst > 0 ? qst : undefined)) : undefined,
      isTaxable: !isPersonalMode ? (isTaxable || undefined) : undefined,
      hasReceipt: !isPersonalMode ? (hasReceipt || undefined) : undefined,
      businessPurpose: !isPersonalMode ? (formData.get("businessPurpose") as string || undefined) : undefined,
      deductibleRatio: !isPersonalMode && deductibleRatio < 1.0 ? deductibleRatio : undefined,
      gstItc: !isPersonalMode && formData.get("gstItc") ? parseFloat(formData.get("gstItc") as string) || undefined : undefined,
      qstItc: !isPersonalMode && formData.get("qstItc") ? parseFloat(formData.get("qstItc") as string) || undefined : undefined,
      autoClassified: autoClassified || undefined,
      classificationConfidence: classificationConfidence > 0 ? classificationConfidence : undefined,
      mode: currentMode,
    };

    try {
      // Sauvegarder comme transaction
      const transactionId = await addTransaction(newTransaction);
      
      // Sauvegarder aussi comme dépense variable dans le budget
      const exp: VariableExpense = {
        id: editVariable?.id || crypto.randomUUID(),
        name: description,
        amount: amount,
        date: date,
      };
      
      await saveVariableExpense(userId, currentMode, exp);
      
      if (editVariable) {
        setVariableExpenses((prev) => prev.map((v) => (v.id === editVariable.id ? exp : v)));
      } else {
        setVariableExpenses((prev) => [...prev, exp]);
      }

      setShowVariableModal(false);
      setEditVariable(null);
      setShowManualTaxes(false);
      
      // Déclencher les événements pour mettre à jour
      window.dispatchEvent(new Event("transactionsUpdated"));
      window.dispatchEvent(new Event("budgetUpdated"));
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde. Vérifiez la console pour plus de détails.");
    }
  };

  /* -------------------------------
     Delete Fixed Expense
  ------------------------------- */
  const handleDeleteFixed = async (expenseId: string) => {
    if (!userId) return;
    
    try {
      await deleteFixedExpense(userId, currentMode, expenseId);
      setFixedExpenses((prev) => prev.filter((f) => f.id !== expenseId));
      
      // Déclencher l'événement pour mettre à jour le Dashboard
      window.dispatchEvent(new Event("budgetUpdated"));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression. Vérifiez la console pour plus de détails.");
    }
  };

  /* -------------------------------
     Delete Variable Expense
  ------------------------------- */
  const handleDeleteVariable = async (expenseId: string) => {
    if (!userId) return;
    
    try {
      await deleteVariableExpense(userId, currentMode, expenseId);
      setVariableExpenses((prev) => prev.filter((v) => v.id !== expenseId));
      
      // Déclencher l'événement pour mettre à jour le Dashboard
      window.dispatchEvent(new Event("budgetUpdated"));
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression. Vérifiez la console pour plus de détails.");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Budget personnel</h1>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Budget personnel</h1>
        <p className="text-muted-foreground">Gestion complète de vos revenus et dépenses</p>
      </div>

      {/* -----------------------------------------------------
         REVENUS
      ----------------------------------------------------- */}
      <div className="p-4 border rounded-lg mb-6">
        <h2 className="font-semibold text-lg mb-3">Revenu</h2>

        <div className="flex gap-4">
          <select
            className="border p-2 rounded"
            value={salaryType}
            onChange={(e) => setSalaryType(e.target.value as any)}
            aria-label="Type de salaire"
          >
            <option value="annual">Salaire annuel</option>
            <option value="biweekly">Salaire aux 2 semaines</option>
          </select>

          <input
            type="number"
            placeholder="0.00"
            className="border p-2 rounded"
            value={salary}
            onChange={(e) => setSalary(parseFloat(e.target.value))}
            aria-label="Montant du salaire"
          />

          {salaryType === "biweekly" && (
            <input
              type="date"
              className="border p-2 rounded"
              value={salaryStartDate}
              onChange={(e) => setSalaryStartDate(e.target.value)}
              aria-label="Date de début du salaire"
            />
          )}
        </div>

        <div className="text-sm mt-3">
          <p><strong>Revenu annuel :</strong> {annualIncome.toFixed(2)} $</p>
          <p><strong>Revenu mensuel :</strong> {monthlyIncome.toFixed(2)} $</p>
        </div>
      </div>

      {/* -----------------------------------------------------
         DÉPENSES FIXES
      ----------------------------------------------------- */}
      <div className="p-4 border rounded-lg mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Dépenses fixes</h2>
          <button className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
            onClick={() => { setEditFixed(null); setShowFixedModal(true); }}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {fixedExpenses.length === 0 ? (
          <p className="text-muted-foreground">Aucune dépense fixe enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {fixedExpenses.map((exp) => (
              <div key={exp.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{exp.name}</p>
                  <p className="text-sm">{exp.amount.toFixed(2)} $ / période</p>
                  <p className="text-xs text-muted-foreground">
                    Début : {exp.startDate} &middot; Récurrence : {exp.recurrence}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="p-2 border rounded"
                    onClick={() => { setEditFixed(exp); setShowFixedModal(true); }}>
                    Modifier
                  </button>
                  <button
                    className="p-2 rounded border border-destructive text-destructive"
                    onClick={() => handleDeleteFixed(exp.id)}
                    aria-label="Supprimer cette dépense fixe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -----------------------------------------------------
         DÉPENSES VARIABLES
      ----------------------------------------------------- */}
      <div className="p-4 border rounded-lg mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Dépenses variables</h2>
          <button
            onClick={() => { setEditVariable(null); setShowVariableModal(true); }}
            className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {variableExpenses.length === 0 ? (
          <p className="text-muted-foreground">Aucune dépense variable.</p>
        ) : (
          <div className="space-y-3">
            {variableExpenses.map((exp) => (
              <div key={exp.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{exp.name}</p>
                  <p className="text-sm">{exp.amount.toFixed(2)} $</p>
                  <p className="text-xs text-muted-foreground">Date : {exp.date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 border rounded"
                    onClick={() => { setEditVariable(exp); setShowVariableModal(true); }}>
                    Modifier
                  </button>
                  <button
                    className="p-2 rounded border border-destructive text-destructive"
                    onClick={() => handleDeleteVariable(exp.id)}
                    aria-label="Supprimer cette dépense variable"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -----------------------------------------------------
         CALENDRIER
      ----------------------------------------------------- */}
      <div className="p-4 border rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Calendrier des revenus et dépenses</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 border rounded hover:bg-secondary transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium min-w-[150px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 border rounded hover:bg-secondary transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* En-têtes des jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayData = dailyData[dateKey] || { revenu: 0, expenses: 0, items: [] };
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={idx}
                className={`min-h-[100px] border rounded p-2 ${
                  !isCurrentMonth ? "bg-muted/30 opacity-50" : "bg-card"
                } ${isToday ? "ring-2 ring-primary" : ""}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? "text-primary" : ""}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-1 text-xs">
                  {dayData.items.length > 0 ? (
                    <div className="space-y-0.5">
                      {dayData.items.slice(0, 3).map((item, i) => {
                        // Pour les dépenses, afficher le montant comme négatif
                        // Le montant stocké est toujours positif, on l'affiche négatif pour les dépenses
                        let displayAmount: number;
                        if (item.type === "expense") {
                          displayAmount = -Math.abs(item.amount);
                        } else {
                          displayAmount = Math.abs(item.amount);
                        }
                        
                        const sign = displayAmount >= 0 ? "+" : "";
                        const amountStr = `${sign}${displayAmount.toFixed(2)} $`;
                        
                        return (
                          <div
                            key={i}
                            className={`truncate ${
                              item.type === "revenu" ? "text-green-600" : "text-red-600"
                            }`}
                            title={`${item.name}: ${amountStr}`}
                          >
                            {amountStr} - {item.name}
                          </div>
                        );
                      })}
                      {dayData.items.length > 3 && (
                        <div className="text-muted-foreground text-[10px]">
                          +{dayData.items.length - 3} autre(s)
                        </div>
                      )}
                    </div>
                  ) : (
                    isCurrentMonth && (
                      <div className="text-muted-foreground text-[10px]">—</div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span>Revenus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span>Dépenses</span>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------
         MODAL — Fixed Expense
      ----------------------------------------------------- */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editFixed ? "Modifier une dépense fixe" : "Ajouter une dépense fixe"}
            </h2>

            <form onSubmit={handleSaveFixed} className="space-y-4">
              <input
                name="name"
                defaultValue={editFixed?.name}
                placeholder="Nom"
                className="border p-2 rounded w-full"
                required
              />

              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={editFixed?.amount}
                placeholder="Montant"
                className="border p-2 rounded w-full"
                required
              />

              <input
                name="startDate"
                type="date"
                defaultValue={editFixed?.startDate}
                className="border p-2 rounded w-full"
                aria-label="Date de début"
                required
              />

              <input
                name="endDate"
                type="date"
                defaultValue={editFixed?.endDate}
                className="border p-2 rounded w-full"
                aria-label="Date de fin"
              />

              <select
                name="recurrence"
                defaultValue={editFixed?.recurrence || "monthly"}
                className="border p-2 rounded w-full"
                aria-label="Fréquence de récurrence"
              >
                <option value="none">Aucune</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="biweekly">Aux 2 semaines</option>
                <option value="monthly">Mensuel</option>
                <option value="bimonthly">Aux 2 mois</option>
                <option value="quarterly">Trimestriel</option>
                <option value="yearly">Annuel</option>
              </select>

              {/* Catégorie */}
              <div>
                <label htmlFor="fixed-category" className="block text-sm font-medium text-foreground mb-2">
                  Catégorie
                </label>
                {!showAddCategory ? (
                  <div className="space-y-2">
                    <select
                      id="fixed-category"
                      name="category"
                      defaultValue={editFixed?.category || ""}
                      className="border p-2 rounded w-full"
                      aria-label="Catégorie"
                      onChange={(e) => {
                        if (e.target.value === "custom") {
                          setShowAddCategory(true);
                        }
                      }}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      <option value="Habitation">Habitation</option>
                      <option value="Abonnements">Abonnements</option>
                      <option value="Loisirs">Loisirs</option>
                      <option value="Électricité">Électricité</option>
                      <option value="Remboursement">Remboursement</option>
                      <option value="Dettes">Dettes</option>
                      <option value="Autres">Autres</option>
                      {customCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="custom">+ Personnaliser</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomCategory())}
                      placeholder="Nouvelle catégorie"
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={addCustomCategory}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                      aria-label="Ajouter la catégorie"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategory("");
                      }}
                      className="px-3 py-2 border border-border rounded-lg hover:opacity-90 transition-opacity"
                      aria-label="Annuler"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" className="p-2 border rounded" onClick={() => setShowFixedModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="p-2 bg-primary text-white rounded">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------
         MODAL — Variable Expense (formulaire complet de transaction)
      ----------------------------------------------------- */}
      {showVariableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {editVariable ? "Modifier une dépense variable" : "Ajouter une dépense variable"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cette dépense sera ajoutée comme transaction
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVariableModal(false);
                  setShowManualTaxes(false);
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveVariable} className="p-6 space-y-6">
              {/* Section: Informations principales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Informations principales
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="variable-date" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      Date <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="variable-date"
                      type="date"
                      name="date"
                      defaultValue={editVariable?.date || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="variable-amount" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      Montant <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="variable-amount"
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0.01"
                      defaultValue={editVariable?.amount}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="variable-description" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Description <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="variable-description"
                      type="text"
                      name="description"
                      defaultValue={editVariable?.name}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      placeholder="Description de la dépense"
                      required
                    />
                  </div>
                  
                  {/* Entreprise (mode business) ou Compte (mode personal) */}
                  {currentMode === "business" || usageType === "business" ? (
                    <div>
                      <label htmlFor="variable-company" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        Entreprise <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                      </label>
                      <select 
                        id="variable-company" 
                        name="company" 
                        className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      >
                        {companies.length > 0 ? (
                          companies.map((company) => (
                            <option key={company.id} value={company.name}>
                              {company.name}
                            </option>
                          ))
                        ) : (
                          <option value="">Aucune entreprise</option>
                        )}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="variable-account" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        Compte <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                      </label>
                      <select 
                        id="variable-account" 
                        name="account" 
                        className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      >
                        <option value="">Aucun compte</option>
                        {accounts.length > 0 ? (
                          accounts.map((account) => (
                            <option key={account.id} value={account.name}>
                              {account.name} ({account.institution})
                            </option>
                          ))
                        ) : null}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="variable-category" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        Catégorie <span className="text-destructive">*</span>
                      </label>
                      {!showAddCategory && (
                        <button
                          type="button"
                          onClick={() => setShowAddCategory(true)}
                          className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Ajouter une catégorie
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
                          placeholder="Nouvelle catégorie"
                          className="flex-1 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={addCustomCategory}
                          className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                          aria-label="Ajouter la catégorie"
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
                          aria-label="Annuler l'ajout de catégorie"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <select id="variable-category" name="category" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required>
                        {allCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Section: Informations fiscales (mode business uniquement) */}
              {(currentMode === "business" || usageType === "business") && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Informations fiscales
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        name="isTaxable"
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Transaction taxable (GST/QST applicable)</span>
                    </label>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        name="hasReceipt"
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Reçu disponible</span>
                    </label>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="variable-business-purpose" className="text-sm font-medium text-foreground block mb-2">
                      Objectif commercial <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <textarea
                      id="variable-business-purpose"
                      name="businessPurpose"
                      rows={2}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      placeholder="Décrivez l'objectif commercial de cette transaction"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="variable-gst-itc" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      ITC GST <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="variable-gst-itc"
                      type="number"
                      name="gstItc"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="variable-qst-itc" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      ITC QST <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="variable-qst-itc"
                      type="number"
                      name="qstItc"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                      <input
                        type="checkbox"
                        name="useManualTaxes"
                        checked={showManualTaxes}
                        onChange={(e) => setShowManualTaxes(e.target.checked)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span>Utiliser des montants de taxes manuels</span>
                    </label>
                    
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 ${showManualTaxes ? '' : 'hidden'}`}>
                      <div>
                        <label htmlFor="variable-manual-gst" className="text-sm font-medium text-foreground block mb-2">
                          GST (montant manuel) <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                        </label>
                        <input
                          id="variable-manual-gst"
                          type="number"
                          name="manualGst"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                          placeholder="0.00"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="variable-manual-qst" className="text-sm font-medium text-foreground block mb-2">
                          QST (montant manuel) <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                        </label>
                        <input
                          id="variable-manual-qst"
                          type="number"
                          name="manualQst"
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              )}

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowVariableModal(false);
                    setShowManualTaxes(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
