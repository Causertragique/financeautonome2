import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { useLanguage } from "../contexts/LanguageContext";
import { Plus, TrendingUp, TrendingDown, Target, DollarSign, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Budget() {
  const { t } = useLanguage();
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [budgets, setBudgets] = useState([
    {
      id: "1",
      category: "Alimentation",
      budgeted: 500,
      spent: 320,
      remaining: 180,
      period: "Mensuel",
    },
    {
      id: "2",
      category: "Transport",
      budgeted: 300,
      spent: 250,
      remaining: 50,
      period: "Mensuel",
    },
    {
      id: "3",
      category: "Loisirs",
      budgeted: 200,
      spent: 180,
      remaining: 20,
      period: "Mensuel",
    },
  ]);

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.budgeted, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Budget</h1>
        <p className="text-muted-foreground">
          Gérez vos budgets par catégorie et suivez vos dépenses
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBudgeted.toFixed(2)} $</div>
            <p className="text-xs text-muted-foreground">Ce mois</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépensé</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalSpent.toFixed(2)} $</div>
            <p className="text-xs text-muted-foreground">
              {((totalSpent / totalBudgeted) * 100).toFixed(0)}% du budget
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Restant</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalRemaining >= 0 ? "text-success" : "text-destructive"}`}>
              {totalRemaining.toFixed(2)} $
            </div>
            <p className="text-xs text-muted-foreground">Disponible</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des budgets */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budgets par catégorie</CardTitle>
              <CardDescription>Vue d'ensemble de vos budgets mensuels</CardDescription>
            </div>
            <Button onClick={() => setShowAddBudget(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un budget
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgets.map((budget) => {
              const percentage = (budget.spent / budget.budgeted) * 100;
              return (
                <div key={budget.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{budget.category}</h3>
                      <p className="text-sm text-muted-foreground">{budget.period}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{budget.spent.toFixed(2)} $ / {budget.budgeted.toFixed(2)} $</div>
                      <div className={`text-sm ${budget.remaining >= 0 ? "text-success" : "text-destructive"}`}>
                        {budget.remaining >= 0 ? "+" : ""}{budget.remaining.toFixed(2)} $ restant
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentage > 100 ? "bg-destructive" : percentage > 80 ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour ajouter un budget */}
      <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un budget</DialogTitle>
            <DialogDescription>
              Créez un nouveau budget pour une catégorie de dépenses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <Input id="category" placeholder="Ex: Alimentation" />
            </div>
            <div>
              <Label htmlFor="amount">Montant</Label>
              <Input id="amount" type="number" placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="period">Période</Label>
              <select id="period" className="w-full px-3 py-2 border rounded-lg">
                <option>Mensuel</option>
                <option>Hebdomadaire</option>
                <option>Annuel</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddBudget(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowAddBudget(false)}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

