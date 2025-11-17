// src/components/VehicleExpenseForm.tsx
import React, { useMemo, useState } from "react";

export interface VehicleExpenseFormValues {
  vehicleName: string;
  periodStart: string;
  periodEnd: string;
  totalKm: number;
  businessKm: number;
  fuel: number;
  maintenance: number;
  insurance: number;
  registration: number;
  parkingAndTolls: number;
  leaseOrLoan: number;
  other: number;
  businessFuel: number;
  businessMaintenance: number;
  businessParkingAndTolls: number;
  businessOther: number;
  gstOnExpenses: number;
  qstOnExpenses: number;
  gstOnBusinessExpenses: number;
  qstOnBusinessExpenses: number;
}

export interface VehicleExpenseFormProps {
  initialValues?: Partial<VehicleExpenseFormValues>;
  onSubmit: (values: VehicleExpenseFormValues & {
    businessRatio: number;
    deductibleTotal: number;
  }) => void;
}

const defaultValues: VehicleExpenseFormValues = {
  vehicleName: "",
  periodStart: "",
  periodEnd: "",
  totalKm: 0,
  businessKm: 0,
  fuel: 0,
  maintenance: 0,
  insurance: 0,
  registration: 0,
  parkingAndTolls: 0,
  leaseOrLoan: 0,
  other: 0,
  businessFuel: 0,
  businessMaintenance: 0,
  businessParkingAndTolls: 0,
  businessOther: 0,
  gstOnExpenses: 0,
  qstOnExpenses: 0,
  gstOnBusinessExpenses: 0,
  qstOnBusinessExpenses: 0,
};

