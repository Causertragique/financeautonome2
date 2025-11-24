import MainLayout from "../layouts/MainLayout";
import { Plus, Download, Calendar } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import React, { useState } from "react";

export default function Reports() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState("Année en cours");
  const [reportFormat, setReportFormat] = useState("PDF");
  
  // Données mock uniquement pour la démo quand l'utilisateur n'est pas connecté
  const mockReports = [
    {
      id: 1,
      name: "Year-End Financial Summary 2023",
      type: t("reports.typeAnnual"),
      company: "Tech Solutions Inc",
      generated: "2024-01-15",
    },
    {
      id: 2,
      name: "Q4 2023 Quarterly Report",
      type: t("reports.typeQuarterly"),
      company: "Creative Agency",
      generated: "2024-01-10",
    },
    {
      id: 3,
      name: "Monthly P&L - December 2023",
      type: t("reports.typeMonthly"),
      company: "Tech Solutions Inc",
      generated: "2024-01-05",
    },
  ];
  
  // Les données mock sont uniquement pour la démo quand l'utilisateur n'est pas connecté
  const reports = currentUser ? [] : mockReports;

  // Fonction pour générer un rapport
  const handleGenerateReport = (templateTitle?: string) => {
    if (templateTitle) {
      setSelectedTemplate(templateTitle);
    }
    setShowGenerateModal(true);
  };

  // Fonction pour télécharger un rapport
  const handleDownloadReport = (report: typeof reports[0]) => {
    // Créer un contenu de rapport simple (format texte)
    const reportContent = `
${report.name}
${"=".repeat(50)}

Type: ${report.type}
Entreprise: ${report.company}
Généré le: ${report.generated}

[Contenu du rapport]
${"-".repeat(50)}
Ce rapport contient les données financières pour la période spécifiée.
    `.trim();

    // Créer un blob et télécharger
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${report.name.replace(/\s+/g, "_")}.txt`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction pour programmer un rapport
  const handleScheduleReport = () => {
    setShowScheduleModal(true);
  };

  // Fonction pour générer le contenu selon le type de rapport
  const generateReportContent = (templateTitle: string, format: string) => {
    const incomeStatement = () => {
      if (format === "CSV") {
        return `Date,Description,Revenus,Dépenses
2024-01-15,"Facture client",5000.00,0.00
2024-01-14,"Fournitures de bureau",0.00,245.50
2024-01-12,"Déjeuner d'équipe",0.00,125.75
2024-01-10,"Licence logicielle",0.00,99.99
2024-01-08,"Paiement freelance",2500.00,0.00
Total,,7500.00,471.24`;
      } else if (format === "Excel") {
        return `Date\tDescription\tRevenus\tDépenses
2024-01-15\tFacture client\t5000.00\t0.00
2024-01-14\tFournitures de bureau\t0.00\t245.50
2024-01-12\tDéjeuner d'équipe\t0.00\t125.75
2024-01-10\tLicence logicielle\t0.00\t99.99
2024-01-08\tPaiement freelance\t2500.00\t0.00
Total\t\t7500.00\t471.24`;
      } else {
        return `
${templateTitle}
${"=".repeat(60)}

Période: ${reportPeriod}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}

${"=".repeat(60)}

ÉTAT DES RÉSULTATS
${"-".repeat(60)}

REVENUS
${"-".repeat(60)}
Facture client                    $5,000.00
Paiement freelance                 $2,500.00
Autres revenus                     $3,000.00
${"-".repeat(60)}
Total Revenus                      $10,500.00

DÉPENSES
${"-".repeat(60)}
Fournitures de bureau                $245.50
Déjeuner d'équipe                    $125.75
Licence logicielle                    $99.99
Salaires                           $5,000.00
Services publics                     $156.25
${"-".repeat(60)}
Total Dépenses                      $5,627.49

${"=".repeat(60)}
REVENU NET                          $4,872.51
${"=".repeat(60)}

Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.
        `.trim();
      }
    };

    const balanceSheet = () => {
      if (format === "CSV") {
        return `Catégorie,Description,Montant
