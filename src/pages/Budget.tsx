import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, Trash2, Calendar, DollarSign, ChevronDown, X } from "lucide-react";
import { format, addWeeks, addMonths, isBefore } from "date-fns";

/* -----------------------------------------------------
   Types
----------------------------------------------------- */
type RecurrenceType =
  | "none"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "yearly";

interface FixedExpense {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate?: string;
  recurrence: RecurrenceType;
}

interface VariableExpense {
  id: string;
  name: string;
  amount: number;
  date: string;
}

/* -----------------------------------------------------
   Recurrence Logic
----------------------------------------------------- */
function generateRecurrenceEvents(exp: FixedExpense): Array<{ date: string; name: string; amount: number }> {
  const results: any[] = [];
  let current = new Date(exp.startDate);
  const end = exp.endDate ? new Date(exp.endDate) : addMonths(new Date(), 6);

  const add = (d: Date) => results.push({ date: format(d, "yyyy-MM-dd"), name: exp.name, amount: exp.amount });

  add(current);

  while (isBefore(current, end)) {
    switch (exp.recurrence) {
      case "weekly":
        current = addWeeks(current, 1);
        break;
      case "biweekly":
        current = addWeeks(current, 2);
        break;
      case "monthly":
        current = addMonths(current, 1);
        break;
      case "bimonthly":
        current = addMonths(current, 2);
        break;
      case "quarterly":
        current = addMonths(current, 3);
        break;
      case "yearly":
        current = addMonths(current, 12);
        break;
      default:
        return results;
    }
    add(current);
  }

  return results;
}

