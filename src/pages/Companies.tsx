import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, Edit2, Trash2, MoreVertical, Building2, FileText, Hash, User, Mail, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import { db } from "../lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { getTransactions, type Transaction } from "../lib/db";
import { nanoid } from "nanoid";
import React from "react";

// Données mock uniquement pour la démo quand l'utilisateur n'est pas connecté
const mockCompanies = [
  {
    id: 1,
    name: "Tech Solutions Inc",
    businessNumber: "123-456-789",
    neq: "1234 5678 90",
    taxNumber: "98-7654-321",
    legalName: "Tech Solutions Incorporated",
    owner: "John Doe",
    email: "john@techsolutions.com",
    stripe: true,
    revenue: "$125,000",
    status: "active",
  },
  {
    id: 2,
    name: "Creative Agency",
    businessNumber: "987-654-321",
    neq: "9876 5432 10",
    taxNumber: "12-3456-789",
    legalName: "Creative Agency Ltd",
    owner: "Jane Smith",
    email: "jane@creativeagency.com",
    stripe: false,
    revenue: "$85,000",
    status: "active",
  },
];

interface Company {
  id: string;
  userId: string;
  name: string;
  legalName?: string;
  businessNumber?: string;
  neq?: string;
  taxNumber?: string;
  owner?: string;
  email?: string;
  stripe?: boolean;
  revenue?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Companies() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { selectedYear } = useFiscalYearContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    businessNumber: "",
    neq: "",
    taxNumber: "",
    owner: "",
    email: "",
  });

  // Récupérer les entreprises depuis Firestore
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!currentUser || !db) {
        setLoading(false);
        return;
      }

      try {
        // Utiliser une sous-collection : users/{userId}/companies
        const companiesRef = collection(db, "users", currentUser.uid, "companies");
        const q = query(companiesRef);
        const snapshot = await getDocs(q);
        
        const companiesData: Company[] = [];
        snapshot.forEach((doc) => {
          companiesData.push({
            id: doc.id,
            ...doc.data(),
          } as Company);
        });
        
        setCompanies(companiesData);
      } catch (error) {
        console.error("Erreur lors de la récupération des entreprises:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [currentUser]);

  // Charger les transactions pour calculer les statistiques par entreprise
  useEffect(() => {
    const loadTransactions = async () => {
      if (!currentUser) {
        setTransactions([]);
        return;
      }
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
    const handleUpdate = () => {
      loadTransactions();
    };
    window.addEventListener("transactionsUpdated", handleUpdate);

    return () => {
      window.removeEventListener("transactionsUpdated", handleUpdate);
    };
  }, [selectedYear, currentUser]);

  // Fonction pour calculer les statistiques d'une entreprise
  const calculateCompanyStats = (companyName: string) => {
    const companyTransactions = transactions.filter(
      (t) => t.company === companyName
    );
    
    const revenue = companyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = companyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const net = revenue - expenses;
    
    return { revenue, expenses, net };
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !db) {
      console.error("Utilisateur non connecté ou Firestore non disponible");
      return;
    }

    try {
      const companyData = {
        id: nanoid(),
        name: formData.name,
        legalName: formData.legalName || "",
        businessNumber: formData.businessNumber || "",
        neq: formData.neq || "",
        taxNumber: formData.taxNumber || "",
        owner: formData.owner || "",
        email: formData.email || "",
        stripe: false,
        revenue: "$0",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Utiliser une sous-collection : users/{userId}/companies
      const companiesRef = collection(db, "users", currentUser.uid, "companies");
      await addDoc(companiesRef, companyData);
      
      console.log("✅ Entreprise créée avec succès");
      
      // Réinitialiser le formulaire et fermer le modal
      setFormData({
        name: "",
        legalName: "",
        businessNumber: "",
        neq: "",
        taxNumber: "",
        owner: "",
        email: "",
      });
      setShowAddModal(false);
      
      // Rafraîchir la liste
      const snapshot = await getDocs(query(companiesRef, where("userId", "==", currentUser.uid)));
      const companiesData: Company[] = [];
      snapshot.forEach((doc) => {
        companiesData.push({
          id: doc.id,
          ...doc.data(),
        } as Company);
      });
      setCompanies(companiesData);
    } catch (error: any) {
      console.error("❌ Erreur lors de la création de l'entreprise:", error);
      console.error("Code d'erreur:", error?.code);
      console.error("Message:", error?.message);
      alert("Erreur lors de la création de l'entreprise. Vérifiez la console pour plus de détails.");
    }
  };

  // Gérer la suppression d'une entreprise
  const handleDelete = async (companyId: string) => {
    if (!currentUser || !db) {
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) {
      return;
    }

    try {
      // Utiliser une sous-collection : users/{userId}/companies
      const companyRef = doc(db, "users", currentUser.uid, "companies", companyId);
      await deleteDoc(companyRef);
      
      // Rafraîchir la liste
      setCompanies(companies.filter(c => c.id !== companyId));
      console.log("✅ Entreprise supprimée avec succès");
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression de l'entreprise:", error);
      alert("Erreur lors de la suppression de l'entreprise.");
    }
  };

  // Les données mock sont uniquement pour la démo quand l'utilisateur n'est pas connecté
  const displayCompanies = currentUser ? companies : mockCompanies;

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("companies.title")}</h1>
          <p className="text-muted-foreground">
            {t("companies.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>{t("companies.addCompany")}</span>
        </button>
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des entreprises...</p>
        </div>
      ) : displayCompanies.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucune entreprise enregistrée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayCompanies.map((company) => (
          <div
            key={company.id}
            className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {company.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {company.legalName}
                </p>
              </div>
              <button 
                className="text-muted-foreground hover:text-foreground"
                aria-label={t("companies.moreOptions") || "Plus d'options"}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Company Details */}
            <div className="space-y-3 mb-4 py-4 border-t border-b border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("companies.businessNumber")}
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {company.businessNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("companies.neq")}
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {company.neq}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("companies.taxNumber")}
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {company.taxNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("companies.owner")}
                  </p>
                  <p className="text-sm text-foreground">{company.owner}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {t("companies.contactEmail")}
                </p>
                <p className="text-sm text-foreground">{company.email}</p>
              </div>
            </div>

            {/* Integrations */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                {t("companies.integrations")}
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    company.stripe
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {company.stripe ? t("companies.stripeConnected") : t("companies.stripe")}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {currentUser ? (
                <div className="flex items-center gap-4 text-xs">
                  {(() => {
                    const stats = calculateCompanyStats(company.name);
                    return (
                      <>
                        <div>
                          <span className="text-muted-foreground">{t("companies.ytdRevenue")}: </span>
                          <span className="font-medium text-success">
                            {stats.revenue.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dépenses: </span>
                          <span className="font-medium text-destructive">
                            {stats.expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net: </span>
                          <span className={`font-medium ${stats.net >= 0 ? "text-success" : "text-destructive"}`}>
                            {stats.net.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <span className="text-sm font-medium text-success">
                  {t("companies.ytdRevenue")}: {company.revenue}
                </span>
              )}
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  aria-label={t("companies.editCompany") || "Modifier l'entreprise"}
                >
                  <Edit2 className="w-4 h-4 text-foreground" />
                </button>
                <button 
                  onClick={() => handleDelete(company.id)}
                  className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                  aria-label={t("companies.deleteCompany") || "Supprimer l'entreprise"}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {t("companies.addNewCompany")}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Remplissez les informations de votre entreprise
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form className="p-6 space-y-6" onSubmit={handleSubmit}>
              {/* Section: Informations de base */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Informations de base
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="company-name" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {t("companies.companyName")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="company-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      placeholder="Ex: Tech Solutions Inc"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="company-legal-name" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {t("companies.legalName")} <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="company-legal-name"
                      name="legalName"
                      type="text"
                      value={formData.legalName}
                      onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      placeholder="Ex: Tech Solutions Incorporated"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="company-owner" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {t("companies.owner")} <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="company-owner"
                      name="owner"
                      type="text"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      placeholder="Ex: Jean Dupont"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="company-email" className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {t("companies.contactEmail")} <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="company-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/60"
                      placeholder="Ex: contact@entreprise.com"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Numéros d'identification */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Numéros d'identification
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company-business-number" className="text-sm font-medium text-foreground block mb-2">
                      {t("companies.businessNumber")} (BN) <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="company-business-number"
                      name="businessNumber"
                      type="text"
                      value={formData.businessNumber}
                      onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm placeholder:text-muted-foreground/60"
                      placeholder="Ex: 123-456-789"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="company-neq" className="text-sm font-medium text-foreground block mb-2">
                      {t("companies.neq")} <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="company-neq"
                      name="neq"
                      type="text"
                      value={formData.neq}
                      onChange={(e) => setFormData({ ...formData, neq: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm placeholder:text-muted-foreground/60"
                      placeholder="Ex: 1234 5678 90"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="company-tax-number" className="text-sm font-medium text-foreground block mb-2">
                      {t("companies.taxNumber")} <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
                    </label>
                    <input
                      id="company-tax-number"
                      name="taxNumber"
                      type="text"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono text-sm placeholder:text-muted-foreground/60"
                      placeholder="Ex: 98-7654-321"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  {t("companies.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("companies.createCompany")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