Actifs,"Comptes bancaires",25000.00
Actifs,"Comptes clients",8500.00
Actifs,"Équipement",15000.00
Passifs,"Dettes fournisseurs",3200.00
Passifs,"Prêts",10000.00
Capitaux propres,"Capital",25000.00
Capitaux propres,"Bénéfices non répartis",10800.00`;
      } else if (format === "Excel") {
        return `Catégorie\tDescription\tMontant
Actifs\tComptes bancaires\t25000.00
Actifs\tComptes clients\t8500.00
Actifs\tÉquipement\t15000.00
Passifs\tDettes fournisseurs\t3200.00
Passifs\tPrêts\t10000.00
Capitaux propres\tCapital\t25000.00
Capitaux propres\tBénéfices non répartis\t10800.00`;
      } else {
        return `
${templateTitle}
${"=".repeat(60)}

Période: ${reportPeriod}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}

${"=".repeat(60)}

BILAN
${"-".repeat(60)}

ACTIFS
${"-".repeat(60)}
Actifs courants
  Comptes bancaires                $25,000.00
  Comptes clients                    $8,500.00
  Inventaire                         $3,200.00
${"-".repeat(60)}
Total Actifs courants               $36,700.00

Actifs non courants
  Équipement                        $15,000.00
  Amortissement cumulé              -$2,500.00
${"-".repeat(60)}
Total Actifs non courants           $12,500.00

${"=".repeat(60)}
TOTAL ACTIFS                        $49,200.00

PASSIFS
${"-".repeat(60)}
Passifs courants
  Dettes fournisseurs                $3,200.00
  Prêts à court terme                $5,000.00
${"-".repeat(60)}
Total Passifs courants               $8,200.00

Passifs non courants
  Prêts à long terme                $10,000.00
${"-".repeat(60)}
Total Passifs non courants          $10,000.00

${"=".repeat(60)}
TOTAL PASSIFS                       $18,200.00

CAPITAUX PROPRES
${"-".repeat(60)}
Capital                             $25,000.00
Bénéfices non répartis              $6,000.00
${"-".repeat(60)}
Total Capitaux propres              $31,000.00

${"=".repeat(60)}
TOTAL PASSIFS + CAPITAUX PROPRES    $49,200.00
${"=".repeat(60)}

Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.
        `.trim();
      }
    };

    const cashFlow = () => {
      if (format === "CSV") {
        return `Catégorie,Description,Montant
Activités opérationnelles,"Revenus clients",10500.00
Activités opérationnelles,"Paiements fournisseurs",-471.24
Activités opérationnelles,"Salaires",-5000.00
Activités d'investissement,"Achat équipement",-5000.00
Activités de financement,"Prêt bancaire",10000.00
Activités de financement,"Remboursement prêt",-2000.00`;
      } else if (format === "Excel") {
        return `Catégorie\tDescription\tMontant
Activités opérationnelles\tRevenus clients\t10500.00
Activités opérationnelles\tPaiements fournisseurs\t-471.24
Activités opérationnelles\tSalaires\t-5000.00
Activités d'investissement\tAchat équipement\t-5000.00
Activités de financement\tPrêt bancaire\t10000.00
Activités de financement\tRemboursement prêt\t-2000.00`;
      } else {
        return `
${templateTitle}
${"=".repeat(60)}

Période: ${reportPeriod}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}

${"=".repeat(60)}

FLUX DE TRÉSORERIE
${"-".repeat(60)}

ACTIVITÉS OPÉRATIONNELLES
${"-".repeat(60)}
Revenus clients                     $10,500.00
Paiements fournisseurs                -$471.24
Salaires                             -$5,000.00
Services publics                       -$156.25
${"-".repeat(60)}
Flux net des activités opérationnelles $4,872.51

ACTIVITÉS D'INVESTISSEMENT
${"-".repeat(60)}
Achat d'équipement                   -$5,000.00
${"-".repeat(60)}
Flux net des activités d'investissement -$5,000.00

ACTIVITÉS DE FINANCEMENT
${"-".repeat(60)}
Prêt bancaire                        $10,000.00
Remboursement de prêt                 -$2,000.00
${"-".repeat(60)}
Flux net des activités de financement $8,000.00

