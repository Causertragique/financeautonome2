// src/components/TechExpensesForm.tsx
import React, { useMemo, useState } from "react";

export interface TechExpensesFormValues {
  periodStart: string;
  periodEnd: string;
  hardwareSmallEquipment: number;
  hardwareCapitalAssets: number;
  softwareLicenses: number;
  saasSubscriptions: number;
  internetTotal: number;
  internetBusinessRatio: number;
  phoneTotal: number;
  phoneBusinessRatio: number;
  otherTech: number;
}

export interface TechExpensesFormProps {
  initialValues?: Partial<TechExpensesFormValues>;
  onSubmit: (values: TechExpensesFormValues & {
    deductibleTotal: number;
    capitalizableHardware: number;
  }) => void;
}

const defaultValues: TechExpensesFormValues = {
  periodStart: "",
  periodEnd: "",
  hardwareSmallEquipment: 0,
  hardwareCapitalAssets: 0,
  softwareLicenses: 0,
  saasSubscriptions: 0,
  internetTotal: 0,
  internetBusinessRatio: 0.5,
  phoneTotal: 0,
  phoneBusinessRatio: 0.5,
  otherTech: 0,
};

export const TechExpensesForm: React.FC<TechExpensesFormProps> = ({
  initialValues,
  onSubmit,
}) => {
  const [values, setValues] = useState<TechExpensesFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  const internetRatio = Math.min(Math.max(values.internetBusinessRatio, 0), 1);
  const phoneRatio = Math.min(Math.max(values.phoneBusinessRatio, 0), 1);

  const deductibleTotal =
    values.hardwareSmallEquipment +
    values.softwareLicenses +
    values.saasSubscriptions +
    values.internetTotal * internetRatio +
    values.phoneTotal * phoneRatio +
    values.otherTech;

  const capitalizableHardware = values.hardwareCapitalAssets;

  const handleChange =
    (field: keyof TechExpensesFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numericFields: (keyof TechExpensesFormValues)[] = [
        "hardwareSmallEquipment",
        "hardwareCapitalAssets",
        "softwareLicenses",
        "saasSubscriptions",
        "internetTotal",
        "internetBusinessRatio",
        "phoneTotal",
        "phoneBusinessRatio",
        "otherTech",
      ];
      setValues((prev) => ({
        ...prev,
        [field]: numericFields.includes(field) ? Number(value || 0) : value,
      }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...values,
      deductibleTotal,
      capitalizableHardware,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 border border-border rounded-lg p-4 bg-card max-w-xl"
    >
      <h3 className="text-base font-semibold">Dépenses technologiques</h3>

      {/* Période */}
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

      {/* Hardware */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Matériel informatique</p>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Petit matériel (dépensé)
            <input
              type="number"
              value={values.hardwareSmallEquipment}
              onChange={handleChange("hardwareSmallEquipment")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Matériel capitalisable (CCA)
            <input
              type="number"
              value={values.hardwareCapitalAssets}
              onChange={handleChange("hardwareCapitalAssets")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
      </div>

      {/* Logiciels */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Logiciels & SaaS</p>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Licences
            <input
              type="number"
              value={values.softwareLicenses}
              onChange={handleChange("softwareLicenses")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Abonnements SaaS
            <input
              type="number"
              value={values.saasSubscriptions}
              onChange={handleChange("saasSubscriptions")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
      </div>

      {/* Internet & téléphone */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Communications</p>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Internet (total)
            <input
              type="number"
              value={values.internetTotal}
              onChange={handleChange("internetTotal")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Ratio business (0–1)
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={values.internetBusinessRatio}
              onChange={handleChange("internetBusinessRatio")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Téléphone (total)
            <input
              type="number"
              value={values.phoneTotal}
              onChange={handleChange("phoneTotal")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Ratio business (0–1)
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={values.phoneBusinessRatio}
              onChange={handleChange("phoneBusinessRatio")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          Internet affaires : {(internetRatio * 100).toFixed(0)}% — Cellulaire :{" "}
          {(phoneRatio * 100).toFixed(0)}%
        </p>
      </div>

      {/* Autres */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Autres dépenses techno</p>
        <label className="text-sm">
          Autres
          <input
            type="number"
            value={values.otherTech}
            onChange={handleChange("otherTech")}
            className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
          />
        </label>
      </div>

      {/* Résumé */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          Total déductible :{" "}
          <span className="text-emerald-700 font-semibold">
            {deductibleTotal.toFixed(2)} $
          </span>
        </p>

        <p>
          Capitalisable (CCA) :{" "}
          <span className="font-medium">
            {capitalizableHardware.toFixed(2)} $
          </span>
        </p>
      </div>

      <button
        type="submit"
        className="px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Ajouter
      </button>
    </form>
  );
};
