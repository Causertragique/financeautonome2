import React, { useEffect, useState } from "react";
import type { VehicleAnnualProfile } from "../lib/db";

interface VehicleAnnualFormProps {
  year: number;
  initialProfile: VehicleAnnualProfile | null;
  onSave: (data: {
    id?: string;
    vehicleName: string;
    totalKm: number;
    insuranceAnnual: number;
    leaseFinanceAnnual: number;
    maintenanceAnnual: number;
    fuelAnnual: number;
    registrationAnnual: number;
    otherAnnual: number;
  }) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}

export const VehicleAnnualForm: React.FC<VehicleAnnualFormProps> = ({
  year,
  initialProfile,
  onSave,
  onDelete,
}) => {
  const [vehicleName, setVehicleName] = useState("");
  const [totalKm, setTotalKm] = useState<number | "">("");
  const [insuranceAnnual, setInsuranceAnnual] = useState<number | "">("");
  const [leaseFinanceAnnual, setLeaseFinanceAnnual] = useState<number | "">("");
  const [maintenanceAnnual, setMaintenanceAnnual] = useState<number | "">("");
  const [fuelAnnual, setFuelAnnual] = useState<number | "">("");
  const [registrationAnnual, setRegistrationAnnual] = useState<number | "">("");
  const [otherAnnual, setOtherAnnual] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialProfile) {
      setVehicleName(initialProfile.vehicleName || "");
      setTotalKm(initialProfile.totalKm || 0);
      setInsuranceAnnual(initialProfile.insuranceAnnual || 0);
      setLeaseFinanceAnnual(initialProfile.leaseFinanceAnnual || 0);
      setMaintenanceAnnual(initialProfile.maintenanceAnnual || 0);
      setFuelAnnual(initialProfile.fuelAnnual || 0);
      setRegistrationAnnual(initialProfile.registrationAnnual || 0);
      setOtherAnnual(initialProfile.otherAnnual || 0);
    } else {
      setVehicleName("");
      setTotalKm("");
      setInsuranceAnnual("");
      setLeaseFinanceAnnual("");
      setMaintenanceAnnual("");
      setFuelAnnual("");
      setRegistrationAnnual("");
      setOtherAnnual("");
    }
  }, [initialProfile, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleName.trim()) return;

    const parsedTotalKm = Number(totalKm) || 0;
    const parsedInsurance = Number(insuranceAnnual) || 0;
    const parsedLeaseFinance = Number(leaseFinanceAnnual) || 0;
    const parsedMaintenance = Number(maintenanceAnnual) || 0;
    const parsedFuel = Number(fuelAnnual) || 0;
    const parsedRegistration = Number(registrationAnnual) || 0;
    const parsedOther = Number(otherAnnual) || 0;

    setSaving(true);
    try {
      await onSave({
        id: initialProfile?.id,
        vehicleName: vehicleName.trim(),
        totalKm: parsedTotalKm,
        insuranceAnnual: parsedInsurance,
        leaseFinanceAnnual: parsedLeaseFinance,
        maintenanceAnnual: parsedMaintenance,
        fuelAnnual: parsedFuel,
        registrationAnnual: parsedRegistration,
        otherAnnual: parsedOther,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border border-border rounded-lg p-4 bg-card"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">
          Profil annuel véhicule – {year}
        </h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Nom du véhicule
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
            placeholder="Ex. Nissan Ariya, Corolla, etc."
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Km totaux (tous usages) pour l'année
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={totalKm}
            onChange={(e) => setTotalKm(e.target.value === "" ? "" : Number(e.target.value))}
            min={0}
            aria-label="Kilométrage total pour l'année"
          />
          <p className="text-[11px] text-muted-foreground">
            Sert à calculer le ratio affaires / personnel.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Assurance annuelle
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={insuranceAnnual}
            onChange={(e) =>
              setInsuranceAnnual(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            step="0.01"
            aria-label="Assurance annuelle"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Location / Financement annuel
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={leaseFinanceAnnual}
            onChange={(e) =>
              setLeaseFinanceAnnual(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            step="0.01"
            aria-label="Location ou financement annuel"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Entretien annuel
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={maintenanceAnnual}
            onChange={(e) =>
              setMaintenanceAnnual(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            step="0.01"
            aria-label="Entretien annuel"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Carburant annuel
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={fuelAnnual}
            onChange={(e) =>
              setFuelAnnual(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            step="0.01"
            aria-label="Carburant annuel"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Immatriculation annuelle
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={registrationAnnual}
            onChange={(e) =>
              setRegistrationAnnual(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            step="0.01"
            aria-label="Immatriculation annuelle"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Autres coûts annuels
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={otherAnnual}
            onChange={(e) =>
              setOtherAnnual(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            step="0.01"
            aria-label="Autres coûts annuels"
          />
          <p className="text-[11px] text-muted-foreground">
            Les petits frais (stationnement, etc.) viennent du journal.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <div className="text-[11px] text-muted-foreground">
          Le ratio affaires est recalculé automatiquement à partir du journal de déplacements.
        </div>
        <div className="flex gap-2">
          {onDelete && initialProfile && (
            <button
              type="button"
              onClick={() => onDelete()}
              className="text-xs px-2 py-1 rounded-md border border-destructive text-destructive hover:bg-destructive/10"
            >
              Supprimer le profil
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : "Enregistrer le profil"}
          </button>
        </div>
      </div>
    </form>
  );
};