${"=".repeat(60)}
AUGMENTATION NETTE DE TRÉSORERIE     $7,872.51
Trésorerie au début de la période   $15,000.00
${"-".repeat(60)}
TRÉSORERIE À LA FIN DE LA PÉRIODE   $22,872.51
${"=".repeat(60)}

Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.
        `.trim();
      }
    };

    const taxSummary = () => {
      if (format === "CSV") {
        return `Catégorie,Description,Montant
Revenus bruts,"Revenus totaux",10500.00
Déductions,"Dépenses déductibles",5627.49
Revenu net,"Revenu imposable",4872.51
Impôts,"Impôt fédéral estimé",1218.13
Impôts,"Impôt provincial estimé",974.50`;
      } else if (format === "Excel") {
        return `Catégorie\tDescription\tMontant
Revenus bruts\tRevenus totaux\t10500.00
Déductions\tDépenses déductibles\t5627.49
Revenu net\tRevenu imposable\t4872.51
Impôts\tImpôt fédéral estimé\t1218.13
Impôts\tImpôt provincial estimé\t974.50`;
      } else {
        return `
${templateTitle}
${"=".repeat(60)}

Période: ${reportPeriod}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}

${"=".repeat(60)}

RÉSUMÉ FISCAL
${"-".repeat(60)}

REVENUS BRUTS
${"-".repeat(60)}
Revenus totaux                       $10,500.00
${"-".repeat(60)}

DÉDUCTIONS
${"-".repeat(60)}
Dépenses d'exploitation               $5,627.49
Amortissement                          $500.00
Intérêts                                $200.00
${"-".repeat(60)}
Total Déductions                      $6,327.49

${"=".repeat(60)}
REVENU NET IMPOSABLE                  $4,172.51
${"=".repeat(60)}

CALCUL DES IMPÔTS
${"-".repeat(60)}
Impôt fédéral (25%)                   $1,043.13
Impôt provincial (15%)                  $625.88
${"-".repeat(60)}
Total Impôts                          $1,669.01

${"=".repeat(60)}
REVENU APRÈS IMPÔTS                   $2,503.50
${"=".repeat(60)}

Note: Ce calcul est une estimation. Consultez un comptable pour
une déclaration fiscale officielle.

Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.
        `.trim();
      }
    };

    const expenseAnalysis = () => {
      if (format === "CSV") {
        return `Catégorie,Montant,Pourcentage
Salaires,5000.00,88.8
Fournitures de bureau,245.50,4.4
Repas et divertissement,125.75,2.2
Logiciel,99.99,1.8
Services publics,156.25,2.8
Total,5627.49,100.0`;
      } else if (format === "Excel") {
        return `Catégorie\tMontant\tPourcentage
Salaires\t5000.00\t88.8
Fournitures de bureau\t245.50\t4.4
Repas et divertissement\t125.75\t2.2
Logiciel\t99.99\t1.8
Services publics\t156.25\t2.8
Total\t5627.49\t100.0`;
      } else {
        return `
${templateTitle}
${"=".repeat(60)}

Période: ${reportPeriod}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}

${"=".repeat(60)}

ANALYSE DES DÉPENSES
${"-".repeat(60)}

RÉPARTITION PAR CATÉGORIE
${"-".repeat(60)}

Catégorie                    Montant      % du total
${"-".repeat(60)}
Salaires                    $5,000.00      88.8%
Fournitures de bureau         $245.50       4.4%
Repas et divertissement      $125.75       2.2%
Logiciel                      $99.99       1.8%
Services publics             $156.25       2.8%
${"-".repeat(60)}
TOTAL DÉPENSES              $5,627.49     100.0%

${"=".repeat(60)}

TENDANCES
${"-".repeat(60)}
Dépenses moyennes par mois:     $1,875.83
Dépense la plus élevée:         $5,000.00 (Salaires)
Dépense la plus faible:           $99.99 (Logiciel)

${"=".repeat(60)}

