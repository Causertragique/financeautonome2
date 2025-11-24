import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface HomeOfficeFormProps {
  year: number;
  initialExpense: any | null;
  onSave: (data: any) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  onClose?: () => void;
}

export const HomeOfficeForm: React.FC<HomeOfficeFormProps> = ({
  year,
  initialExpense,
  onSave,
  onDelete,
  onClose,
}) => {
  // Champs
  const [periodStart, setPeriodStart] = useState(initialExpense?.periodStart || `${year}-01-01`);
  const [periodEnd, setPeriodEnd] = useState(initialExpense?.periodEnd || `${year}-12-31`);
  const [totalArea, setTotalArea] = useState<number | "">(initialExpense?.totalArea || "");
  const [officeArea, setOfficeArea] = useState<number | "">(initialExpense?.officeArea || "");

  // Seulement loyer OU hypothèque, jamais les deux
  const [rent, setRent] = useState<number | "">(initialExpense?.rent || "");
  const [mortgageInterest, setMortgageInterest] = useState<number | "">(initialExpense?.mortgageInterest || "");

  const [electricityHeating, setElectricityHeating] = useState<number | "">(initialExpense?.electricityHeating || "");
  const [condoFees, setCondoFees] = useState<number | "">(initialExpense?.condoFees || "");
  const [propertyTaxes, setPropertyTaxes] = useState<number | "">(initialExpense?.propertyTaxes || "");
  const [homeInsurance, setHomeInsurance] = useState<number | "">(initialExpense?.homeInsurance || "");
  const [other, setOther] = useState<number | "">(initialExpense?.other || "");
  const [saving, setSaving] = useState(false);

  // Mettre à jour les valeurs quand initialExpense change
  useEffect(() => {
    if (initialExpense) {
      setPeriodStart(initialExpense.periodStart || `${year}-01-01`);
      setPeriodEnd(initialExpense.periodEnd || `${year}-12-31`);
      setTotalArea(initialExpense.totalArea || "");
      setOfficeArea(initialExpense.officeArea || "");
      setRent(initialExpense.rent || "");
      setMortgageInterest(initialExpense.mortgageInterest || "");
      setElectricityHeating(initialExpense.electricityHeating || "");
      setCondoFees(initialExpense.condoFees || "");
      setPropertyTaxes(initialExpense.propertyTaxes || "");
      setHomeInsurance(initialExpense.homeInsurance || "");
      setOther(initialExpense.other || "");
    } else {
      // Réinitialiser pour un nouveau formulaire
      setPeriodStart(`${year}-01-01`);
      setPeriodEnd(`${year}-12-31`);
      setTotalArea("");
      setOfficeArea("");
      setRent("");
      setMortgageInterest("");
      setElectricityHeating("");
      setCondoFees("");
      setPropertyTaxes("");
      setHomeInsurance("");
      setOther("");
    }
  }, [initialExpense, year]);

  // Ratio automatique
  const businessRatio =
    totalArea && officeArea && totalArea > 0
      ? ((officeArea as number) / (totalArea as number)) * 100
      : 0;

  // Somme des dépenses admissibles (fiscales)
  const totalExpenses =
    (rent || 0) +
    (mortgageInterest || 0) +
    (electricityHeating || 0) +
    (condoFees || 0) +
    (propertyTaxes || 0) +
    (homeInsurance || 0) +
    (other || 0);

  // Montant déductible (partie bureau à domicile)
  const deductibleTotal = totalExpenses * (businessRatio / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalArea || !officeArea) {
      alert("Veuillez remplir la superficie totale et la superficie du bureau.");
      return;
    }
    if ((rent && mortgageInterest) || (!rent && !mortgageInterest)) {
      alert("Indiquez soit le loyer annuel, soit l'intérêt hypothécaire payé, mais jamais les deux.");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: initialExpense?.id,
        periodStart,
        periodEnd,
        totalArea: totalArea as number,
        officeArea: officeArea as number,
        rent: rent ? rent as number : 0,
        mortgageInterest: mortgageInterest ? mortgageInterest as number : 0,
        electricityHeating: electricityHeating as number,
        condoFees: condoFees as number,
        propertyTaxes: propertyTaxes as number,
        homeInsurance: homeInsurance as number,
        other: other as number,
      });
      if (onClose) onClose();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;
    if (onDelete) {
      await onDelete();
      if (onClose) onClose();
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {initialExpense ? "Modifier" : "Ajouter"} les coûts du bureau à domicile
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
        {/* Période */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="periodStart" className="text-sm font-medium text-foreground block mb-2">
              Date de début <span className="text-destructive">*</span>
            </label>
            <input
              id="periodStart"
              type="date"
              required
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
            />
          </div>
          <div>
            <label htmlFor="periodEnd" className="text-sm font-medium text-foreground block mb-2">
              Date de fin <span className="text-destructive">*</span>
            </label>
            <input
              id="periodEnd"
              type="date"
              required
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
            />
          </div>
        </div>

        {/* Superficie */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="totalArea" className="text-sm font-medium text-foreground block mb-2">
              Superficie totale du domicile (pi²) <span className="text-destructive">*</span>
            </label>
            <input
              id="totalArea"
              type="number"
              step="0.01"
              required
              value={totalArea}
              onChange={e => setTotalArea(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="Ex: 1200"
            />
          </div>
          <div>
            <label htmlFor="officeArea" className="text-sm font-medium text-foreground block mb-2">
              Superficie du bureau (pi²) <span className="text-destructive">*</span>
            </label>
            <input
              id="officeArea"
              type="number"
              step="0.01"
              required
              value={officeArea}
              onChange={e => setOfficeArea(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="Ex: 150"
            />
          </div>
        </div>

        {/* Ratio */}
        {totalArea && officeArea && totalArea > 0 && (
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              Ratio d'utilisation pour le travail&nbsp;:{" "}
              <span className="font-semibold text-foreground">{businessRatio.toFixed(2)}%</span>
            </p>
          </div>
        )}

        {/* Coûts admissibles */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            Coûts admissibles annuels (fiscaux)
          </h4>
          <div>
            <label htmlFor="rent" className="text-sm font-medium text-foreground block mb-2">
              Loyer (si locataire, annuel)
            </label>
            <input
              id="rent"
              type="number"
              step="0.01"
              value={rent}
              onChange={e => setRent(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="0.00"
              disabled={!!mortgageInterest}
            />
          </div>
          <div>
            <label htmlFor="mortgageInterest" className="text-sm font-medium text-foreground block mb-2">
              Intérêts hypothécaires (si propriétaire, annuel) <span className="text-xs text-muted-foreground">(pas le capital!)</span>
            </label>
            <input
              id="mortgageInterest"
              type="number"
              step="0.01"
              value={mortgageInterest}
              onChange={e => setMortgageInterest(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="0.00"
              disabled={!!rent}
            />
          </div>
          <div>
            <label htmlFor="electricityHeating" className="text-sm font-medium text-foreground block mb-2">
              Électricité et chauffage (annuel)
            </label>
            <input
              id="electricityHeating"
              type="number"
              step="0.01"
              value={electricityHeating}
              onChange={e => setElectricityHeating(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="condoFees" className="text-sm font-medium text-foreground block mb-2">
              Frais de condo (annuel)
            </label>
            <input
              id="condoFees"
              type="number"
              step="0.01"
              value={condoFees}
              onChange={e => setCondoFees(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="propertyTaxes" className="text-sm font-medium text-foreground block mb-2">
              Taxes foncières (annuel)
            </label>
            <input
              id="propertyTaxes"
              type="number"
              step="0.01"
              value={propertyTaxes}
              onChange={e => setPropertyTaxes(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="homeInsurance" className="text-sm font-medium text-foreground block mb-2">
              Assurance habitation (annuel)
            </label>
            <input
              id="homeInsurance"
              type="number"
              step="0.01"
              value={homeInsurance}
              onChange={e => setHomeInsurance(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="other" className="text-sm font-medium text-foreground block mb-2">
              Autres coûts admissibles (annuel)
            </label>
            <input
              id="other"
              type="number"
              step="0.01"
              value={other}
              onChange={e => setOther(e.target.value === "" ? "" : parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Résumé */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total des dépenses :</span>
            <span className="font-semibold text-foreground">
              {totalExpenses.toFixed(2)} $
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Ratio d'utilisation :</span>
            <span className="font-semibold text-foreground">
              {businessRatio.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between text-base pt-2 border-t border-border">
            <span className="font-semibold text-foreground">Total déductible :</span>
            <span className="font-bold text-emerald-700">
              {deductibleTotal.toFixed(2)} $
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {initialExpense && onDelete && (
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
        <b>Note :</b> Inscris uniquement <u>le loyer</u> si tu es locataire, <u>les intérêts hypothécaires</u> (jamais le capital) si tu es proprio. La portion bureau à domicile se calcule selon la méthode officielle Revenu Québec et ARC.
      </p>
    </div>
  );
};
