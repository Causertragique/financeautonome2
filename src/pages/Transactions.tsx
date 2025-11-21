import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, Filter, Download, Edit2, Trash2, Search, Calendar, X, Printer, DollarSign, FileText, Building2, Tag, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, Paperclip, File, Trash, Wallet } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import { useUsageMode } from "../contexts/UsageModeContext";
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, type Transaction } from "../lib/db";
import { db } from "../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { classifyTransaction, calculateTaxes, validateExpense } from "../lib/taxRules";
import { uploadTransactionDocument, deleteTransactionDocument, type Document } from "../lib/storage";
import React from "react";

export default function Transactions() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { selectedYear } = useFiscalYearContext();
  const { usageType, currentMode } = useUsageMode();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("customCategories");
    return saved ? JSON.parse(saved) : [];
  });
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string; type: string; institution: string }>>([]);
  
  // Cache pour les transactions des deux modes
  const [transactionsCache, setTransactionsCache] = useState<{
    business: Transaction[];
    personal: Transaction[];
  }>({
    business: [],
    personal: [],
  });
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortColumn, setSortColumn] = useState<"date" | "type" | "company" | "account" | "category" | "tags" | "amount" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterCompany, setFilterCompany] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterAmount, setFilterAmount] = useState<"all" | "income" | "expense">("all");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showCompanyFilter, setShowCompanyFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showAmountFilter, setShowAmountFilter] = useState(false);
  const [showManualTaxes, setShowManualTaxes] = useState(false);
  const [showEditManualTaxes, setShowEditManualTaxes] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState<{ [key: string]: boolean }>({});
  
  // Charger les entreprises depuis Firestore
  useEffect(() => {
    const loadCompanies = async () => {
      if (!currentUser || !db) {
        return;
      }

      try {
        // Utiliser une sous-collection : users/{userId}/companies
        const companiesRef = collection(db, "users", currentUser.uid, "companies");
        const q = query(companiesRef);
        const snapshot = await getDocs(q);
        
        const companiesData: Array<{ id: string; name: string }> = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          companiesData.push({
            id: doc.id,
            name: data.name || "",
          });
        });
        
        setCompanies(companiesData);
      } catch (error) {
        console.error("Erreur lors du chargement des entreprises:", error);
      }
    };

    loadCompanies();
  }, [currentUser]);

  // Charger les comptes depuis Firestore (pour mode personnel)
  useEffect(() => {
    const loadAccounts = async () => {
      if (!currentUser || !db) {
        return;
      }

      try {
        // Utiliser une sous-collection : users/{userId}/accounts
        const accountsRef = collection(db, "users", currentUser.uid, "accounts");
        const q = query(accountsRef);
        const snapshot = await getDocs(q);
        
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
  }, [currentUser]);

  // Charger les transactions dans le cache pour les deux modes (si usageType === "both")
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      console.log("🔄 Chargement des transactions pour l'année:", selectedYear);
      try {
        if (usageType === "both") {
          // Charger les deux modes en parallèle
          const [businessData, personalData] = await Promise.all([
            getTransactions(selectedYear, "business"),
            getTransactions(selectedYear, "personal"),
          ]);
          
          const newCache = {
            business: businessData,
            personal: personalData,
          };
          
          setTransactionsCache(newCache);
          
          // Afficher les transactions du mode actuel
          setTransactions(newCache[currentMode]);
        } else {
          // Si un seul mode, charger normalement
          const mode = usageType || "business";
          const data = await getTransactions(selectedYear, mode);
        setTransactions(data);
        }
      } catch (error) {
        console.error("❌ Erreur lors du chargement des transactions:", error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadTransactions();
    
    // Écouter les mises à jour
    const handleUpdate = () => {
      console.log("🔄 Événement transactionsUpdated déclenché, rechargement...");
      loadTransactions();
    };
    
    // Écouter les changements de mode
    const handleModeChange = (event: CustomEvent) => {
      console.log("🔄 Événement modeChanged détecté:", event.detail);
      if (usageType === "both") {
        loadTransactions();
      }
    };
    
    window.addEventListener("transactionsUpdated", handleUpdate);
    window.addEventListener("modeChanged", handleModeChange as EventListener);
    
    return () => {
      window.removeEventListener("transactionsUpdated", handleUpdate);
      window.removeEventListener("modeChanged", handleModeChange as EventListener);
    };
  }, [selectedYear, usageType, currentMode]);

  // Quand le mode change (pour usageType === "both"), basculer instantanément depuis le cache
  useEffect(() => {
    if (usageType === "both" && currentUser) {
      console.log("🔄 Changement de mode détecté dans Transactions:", currentMode);
      console.log("📊 Cache disponible:", Object.keys(transactionsCache));
      const cachedData = transactionsCache[currentMode];
      if (cachedData) {
        console.log(`✅ Chargement de ${cachedData.length} transactions pour le mode ${currentMode}`);
        setTransactions(cachedData);
      } else {
        console.warn(`⚠️ Pas de données en cache pour le mode ${currentMode}, rechargement...`);
        // Recharger les données si le cache est vide
        getTransactions(selectedYear, currentMode).then((data) => {
          setTransactions(data);
          setTransactionsCache(prev => ({
            ...prev,
            [currentMode]: data
          }));
        });
      }
    }
  }, [currentMode, usageType, transactionsCache, currentUser, selectedYear]);
  
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
    
    const description = (formData.get("description") as string) || "";
    const amount = parseFloat((formData.get("amount") as string) || "0");
    const rawType = (formData.get("type") as string) || "expense";
    
    // Convertir les types personnels en types génériques pour le calcul
    let type: "income" | "expense" = "expense";
    const isPersonalMode = currentMode === "personal" || usageType === "personal";
    
    if (isPersonalMode) {
      // En mode personnel, déterminer si c'est une entrée ou sortie
      if (rawType === "revenue") {
        type = "income";
      } else if (rawType === "depense" || rawType === "remboursement" || rawType === "paiement_facture") {
        type = "expense";
      } else if (rawType === "transfert") {
        // Pour les transferts, vérifier si c'est entre comptes ou entre personnes
        const transferType = formData.get("transferType") as string;
        const accountTo = formData.get("accountTo") as string;
        
        if (transferType === "between_accounts" && accountTo) {
          // Transfert entre comptes : pas d'influence sur le portrait financier
          // On crée quand même la transaction mais avec un flag spécial
          type = "expense"; // On garde expense mais on ne l'inclura pas dans les calculs
        } else {
          // Transfert entre personnes : sortie d'argent
          type = "expense";
        }
      }
    } else {
      // Mode business : types classiques
      type = rawType as "income" | "expense";
    }
    const isTaxable = formData.get("isTaxable") === "true" || formData.get("isTaxable") === "on";
    const hasReceipt = formData.get("hasReceipt") === "true" || formData.get("hasReceipt") === "on";
    
    // Récupérer les valeurs manuelles de GST/QST si fournies
    const manualGst = formData.get("manualGst") as string;
    const manualQst = formData.get("manualQst") as string;
    const useManualTaxes = formData.get("useManualTaxes") === "true" || formData.get("useManualTaxes") === "on";
    
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
    
    // Calcul des taxes si applicable
    let gst: number | undefined = undefined;
    let qst: number | undefined = undefined;
    
    if (isTaxable && amount > 0) {
      if (useManualTaxes) {
        // Utiliser les valeurs manuelles si le checkbox est coché
        if (manualGst && manualGst.trim() !== "") {
          gst = parseFloat(manualGst) || 0;
        }
        if (manualQst && manualQst.trim() !== "") {
          qst = parseFloat(manualQst) || 0;
        }
        // Si le checkbox est coché mais les champs sont vides, on laisse undefined
      } else {
        // Calculer automatiquement
        try {
          const taxes = await calculateTaxes(amount, true);
          gst = taxes.gst;
          qst = taxes.qst;
        } catch (error) {
          console.warn("Erreur lors du calcul des taxes:", error);
        }
      }
    }
    
    // Validation des dépenses
    let deductibleRatio = 1.0;
    if (type === "expense") {
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
    
    const account = formData.get("account") as string;
    const accountTo = formData.get("accountTo") as string;
    const transferType = formData.get("transferType") as string;
    
    const newTransaction: Omit<Transaction, "id" | "userId" | "createdAt" | "updatedAt"> = {
      date: (formData.get("date") as string) || new Date().toISOString().split('T')[0],
      description,
      category: suggestedCategory,
      type: isPersonalMode ? (rawType as any) : type, // Garder le type original en mode personnel
      amount,
      company: isPersonalMode ? undefined : ((formData.get("company") as string) || (companies.length > 0 ? companies[0].name : "")),
      account: isPersonalMode ? account : undefined,
      accountTo: isPersonalMode && rawType === "transfert" && accountTo ? accountTo : undefined,
      transferType: isPersonalMode && rawType === "transfert" ? (transferType as "between_accounts" | "between_persons") : undefined,
      tags: [],
      // Champs fiscaux
      // Si useManualTaxes est coché, utiliser les valeurs saisies (même si 0), sinon utiliser les valeurs calculées
      gst: useManualTaxes ? gst : (gst && gst > 0 ? gst : undefined),
      qst: useManualTaxes ? qst : (qst && qst > 0 ? qst : undefined),
      isTaxable: isTaxable || undefined,
      hasReceipt: hasReceipt || undefined,
      businessPurpose: (formData.get("businessPurpose") as string) || undefined,
      deductibleRatio: deductibleRatio < 1.0 ? deductibleRatio : undefined,
      // ITC (Input Tax Credits)
      gstItc: formData.get("gstItc") ? parseFloat(formData.get("gstItc") as string) || undefined : undefined,
      qstItc: formData.get("qstItc") ? parseFloat(formData.get("qstItc") as string) || undefined : undefined,
      // Classification automatique
      autoClassified: autoClassified || undefined,
      classificationConfidence: classificationConfidence > 0 ? classificationConfidence : undefined,
    };
    
    if (newTransaction.amount > 0 && newTransaction.description) {
      console.log("🔄 Tentative d'ajout de transaction:", newTransaction);
      const id = await addTransaction(newTransaction);
      if (id) {
        console.log("✅ Transaction ajoutée avec succès, ID:", id);
        setShowAddModal(false);
        form.reset();
        // Les transactions seront rechargées automatiquement via l'événement
      } else {
        console.error("❌ Échec de l'ajout de la transaction");
        alert(t("transactions.errorAdd"));
      }
    } else {
      console.warn("⚠️ Transaction invalide:", newTransaction);
      alert(t("transactions.requiredFields"));
    }
  };

  // Fonction pour modifier une transaction
  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowEditModal(true);
    // Afficher les champs manuels si des valeurs GST/QST existent déjà
    setShowEditManualTaxes(!!(transaction.gst !== undefined || transaction.qst !== undefined));
  };

  // Fonction pour mettre à jour une transaction
  const handleUpdateTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const description = (formData.get("description") as string) || editingTransaction.description || "";
    const amount = parseFloat((formData.get("amount") as string) || "0") || editingTransaction.amount;
    const type = (formData.get("type") as "income" | "expense") || editingTransaction.type;
    const isTaxable = formData.get("isTaxable") === "true" || formData.get("isTaxable") === "on";
    const hasReceipt = formData.get("hasReceipt") === "true" || formData.get("hasReceipt") === "on";
    
    // Récupérer les valeurs manuelles de GST/QST si fournies
    const manualGst = formData.get("manualGst") as string;
    const manualQst = formData.get("manualQst") as string;
    const useManualTaxes = formData.get("useManualTaxes") === "true" || formData.get("useManualTaxes") === "on";
    
    // Calcul des taxes si applicable
    let gst: number | undefined = undefined;
    let qst: number | undefined = undefined;
    
    if (isTaxable && amount > 0) {
      if (useManualTaxes) {
        // Utiliser les valeurs manuelles si le checkbox est coché
        if (manualGst && manualGst.trim() !== "") {
          gst = parseFloat(manualGst) || 0;
        }
        if (manualQst && manualQst.trim() !== "") {
          qst = parseFloat(manualQst) || 0;
        }
        // Si le checkbox est coché mais les champs sont vides, on laisse undefined
      } else {
        // Calculer automatiquement
        try {
          const taxes = await calculateTaxes(amount, true);
          gst = taxes.gst;
          qst = taxes.qst;
        } catch (error) {
          console.warn("Erreur lors du calcul des taxes:", error);
        }
      }
    }
    
    // Validation des dépenses
    let deductibleRatio = 1.0;
    if (type === "expense") {
      try {
        const validation = await validateExpense({
          amount,
          category: (formData.get("category") as string) || editingTransaction.category || "",
          description,
          date: (formData.get("date") as string) || editingTransaction.date,
          hasReceipt,
          businessPurpose: formData.get("businessPurpose") as string || undefined
        });
        deductibleRatio = validation.deductibleRatio;
      } catch (error) {
        console.warn("Erreur lors de la validation de la dépense:", error);
      }
    }
    
    const updates = {
      date: (formData.get("date") as string) || editingTransaction.date,
      description,
      category: (formData.get("category") as string) || editingTransaction.category || "",
      type,
      amount,
      company: (formData.get("company") as string) || editingTransaction.company || "",
      tags: editingTransaction.tags || [],
      // Champs fiscaux
      // Si useManualTaxes est coché, utiliser les valeurs saisies (même si 0), sinon utiliser les valeurs calculées
      gst: useManualTaxes ? gst : (gst && gst > 0 ? gst : undefined),
      qst: useManualTaxes ? qst : (qst && qst > 0 ? qst : undefined),
      isTaxable: isTaxable || undefined,
      hasReceipt: hasReceipt || undefined,
      businessPurpose: (formData.get("businessPurpose") as string) || undefined,
      deductibleRatio: deductibleRatio < 1.0 ? deductibleRatio : undefined,
      // ITC (Input Tax Credits)
      gstItc: formData.get("gstItc") ? parseFloat(formData.get("gstItc") as string) || undefined : undefined,
      qstItc: formData.get("qstItc") ? parseFloat(formData.get("qstItc") as string) || undefined : undefined,
    };

    if (updates.amount > 0 && updates.description) {
      const success = await updateTransaction(editingTransaction.id, updates);
      if (success) {
        // Upload des nouveaux documents si présents
        const fileInput = form.querySelector('input[type="file"][name="documents"]') as HTMLInputElement;
        if (fileInput && fileInput.files && fileInput.files.length > 0) {
          const files = Array.from(fileInput.files);
          const existingDocs = editingTransaction.documents || [];
          const uploadedDocuments: Document[] = [...existingDocs];
          
          setUploadingDocuments(prev => ({ ...prev, [editingTransaction.id]: true }));
          for (const file of files) {
            const doc = await uploadTransactionDocument(editingTransaction.id, file);
            if (doc) {
              uploadedDocuments.push(doc);
            }
          }
          setUploadingDocuments(prev => ({ ...prev, [editingTransaction.id]: false }));
          
          // Mettre à jour la transaction avec les nouveaux documents
          if (uploadedDocuments.length > existingDocs.length) {
            await updateTransaction(editingTransaction.id, { documents: uploadedDocuments });
          }
        }
        
        setShowEditModal(false);
        setEditingTransaction(null);
        setShowEditManualTaxes(false);
        form.reset();
      } else {
        alert(t("transactions.errorUpdate"));
      }
    } else {
      alert(t("transactions.requiredFields"));
    }
  };
  
  // Fonction pour supprimer un document
  const handleDeleteDocument = async (transactionId: string, documentUrl: string, documentIndex: number) => {
    if (!confirm(t("transactions.confirmDeleteDocument"))) {
      return;
    }

    const success = await deleteTransactionDocument(transactionId, documentUrl);
    if (success) {
      // Mettre à jour la transaction pour retirer le document
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction && transaction.documents) {
        const updatedDocuments = transaction.documents.filter((_, idx) => idx !== documentIndex);
        await updateTransaction(transactionId, { documents: updatedDocuments.length > 0 ? updatedDocuments : undefined });
      }
    } else {
      alert(t("transactions.errorDeleteDocument"));
    }
  };

  // Fonction pour supprimer une transaction
  const handleDeleteTransaction = async (transactionId: string) => {
    if (!confirm(t("transactions.confirmDelete"))) {
      return;
    }

    const success = await deleteTransaction(transactionId);
    if (!success) {
      alert(t("transactions.errorDelete"));
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
          ? `+${transaction.amount.toFixed(2)} $` 
          : `-${transaction.amount.toFixed(2)} $`;
        
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
                  ? `+${transaction.amount.toFixed(2)} $` 
                  : `-${transaction.amount.toFixed(2)} $`;
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
  

  // Obtenir les valeurs uniques pour les filtres
  const uniqueDates = Array.from(new Set(transactions.map(t => t.date))).sort().reverse();
  const uniqueCompanies = Array.from(new Set(transactions.map(t => t.company).filter(Boolean))).sort();
  const uniqueAccounts = Array.from(new Set(transactions.map(t => t.account).filter(Boolean))).sort();
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean))).sort();

  // Filtrer les transactions par recherche et type
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    const matchesDate = !filterDate || t.date === filterDate;
    const matchesCompany = !filterCompany || 
      (currentMode === "personal" || usageType === "personal" 
        ? t.account === filterCompany 
        : t.company === filterCompany);
    const matchesCategory = !filterCategory || t.category === filterCategory;
    const matchesAmount = filterAmount === "all" || 
      (filterAmount === "income" && t.type === "income") ||
      (filterAmount === "expense" && t.type === "expense");
    return matchesSearch && matchesType && matchesDate && matchesCompany && matchesCategory && matchesAmount;
  });

  // Fonction pour gérer le tri
  const handleSort = (column: "date" | "type" | "company" | "account" | "category" | "tags" | "amount") => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, commencer par ordre décroissant pour le montant, croissant pour les autres
      setSortColumn(column);
      setSortDirection(column === "amount" ? "desc" : "asc");
    }
  };

  // Trier les transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortColumn) return 0;

    if (sortColumn === "amount") {
      // Tri numérique pour les montants
      const comparison = a.amount - b.amount;
      return sortDirection === "asc" ? comparison : -comparison;
    }

    let aValue: string;
    let bValue: string;

    switch (sortColumn) {
      case "date":
        aValue = a.date;
        bValue = b.date;
        break;
      case "company":
        aValue = a.company || "";
        bValue = b.company || "";
        break;
      case "category":
        aValue = a.category || "";
        bValue = b.category || "";
        break;
      case "tags":
        aValue = (a.tags || []).join(", ");
        bValue = (b.tags || []).join(", ");
        break;
      default:
        return 0;
    }

    const comparison = aValue.localeCompare(bValue);
    return sortDirection === "asc" ? comparison : -comparison;
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
        <div className="flex items-center gap-3">
          {/* Summary Cards */}
          <div className="flex items-center gap-2">
            <div className="bg-card rounded-md border border-border px-3 py-1.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground mb-0.5">{t("transactions.totalIncome")}</p>
              <p className="text-sm font-bold text-success">
                {totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
              </p>
            </div>
            <div className="bg-card rounded-md border border-border px-3 py-1.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground mb-0.5">{t("transactions.totalExpenses")}</p>
              <p className="text-sm font-bold text-destructive">
                {totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
              </p>
            </div>
            <div className="bg-card rounded-md border border-border px-3 py-1.5 shadow-sm">
              <p className="text-[10px] text-muted-foreground mb-0.5">{t("transactions.net")}</p>
              <p
                className={`text-sm font-bold ${
                  totalIncome - totalExpenses >= 0
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {(totalIncome - totalExpenses).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })} $
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>{t("transactions.addTransaction")}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <input
            id="transaction-search"
            name="search"
            type="text"
            placeholder={t("transactions.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            id="transaction-filter-type"
            name="filterType"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg bg-card text-foreground hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Filtrer par type de transaction"
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
                  <div className="relative flex items-center gap-2">
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {sortColumn === "date" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                      {t("transactions.date")}
                    </button>
                    <button
                      onClick={() => setShowDateFilter(!showDateFilter)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                      aria-label="Filtrer par date"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${showDateFilter ? 'rotate-180' : ''}`} />
                    </button>
                    {showDateFilter && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px] max-h-[300px] overflow-y-auto">
                        <div className="p-2">
                          <button
                            onClick={() => { setFilterDate(null); setShowDateFilter(false); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${!filterDate ? 'bg-primary/10 text-primary font-medium' : ''}`}
                          >
                            Toutes les dates
                          </button>
                          {uniqueDates.map((date) => (
                            <button
                              key={date}
                              onClick={() => { setFilterDate(date); setShowDateFilter(false); }}
                              className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${filterDate === date ? 'bg-primary/10 text-primary font-medium' : ''}`}
                            >
                              {date}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  <button
                    onClick={() => handleSort("type")}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                  >
                    {t("transactions.type")}
                    {sortColumn === "type" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-50" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.description")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  <div className="relative flex items-center gap-2">
                    <button
                      onClick={() => handleSort("amount")}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {sortColumn === "amount" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                      {t("transactions.amount")}
                    </button>
                    <button
                      onClick={() => setShowAmountFilter(!showAmountFilter)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                      aria-label="Filtrer par type"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${showAmountFilter ? 'rotate-180' : ''}`} />
                    </button>
                    {showAmountFilter && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[180px]">
                        <div className="p-2">
                          <button
                            onClick={() => { setFilterAmount("all"); setShowAmountFilter(false); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${filterAmount === "all" ? 'bg-primary/10 text-primary font-medium' : ''}`}
                          >
                            {t("transactions.allIncomeExpenses")}
                          </button>
                          <button
                            onClick={() => { setFilterAmount("income"); setShowAmountFilter(false); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${filterAmount === "income" ? 'bg-primary/10 text-primary font-medium' : ''}`}
                          >
                            {t("transactions.incomeOnly")}
                          </button>
                          <button
                            onClick={() => { setFilterAmount("expense"); setShowAmountFilter(false); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${filterAmount === "expense" ? 'bg-primary/10 text-primary font-medium' : ''}`}
                          >
                            {t("transactions.expensesOnly")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  <div className="relative flex items-center gap-2">
                    <button
                      onClick={() => handleSort(currentMode === "personal" || usageType === "personal" ? "account" : "company")}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {sortColumn === (currentMode === "personal" || usageType === "personal" ? "account" : "company") ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                      {currentMode === "personal" || usageType === "personal" ? t("transactions.account") : t("transactions.company")}
                    </button>
                    <button
                      onClick={() => setShowCompanyFilter(!showCompanyFilter)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                      aria-label={currentMode === "personal" || usageType === "personal" ? t("transactions.filterByAccount") : t("transactions.filterByCompany")}
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${showCompanyFilter ? 'rotate-180' : ''}`} />
                    </button>
                    {showCompanyFilter && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px] max-h-[300px] overflow-y-auto">
                        <div className="p-2">
                          <button
                            onClick={() => { setFilterCompany(null); setShowCompanyFilter(false); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${!filterCompany ? 'bg-primary/10 text-primary font-medium' : ''}`}
                          >
                            {currentMode === "personal" || usageType === "personal" ? t("transactions.allAccounts") : t("transactions.allCompanies")}
                          </button>
                          {(currentMode === "personal" || usageType === "personal" 
                            ? uniqueAccounts.length > 0 
                              ? uniqueAccounts.map((accountName) => (
                                  <button
                                    key={accountName}
                                    onClick={() => { setFilterCompany(accountName); setShowCompanyFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${filterCompany === accountName ? 'bg-primary/10 text-primary font-medium' : ''}`}
                                  >
                                    {accountName}
                                  </button>
                                ))
                              : accounts.map((account) => (
                                  <button
                                    key={account.id}
                                    onClick={() => { setFilterCompany(account.name); setShowCompanyFilter(false); }}
                                    className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${filterCompany === account.name ? 'bg-primary/10 text-primary font-medium' : ''}`}
                                  >
                                    {account.name}
                                  </button>
                                ))
                            : uniqueCompanies.map((company) => (
                                <button
                                  key={company}
                                  onClick={() => { setFilterCompany(company); setShowCompanyFilter(false); }}
                                  className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${filterCompany === company ? 'bg-primary/10 text-primary font-medium' : ''}`}
                                >
                                  {company}
                                </button>
                              ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  <div className="relative flex items-center gap-2">
                    <button
                      onClick={() => handleSort("category")}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {sortColumn === "category" ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      )}
                      {t("transactions.category")}
                    </button>
                    <button
                      onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                      className="p-1 hover:bg-secondary rounded transition-colors"
                      aria-label="Filtrer par catégorie"
                    >
                      <ChevronDown className={`w-3 h-3 transition-transform ${showCategoryFilter ? 'rotate-180' : ''}`} />
                    </button>
                    {showCategoryFilter && (
                      <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[200px] max-h-[300px] overflow-y-auto">
                        <div className="p-2">
                          <button
                            onClick={() => { setFilterCategory(null); setShowCategoryFilter(false); }}
                            className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${!filterCategory ? 'bg-primary/10 text-primary font-medium' : ''}`}
                          >
                            Toutes les catégories
                          </button>
                          {uniqueCategories.map((category) => (
                            <button
                              key={category}
                              onClick={() => { setFilterCategory(category); setShowCategoryFilter(false); }}
                              className={`w-full text-left px-3 py-2 rounded text-xs hover:bg-secondary transition-colors ${filterCategory === category ? 'bg-primary/10 text-primary font-medium' : ''}`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-muted-foreground">
                    Chargement des transactions...
                  </td>
                </tr>
                      ) : sortedTransactions.length > 0 ? (
                        sortedTransactions.map((transaction) => {
                          // Déterminer le label du type selon le mode
                          const getTypeLabel = () => {
                            if (currentMode === "personal" || usageType === "personal") {
                              switch (transaction.type) {
                                case "revenue": return t("transactions.typeRevenue");
                                case "depense": return t("transactions.typeDepense");
                                case "transfert": return t("transactions.typeTransfert");
                                case "remboursement": return t("transactions.typeRemboursement");
                                case "paiement_facture": return t("transactions.typePaiementFacture");
                                default: return transaction.type;
                              }
                            } else {
                              return transaction.type === "income" ? t("transactions.income") : t("transactions.expense");
                            }
                          };
                          
                          // Déterminer si c'est une entrée ou sortie d'argent
                          const isIncome = (currentMode === "personal" || usageType === "personal") 
                            ? transaction.type === "revenue"
                            : transaction.type === "income";
                          
                          return (
                <tr
                  key={transaction.id}
                  className="border-b border-border hover:bg-secondary/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-foreground">
                    {transaction.date}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        isIncome
                          ? "bg-success/10 text-success border border-success/20"
                          : "bg-destructive/10 text-destructive border border-destructive/20"
                      }`}
                    >
                      {getTypeLabel()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <span>{transaction.description}</span>
                      {transaction.documents && transaction.documents.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-primary" title={`${transaction.documents.length} document(s) joint(s)`}>
                          <Paperclip className="w-3 h-3" />
                          <span>{transaction.documents.length}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={`py-3 px-4 text-sm font-medium text-right ${
                      isIncome
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {transaction.amount.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })} $
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {currentMode === "personal" || usageType === "personal" 
                      ? (transaction.account || "-")
                      : (transaction.company || "-")}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {transaction.category}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                        aria-label={t("transactions.editTransaction")}
                      >
                        <Edit2 className="w-4 h-4 text-foreground" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors"
                        aria-label={t("transactions.deleteTransaction")}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
                        })
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
                    {t("transactions.addTransactionTitle")}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ajoutez une nouvelle transaction financière
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                aria-label={t("transactions.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddTransaction} className="p-6 space-y-6">
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
                    <label htmlFor="transaction-date" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.date")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="transaction-date"
                      type="date"
                      name="date"
                      defaultValue={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="transaction-type" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.type")} <span className="text-destructive">*</span>
                    </label>
                    <select 
                      id="transaction-type" 
                      name="type" 
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                      required
                      onChange={(e) => {
                        const transferDiv = document.getElementById("transfer-account-to");
                        const transferTypeInput = document.getElementById("transaction-transfer-type") as HTMLInputElement;
                        if (e.target.value === "transfert" && transferDiv) {
                          transferDiv.classList.remove("hidden");
                        } else if (transferDiv) {
                          transferDiv.classList.add("hidden");
                        }
                        // Mettre à jour le type de transfert selon si accountTo est rempli
                        const accountToSelect = document.getElementById("transaction-account-to") as HTMLSelectElement;
                        if (accountToSelect && transferTypeInput) {
                          accountToSelect.addEventListener("change", () => {
                            if (accountToSelect.value) {
                              transferTypeInput.value = "between_accounts";
                            } else {
                              transferTypeInput.value = "between_persons";
                            }
                          });
                        }
                      }}
                    >
                      {currentMode === "business" || usageType === "business" ? (
                        <>
                          <option value="income">{t("transactions.income")}</option>
                          <option value="expense">{t("transactions.expense")}</option>
                        </>
                      ) : (
                        <>
                          <option value="revenue">{t("transactions.typeRevenue")}</option>
                          <option value="depense">{t("transactions.typeDepense")}</option>
                          <option value="transfert">{t("transactions.typeTransfert")}</option>
                          <option value="remboursement">{t("transactions.typeRemboursement")}</option>
                          <option value="paiement_facture">{t("transactions.typePaiementFacture")}</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="transaction-description" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.description")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="transaction-description"
                      type="text"
                      name="description"
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      placeholder={t("transactions.descriptionPlaceholder")}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="transaction-amount" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.amount")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="transaction-amount"
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0.01"
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  {/* Entreprise (mode business) ou Compte (mode personal) */}
                  {currentMode === "business" || usageType === "business" ? (
                    <div>
                      <label htmlFor="transaction-company" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        {t("transactions.company")} <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                      </label>
                      <select 
                        id="transaction-company" 
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
                          <option value="">{t("transactions.noCompany")}</option>
                        )}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="transaction-account" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                        {t("transactions.account")} <span className="text-xs text-muted-foreground font-normal">({t("transactions.optional")})</span>
                      </label>
                      <select 
                        id="transaction-account" 
                        name="account" 
                        className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      >
                        <option value="">{t("transactions.noAccount")}</option>
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
                  
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="transaction-category" className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        {t("transactions.category")} <span className="text-destructive">*</span>
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
                      id="new-category-input"
                      name="newCategory"
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
                      aria-label={t("transactions.addCategory")}
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
                      aria-label={t("transactions.cancelAddCategory")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select id="transaction-category" name="category" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary" required>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    )                      )}
                </select>
                        )}
                      </div>

                      {/* Champ pour transfert entre comptes (mode personnel uniquement) */}
                      {(currentMode === "personal" || usageType === "personal") && (
                        <div id="transfer-account-to" className="md:col-span-2 hidden">
                          <label htmlFor="transaction-account-to" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-muted-foreground" />
                            {t("transactions.accountTo")} <span className="text-xs text-muted-foreground font-normal">({t("transactions.transferBetweenAccountsHint")})</span>
                          </label>
                          <select 
                            id="transaction-account-to" 
                            name="accountTo" 
                            className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            onChange={(e) => {
                              const transferTypeInput = document.getElementById("transaction-transfer-type") as HTMLInputElement;
                              if (transferTypeInput) {
                                if (e.target.value) {
                                  transferTypeInput.value = "between_accounts";
                                } else {
                                  transferTypeInput.value = "between_persons";
                                }
                              }
                            }}
                          >
                            <option value="">{t("transactions.transferBetweenAccountsInfo")}</option>
                            {accounts.length > 0 ? (
                              accounts.map((account) => (
                                <option key={account.id} value={account.name}>
                                  {account.name} ({account.institution})
                                </option>
                              ))
                            ) : null}
                          </select>
                          <input type="hidden" name="transferType" id="transaction-transfer-type" value="between_persons" />
                          <p className="text-xs text-muted-foreground mt-1">
                            Si un compte de destination est sélectionné, c'est un transfert entre comptes (pas d'influence sur le portrait financier). Sinon, c'est un transfert entre personnes (sortie d'argent).
                          </p>
                        </div>
                      )}
                        </div>
                      </div>

                      {/* Section: Informations fiscales (mode business uniquement) */}
                      {(currentMode === "business" || usageType === "business") && (
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            {t("transactions.fiscalInfo")}
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
                              <span>{t("transactions.taxableTransaction")}</span>
                            </label>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <input
                                type="checkbox"
                                name="hasReceipt"
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span>{t("transactions.receiptAvailable")}</span>
                            </label>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label htmlFor="transaction-business-purpose" className="text-sm font-medium text-foreground block mb-2">
                              {t("transactions.businessPurpose")} <span className="text-xs text-muted-foreground font-normal">({t("transactions.optional")})</span>
                            </label>
                            <textarea
                              id="transaction-business-purpose"
                              name="businessPurpose"
                              rows={2}
                              className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                              placeholder={t("transactions.businessPurposePlaceholder")}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="transaction-gst-itc" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              ITC GST <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                            </label>
                            <input
                              id="transaction-gst-itc"
                              type="number"
                              name="gstItc"
                              step="0.01"
                              min="0"
                              className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                              placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Crédit de taxe sur les intrants GST
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="transaction-qst-itc" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              ITC QST <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                            </label>
                            <input
                              id="transaction-qst-itc"
                              type="number"
                              name="qstItc"
                              step="0.01"
                              min="0"
                              className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                              placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Crédit de taxe sur les intrants QST
                            </p>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                              <input
                                type="checkbox"
                                name="useManualTaxes"
                                id="use-manual-taxes"
                                checked={showManualTaxes}
                                onChange={(e) => setShowManualTaxes(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span>{t("transactions.useManualTaxes")}</span>
                            </label>
                            
                            <div id="manual-taxes-fields" className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 ${showManualTaxes ? '' : 'hidden'}`}>
                              <div>
                                <label htmlFor="transaction-manual-gst" className="text-sm font-medium text-foreground block mb-2">
                                  GST (montant manuel) <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                                </label>
                                <input
                                  id="transaction-manual-gst"
                                  type="number"
                                  name="manualGst"
                                  step="0.01"
                                  min="0"
                                  className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                                  placeholder="0.00"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="transaction-manual-qst" className="text-sm font-medium text-foreground block mb-2">
                                  QST (montant manuel) <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                                </label>
                                <input
                                  id="transaction-manual-qst"
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

                      {/* Section: Documents */}
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-4">
                          <Paperclip className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            Documents joints
                          </h3>
                        </div>
                        
                        <div>
                          <label htmlFor="transaction-documents" className="text-sm font-medium text-foreground block mb-2">
                            Ajouter des documents <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                          </label>
                          <input
                            id="transaction-documents"
                            type="file"
                            name="documents"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Formats acceptés: PDF, images (JPG, PNG), documents (DOC, DOCX, XLS, XLSX)
                          </p>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowManualTaxes(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  {t("companies.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("transactions.addTransaction")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Edit2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t("transactions.updateTransaction")}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Modifiez les informations de la transaction
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTransaction(null);
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                aria-label={t("transactions.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUpdateTransaction} className="p-6 space-y-6">
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
                    <label htmlFor="edit-transaction-date" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.date")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="edit-transaction-date"
                      type="date"
                      name="date"
                      defaultValue={editingTransaction.date}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-transaction-type" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.type")} <span className="text-destructive">*</span>
                    </label>
                    <select 
                      id="edit-transaction-type" 
                      name="type" 
                      defaultValue={editingTransaction.type}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                      required
                    >
                      <option value="income">{t("transactions.income")}</option>
                      <option value="expense">{t("transactions.expense")}</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="edit-transaction-description" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.description")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="edit-transaction-description"
                      type="text"
                      name="description"
                      defaultValue={editingTransaction.description || ""}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      placeholder={t("transactions.descriptionPlaceholder")}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-transaction-amount" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.amount")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="edit-transaction-amount"
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0.01"
                      defaultValue={editingTransaction.amount}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-transaction-company" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.company")} <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <select 
                      id="edit-transaction-company" 
                      name="company" 
                      defaultValue={editingTransaction.company || ""}
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
                  
                  <div className="md:col-span-2">
                    <label htmlFor="edit-transaction-category" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {t("transactions.category")} <span className="text-destructive">*</span>
                    </label>
                    <select 
                      id="edit-transaction-category" 
                      name="category" 
                      defaultValue={editingTransaction.category || ""}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" 
                      required
                    >
                      {allCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Section: Informations fiscales */}
                      <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            {t("transactions.fiscalInfo")}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <input
                                type="checkbox"
                                name="isTaxable"
                                defaultChecked={editingTransaction.isTaxable || false}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span>{t("transactions.taxableTransaction")}</span>
                            </label>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                              <input
                                type="checkbox"
                                name="hasReceipt"
                                defaultChecked={editingTransaction.hasReceipt || false}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span>{t("transactions.receiptAvailable")}</span>
                            </label>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label htmlFor="edit-transaction-business-purpose" className="text-sm font-medium text-foreground block mb-2">
                              {t("transactions.businessPurpose")} <span className="text-xs text-muted-foreground font-normal">({t("transactions.optional")})</span>
                            </label>
                            <textarea
                              id="edit-transaction-business-purpose"
                              name="businessPurpose"
                              rows={2}
                              defaultValue={editingTransaction.businessPurpose || ""}
                              className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                              placeholder={t("transactions.businessPurposePlaceholder")}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="edit-transaction-gst-itc" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              ITC GST <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                            </label>
                            <input
                              id="edit-transaction-gst-itc"
                              type="number"
                              name="gstItc"
                              step="0.01"
                              min="0"
                              defaultValue={editingTransaction.gstItc || ""}
                              className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                              placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Crédit de taxe sur les intrants GST
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="edit-transaction-qst-itc" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              ITC QST <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                            </label>
                            <input
                              id="edit-transaction-qst-itc"
                              type="number"
                              name="qstItc"
                              step="0.01"
                              min="0"
                              defaultValue={editingTransaction.qstItc || ""}
                              className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                              placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Crédit de taxe sur les intrants QST
                            </p>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                              <input
                                type="checkbox"
                                name="useManualTaxes"
                                id="edit-use-manual-taxes"
                                checked={showEditManualTaxes}
                                onChange={(e) => setShowEditManualTaxes(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                              />
                              <span>{t("transactions.useManualTaxes")}</span>
                            </label>
                            
                            <div id="edit-manual-taxes-fields" className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 ${showEditManualTaxes ? '' : 'hidden'}`}>
                              <div>
                                <label htmlFor="edit-transaction-manual-gst" className="text-sm font-medium text-foreground block mb-2">
                                  GST (montant manuel) <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                                </label>
                                <input
                                  id="edit-transaction-manual-gst"
                                  type="number"
                                  name="manualGst"
                                  step="0.01"
                                  min="0"
                                  defaultValue={editingTransaction.gst || ""}
                                  className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                                  placeholder="0.00"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="edit-transaction-manual-qst" className="text-sm font-medium text-foreground block mb-2">
                                  QST (montant manuel) <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                                </label>
                                <input
                                  id="edit-transaction-manual-qst"
                                  type="number"
                                  name="manualQst"
                                  step="0.01"
                                  min="0"
                                  defaultValue={editingTransaction.qst || ""}
                                  className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60 font-mono"
                                  placeholder="0.00"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex gap-3 pt-4 border-t border-border">
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditModal(false);
                            setEditingTransaction(null);
                          }}
                          className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                        >
                          {t("transactions.cancel")}
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          {t("transactions.save")}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </MainLayout>
          );
        }