RECOMMANDATIONS
${"-".repeat(60)}
• Les salaires représentent 88.8% des dépenses totales
• Considérez optimiser les coûts de personnel si possible
• Les dépenses en logiciel sont minimales - bon contrôle

Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.
        `.trim();
      }
    };

    const revenuForecast = () => {
      if (format === "CSV") {
        return `Mois,Revenus projetés,Revenus réels,Écart
Janvier,8000.00,7500.00,-500.00
Février,8500.00,8200.00,-300.00
Mars,9000.00,9500.00,500.00
Avril,9500.00,,
Mai,10000.00,,
Juin,10500.00,,`;
      } else if (format === "Excel") {
        return `Mois\tRevenus projetés\tRevenus réels\tÉcart
Janvier\t8000.00\t7500.00\t-500.00
Février\t8500.00\t8200.00\t-300.00
Mars\t9000.00\t9500.00\t500.00
Avril\t9500.00\t\t
Mai\t10000.00\t\t
Juin\t10500.00\t\t`;
      } else {
        return `
${templateTitle}
${"=".repeat(60)}

Période: ${reportPeriod}
Date de génération: ${new Date().toLocaleDateString('fr-FR')}

${"=".repeat(60)}

PRÉVISION DES REVENUS
${"-".repeat(60)}

PROJECTIONS MENSUELLES
${"-".repeat(60)}

Mois          Revenus projetés   Revenus réels   Écart
${"-".repeat(60)}
Janvier            $8,000.00        $7,500.00    -$500.00
Février            $8,500.00        $8,200.00    -$300.00
Mars               $9,000.00        $9,500.00     $500.00
Avril              $9,500.00           -           -
Mai               $10,000.00           -           -
Juin              $10,500.00           -           -
${"-".repeat(60)}
Total projeté     $55,500.00      $25,200.00

${"=".repeat(60)}

ANALYSE
${"-".repeat(60)}
Revenus moyens (3 mois):           $8,400.00
Tendance:                           Croissante (+6.7%)
Projection annuelle:               $100,800.00

${"=".repeat(60)}

FACTEURS DE CROISSANCE
${"-".repeat(60)}
• Expansion de la clientèle: +15%
• Augmentation des prix: +5%
• Nouveaux services: +10%
• Total croissance attendue: +30%

