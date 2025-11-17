import React, { useEffect, useState } from "react";
import type { VehicleAnnualProfile } from "../lib/db";

export interface VehicleAnnualFormProps {
  initialProfile?: VehicleAnnualProfile | null;
  year: number;
  onSave: (data: {
    vehicleName: string;
    estimatedTotalKm: number;
    estimatedBusinessKm: number;
    annualLeaseOrLoan: number;
    annualInsurance: number;
    annualRegistration: number;
    annualFuelBudget: number;
    annualMaintenanceBudget: number;
    annualOther: number;
    notes?: string;
  }) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

interface FormState {
  vehicleName: string;
  estimatedTotalKm: number;
  estimatedBusinessKm: number;
  annualLeaseOrLoan: number;
  annualInsurance: number;
  annualRegistration: number;
  annualFuelBudget: number;
  annualMaintenanceBudget: number;
  annualOther: number;
  notes: string;
}

const defaultState: FormState = {
  vehicleName: "",
  estimatedTotalKm: 0,
  estimatedBusinessKm: 0,
  annualLeaseOrLoan: 0,
  annualInsurance: 0,
  annualRegistration: 0,
  annualFuelBudget: 0,
  annualMaintenanceBudget: 0,
  annualOther: 0,
  notes: "",
};

export const VehicleAnnualForm: React.FC<VehicleAnnualFormProps> = ({
  initialProfile,
  year,
  onSave,
  onDelete,
}) => {
  const [state, setState] = useState<FormState>(defaultState);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setState({
        vehicleName: initialProfile.vehicleName || "",
        estimatedTotalKm: initialProfile.estimatedTotalKm || 0,
        estimatedBusinessKm: initialProfile.estimatedBusinessKm || 0,
        annualLeaseOrLoan: initialProfile.annualLeaseOrLoan || 0,
        annualInsurance: initialProfile.annualInsurance || 0,
        annualRegistration: initialProfile.annualRegistration || 0,
        annualFuelBudget: initialProfile.annualFuelBudget || 0,
        annualMaintenanceBudget: initialProfile.annualMaintenanceBudget || 0,
        annualOther: initialProfile.annualOther || 0,
        notes: initialProfile.notes || "",
      });
    } else {
      setState(defaultState);
    }
  }, [initialProfile]);

  const ratio =
    state.estimatedTotalKm > 0
      ? Math.min(
          Math.max(state.estimatedBusinessKm / state.estimatedTotalKm, 0),
          1
        )
      : 0;

  const totalAnnualCosts =
    state.annualLeaseOrLoan +
    state.annualInsurance +
    state.annualRegistration +
    state.annualFuelBudget +
    state.annualMaintenanceBudget +
    state.annualOther;

  const estimatedDeductible = totalAnnualCosts * ratio;

  const handleChange =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      const numericFields: (keyof FormState)[] = [
        "estimatedTotalKm",
        "estimatedBusinessKm",
        "annualLeaseOrLoan",
        "annualInsurance",
        "annualRegistration",
        "annualFuelBudget",
        "annualMaintenanceBudget",
        "annualOther",
      ];
      setState((prev) => ({
        ...prev,
        [field]: numericFields.includes(field) ? Number(value || 0) : value,
      }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        vehicleName: state.vehicleName,
        estimatedTotalKm: state.estimatedTotalKm,
        estimatedBusinessKm: state.estimatedBusinessKm,
        annualLeaseOrLoan: state.annualLeaseOrLoan,
        annualInsurance: state.annualInsurance,
        annualRegistration: state.annualRegistration,
        annualFuelBudget: state.annualFuelBudget,
        annualMaintenanceBudget: state.annualMaintenanceBudget,
        annualOther: state.annualOther,
        notes: state.notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 border border-border rounded-lg p-4 bg-card max-w-2xl"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">
          Profil annuel du véhicule – {year}
        </h3>
        <span className="text-xs text-muted-foreground">
          Prévision modifiable en cours d&apos;année
        </span>
      </div>

      {/* Nom + km estimés */}
      <div className="grid gap-2">
        <label className="text-sm">
          Nom du véhicule
          <input
            type="text"
            value={state.vehicleName}
            onChange={handleChange("vehicleName")}
            placeholder="Ex.: Nissan Ariya, voiture personnelle"
            className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
          />
        </label>
        <div className="flex gap-2">
          <label className="flex-1 text-sm">
            Km totaux annuels estimés
            <input
              type="number"
              min={0}
              value={state.estimatedTotalKm}
              onChange={handleChange("estimatedTotalKm")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="flex-1 text-sm">
            Km affaires annuels estimés (Lyft, clients)
            <input
              type="number"
              min={0}
              value={state.estimatedBusinessKm}
              onChange={handleChange("estimatedBusinessKm")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Ratio affaires prévisionnel :{" "}
          <span className="font-medium">
            {(ratio * 100).toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Coûts annuels */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Coûts annuels (prévision)</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-sm">
            Location / financement (année)
            <input
              type="number"
              value={state.annualLeaseOrLoan}
              onChange={handleChange("annualLeaseOrLoan")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Assurance auto (année)
            <input
              type="number"
              value={state.annualInsurance}
              onChange={handleChange("annualInsurance")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Immatriculation (année)
            <input
              type="number"
              value={state.annualRegistration}
              onChange={handleChange("annualRegistration")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Essence (budget annuel)
            <input
              type="number"
              value={state.annualFuelBudget}
              onChange={handleChange("annualFuelBudget")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Entretien / réparations (budget annuel)
            <input
              type="number"
              value={state.annualMaintenanceBudget}
              onChange={handleChange("annualMaintenanceBudget")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Autres (stationnement résidentiel, etc.)
            <input
              type="number"
              value={state.annualOther}
              onChange={handleChange("annualOther")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            Total des coûts annuels (prévision) :{" "}
            <span className="font-medium">
              {totalAnnualCosts.toFixed(2)} $
            </span>
          </p>
          <p>
            Portion déductible estimée (avec ratio prévisionnel) :{" "}
            <span className="font-semibold text-emerald-700">
              {estimatedDeductible.toFixed(2)} $
            </span>
          </p>
        </div>
      </div>

      {/* Notes */}
      <div className="grid gap-1">
        <label className="text-sm">
          Notes
          <textarea
            value={state.notes}
            onChange={handleChange("notes")}
            rows={3}
            placeholder="Ex.: changements prévus, renouvellement du bail, etc."
            className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background resize-none"
          />
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Enregistrement..." : "Enregistrer le profil annuel"}
        </button>
        {initialProfile && onDelete && (
          <button
            type="button"
            onClick={() => onDelete()}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            Supprimer le profil annuel
          </button>
        )}
      </div>
    </form>
  );
};
