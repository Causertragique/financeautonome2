import React, { useState } from "react";
import { X } from "lucide-react";

export interface TechExpenseFormData {
  id?: string;
  date: string;
  description: string;
  category:
    | "Matériel informatique"
    | "Accessoires"
    | "Téléphone cellulaire"
    | "Logiciel (achat)"
    | "Abonnement logiciel"
    | "Abonnement service numérique"
    | "Cloud/stockage"
    | "Maintenance/réparation"
    | "Autre";
  amount: number;
  businessUsage: number; // 0 à 100
}

interface TechExpenseFormProps {
  initial?: TechExpenseFormData | null;
  onSave: (data: TechExpenseFormData) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onClose?: () => void;
}

export const TechExpenseForm: React.FC<TechExpenseFormProps> = ({
  initial,
  onSave,
  onDelete,
  onClose,
}) => {
  const [date, setDate] = useState(initial?.date || new Date().toISOString().substring(0, 10));
  const [description, setDescription] = useState(initial?.description || "");
  const [category, setCategory] = useState<TechExpenseFormData["category"]>(
    initial?.category || "Matériel informatique"
  );
  const [amount, setAmount] = useState<number | "">(initial?.amount || "");
  const [businessUsage, setBusinessUsage] = useState<number | "">(
    initial?.businessUsage ?? 100
  );
  const [saving, setSaving] = useState(false);

  const deductible = amount && businessUsage ? (amount as number) * (businessUsage as number) / 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !description || !category || !amount || !businessUsage) {
      alert("Tous les champs sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: initial?.id,
        date,
        description,
        category,
        amount: amount as number,
        businessUsage: businessUsage as number,
      });
      if (onClose) onClose();
    } catch (e) {
      console.error("Erreur d’enregistrement :", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Confirmer la suppression ?")) return;
    if (onDelete) {
      await onDelete();
      if (onClose) onClose();
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {initial ? "Modifier" : "Ajouter"} une dépense technologique
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="tech-date" className="text-sm font-medium block mb-2">
            Date d'achat ou de paiement <span className="text-destructive">*</span>
          </label>
          <input
            id="tech-date"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
          />
        </div>
        <div>
          <label htmlFor="tech-description" className="text-sm font-medium block mb-2">
            Description détaillée <span className="text-destructive">*</span>
          </label>
          <input
            id="tech-description"
            type="text"
            required
            maxLength={128}
            placeholder="Ex : MacBook Air M3, licence Office 365, abonnement Canva..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
          />
        </div>
        <div>
          <label htmlFor="tech-category" className="text-sm font-medium block mb-2">
            Catégorie <span className="text-destructive">*</span>
          </label>
          <select
            id="tech-category"
            required
            value={category}
            onChange={e => setCategory(e.target.value as TechExpenseFormData["category"])}
            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
          >
            <option value="Matériel informatique">Matériel informatique (ordi/tablette...)</option>
            <option value="Accessoires">Accessoires (clavier, souris, casque...)</option>
            <option value="Téléphone cellulaire">Téléphone cellulaire</option>
            <option value="Logiciel (achat)">Logiciel (achat unique)</option>
            <option value="Abonnement logiciel">Abonnement logiciel (SaaS)</option>
            <option value="Abonnement service numérique">Abonnement service numérique</option>
            <option value="Cloud/stockage">Services Cloud / Stockage</option>
            <option value="Maintenance/réparation">Maintenance / Réparation</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div>
          <label htmlFor="tech-amount" className="text-sm font-medium block mb-2">
            Montant payé (taxes incluses si non récupérées) <span className="text-destructive">*</span>
          </label>
          <input
            id="tech-amount"
            type="number"
            required
            step="0.01"
            min={0}
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value === "" ? "" : parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
          />
        </div>
        <div>
          <label htmlFor="tech-business-usage" className="text-sm font-medium block mb-2">
            % d'utilisation professionnelle <span className="text-destructive">*</span>
            <span className="text-xs ml-1 text-muted-foreground">(0 à 100)</span>
          </label>
          <input
            id="tech-business-usage"
            type="number"
            required
            step="1"
            min={0}
            max={100}
            placeholder="100"
            value={businessUsage}
            onChange={e => setBusinessUsage(e.target.value === "" ? "" : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
          />
        </div>

        {/* Résumé */}
        {amount && businessUsage !== "" && (
          <div className="bg-muted/50 border border-border rounded-lg p-3 mt-2">
            <div className="flex justify-between text-sm">
              <span>Montant déductible</span>
              <span className="font-semibold text-emerald-700">{deductible.toFixed(2)} $</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {initial && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors font-medium"
            >
              Supprimer
            </button>
          )}
          <div className="flex-1" />
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
      <p className="text-xs text-muted-foreground mt-4">
        <b>Note :</b> Chaque dépense doit être justifiée et raisonnable selon l’usage professionnel réel.  
        Les abonnements à usage mixte (perso/pro) doivent être ventilés par pourcentage réel d’utilisation.  
        Conserve les factures électroniques : Revenu Québec/ARC peuvent les exiger à tout moment.
      </p>
    </div>
  );
};
