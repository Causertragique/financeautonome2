import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import { getCCAClasses, getTaxRules } from "../lib/taxRules";
import { Plus, Building2, Calculator, X, FileText } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, query, where } from "firebase/firestore";
import { nanoid } from "nanoid";

interface Asset {
  id: string;
  userId: string;
  description: string;
  purchaseDate: string;
  cost: number;
  ccaClass: string;
  useStartDate: string;
  currentBookValue?: number;
  createdAt?: string;
  updatedAt?: string;
}

export default function Assets() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { selectedYear } = useFiscalYearContext();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [ccaClasses, setCcaClasses] = useState<Array<{class: string; description: string; rate: number}>>([]);
  const [formData, setFormData] = useState({
    description: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    cost: "",
    ccaClass: "",
    useStartDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser || !db) {
        setLoading(false);
        return;
      }

      try {
        // Charger les classes CCA
        const classes = await getCCAClasses();
        setCcaClasses(classes);

        // Charger les actifs
        const assetsRef = collection(db, "assets");
        const q = query(assetsRef, where("userId", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        
        const assetsData: Asset[] = [];
        snapshot.forEach((doc) => {
          assetsData.push({
            id: doc.id,
            ...doc.data(),
          } as Asset);
        });
        
        setAssets(assetsData);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !db) {
      console.error("Utilisateur non connecté ou Firestore non disponible");
      return;
    }

    try {
      const assetData = {
        id: nanoid(),
        userId: currentUser.uid,
        description: formData.description,
        purchaseDate: formData.purchaseDate,
        cost: parseFloat(formData.cost),
        ccaClass: formData.ccaClass,
        useStartDate: formData.useStartDate,
        currentBookValue: parseFloat(formData.cost),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const assetsRef = collection(db, "assets");
      await addDoc(assetsRef, assetData);
      
      // Réinitialiser le formulaire
      setFormData({
        description: "",
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: "",
        ccaClass: "",
        useStartDate: new Date().toISOString().split('T')[0],
      });
      setShowAddModal(false);
      
      // Rafraîchir la liste
      const snapshot = await getDocs(query(assetsRef, where("userId", "==", currentUser.uid)));
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) => {
        assetsData.push({
          id: doc.id,
          ...doc.data(),
        } as Asset);
      });
      setAssets(assetsData);
    } catch (error: any) {
      console.error("❌ Erreur lors de la création de l'actif:", error);
      alert("Erreur lors de la création de l'actif.");
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!currentUser || !db) {
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cet actif ?")) {
      return;
    }

    try {
      const assetRef = doc(db, "assets", assetId);
      await deleteDoc(assetRef);
      setAssets(assets.filter(a => a.id !== assetId));
    } catch (error: any) {
      console.error("❌ Erreur lors de la suppression de l'actif:", error);
      alert("Erreur lors de la suppression de l'actif.");
    }
  };

  // Calculer l'amortissement CCA
  const calculateCCA = (asset: Asset, year: number) => {
    const classInfo = ccaClasses.find(c => c.class === asset.ccaClass);
    if (!classInfo) return 0;

    const purchaseYear = new Date(asset.purchaseDate).getFullYear();
    const useStartYear = new Date(asset.useStartDate).getFullYear();
    const yearsSincePurchase = year - Math.max(purchaseYear, useStartYear);
    
    if (yearsSincePurchase < 0) return 0;

    let bookValue = asset.cost;
    for (let i = 0; i <= yearsSincePurchase; i++) {
      const cca = bookValue * classInfo.rate;
      bookValue = bookValue - cca;
    }

    return asset.cost - bookValue;
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Actifs et amortissement</h1>
          <p className="text-sm text-muted-foreground">
            Gestion des actifs et calcul de l'amortissement (CCA)
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un actif</span>
        </button>
      </div>

      {/* Liste des actifs */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des actifs...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Aucun actif enregistré</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assets.map((asset) => {
            const classInfo = ccaClasses.find(c => c.class === asset.ccaClass);
            const totalCCA = calculateCCA(asset, selectedYear);
            const currentBookValue = asset.cost - totalCCA;

            return (
              <div
                key={asset.id}
                className="bg-card rounded-lg border border-border p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {asset.description}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Coût d'achat:</span>
                        <p className="font-medium">{asset.cost.toLocaleString()} $</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Classe CCA:</span>
                        <p className="font-medium">{asset.ccaClass} ({classInfo?.rate ? (classInfo.rate * 100).toFixed(0) : 'N/A'}%)</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amortissement cumulé:</span>
                        <p className="font-medium text-blue-600">{totalCCA.toFixed(2)} $</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valeur comptable:</span>
                        <p className="font-medium text-green-600">{currentBookValue.toFixed(2)} $</p>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Achat: {asset.purchaseDate} | Mise en service: {asset.useStartDate}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors ml-4"
                    aria-label="Supprimer l'actif"
                    title="Supprimer l'actif"
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Ajouter un actif</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enregistrez un actif pour le calcul de l'amortissement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Fermer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Description <span className="text-destructive">*</span>
                </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: Ordinateur portable"
                    aria-label="Description de l'actif"
                  />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Date d'achat <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Date d'achat"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Date de mise en service <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.useStartDate}
                    onChange={(e) => setFormData({ ...formData, useStartDate: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Date de mise en service"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Coût <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Classe CCA <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={formData.ccaClass}
                    onChange={(e) => setFormData({ ...formData, ccaClass: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-border/80 rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Classe CCA"
                  >
                    <option value="">Sélectionner une classe</option>
                    {ccaClasses.map((cls) => (
                      <option key={cls.class} value={cls.class}>
                        Classe {cls.class} - {cls.description} ({(cls.rate * 100).toFixed(0)}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

