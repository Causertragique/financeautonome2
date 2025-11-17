import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import {
  getTransactions,
  type Transaction,
  getVehicleExpenses,
  addVehicleExpense,
  deleteVehicleExpense,
  type VehicleExpense,
  getVehicleAnnualProfile,
  upsertVehicleAnnualProfile,
  deleteVehicleAnnualProfile,
  getHomeOfficeExpenses,
  addHomeOfficeExpense,
  deleteHomeOfficeExpense,
  type HomeOfficeExpense,
  getTechExpenses,
  addTechExpense,
  deleteTechExpense,
  type TechExpense,
  type VehicleAnnualProfile,
} from "../lib/db";
import { VehicleExpenseForm } from "../components/VehicleExpenseForm";
import { VehicleAnnualForm } from "../components/VehicleAnnualForm";
import { HomeOfficeForm } from "../components/HomeOfficeForm";
import { TechExpensesForm } from "../components/TechExpensesForm";
import { shouldRegisterForTaxes } from "../lib/taxRules";
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Car,
  Plus,
  Trash2,
} from "lucide-react";

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

type ActiveTab = "taxes" | "summary" | "vehicle" | "homeoffice" | "tech";

export default function TaxFiling() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { selectedYear } = useFiscalYearContext();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("taxes");

  const [vehicleExpenses, setVehicleExpenses] = useState<VehicleExpense[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [annualProfile, setAnnualProfile] = useState<VehicleAnnualProfile | null>(
    null
  );

  const [homeOfficeExpenses, setHomeOfficeExpenses] = useState<
    HomeOfficeExpense[]
  >([]);
  const [showHomeOfficeForm, setShowHomeOfficeForm] = useState(false);

  const [techExpenses, setTechExpenses] = useState<TechExpense[]>([]);
  const [showTechForm, setShowTechForm] = useState(false);

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

    const loadVehicleExpenses = async () => {
      try {
        const data = await getVehicleExpenses(selectedYear);
        setVehicleExpenses(data);
      } catch (error) {
        console.error("Erreur lors du chargement des dépenses véhicule:", error);
      }
    };

    const loadVehicleAnnual = async () => {
      try {
        const profile = await getVehicleAnnualProfile(selectedYear);
        setAnnualProfile(profile);
      } catch (error) {
        console.error("Erreur lors du chargement du profil annuel véhicule:", error);
      }
    };

    const loadHomeOffice = async () => {
      try {
        const data = await getHomeOfficeExpenses(selectedYear);
        setHomeOfficeExpenses(data);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des dépenses bureau à domicile:",
          error
        );
      }
    };

    const loadTech = async () => {
      try {
        const data = await getTechExpenses(selectedYear);
        setTechExpenses(data);
      } catch (error) {
        console.error("Erreur lors du chargement des dépenses techno:", error);
      }
    };

    const initialLoad = async () => {
      setLoading(true);
      await Promise.all([
        loadTransactions(),
        loadVehicleExpenses(),
        loadVehicleAnnual(),
        loadHomeOffice(),
        loadTech(),
      ]);
      setLoading(false);
    };

    initialLoad();

    const handleTransactionsUpdated = () => {
      void loadTransactions();
    };
    const handleVehicleExpensesUpdated = () => {
      void loadVehicleExpenses();
      void loadTransactions();
    };
    const handleVehicleAnnualUpdated = () => {
      void loadVehicleAnnual();
    };
    const handleHomeOfficeUpdated = () => {
      void loadHomeOffice();
    };
    const handleTechUpdated = () => {
      void loadTech();
    };

    window.addEventListener("transactionsUpdated", handleTransactionsUpdated);
    window.addEventListener("vehicleExpensesUpdated", handleVehicleExpensesUpdated);
    window.addEventListener("vehicleAnnualProfileUpdated", handleVehicleAnnualUpdated);
    window.addEventListener("homeOfficeExpensesUpdated", handleHomeOfficeUpdated);
    window.addEventListener("techExpensesUpdated", handleTechUpdated);

    return () => {
      window.removeEventListener("transactionsUpdated", handleTransactionsUpdated);
      window.removeEventListener(
        "vehicleExpensesUpdated",
        handleVehicleExpensesUpdated
      );
      window.removeEventListener(
        "vehicleAnnualProfileUpdated",
        handleVehicleAnnualUpdated
      );
      window.removeEventListener(
        "homeOfficeExpensesUpdated",
        handleHomeOfficeUpdated
      );
      window.removeEventListener("techExpensesUpdated", handleTechUpdated);
    };
  }, [selectedYear, currentUser]);

  // Calcul GST/QST sur l'année
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

    // ITC provenant des dépenses véhicule structurées
    const vehicleGstItc = vehicleExpenses.reduce(
      (sum, ve) => sum + (ve.gstItc || 0),
      0
    );
    const vehicleQstItc = vehicleExpenses.reduce(
      (sum, ve) => sum + (ve.qstItc || 0),
      0
    );

    gstItc += vehicleGstItc;
    qstItc += vehicleQstItc;

    return {
      gstCollected,
      qstCollected,
      gstPaid: gstItc,
      qstPaid: qstItc,
      gstNet: gstCollected - gstItc,
      qstNet: qstCollected - qstItc,
    };
  };

  const taxReturn = calculateGSTQSTReturn();

  const totalRevenue = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Dépenses déductibles basées sur transactions
  const calculateDeductibleExpenses = () => {
    const periodStart = new Date(selectedYear, 0, 1);
    const periodEnd = new Date(selectedYear, 11, 31);

    const deductibleExpenses = transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transaction.type === "expense" &&
          transactionDate >= periodStart &&
          transactionDate <= periodEnd
        );
      })
      .map((transaction) => {
        const deductibleAmount = transaction.deductibleRatio
          ? transaction.amount * transaction.deductibleRatio
          : transaction.amount;

        return {
          ...transaction,
          deductibleAmount,
          nonDeductibleAmount: transaction.amount - deductibleAmount,
        };
      });

    const totalDeductible = deductibleExpenses.reduce(
      (sum, exp) => sum + exp.deductibleAmount,
      0
    );
    const totalNonDeductible = deductibleExpenses.reduce(
      (sum, exp) => sum + exp.nonDeductibleAmount,
      0
    );
    const totalExpenses = deductibleExpenses.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    return {
      expenses: deductibleExpenses,
      totalDeductible,
      totalNonDeductible,
      totalExpenses,
    };
  };

  const deductibleData = calculateDeductibleExpenses();

  // Totaux modules structurés
  const vehicleDeductibleTotal = vehicleExpenses.reduce(
    (sum, ve) => sum + (ve.deductibleTotal || 0),
    0
  );

  const homeOfficeDeductibleTotal = homeOfficeExpenses.reduce(
    (sum, e) => sum + (e.deductibleTotal || 0),
    0
  );

  const techDeductibleTotal = techExpenses.reduce(
    (sum, e) => sum + (e.deductibleTotal || 0),
    0
  );

  const techCapitalizableTotal = techExpenses.reduce(
    (sum, e) => sum + (e.capitalizableHardware || 0),
    0
  );

  const totalStructuredDeductible =
    vehicleDeductibleTotal + homeOfficeDeductibleTotal + techDeductibleTotal;

  // Handlers formulaires
  const handleVehicleExpenseSubmit = async (values: any) => {
    try {
      await addVehicleExpense({
        vehicleName: values.vehicleName,
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        totalKm: values.totalKm,
        businessKm: values.businessKm,
        businessRatio: values.businessRatio,
        fuel: values.fuel,
        maintenance: values.maintenance,
        insurance: values.insurance,
        registration: values.registration,
        parkingAndTolls: values.parkingAndTolls,
        leaseOrLoan: values.leaseOrLoan,
        other: values.other,
        businessFuel: values.businessFuel || 0,
        businessMaintenance: values.businessMaintenance || 0,
        businessParkingAndTolls: values.businessParkingAndTolls || 0,
        businessOther: values.businessOther || 0,
        deductibleTotal: values.deductibleTotal,
        gstOnExpenses: values.gstOnExpenses || 0,
        qstOnExpenses: values.qstOnExpenses || 0,
        gstOnBusinessExpenses: values.gstOnBusinessExpenses || 0,
        qstOnBusinessExpenses: values.qstOnBusinessExpenses || 0,
      });
      setShowVehicleForm(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement dépense véhicule:", error);
    }
  };

  const handleDeleteVehicleExpense = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette dépense véhicule ?")) {
      await deleteVehicleExpense(id);
    }
  };

  const handleHomeOfficeSubmit = async (values: any) => {
    try {
      await addHomeOfficeExpense({
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        totalArea: values.totalArea,
        officeArea: values.officeArea,
        businessAreaRatio: values.businessAreaRatio,
        rent: values.rent,
        electricityHeating: values.electricityHeating,
        condoFees: values.condoFees,
        propertyTaxes: values.propertyTaxes,
        homeInsurance: values.homeInsurance,
        other: values.other,
      });
      setShowHomeOfficeForm(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement bureau à domicile:", error);
    }
  };

  const handleDeleteHomeOffice = async (id: string) => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer cette entrée de bureau à domicile ?"
      )
    ) {
      await deleteHomeOfficeExpense(id);
    }
  };

  const handleTechSubmit = async (values: any) => {
    try {
      await addTechExpense({
        periodStart: values.periodStart,
        periodEnd: values.periodEnd,
        hardwareSmallEquipment: values.hardwareSmallEquipment,
        hardwareCapitalAssets: values.hardwareCapitalAssets,
        softwareLicenses: values.softwareLicenses,
        saasSubscriptions: values.saasSubscriptions,
        internetTotal: values.internetTotal,
        internetBusinessRatio: values.internetBusinessRatio,
        phoneTotal: values.phoneTotal,
        phoneBusinessRatio: values.phoneBusinessRatio,
        otherTech: values.otherTech,
      });
      setShowTechForm(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement dépenses techno:", error);
    }
  };

  const handleDeleteTech = async (id: string) => {
    if (confirm("Supprimer cette dépense techno ?")) {
      await deleteTechExpense(id);
    }
  };

  // Vérifier si l'enregistrement GST/QST est requis
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
            Gestion des taxes et des dépenses admissibles – année {selectedYear}
          </p>
        </div>
      </div>

      {/* Onglets principaux */}
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
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "summary"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Résumé dépenses
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
                <div className="border-top border-border pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Solde net à remettre:</span>
                  <span
                    className={`font-bold ${
                      taxReturn.gstNet >= 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {taxReturn.gstNet >= 0 ? "+" : ""}
                    {taxReturn.gstNet.toFixed(2)} $
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Inclut les ITC basés sur les transactions et sur les dépenses
                  véhicule détaillées.
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
                <div className="border-top border-border pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Solde net à remettre:</span>
                  <span
                    className={`font-bold ${
                      taxReturn.qstNet >= 0
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {taxReturn.qstNet >= 0 ? "+" : ""}
                    {taxReturn.qstNet.toFixed(2)} $
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Inclut les ITC basés sur les transactions et sur les dépenses
                  véhicule détaillées.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* === Onglet RÉSUMÉ DÉPENSES === */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">
                Revenus & dépenses (transactions)
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenus:</span>
                  <span className="font-medium">
                    {totalRevenue.toFixed(2)} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Dépenses brutes:
                  </span>
                  <span className="font-medium">
                    {deductibleData.totalExpenses.toFixed(2)} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Non admissibles:
                  </span>
                  <span className="font-medium text-red-600">
                    {deductibleData.totalNonDeductible.toFixed(2)} $
                  </span>
                </div>
                <div className="border-t border-border mt-2 pt-2 flex justify-between">
                  <span className="font-semibold">
                    Admissibles (transactions):
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {deductibleData.totalDeductible.toFixed(2)} $
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">
                Modules structurés (auto / bureau / techno)
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Véhicule:</span>
                  <span className="font-medium">
                    {vehicleDeductibleTotal.toFixed(2)} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Bureau à domicile:
                  </span>
                  <span className="font-medium">
                    {homeOfficeDeductibleTotal.toFixed(2)} $
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Technologie:</span>
                  <span className="font-medium">
                    {techDeductibleTotal.toFixed(2)} $
                  </span>
                </div>
                <div className="border-t border-border mt-2 pt-2 flex justify-between">
                  <span className="font-semibold">
                    Total admissible (modules):
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {totalStructuredDeductible.toFixed(2)} $
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-2">
                Immobilisations (CCA)
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Matériel capitalisable (tech):
                  </span>
                  <span className="font-medium">
                    {techCapitalizableTotal.toFixed(2)} $
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ces montants servent à calculer la déduction pour amortissement
                  (CCA) dans tes déclarations fiscales.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === Onglet VÉHICULE === */}
      {activeTab === "vehicle" && (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Car className="w-4 h-4" />
                Véhicule – profil annuel
              </h2>
            </div>

            <VehicleAnnualForm
              year={selectedYear}
              initialProfile={annualProfile}
              onSave={async (data) => {
                await upsertVehicleAnnualProfile(selectedYear, data);
              }}
              onDelete={
                annualProfile
                  ? async () => {
                      await deleteVehicleAnnualProfile(selectedYear);
                    }
                  : undefined
              }
            />
          </section>

          <section className="space-y-4">
            <div className="border border-dashed border-border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  Journal des déplacements & dépenses réelles
                </h3>
                <button
                  onClick={() => setShowVehicleForm((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-accent"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter une période
                </button>
              </div>

              {showVehicleForm && (
                <VehicleExpenseForm onSubmit={handleVehicleExpenseSubmit} />
              )}

              {vehicleExpenses.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucune dépense véhicule enregistrée pour {selectedYear}.
                  Utilise le bouton « Ajouter une période » pour commencer à
                  journaliser tes km Lyft et dépenses liées au travail.
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  {vehicleExpenses.map((ve) => (
                    <div
                      key={ve.id}
                      className="flex items-start justify-between gap-3 border border-border rounded-md px-3 py-2 bg-background"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {ve.vehicleName || "Véhicule"}
                          </span>
                          <span className="text-muted-foreground">
                            ({ve.periodStart} → {ve.periodEnd})
                          </span>
                        </div>
                        <div className="mt-1 space-y-0.5">
                          <p className="text-muted-foreground">
                            Km affaires :{" "}
                            <span className="font-medium">
                              {ve.businessKm} km
                            </span>{" "}
                            / ratio :{" "}
                            <span className="font-medium">
                              {(ve.businessRatio * 100).toFixed(1)}%
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Dépenses admissibles :{" "}
                            <span className="font-semibold text-emerald-700">
                              {ve.deductibleTotal.toFixed(2)} $
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            ITC estimés : GST{" "}
                            <span className="font-medium">
                              {ve.gstItc.toFixed(2)} $
                            </span>
                            , QST{" "}
                            <span className="font-medium">
                              {ve.qstItc.toFixed(2)} $
                            </span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteVehicleExpense(ve.id)}
                        className="text-destructive hover:text-destructive/80"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* === Onglet BUREAU À DOMICILE === */}
      {activeTab === "homeoffice" && (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Bureau à domicile – périodes et calcul du ratio
              </h2>
              <button
                onClick={() => setShowHomeOfficeForm((v) => !v)}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-accent"
              >
                <Plus className="w-3 h-3" />
                Ajouter une période
              </button>
            </div>

            {showHomeOfficeForm && (
              <HomeOfficeForm onSubmit={handleHomeOfficeSubmit} />
            )}

            {homeOfficeExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucune dépense de bureau à domicile enregistrée pour {selectedYear}.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {homeOfficeExpenses.map((ho) => (
                  <div
                    key={ho.id}
                    className="flex items-start justify-between gap-3 border border-border rounded-md px-3 py-2 bg-background"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Période {ho.periodStart} → {ho.periodEnd}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-muted-foreground">
                          Ratio affaires (superficie) :{" "}
                          <span className="font-medium">
                            {(ho.businessAreaRatio * 100).toFixed(1)}%
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Dépenses totales :{" "}
                          <span className="font-medium">
                            {ho.totalExpenses.toFixed(2)} $
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Dépenses admissibles :{" "}
                          <span className="font-semibold text-emerald-700">
                            {ho.deductibleTotal.toFixed(2)} $
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteHomeOffice(ho.id)}
                      className="text-destructive hover:text-destructive/80"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* === Onglet TECHNO === */}
      {activeTab === "tech" && (
        <div className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Dépenses technologiques – matériel & SaaS
              </h2>
              <button
                onClick={() => setShowTechForm((v) => !v)}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-accent"
              >
                <Plus className="w-3 h-3" />
                Ajouter une période
              </button>
            </div>

            {showTechForm && <TechExpensesForm onSubmit={handleTechSubmit} />}

            {techExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Aucune dépense techno enregistrée pour {selectedYear}.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {techExpenses.map((te) => (
                  <div
                    key={te.id}
                    className="flex items-start justify-between gap-3 border border-border rounded-md px-3 py-2 bg-background"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          Période {te.periodStart} → {te.periodEnd}
                        </span>
                      </div>
                      <div className="mt-1 space-y-0.5">
                        <p className="text-muted-foreground">
                          Dépenses admissibles :{" "}
                          <span className="font-semibold text-emerald-700">
                            {te.deductibleTotal.toFixed(2)} $
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Matériel capitalisable (CCA) :{" "}
                          <span className="font-medium">
                            {te.capitalizableHardware.toFixed(2)} $
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          Internet affaires :{" "}
                          <span className="font-medium">
                            {(te.internetBusinessRatio * 100).toFixed(0)}%
                          </span>{" "}
                          – Téléphone :{" "}
                          <span className="font-medium">
                            {(te.phoneBusinessRatio * 100).toFixed(0)}%
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTech(te.id)}
                      className="text-destructive hover:text-destructive/80"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </MainLayout>
  );
}