Ce rapport a été généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}.
        `.trim();
      }
    };

    // Sélectionner le contenu selon le template
    if (templateTitle === t("reports.incomeStatement")) {
      return incomeStatement();
    } else if (templateTitle === t("reports.balanceSheet")) {
      return balanceSheet();
    } else if (templateTitle === t("reports.cashFlow")) {
      return cashFlow();
    } else if (templateTitle === t("reports.taxSummary")) {
      return taxSummary();
    } else if (templateTitle === t("reports.expenseAnalysis")) {
      return expenseAnalysis();
    } else if (templateTitle === t("reports.revenuForecast")) {
      return revenuForecast();
    } else {
      return incomeStatement(); // Par défaut
    }
  };

  // Fonction pour générer et télécharger un rapport
  const generateAndDownloadReport = () => {
    const reportTitle = selectedTemplate || t("reports.incomeStatement");
    const currentDate = new Date().toISOString().split('T')[0];
    const reportName = `${reportTitle} - ${reportPeriod} - ${currentDate}`;
    
    const content = generateReportContent(reportTitle, reportFormat);
    let mimeType = "";
    let fileExtension = "";
    
    if (reportFormat === "CSV") {
      mimeType = "text/csv;charset=utf-8;";
      fileExtension = "csv";
    } else if (reportFormat === "Excel") {
      mimeType = "application/vnd.ms-excel;charset=utf-8;";
      fileExtension = "xls";
    } else {
      mimeType = "text/plain;charset=utf-8;";
      fileExtension = "txt";
    }
    
    // Créer et télécharger le fichier
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportName.replace(/\s+/g, "_")}.${fileExtension}`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Fermer le modal
    setShowGenerateModal(false);
    setSelectedTemplate(null);
  };
  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{t("reports.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("reports.subtitle")}
          </p>
        </div>
        <button 
          onClick={() => handleGenerateReport()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t("reports.generateReport")}</span>
        </button>
      </div>

      {/* Report Templates */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground mb-3">{t("reports.templates")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: t("reports.incomeStatement"),
              description: t("reports.incomeStatementDesc"),
              icon: "📊",
            },
            {
              title: t("reports.balanceSheet"),
              description: t("reports.balanceSheetDesc"),
              icon: "💰",
            },
            {
              title: t("reports.cashFlow"),
              description: t("reports.cashFlowDesc"),
              icon: "💳",
            },
            {
              title: t("reports.taxSummary"),
              description: t("reports.taxSummaryDesc"),
              icon: "���",
            },
            {
              title: t("reports.expenseAnalysis"),
              description: t("reports.expenseAnalysisDesc"),
              icon: "📉",
            },
            {
              title: t("reports.revenuForecast"),
              description: t("reports.revenuForecastDesc"),
              icon: "📈",
            },
          ].map((template, idx) => (
            <div
              key={idx}
              className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {template.icon}
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                {template.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {template.description}
              </p>
              <button 
                onClick={() => handleGenerateReport(template.title)}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {t("reports.generate")} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t("reports.recentReports")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("reports.reportName")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("reports.type")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.company")}
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                  {t("reports.generated")}
                </th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                  {t("transactions.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-border hover:bg-secondary/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-foreground">
                    {report.name}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {report.type}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {report.company}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {report.generated}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button 
                      onClick={() => handleDownloadReport(report)}
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span className="text-sm">{t("reports.download")}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="mt-6 bg-card rounded-lg border border-border p-4 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-3">{t("reports.scheduledReports")}</h2>
        <p className="text-sm text-muted-foreground mb-3">
          {t("reports.scheduledDesc")}
        </p>
        <button 
          onClick={handleScheduleReport}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium text-sm"
        >
          <Calendar className="w-4 h-4" />
          <span>{t("reports.scheduleReport")}</span>
        </button>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-3">
              {selectedTemplate 
                ? `${t("reports.generate")} - ${selectedTemplate}`
                : t("reports.generateReport")
              }
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {selectedTemplate
                ? t("reports.generateReport")
                : "Sélectionnez les options pour générer votre rapport."
              }
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="report-period" className="text-xs font-medium text-foreground block mb-1">
                  Période
                </label>
                <select 
                  id="report-period"
                  name="period"
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Année en cours</option>
                  <option>Dernier trimestre</option>
                  <option>Dernier mois</option>
                  <option>Période personnalisée</option>
                </select>
              </div>
              <div>
                <label htmlFor="report-format" className="text-xs font-medium text-foreground block mb-1">
                  Format
                </label>
                <select 
                  id="report-format"
                  name="format"
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>CSV</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedTemplate(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={generateAndDownloadReport}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                {t("reports.generate")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-foreground mb-3">
              {t("reports.scheduleReport")}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Configurez la programmation automatique de vos rapports.
            </p>
            <div className="space-y-3 mb-4">
              <div>
                <label htmlFor="schedule-report-type" className="text-xs font-medium text-foreground block mb-1">
                  Type de rapport
                </label>
                <select id="schedule-report-type" name="reportType" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>{t("reports.incomeStatement")}</option>
                  <option>{t("reports.balanceSheet")}</option>
                  <option>{t("reports.cashFlow")}</option>
                  <option>{t("reports.taxSummary")}</option>
                </select>
              </div>
              <div>
                <label htmlFor="schedule-frequency" className="text-xs font-medium text-foreground block mb-1">
                  Fréquence
                </label>
                <select id="schedule-frequency" name="frequency" className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Quotidien</option>
                  <option>Hebdomadaire</option>
                  <option>Mensuel</option>
                  <option>Trimestriel</option>
                  <option>Annuel</option>
                </select>
              </div>
              <div>
                <label htmlFor="schedule-start-date" className="text-xs font-medium text-foreground block mb-1">
                  Date de début
                </label>
                <input
                  id="schedule-start-date"
                  name="startDate"
                  type="date"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert("Programmation configurée avec succès !");
                  setShowScheduleModal(false);
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Programmer
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
