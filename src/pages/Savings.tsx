import React, { useState, useRef, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, PiggyBank, TrendingUp, Target, Calendar, Info } from "lucide-react";
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

// Composant ProgressBar sans style inline
const ProgressBar = ({ progress, className = "" }: { progress: number; className?: string }) => {
  const barRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty("--progress-width", `${Math.min(progress, 100)}%`);
    }
  }, [progress]);
  
  return (
    <div
      ref={barRef}
      className={`h-2 rounded-full transition-all progress-bar ${className}`}
    />
  );
};

// Produits d'épargne courants au Québec
const savingsTypes = [
  { 
    value: "celi", 
    label: "CELI (Compte d'épargne libre d'impôt)", 
    icon: "📈",
    description: "Contribution maximale: 95 000 $ (2025). Gains non imposables.",
    maxContribution: 95000,
  },
  { 
    value: "reer", 
    label: "REER (Régime enregistré d'épargne-retraite)", 
    icon: "🏦",
    description: "Déductible d'impôt. Plafond: 18% du revenu gagné ou 32 490 $ (2025).",
    maxContribution: 32490,
  },
  { 
    value: "celiapp", 
    label: "CELIAPP (Compte d'épargne libre d'impôt pour l'achat d'une première propriété)", 
    icon: "🏠",
    description: "Maximum 8 000 $ par année, plafond de 40 000 $ à vie.",
    maxContribution: 40000,
  },
  { 
    value: "reee", 
    label: "REEE (Régime enregistré d'épargne-études)", 
    icon: "🎓",
    description: "Subvention gouvernementale jusqu'à 500 $ par année. Maximum 50 000 $ par bénéficiaire.",
    maxContribution: 50000,
  },
  { 
    value: "epargne_taxable", 
    label: "Compte épargne taxable", 
    icon: "💰",
    description: "Compte d'épargne standard, gains imposables.",
    maxContribution: null,
  },
  { 
    value: "epargne_urgence", 
    label: "Fonds d'urgence", 
    icon: "🚨",
    description: "Épargne pour les urgences (3-6 mois de dépenses).",
    maxContribution: null,
  },
];

export default function Savings() {
  const [showAddSaving, setShowAddSaving] = useState(false);
  const [savings, setSavings] = useState([
    {
      id: "1",
      name: "CELI principal",
      type: "celi",
      balance: 25000,
      contribution: 25000,
      target: 50000,
      institution: "Desjardins",
      annualContribution: 7000,
    },
    {
      id: "2",
      name: "REER retraite",
      type: "reer",
      balance: 45000,
      contribution: 45000,
      target: 100000,
      institution: "RBC",
      annualContribution: 6000,
    },
    {
      id: "3",
      name: "Fonds d'urgence",
      type: "epargne_urgence",
      balance: 15000,
      contribution: 15000,
      target: 20000,
      institution: "Banque Nationale",
      annualContribution: 0,
    },
  ]);

  const totalSavings = savings.reduce((sum, s) => sum + s.balance, 0);
  const totalTarget = savings.reduce((sum, s) => sum + s.target, 0);
  const progressPercentage = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0;

  const getSavingsTypeInfo = (type: string) => {
    return savingsTypes.find(t => t.value === type) || savingsTypes[0];
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Épargne</h1>
        <p className="text-muted-foreground">
          Gérez vos comptes d'épargne et produits financiers québécois
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Épargne totale</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSavings.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </div>
            <p className="text-xs text-muted-foreground">Sur {savings.length} compte{savings.length > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objectif total</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalTarget.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </div>
            <p className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(0)}% atteint
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reste à épargner</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {(totalTarget - totalSavings).toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </div>
            <p className="text-xs text-muted-foreground">Pour atteindre l'objectif</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des comptes d'épargne */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes comptes d'épargne</CardTitle>
              <CardDescription>Vue d'ensemble de vos produits d'épargne</CardDescription>
            </div>
            <Button onClick={() => setShowAddSaving(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un compte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savings.map((saving) => {
              const typeInfo = getSavingsTypeInfo(saving.type);
              const progress = saving.target > 0 ? (saving.balance / saving.target) * 100 : 0;
              const contributionProgress = typeInfo.maxContribution 
                ? (saving.contribution / typeInfo.maxContribution) * 100 
                : null;

              return (
                <Card key={saving.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{typeInfo.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{saving.name}</CardTitle>
                          <CardDescription>
                            {saving.institution} • {typeInfo.label}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Solde actuel</p>
                          <p className="text-2xl font-bold">
                            {saving.balance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Objectif</p>
                          <p className="text-2xl font-bold">
                            {saving.target.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-muted-foreground">Progression vers l'objectif</p>
                          <p className="text-sm font-medium">{progress.toFixed(0)}%</p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <ProgressBar progress={Math.min(progress, 100)} className="bg-success" />
                        </div>
                      </div>

                      {contributionProgress !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm text-muted-foreground">
                              Contribution: {saving.contribution.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })} / {typeInfo.maxContribution?.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                            </p>
                            <p className="text-sm font-medium">{contributionProgress.toFixed(0)}%</p>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <ProgressBar
                              progress={Math.min(contributionProgress, 100)}
                              className={
                                contributionProgress >= 100 ? "bg-destructive" : contributionProgress > 80 ? "bg-warning" : "bg-primary"
                              }
                            />
                          </div>
                        </div>
                      )}

                      {saving.annualContribution > 0 && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">Contribution annuelle prévue</p>
                          <p className="font-semibold">
                            {saving.annualContribution.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                          </p>
                        </div>
                      )}

                      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-900 dark:text-blue-100">{typeInfo.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour ajouter un compte d'épargne */}
      <Dialog open={showAddSaving} onOpenChange={setShowAddSaving}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un compte d'épargne</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau produit d'épargne à votre profil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="saving-name">Nom du compte</Label>
              <Input id="saving-name" placeholder="Ex: CELI principal" />
            </div>
            <div>
              <Label htmlFor="saving-type">Type de compte</Label>
              <select id="saving-type" aria-label="Type de compte" className="w-full px-3 py-2 border rounded-lg">
                {savingsTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="institution">Institution financière</Label>
              <Input id="institution" placeholder="Ex: Desjardins, Banque Nationale, RBC..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="balance">Solde actuel</Label>
                <Input id="balance" type="number" step="0.01" placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="target">Objectif (optionnel)</Label>
                <Input id="target" type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label htmlFor="annual-contribution">Contribution annuelle prévue (optionnel)</Label>
              <Input id="annual-contribution" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSaving(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowAddSaving(false)}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

