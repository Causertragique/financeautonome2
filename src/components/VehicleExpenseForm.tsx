import React, { useEffect, useState } from "react";
import type { VehicleAnnualProfile, VehicleJournalEntry } from "../lib/db";

interface VehicleExpenseFormProps {
  year: number;
  vehicleProfiles: VehicleAnnualProfile[];
  initialEntry?: VehicleJournalEntry | null;
  onSubmit: (data: {
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
  }) => Promise<void> | void;
  onCancel?: () => void;
}

export const VehicleExpenseForm: React.FC<VehicleExpenseFormProps> = ({
  year,
  vehicleProfiles,
  initialEntry,
  onSubmit,
  onCancel,
}) => {
  const [vehicleProfileId, setVehicleProfileId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [businessKm, setBusinessKm] = useState<number | "">("");
  const [parking, setParking] = useState<number | "">("");
  const [other, setOther] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialEntry) {
      setVehicleProfileId(initialEntry.vehicleProfileId);
      setPeriodStart(initialEntry.periodStart);
      setPeriodEnd(initialEntry.periodEnd);
      setBusinessKm(initialEntry.businessKm);
      setParking(initialEntry.parking ?? 0);
      setOther(initialEntry.other ?? 0);
    } else {
      // défaut : premier véhicule disponible s'il existe
      if (vehicleProfiles.length > 0) {
        setVehicleProfileId(vehicleProfiles[0].id);
      }
      setPeriodStart("");
      setPeriodEnd("");
      setBusinessKm("");
      setParking("");
      setOther("");
    }
  }, [initialEntry, vehicleProfiles, year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleProfileId || !periodStart || !periodEnd) return;

    const selectedProfile = vehicleProfiles.find((v) => v.id === vehicleProfileId);
    if (!selectedProfile) return;

    const parsedBusinessKm = Number(businessKm) || 0;
    const parsedParking = Number(parking) || 0;
    const parsedOther = Number(other) || 0;
    const periodTotal = parsedParking + parsedOther;

    setSaving(true);
    try {
      await onSubmit({
        id: initialEntry?.id,
        year,
        vehicleProfileId: selectedProfile.id,
        vehicleName: selectedProfile.vehicleName,
        periodStart,
        periodEnd,
        businessKm: parsedBusinessKm,
        parking: parsedParking,
        other: parsedOther,
        periodTotal,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border border-dashed border-border rounded-lg p-4 bg-muted/40"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Véhicule
          </label>
          <select
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={vehicleProfileId}
            onChange={(e) => setVehicleProfileId(e.target.value)}
            aria-label="Sélectionner un véhicule"
          >
            {vehicleProfiles.length === 0 && (
              <option value="">Aucun profil annuel défini</option>
            )}
            {vehicleProfiles.map((vp) => (
              <option key={vp.id} value={vp.id}>
                {vp.vehicleName} ({vp.year})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Les km d'affaires et les dépenses seront automatiquement intégrés au profil annuel.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Période
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              aria-label="Date de début de la période"
            />
            <input
              type="date"
              className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              aria-label="Date de fin de la période"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Ex. semaine Lyft, mois, ou toute autre période significative.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Km d'affaires pour la période
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={businessKm}
            onChange={(e) =>
              setBusinessKm(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            aria-label="Kilométrage d'affaires pour la période"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Stationnement / péages
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={parking}
            onChange={(e) =>
              setParking(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            step="0.01"
            aria-label="Stationnement et péages"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Autres dépenses liées au travail (lavage, petits frais, etc.)
          </label>
          <input
            type="number"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            value={other}
            onChange={(e) =>
              setOther(e.target.value === "" ? "" : Number(e.target.value))
            }
            min={0}
            step="0.01"
            aria-label="Autres dépenses liées au travail"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60">
        <div className="text-[11px] text-muted-foreground">
          Chaque entrée met à jour les km d'affaires et les petites dépenses dans le profil
          annuel du véhicule.
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs px-2 py-1 rounded-md border border-border hover:bg-muted"
            >
              Annuler
            </button>
          )}
          <button
            type="submit"
            disabled={saving || vehicleProfiles.length === 0}
            className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving
              ? "Enregistrement..."
              : initialEntry
              ? "Mettre à jour le journal"
              : "Ajouter au journal"}
          </button>
        </div>
      </div>
    </form>
  );
};
