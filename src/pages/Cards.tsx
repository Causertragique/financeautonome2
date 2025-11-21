import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, CreditCard, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
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

const cardTypes = [
  { value: "visa", label: "Visa", icon: "💳" },
  { value: "mastercard", label: "Mastercard", icon: "💳" },
  { value: "amex", label: "American Express", icon: "💳" },
  { value: "desjardins", label: "Desjardins", icon: "💳" },
];

export default function Cards() {
  const [showAddCard, setShowAddCard] = useState(false);
  const [cards, setCards] = useState<Array<{
    id: string;
    name: string;
    type: string;
    last4: string;
    balance: number;
    creditLimit: number;
    dueDate: string;
    institution: string;
    status: string;
  }>>([]);

  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
  const totalCreditLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
  const availableCredit = totalCreditLimit - totalBalance;

  const getCardTypeLabel = (type: string) => {
    return cardTypes.find(t => t.value === type)?.label || type;
  };

  const getUtilizationPercentage = (balance: number, limit: number) => {
    return limit > 0 ? (balance / limit) * 100 : 0;
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Cartes de crédit</h1>
        <p className="text-muted-foreground">
          Gérez vos cartes de crédit et suivez vos dépenses
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totalBalance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </div>
            <p className="text-xs text-muted-foreground">Sur {cards.length} carte{cards.length > 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crédit disponible</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {availableCredit.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </div>
            <p className="text-xs text-muted-foreground">
              {((availableCredit / totalCreditLimit) * 100).toFixed(0)}% disponible
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Limite totale</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCreditLimit.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            </div>
            <p className="text-xs text-muted-foreground">Toutes cartes confondues</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des cartes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes cartes</CardTitle>
              <CardDescription>Vue d'ensemble de vos cartes de crédit</CardDescription>
            </div>
            <Button onClick={() => setShowAddCard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une carte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cards.map((card) => {
              const utilization = getUtilizationPercentage(card.balance, card.creditLimit);
              return (
                <Card key={card.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-primary" />
                        <div>
                          <CardTitle className="text-lg">{card.name}</CardTitle>
                          <CardDescription>
                            {card.institution} • •••• {card.last4}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {card.status === "active" ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Solde</p>
                          <p className="text-xl font-bold">
                            {card.balance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Limite de crédit</p>
                          <p className="text-xl font-bold">
                            {card.creditLimit.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                          </p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-muted-foreground">Utilisation</p>
                          <p className="text-sm font-medium">{utilization.toFixed(0)}%</p>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          {/* Dynamic width requires CSS custom property - inline style is necessary for progress bar */}
                          <div
                            className={`h-full rounded-full transition-all progress-bar ${
                              utilization > 80 ? "bg-destructive" : utilization > 50 ? "bg-warning" : "bg-success"
                            }`}
                            style={{ "--progress-width": `${Math.min(utilization, 100)}%` } as React.CSSProperties & { "--progress-width": string }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date d'échéance</p>
                        <p className="font-medium">{new Date(card.dueDate).toLocaleDateString("fr-CA")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour ajouter une carte */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une carte de crédit</DialogTitle>
            <DialogDescription>
              Ajoutez une nouvelle carte de crédit à votre profil
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="card-name">Nom de la carte</Label>
              <Input id="card-name" placeholder="Ex: Visa Desjardins Cashback" />
            </div>
            <div>
              <Label htmlFor="card-type">Type de carte</Label>
              <select id="card-type" aria-label="Type de carte" className="w-full px-3 py-2 border rounded-lg">
                {cardTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="institution">Institution</Label>
              <Input id="institution" placeholder="Ex: Desjardins, RBC, Banque Nationale..." />
            </div>
            <div>
              <Label htmlFor="last4">4 derniers chiffres</Label>
              <Input id="last4" placeholder="1234" maxLength={4} />
            </div>
            <div>
              <Label htmlFor="credit-limit">Limite de crédit</Label>
              <Input id="credit-limit" type="number" step="0.01" placeholder="5000.00" />
            </div>
            <div>
              <Label htmlFor="balance">Solde actuel</Label>
              <Input id="balance" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCard(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowAddCard(false)}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

