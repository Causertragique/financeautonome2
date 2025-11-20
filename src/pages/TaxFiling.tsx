import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import {
  getTransactions,
  type Transaction,
  getVehicleAnnualProfiles,
  type VehicleAnnualProfile,
  getVehicleJournals,
  type VehicleJournalEntry,
  upsertVehicleAnnualProfile,
  deleteVehicleAnnualProfile,
  addVehicleJournalEntry,
  updateVehicleJournalEntry,
  deleteVehicleJournalEntry,
} from "../lib/db";
import { VehicleAnnualForm } from "../components/VehicleAnnualForm";
import { VehicleExpenseForm } from "../components/VehicleExpenseForm";
import { shouldRegisterForTaxes } from "../lib/taxRules";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Car,
  Plus,
  Trash2,
  Home,
  Cpu,
} from "lucide-react";

type ActiveTab = "taxes" | "vehicle" | "homeoffice" | "tech";

interface TaxReturn {
  period: string;
  gstCollected: number;
  qstCollected: number;
  gstPaid: number;
  qstPaid: number;
  gstNet: number;
  qstNet: number;
  status: "draft" | "filed";
  filedDate?: string;
}

export default function TaxFiling() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { selectedYear } = useFiscalYearContext();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("taxes");

  const [vehicleProfiles, setVehicleProfiles] = useState<VehicleAnnualProfile[]>([]);
  const [vehicleJournals, setVehicleJournals] = useState<VehicleJournalEntry[]>([]);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState<VehicleJournalEntry | null>(
    null
  );

  // Chargement des données
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const loadTransactions = async () => {
      try {
        const data = await getTransactions(selectedYear);
        setTransactions(data);
      } catch (error) {
        console.error("Erreur lors du chargement des transactions:", error);
      }
    };

    const loadVehicleProfiles = async () => {
      try {
        const profiles = await getVehicleAnnualProfiles(selectedYear);
        setVehicleProfiles(profiles);
        if (!selectedProfileId && profiles.length > 0) {
          setSelectedProfileId(profiles[0].id);
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des profils annuels véhicule:",
          error
        );
      }
    };

    const loadVehicleJournals = async () => {
      try {
        const journals = await getVehicleJournals(selectedYear);
        setVehicleJournals(journals);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des journaux de déplacements:",
          error
        );
      }
    };

    const initialLoad = async () => {
      setLoading(true);
      await Promise.all([
        loadTransactions(),
        loadVehicleProfiles(),
        loadVehicleJournals(),
      ]);
      setLoading(false);
    };

    initialLoad();

    const handleTransactionsUpdated = () => {
      void loadTransactions();
    };
    const handleVehicleProfilesUpdated = () => {
      void loadVehicleProfiles();
    };
    const handleVehicleJournalsUpdated = () => {
      void loadVehicleJournals();
      void loadVehicleProfiles(); // pour mettre à jour les agrégats dans les profils
    };

    window.addEventListener("transactionsUpdated", handleTransactionsUpdated);
    window.addEventListener(
      "vehicleAnnualProfileUpdated",
      handleVehicleProfilesUpdated
    );
    window.addEventListener(
      "vehicleJournalsUpdated",
      handleVehicleJournalsUpdated
    );

    return () => {
      window.removeEventListener("transactionsUpdated", handleTransactionsUpdated);
      window.removeEventListener(
        "vehicleAnnualProfileUpdated",
        handleVehicleProfilesUpdated
      );
      window.removeEventListener(
        "vehicleJournalsUpdated",
        handleVehicleJournalsUpdated
      );
    };
  }, [selectedYear, currentUser, selectedProfileId]);

  // Calcul GST/QST sur l'année (basé sur transactions)
  const calculateGSTQSTReturn = () => {
    const periodStart = new Date(selectedYear, 0, 1);
    const periodEnd = new Date(selectedYear, 11, 31);

    let gstCollected = 0;
    let qstCollected = 0;
    let gstItc = 0;
    let qstItc = 0;

    transactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate >= periodStart && transactionDate <= periodEnd) {
        if (transaction.type === "income" && transaction.isTaxable) {
          if (transaction.gst !== undefined && transaction.gst !== null) {
            gstCollected += transaction.gst;
          }
          if (transaction.qst !== undefined && transaction.qst !== null) {
            qstCollected += transaction.qst;
          }
        }

        if (
          transaction.gstItc !== undefined &&
          transaction.gstItc !== null &&
          !isNaN(transaction.gstItc)
        ) {
          gstItc += Number(transaction.gstItc);
        }
        if (
          transaction.qstItc !== undefined &&
          transaction.qstItc !== null &&
          !isNaN(transaction.qstItc)
        ) {
          qstItc += Number(transaction.qstItc);
        }
      }
    });

    return {
      gstCollected,
      qstCollected,
      gstPaid: gstItc,
      qstPaid: qstItc,
      gstNet: gstCollected - gstItc,
      qstNet: qstCollected - qstItc,
    };
  };

  const taxReturn: TaxReturn = {
    period: `${selectedYear}-01-01/${selectedYear}-12-31`,
    ...calculateGSTQSTReturn(),
    status: "draft",
  };

  const totalRevenue = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Enregistrement requis ?
  const [registrationRequired, setRegistrationRequired] = useState<{
    gstRequired: boolean;
    qstRequired: boolean;
  } | null>(null);

  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const required = await shouldRegisterForTaxes(totalRevenue);
        setRegistrationRequired(required);
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de l'enregistrement:",
          error
        );
      }
    };
    checkRegistration();
  }, [totalRevenue]);

  // Totaux véhicule (pour info)
  const totalVehicleDeductible = vehicleProfiles.reduce(
    (sum, vp) => sum + (vp.deductibleTotal || 0),
    0
  );

  const selectedProfile: VehicleAnnualProfile | null =
    selectedProfileId && vehicleProfiles.length > 0
      ? vehicleProfiles.find((p) => p.id === selectedProfileId) || null
      : vehicleProfiles[0] || null;

  // Résumés maison / techno basés sur les transactions
  const homeOfficeExpenses = transactions.filter((t) => {
    if (t.type !== "expense") return false;
    const cat = (t.category || "").toLowerCase();
    const tags = (t.tags || []).map((x) => x.toLowerCase());
    return (
      cat.includes("home") ||
      cat.includes("bureau") ||
      tags.includes("home") ||
      tags.includes("homeoffice") ||
      tags.includes("bureau")
    );
  });
  const homeOfficeTotal = homeOfficeExpenses.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  const techExpenses = transactions.filter((t) => {
    if (t.type !== "expense") return false;
    const cat = (t.category || "").toLowerCase();
    const tags = (t.tags || []).map((x) => x.toLowerCase());
    return (
      cat.includes("tech") ||
      cat.includes("informatique") ||
      cat.includes("saas") ||
      cat.includes("software") ||
      cat.includes("hardware") ||
      tags.includes("tech") ||
      tags.includes("saas") ||
      tags.includes("logiciel")
    );
  });
  const techTotal = techExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Handlers profil annuel
  const handleSaveVehicleProfile = async (data: {
    id?: string;
    vehicleName: string;
    totalKm: number;
    insuranceAnnual: number;
    leaseFinanceAnnual: number;
    maintenanceAnnual: number;
    fuelAnnual: number;
    registrationAnnual: number;
    otherAnnual: number;
  }) => {
    try {
      const id = await upsertVehicleAnnualProfile(selectedYear, data);
      if (id) {
        console.log("✅ Profil véhicule enregistré avec succès, ID:", id);
        if (!selectedProfileId) {
          setSelectedProfileId(id);
        }
        // Recharger les profils pour mettre à jour l'affichage
        const profiles = await getVehicleAnnualProfiles(selectedYear);
        setVehicleProfiles(profiles);
      } else {
        console.error("❌ Échec de l'enregistrement du profil véhicule");
        alert("Erreur lors de l'enregistrement du profil. Vérifiez la console pour plus de détails.");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'enregistrement du profil véhicule:", error);
      alert("Erreur lors de l'enregistrement du profil. Vérifiez la console pour plus de détails.");
    }
  };

  const handleDeleteVehicleProfile = async () => {
    if (!selectedProfile) return;
    if (
      !confirm(
        `Supprimer le profil annuel pour ${selectedProfile.vehicleName} ?`
      )
    ) {
      return;
    }
    await deleteVehicleAnnualProfile(selectedProfile.id);
    setSelectedProfileId(null);
  };

  // Handlers journal
  const handleJournalSubmit = async (payload: {
    id?: string;
    year: number;
    vehicleProfileId: string;
    vehicleName: string;
    periodStart: string;
    periodEnd: string;
    businessKm: number;
    parking: number;
    other: number;
    periodTotal: number;
  }) => {
    if (payload.id) {
      await updateVehicleJournalEntry(payload.id, {
        year: payload.year,
        vehicleProfileId: payload.vehicleProfileId,
        vehicleName: payload.vehicleName,
        periodStart: payload.periodStart,
        periodEnd: payload.periodEnd,
        businessKm: payload.businessKm,
        parking: payload.parking,
        other: payload.other,
        periodTotal: payload.periodTotal,
      });
    } else {
      await addVehicleJournalEntry({
        year: payload.year,
        vehicleProfileId: payload.vehicleProfileId,
        vehicleName: payload.vehicleName,
        periodStart: payload.periodStart,
        periodEnd: payload.periodEnd,
        businessKm: payload.businessKm,
        parking: payload.parking,
        other: payload.other,
        periodTotal: payload.periodTotal,
      });
    }

    setShowJournalForm(false);
    setEditingJournal(null);
  };

  const handleDeleteJournal = async (entry: VehicleJournalEntry) => {
    if (
      !confirm(
        `Supprimer le journal du ${entry.periodStart} au ${entry.periodEnd} pour ${entry.vehicleName} ?`
      )
    ) {
      return;
    }
    await deleteVehicleJournalEntry(entry.id);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="py-10 text-sm text-muted-foreground">
          Chargement des données fiscales…
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Déclarations fiscales
          </h1>
          <p className="text-sm text-muted-foreground">
            Année {selectedYear} – Taxes et dépenses admissibles
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("taxes")}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "taxes"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Taxes (GST/QST)
        </button>
        <button
          onClick={() => setActiveTab("vehicle")}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "vehicle"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Véhicule
        </button>
        <button
          onClick={() => setActiveTab("homeoffice")}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "homeoffice"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Bureau à domicile
        </button>
        <button
          onClick={() => setActiveTab("tech")}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "tech"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Technologie
        </button>
      </div>

      {/* === Onglet TAXES === */}
      {activeTab === "taxes" && (
        <>
          {/* Alerte d'enregistrement */}
          {registrationRequired && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                registrationRequired.gstRequired ||
                registrationRequired.qstRequired
                  ? "bg-amber-50 border-amber-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {registrationRequired.gstRequired ||
                registrationRequired.qstRequired ? (
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                )}
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {registrationRequired.gstRequired ||
                    registrationRequired.qstRequired
                      ? "Enregistrement requis"
                      : "Enregistrement non requis"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {registrationRequired.gstRequired ||
                    registrationRequired.qstRequired
                      ? `Vos revenus taxables dépassent 30 000 $ sur 12 mois. Vous devez vous enregistrer pour la GST${
                          registrationRequired.gstRequired ? " et la QST" : ""
                        }.`
                      : "Vos revenus sont en dessous du seuil d'enregistrement (30 000 $ sur 12 mois)."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Résumé GST/QST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                GST - Année {selectedYear}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST collectée:</span>
                  <span className="font-medium">
                    {taxReturn.gstCollected.toFixed(2)} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST payée (ITC):</span>
                  <span className="font-medium text-green-600">
                    -{taxReturn.gstPaid.toFixed(2)} $
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Solde net à remettre:</span>
                  <span
                    className={`font-bold ${
                      taxReturn.gstNet >= 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {taxReturn.gstNet >= 0 ? "+" : ""}
                    {taxReturn.gstNet.toFixed(2)} $
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Basé sur les transactions déclarées comme imposables avec GST et les ITC
                  saisis sur les dépenses.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                QST - Année {selectedYear}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">QST collectée:</span>
                  <span className="font-medium">
                    {taxReturn.qstCollected.toFixed(2)} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">QST payée (ITC):</span>
                  <span className="font-medium text-green-600">
                    -{taxReturn.qstPaid.toFixed(2)} $
                  </span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Solde net à remettre:</span>
                  <span
                    className={`font-bold ${
                      taxReturn.qstNet >= 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {taxReturn.qstNet >= 0 ? "+" : ""}
                    {taxReturn.qstNet.toFixed(2)} $
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Basé sur les transactions déclarées comme imposables avec QST et les ITC
                  saisis sur les dépenses.
                </p>
              </div>
            </div>
          </div>

          {/* Info véhicule pour l'impôt revenu */}
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Car className="w-4 h-4" />
              Dépenses admissibles liées au véhicule (impôt sur le revenu)
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Total des dépenses admissibles calculées à partir du profil annuel véhicule
              et du journal des déplacements pour {selectedYear}.
            </p>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">
                Total déductible véhicule (tous véhicules):
              </span>
              <span className="font-semibold text-emerald-700">
                {totalVehicleDeductible.toFixed(2)} $
              </span>
            </div>
          </div>
        </>
      )}

      {/* === Onglet VÉHICULE === */}
      {activeTab === "vehicle" && (
        <div className="space-y-6">
          {/* Profil annuel */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Car className="w-4 h-4" />
                Profil annuel du véhicule
              </h2>
              {vehicleProfiles.length > 1 && (
                <select
                  className="text-xs rounded-md border border-input bg-background px-2 py-1.5"
                  value={selectedProfile?.id || ""}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  aria-label="Sélectionner un profil de véhicule"
                >
                  {vehicleProfiles.map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.vehicleName} ({vp.year})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <VehicleAnnualForm
              year={selectedYear}
              initialProfile={selectedProfile}
              onSave={handleSaveVehicleProfile}
              onDelete={
                selectedProfile ? () => handleDeleteVehicleProfile() : undefined
              }
            />

            {selectedProfile && (
              <div className="mt-3 grid gap-3 md:grid-cols-3 text-xs bg-muted/50 border border-border rounded-lg p-3">
                <div>
                  <p className="font-semibold mb-1">Kilométrage</p>
                  <p className="text-muted-foreground">
                    Km totaux :{" "}
                    <span className="font-medium">
                      {selectedProfile.totalKm.toFixed(0)} km
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Km d&apos;affaires :{" "}
                    <span className="font-medium">
                      {selectedProfile.businessKm.toFixed(0)} km
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Ratio affaires :{" "}
                    <span className="font-medium">
                      {(selectedProfile.businessRatio * 100).toFixed(1)} %
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Coûts</p>
                  <p className="text-muted-foreground">
                    Coûts annuels fixes :{" "}
                    <span className="font-medium">
                      {selectedProfile.annualFixedCosts.toFixed(2)} $
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Parking + autres (journal) :{" "}
                    <span className="font-medium">
                      {selectedProfile.variableParkingAndOther.toFixed(2)} $
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-semibold mb-1">Résultat fiscal</p>
                  <p className="text-muted-foreground">
                    Dépenses admissibles totales :
                  </p>
                  <p className="font-semibold text-emerald-700 text-base">
                    {selectedProfile.deductibleTotal.toFixed(2)} $
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Journal de déplacements */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Journal des déplacements et petites dépenses
              </h2>
              <button
                onClick={() => {
                  setEditingJournal(null);
                  setShowJournalForm(true);
                }}
                disabled={vehicleProfiles.length === 0}
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-accent disabled:opacity-50"
              >
                <Plus className="w-3 h-3" />
                Ajouter une entrée
              </button>
            </div>

            {vehicleProfiles.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Commence par créer un profil annuel de véhicule ci-dessus avant
                d&apos;ajouter des entrées au journal.
              </p>
            )}

            {showJournalForm && (
              <VehicleExpenseForm
                year={selectedYear}
                vehicleProfiles={vehicleProfiles}
                initialEntry={editingJournal || undefined}
                onSubmit={handleJournalSubmit}
                onCancel={() => {
                  setShowJournalForm(false);
                  setEditingJournal(null);
                }}
              />
            )}

            {vehicleJournals.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucun journal de déplacements enregistré pour {selectedYear}. Utilise
                le bouton &laquo; Ajouter une entrée &raquo; pour enregistrer tes km
                Lyft, stationnements et autres petites dépenses liées au travail.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {vehicleJournals.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-3 border border-border rounded-md px-3 py-2 bg-background"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{entry.vehicleName}</span>
                        <span className="text-muted-foreground">
                          ({entry.periodStart} → {entry.periodEnd})
                        </span>
                      </div>
                      <p className="text-muted-foreground">
                        Km d&apos;affaires :{" "}
                        <span className="font-medium">
                          {entry.businessKm.toFixed(0)} km
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Stationnement :{" "}
                        <span className="font-medium">
                          {entry.parking.toFixed(2)} $
                        </span>{" "}
                        – Autres :{" "}
                        <span className="font-medium">
                          {entry.other.toFixed(2)} $
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        Dépenses de la période (parking + autres) :{" "}
                        <span className="font-semibold">
                          {(
                            (entry as any).periodTotal ??
                            (entry.parking || 0) + (entry.other || 0)
                          ).toFixed(2)}{" "}
                          $
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <button
                        className="text-[11px] px-2 py-0.5 rounded-md border border-border hover:bg-muted"
                        onClick={() => {
                          setEditingJournal(entry);
                          setShowJournalForm(true);
                        }}
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDeleteJournal(entry)}
                        className="text-destructive hover:text-destructive/80"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* === Onglet BUREAU À DOMICILE === */}
      {activeTab === "homeoffice" && (
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Home className="w-4 h-4" />
              Bureau à domicile – {selectedYear}
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Résumé des dépenses liées au bureau à domicile basées sur les transactions
              catégorisées comme &laquo; bureau &raquo; / &laquo; home office &raquo;.
            </p>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">
                Total des dépenses identifiées (bureau à domicile):
              </span>
              <span className="font-semibold text-emerald-700">
                {homeOfficeTotal.toFixed(2)} $
              </span>
            </div>
          </div>

          {homeOfficeExpenses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucune dépense identifiée comme bureau à domicile pour {selectedYear}. Tu peux
              utiliser des catégories ou des tags (ex. &laquo; bureau &raquo;,
              &laquo; homeoffice &raquo;) dans tes transactions pour les faire apparaître ici.
            </p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-muted font-semibold">
                <span>Date</span>
                <span>Description</span>
                <span>Catégorie / Tags</span>
                <span className="text-right">Montant</span>
              </div>
              {homeOfficeExpenses.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-4 gap-2 px-3 py-2 border-t border-border/60"
                >
                  <span className="truncate">{tx.date}</span>
                  <span className="truncate">{tx.description || "-"}</span>
                  <span className="truncate text-muted-foreground">
                    {tx.category || ""}
                    {tx.tags && tx.tags.length > 0
                      ? ` • ${tx.tags.join(", ")}`
                      : ""}
                  </span>
                  <span className="text-right font-medium">
                    {tx.amount.toFixed(2)} $
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === Onglet TECHNOLOGIE === */}
      {activeTab === "tech" && (
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4" />
              Technologie – {selectedYear}
            </h2>
            <p className="text-sm text-muted-foreground mb-2">
              Résumé des dépenses technologiques (logiciels, abonnements, matériel,
              services cloud) identifiées dans tes transactions.
            </p>
            <div className="flex justify-between text-sm mt-2">
              <span className="text-muted-foreground">
                Total des dépenses technologiques:
              </span>
              <span className="font-semibold text-emerald-700">
                {techTotal.toFixed(2)} $
              </span>
            </div>
          </div>

          {techExpenses.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Aucune dépense catégorisée comme technologique pour {selectedYear}. Utilise des
              catégories ou tags (ex. &laquo; tech &raquo;, &laquo; logiciel &raquo;,
              &laquo; saas &raquo;) dans tes transactions pour les faire apparaître ici.
            </p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-muted font-semibold">
                <span>Date</span>
                <span>Description</span>
                <span>Catégorie / Tags</span>
                <span className="text-right">Montant</span>
              </div>
              {techExpenses.map((tx) => (
                <div
                  key={tx.id}
                  className="grid grid-cols-4 gap-2 px-3 py-2 border-t border-border/60"
                >
                  <span className="truncate">{tx.date}</span>
                  <span className="truncate">{tx.description || "-"}</span>
                  <span className="truncate text-muted-foreground">
                    {tx.category || ""}
                    {tx.tags && tx.tags.length > 0
                      ? ` • ${tx.tags.join(", ")}`
                      : ""}
                  </span>
                  <span className="text-right font-medium">
                    {tx.amount.toFixed(2)} $
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}
