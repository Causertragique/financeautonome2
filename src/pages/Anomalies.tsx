import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { useFiscalYearContext } from "../contexts/FiscalYearContext";
import { getTransactions, type Transaction } from "../lib/db";
import { detectAnomalies } from "../lib/taxRules";
import { AlertTriangle, CheckCircle2, XCircle, Info } from "lucide-react";

interface Anomaly {
  transactionId: string;
  anomalyType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export default function Anomalies() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const { selectedYear } = useFiscalYearContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        const data = await getTransactions(selectedYear);
        setTransactions(data);
        
        // Détecter les anomalies
        const detectedAnomalies = await detectAnomalies(data);
        setAnomalies(detectedAnomalies);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.addEventListener("transactionsUpdated", loadData);
    return () => {
      window.removeEventListener("transactionsUpdated", loadData);
    };
  }, [selectedYear, currentUser]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'border-destructive/50 bg-destructive/5';
      case 'medium':
        return 'border-amber-200 bg-amber-50';
      case 'low':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-border bg-card';
    }
  };

  const getTransactionById = (id: string) => {
    return transactions.find(t => t.id === id);
  };

  const anomalyCounts = {
    high: anomalies.filter(a => a.severity === 'high').length,
    medium: anomalies.filter(a => a.severity === 'medium').length,
    low: anomalies.filter(a => a.severity === 'low').length,
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Détection d'anomalies</h1>
          <p className="text-sm text-muted-foreground">
            Transactions nécessitant une attention particulière
          </p>
        </div>
      </div>

      {/* Résumé */}
      {anomalies.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-card rounded-lg border border-destructive/50 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Critiques</h3>
            </div>
            <p className="text-2xl font-bold text-destructive">{anomalyCounts.high}</p>
          </div>
          <div className="bg-card rounded-lg border border-amber-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-semibold text-foreground">Avertissements</h3>
            </div>
            <p className="text-2xl font-bold text-amber-600">{anomalyCounts.medium}</p>
          </div>
          <div className="bg-card rounded-lg border border-blue-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-foreground">Informations</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">{anomalyCounts.low}</p>
          </div>
        </div>
      )}

      {/* Liste des anomalies */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Chargement des anomalies...</p>
        </div>
      ) : anomalies.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Aucune anomalie détectée</h3>
          <p className="text-sm text-muted-foreground">
            Toutes vos transactions semblent normales pour l'année {selectedYear}.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anomaly, idx) => {
            const transaction = getTransactionById(anomaly.transactionId);
            return (
              <div
                key={idx}
                className={`bg-card rounded-lg border p-4 shadow-sm ${getSeverityColor(anomaly.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(anomaly.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">
                        {anomaly.anomalyType}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        anomaly.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                        anomaly.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {anomaly.severity === 'high' ? 'Critique' :
                         anomaly.severity === 'medium' ? 'Avertissement' :
                         'Information'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {anomaly.description}
                    </p>
                    {transaction && (
                      <div className="bg-background/50 rounded-lg p-3 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="ml-2 font-medium">{transaction.date}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Montant:</span>
                            <span className="ml-2 font-medium">
                              {transaction.type === "income" ? "+" : "-"}
                              {transaction.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} $
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Description:</span>
                            <span className="ml-2 font-medium">{transaction.description}</span>
                          </div>
                          {transaction.category && (
                            <div>
                              <span className="text-muted-foreground">Catégorie:</span>
                              <span className="ml-2 font-medium">{transaction.category}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}