/* -----------------------------------------------------
   UI Component
----------------------------------------------------- */
export default function Budget() {
  const [salaryType, setSalaryType] = useState<"annual" | "biweekly">("annual");
  const [salary, setSalary] = useState(0);
  const [salaryStartDate, setSalaryStartDate] = useState("");

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>([]);

  const [showFixedModal, setShowFixedModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);

  const [editFixed, setEditFixed] = useState<FixedExpense | null>(null);
  const [editVariable, setEditVariable] = useState<VariableExpense | null>(null);

  /* -------------------------------
     Derived Calculations
  ------------------------------- */
  const annualIncome =
    salaryType === "annual"
      ? salary
      : ((salary * 26)); // 26 périodes aux 2 semaines

  const monthlyIncome = annualIncome / 12;

  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVariable = variableExpenses.reduce((sum, e) => sum + e.amount, 0);

  const balance = monthlyIncome - (totalFixed + totalVariable);

  /* -------------------------------
     Calendar Generation
  ------------------------------- */
  const calendarEvents = [
    ...fixedExpenses.flatMap((exp) => generateRecurrenceEvents(exp)),
    ...variableExpenses.map((v) => ({ date: v.date, name: v.name, amount: v.amount })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  /* -------------------------------
     Save Fixed Expense
  ------------------------------- */
  const handleSaveFixed = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const exp: FixedExpense = {
      id: editFixed?.id || crypto.randomUUID(),
      name: data.get("name") as string,
      amount: parseFloat(data.get("amount") as string),
      startDate: data.get("startDate") as string,
      endDate: data.get("endDate") as string || undefined,
      recurrence: data.get("recurrence") as RecurrenceType,
    };

    if (editFixed) {
      setFixedExpenses((prev) => prev.map((f) => (f.id === editFixed.id ? exp : f)));
    } else {
      setFixedExpenses((prev) => [...prev, exp]);
    }

    setShowFixedModal(false);
    setEditFixed(null);
  };

  /* -------------------------------
     Save Variable Expense
  ------------------------------- */
  const handleSaveVariable = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const exp: VariableExpense = {
      id: editVariable?.id || crypto.randomUUID(),
      name: data.get("name") as string,
      amount: parseFloat(data.get("amount") as string),
      date: data.get("date") as string,
    };

    if (editVariable) {
      setVariableExpenses((prev) => prev.map((v) => (v.id === editVariable.id ? exp : v)));
    } else {
      setVariableExpenses((prev) => [...prev, exp]);
    }

    setShowVariableModal(false);
    setEditVariable(null);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Budget personnel</h1>
        <p className="text-muted-foreground">Gestion complète de vos revenus et dépenses</p>
      </div>

      {/* -----------------------------------------------------
         REVENUS
      ----------------------------------------------------- */}
      <div className="p-4 border rounded-lg mb-6">
        <h2 className="font-semibold text-lg mb-3">Revenu</h2>

        <div className="flex gap-4">
          <select
            className="border p-2 rounded"
            value={salaryType}
            onChange={(e) => setSalaryType(e.target.value as any)}
            aria-label="Type de salaire"
          >
            <option value="annual">Salaire annuel</option>
            <option value="biweekly">Salaire aux 2 semaines</option>
          </select>

          <input
            type="number"
            placeholder="0.00"
            className="border p-2 rounded"
            value={salary}
            onChange={(e) => setSalary(parseFloat(e.target.value))}
            aria-label="Montant du salaire"
          />

          {salaryType === "biweekly" && (
            <input
              type="date"
              className="border p-2 rounded"
              value={salaryStartDate}
              onChange={(e) => setSalaryStartDate(e.target.value)}
              aria-label="Date de début du salaire"
            />
          )}
        </div>

        <div className="text-sm mt-3">
          <p><strong>Revenu annuel :</strong> {annualIncome.toFixed(2)} $</p>
          <p><strong>Revenu mensuel :</strong> {monthlyIncome.toFixed(2)} $</p>
        </div>
      </div>

      {/* -----------------------------------------------------
         DÉPENSES FIXES
      ----------------------------------------------------- */}
      <div className="p-4 border rounded-lg mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Dépenses fixes</h2>
          <button className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
            onClick={() => { setEditFixed(null); setShowFixedModal(true); }}>
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {fixedExpenses.length === 0 ? (
          <p className="text-muted-foreground">Aucune dépense fixe enregistrée.</p>
        ) : (
          <div className="space-y-3">
            {fixedExpenses.map((exp) => (
              <div key={exp.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{exp.name}</p>
                  <p className="text-sm">{exp.amount.toFixed(2)} $ / période</p>
                  <p className="text-xs text-muted-foreground">
                    Début : {exp.startDate} &middot; Récurrence : {exp.recurrence}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="p-2 border rounded"
                    onClick={() => { setEditFixed(exp); setShowFixedModal(true); }}>
                    Modifier
                  </button>
                  <button
                    className="p-2 rounded border border-destructive text-destructive"
                    onClick={() => setFixedExpenses((prev) => prev.filter((f) => f.id !== exp.id))}
                    aria-label="Supprimer cette dépense fixe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -----------------------------------------------------
         DÉPENSES VARIABLES
      ----------------------------------------------------- */}
      <div className="p-4 border rounded-lg mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-lg">Dépenses variables</h2>
          <button
            onClick={() => { setEditVariable(null); setShowVariableModal(true); }}
            className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {variableExpenses.length === 0 ? (
          <p className="text-muted-foreground">Aucune dépense variable.</p>
        ) : (
          <div className="space-y-3">
            {variableExpenses.map((exp) => (
              <div key={exp.id} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <p className="font-semibold">{exp.name}</p>
                  <p className="text-sm">{exp.amount.toFixed(2)} $</p>
                  <p className="text-xs text-muted-foreground">Date : {exp.date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 border rounded"
                    onClick={() => { setEditVariable(exp); setShowVariableModal(true); }}>
                    Modifier
                  </button>
                  <button
                    className="p-2 rounded border border-destructive text-destructive"
                    onClick={() => setVariableExpenses((prev) => prev.filter((v) => v.id !== exp.id))}
                    aria-label="Supprimer cette dépense variable"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -----------------------------------------------------
         CALENDRIER
      ----------------------------------------------------- */}
      <div className="p-4 border rounded-lg mb-6">
        <h2 className="font-semibold text-lg mb-3">Calendrier des dépenses</h2>

        {calendarEvents.length === 0 ? (
          <p className="text-muted-foreground">Aucune dépense planifiée.</p>
        ) : (
          <div className="space-y-2">
            {calendarEvents.map((ev, i) => (
              <div key={i} className="p-3 border rounded flex justify-between">
                <span>{ev.date}</span>
                <span>{ev.name}</span>
                <span>{ev.amount.toFixed(2)} $</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* -----------------------------------------------------
         MODAL — Fixed Expense
      ----------------------------------------------------- */}
      {showFixedModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editFixed ? "Modifier une dépense fixe" : "Ajouter une dépense fixe"}
            </h2>

            <form onSubmit={handleSaveFixed} className="space-y-4">
              <input
                name="name"
                defaultValue={editFixed?.name}
                placeholder="Nom"
                className="border p-2 rounded w-full"
                required
              />

              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={editFixed?.amount}
                placeholder="Montant"
                className="border p-2 rounded w-full"
                required
              />

              <input
                name="startDate"
                type="date"
                defaultValue={editFixed?.startDate}
                className="border p-2 rounded w-full"
                aria-label="Date de début"
                required
              />

              <input
                name="endDate"
                type="date"
                defaultValue={editFixed?.endDate}
                className="border p-2 rounded w-full"
                aria-label="Date de fin"
              />

              <select
                name="recurrence"
                defaultValue={editFixed?.recurrence || "monthly"}
                className="border p-2 rounded w-full"
                aria-label="Fréquence de récurrence"
              >
                <option value="none">Aucune</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="biweekly">Aux 2 semaines</option>
                <option value="monthly">Mensuel</option>
                <option value="bimonthly">Aux 2 mois</option>
                <option value="quarterly">Trimestriel</option>
                <option value="yearly">Annuel</option>
              </select>

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" className="p-2 border rounded" onClick={() => setShowFixedModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="p-2 bg-primary text-white rounded">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------
         MODAL — Variable Expense
      ----------------------------------------------------- */}
      {showVariableModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">
              {editVariable ? "Modifier une dépense variable" : "Ajouter une dépense variable"}
            </h2>

            <form onSubmit={handleSaveVariable} className="space-y-4">
              <input
                name="name"
                defaultValue={editVariable?.name}
                placeholder="Nom"
                className="border p-2 rounded w-full"
                required
              />

              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={editVariable?.amount}
                placeholder="Montant"
                className="border p-2 rounded w-full"
                required
              />

              <input
                name="date"
                type="date"
                defaultValue={editVariable?.date}
                className="border p-2 rounded w-full"
                aria-label="Date"
                required
              />

              <div className="flex justify-end gap-2 pt-4">
                <button type="button" className="p-2 border rounded" onClick={() => setShowVariableModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="p-2 bg-primary text-white rounded">
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