export const VehicleExpenseForm: React.FC<VehicleExpenseFormProps> = ({
  initialValues,
  onSubmit,
}) => {
  const [values, setValues] = useState<VehicleExpenseFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  // Ratio d'utilisation affaires = km affaires / km total
  const businessRatio = useMemo(() => {
    if (!values.totalKm || values.totalKm <= 0) return 0;
    const r = values.businessKm / values.totalKm;
    return Math.min(Math.max(r, 0), 1);
  }, [values.totalKm, values.businessKm]);

  // Total des dépenses "partagées" (soumise au ratio)
  const sharedBase =
    values.fuel +
    values.maintenance +
    values.insurance +
    values.registration +
    values.leaseOrLoan +
    values.other;

  // Dépenses direct business (saisies déjà filtrées)
  const directBusiness =
    values.businessFuel +
    values.businessMaintenance +
    values.businessParkingAndTolls +
    values.businessOther;

  // On applique le ratio sur les dépenses partagées + on ajoute les direct business
  const deductibleTotal = sharedBase * businessRatio + directBusiness;

  const totalExpensesFull =
    sharedBase + values.parkingAndTolls; // pour info uniquement

  const gstItcEstimate =
    values.gstOnExpenses * businessRatio + values.gstOnBusinessExpenses;
  const qstItcEstimate =
    values.qstOnExpenses * businessRatio + values.qstOnBusinessExpenses;

  const handleChange =
    (field: keyof VehicleExpenseFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      const numericFields: (keyof VehicleExpenseFormValues)[] = [
        "totalKm",
        "businessKm",
        "fuel",
        "maintenance",
        "insurance",
        "registration",
        "parkingAndTolls",
        "leaseOrLoan",
        "other",
        "businessFuel",
        "businessMaintenance",
        "businessParkingAndTolls",
        "businessOther",
        "gstOnExpenses",
        "qstOnExpenses",
        "gstOnBusinessExpenses",
        "qstOnBusinessExpenses",
      ];

      setValues((prev) => ({
        ...prev,
        [field]: numericFields.includes(field)
          ? Number(value || 0)
          : value,
      }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...values,
      businessRatio,
      deductibleTotal,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 max-w-xl border border-border rounded-lg p-4 bg-card"
    >
      <h3 className="text-base font-semibold">Dépenses liées au véhicule</h3>

      {/* Période + nom du véhicule */}
      <div className="grid gap-2">
        <label className="text-sm">
          Nom du véhicule
          <input
            type="text"
            value={values.vehicleName}
            onChange={handleChange("vehicleName")}
            placeholder="Ex.: Nissan Ariya, voiture perso"
            className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
          />
        </label>
        <div className="flex gap-2">
          <label className="flex-1 text-sm">
            Du
            <input
              type="date"
              value={values.periodStart}
              onChange={handleChange("periodStart")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="flex-1 text-sm">
            Au
            <input
              type="date"
              value={values.periodEnd}
              onChange={handleChange("periodEnd")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
      </div>

      {/* Kilométrage */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Kilométrage (période)</p>
        <div className="flex gap-2">
          <label className="flex-1 text-sm">
            Km total
            <input
              type="number"
              min={0}
              value={values.totalKm}
              onChange={handleChange("totalKm")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="flex-1 text-sm">
            Km affaires (Lyft, client, etc.)
            <input
              type="number"
              min={0}
              value={values.businessKm}
              onChange={handleChange("businessKm")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Ratio affaires :{" "}
          <span className="font-medium">
            {(businessRatio * 100 || 0).toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Dépenses véhicule (totales) */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Dépenses véhicule (totales, période)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Essence
            <input
              type="number"
              step="0.01"
              value={values.fuel}
              onChange={handleChange("fuel")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Entretien / réparations
            <input
              type="number"
              step="0.01"
              value={values.maintenance}
              onChange={handleChange("maintenance")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Assurance auto
            <input
              type="number"
              step="0.01"
              value={values.insurance}
              onChange={handleChange("insurance")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Immatriculation
            <input
              type="number"
              step="0.01"
              value={values.registration}
              onChange={handleChange("registration")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Stationnement / péages (total)
            <input
              type="number"
              step="0.01"
              value={values.parkingAndTolls}
              onChange={handleChange("parkingAndTolls")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Location / financement
            <input
              type="number"
              step="0.01"
              value={values.leaseOrLoan}
              onChange={handleChange("leaseOrLoan")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Autres dépenses
            <input
              type="number"
              step="0.01"
              value={values.other}
              onChange={handleChange("other")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Total dépenses véhicule (approx.) :{" "}
          <span className="font-medium">
            {totalExpensesFull.toFixed(2)} $
          </span>
        </p>
      </div>

      {/* Dépenses directes affaires */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">
          Dépenses directement liées au travail (déjà filtrées)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Essence affaires
            <input
              type="number"
              step="0.01"
              value={values.businessFuel}
              onChange={handleChange("businessFuel")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Entretien affaires
            <input
              type="number"
              step="0.01"
              value={values.businessMaintenance}
              onChange={handleChange("businessMaintenance")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Stationnement/péages affaires
            <input
              type="number"
              step="0.01"
              value={values.businessParkingAndTolls}
              onChange={handleChange("businessParkingAndTolls")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            Autres affaires
            <input
              type="number"
              step="0.01"
              value={values.businessOther}
              onChange={handleChange("businessOther")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
      </div>

      {/* Taxes sur les dépenses */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Taxes sur les dépenses</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-sm">
            GST payée (sur toutes les dépenses)
            <input
              type="number"
              step="0.01"
              value={values.gstOnExpenses}
              onChange={handleChange("gstOnExpenses")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            QST payée (sur toutes les dépenses)
            <input
              type="number"
              step="0.01"
              value={values.qstOnExpenses}
              onChange={handleChange("qstOnExpenses")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            GST sur dépenses 100% affaires
            <input
              type="number"
              step="0.01"
              value={values.gstOnBusinessExpenses}
              onChange={handleChange("gstOnBusinessExpenses")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="text-sm">
            QST sur dépenses 100% affaires
            <input
              type="number"
              step="0.01"
              value={values.qstOnBusinessExpenses}
              onChange={handleChange("qstOnBusinessExpenses")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          ITC estimé (GST):{" "}
          <span className="font-medium">
            {gstItcEstimate.toFixed(2)} $
          </span>{" "}
          — ITC estimé (QST):{" "}
          <span className="font-medium">
            {qstItcEstimate.toFixed(2)} $
          </span>
        </p>
      </div>

      {/* Résumé déductible */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          Dépenses partagées soumises au ratio (essence, entretien, assurance,
          immatriculation, location, autres) :{" "}
          <span className="font-medium">
            {sharedBase.toFixed(2)} $
          </span>
        </p>
        <p>
          Dépenses directes affaires :{" "}
          <span className="font-medium">
            {directBusiness.toFixed(2)} $
          </span>
        </p>
        <p>
          Total déductible estimé :{" "}
          <span className="font-semibold text-emerald-700">
            {deductibleTotal.toFixed(2)} $
          </span>
        </p>
      </div>

      <button
        type="submit"
        className="self-start px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Enregistrer la dépense véhicule
      </button>
    </form>
  );
};
