// src/components/HomeOfficeForm.tsx
import React, { useMemo, useState } from "react";

export interface HomeOfficeFormValues {
  periodStart: string;
  periodEnd: string;
  totalArea: number;
  officeArea: number;
  rent: number;
  electricityHeating: number;
  condoFees: number;
  propertyTaxes: number;
  homeInsurance: number;
  other: number;
}

export interface HomeOfficeFormProps {
  initialValues?: Partial<HomeOfficeFormValues>;
  onSubmit: (values: HomeOfficeFormValues & {
    businessAreaRatio: number;
    deductibleTotal: number;
  }) => void;
}

const defaultValues: HomeOfficeFormValues = {
  periodStart: "",
  periodEnd: "",
  totalArea: 0,
  officeArea: 0,
  rent: 0,
  electricityHeating: 0,
  condoFees: 0,
  propertyTaxes: 0,
  homeInsurance: 0,
  other: 0,
};

export const HomeOfficeForm: React.FC<HomeOfficeFormProps> = ({
  initialValues,
  onSubmit,
}) => {
  const [values, setValues] = useState<HomeOfficeFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  const businessAreaRatio = useMemo(() => {
    if (!values.totalArea || values.totalArea <= 0) return 0;
    const ratio = values.officeArea / values.totalArea;
    return Math.min(Math.max(ratio, 0), 1);
  }, [values.officeArea, values.totalArea]);

  const totalBase =
    values.rent +
    values.electricityHeating +
    values.condoFees +
    values.propertyTaxes +
    values.homeInsurance +
    values.other;

  const deductibleTotal = totalBase * businessAreaRatio;

  const handleChange =
    (field: keyof HomeOfficeFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numericFields: (keyof HomeOfficeFormValues)[] = [
        "totalArea",
        "officeArea",
        "rent",
        "electricityHeating",
        "condoFees",
        "propertyTaxes",
        "homeInsurance",
        "other",
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
      businessAreaRatio,
      deductibleTotal,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 border border-border rounded-lg p-4 bg-card max-w-xl"
    >
      <h3 className="text-base font-semibold">Bureau à domicile</h3>

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

      {/* Superficies */}
      <div className="grid gap-2">
        <div className="flex gap-2">
          <label className="flex-1 text-sm">
            Superficie totale (pi²)
            <input
              type="number"
              min={0}
              value={values.totalArea}
              onChange={handleChange("totalArea")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
          <label className="flex-1 text-sm">
            Superficie du bureau (pi²)
            <input
              type="number"
              min={0}
              value={values.officeArea}
              onChange={handleChange("officeArea")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Ratio affaires :{" "}
          <span className="font-medium">
            {(businessAreaRatio * 100).toFixed(1)}%
          </span>
        </p>
      </div>

      {/* Dépenses d’habitation */}
      <div className="grid gap-2">
        <p className="text-sm font-medium">Dépenses d’habitation</p>

        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm">
            Loyer
            <input
              type="number"
              value={values.rent}
              onChange={handleChange("rent")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Électricité / chauffage
            <input
              type="number"
              value={values.electricityHeating}
              onChange={handleChange("electricityHeating")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Frais de condo
            <input
              type="number"
              value={values.condoFees}
              onChange={handleChange("condoFees")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Taxes municipales / scolaires
            <input
              type="number"
              value={values.propertyTaxes}
              onChange={handleChange("propertyTaxes")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Assurance habitation
            <input
              type="number"
              value={values.homeInsurance}
              onChange={handleChange("homeInsurance")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>

          <label className="text-sm">
            Autres
            <input
              type="number"
              value={values.other}
              onChange={handleChange("other")}
              className="mt-1 w-full border border-input rounded-md px-2 py-1 text-sm bg-background"
            />
          </label>
        </div>

        <div className="text-xs text-muted-foreground">
          Total période :{" "}
          <span className="font-medium">{totalBase.toFixed(2)} $</span>
        </div>

        <div className="text-xs text-muted-foreground">
          Déductible (approx.) :{" "}
          <span className="font-semibold text-emerald-700">
            {deductibleTotal.toFixed(2)} $
          </span>
        </div>
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
