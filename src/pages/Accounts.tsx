import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, Wallet, Building2, TrendingUp, ArrowRightLeft } from "lucide-react";
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

// Types de comptes bancaires courants au Québec
const accountTypes = [
  { value: "cheque", label: "Compte chèque", icon: "💳" },
  { value: "epargne", label: "Compte épargne", icon: "💰" },
  { value: "celi", label: "CELI (Compte d'épargne libre d'impôt)", icon: "📈" },
  { value: "reer", label: "REER (Régime enregistré d'épargne-retraite)", icon: "🏦" },
  { value: "reer_employeur", label: "REER collectif (employeur)", icon: "🏢" },
  { value: "celiapp", label: "CELIAPP (Compte d'épargne libre d'impôt pour l'achat d'une première propriété)", icon: "🏠" },
  { value: "reee", label: "REEE (Régime enregistré d'épargne-études)", icon: "🎓" },
  { value: "marge", label: "Marge de crédit", icon: "💵" },
  { value: "hypotheque", label: "Hypothèque", icon: "🏡" },
];

export default function Accounts() {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accounts, setAccounts] = useState<Array<{
    id: string;
    name: string;
    type: string;
    institution: string;
    balance: number;
    accountNumber: string;
  }>>([]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const getAccountTypeLabel = (type: string) => {
    return accountTypes.find(t => t.value === type)?.label || type;
  };

  const getAccountTypeIcon = (type: string) => {
    return accountTypes.find(t => t.value === type)?.icon || "💳";
  };

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Comptes</h1>
        <p className="text-muted-foreground">
          Gérez tous vos comptes bancaires et produits financiers
        </p>
      </div>

      {/* Solde total */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Solde total</CardTitle>
          <CardDescription>Somme de tous vos comptes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-foreground">
            {totalBalance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
          </div>
        </CardContent>
      </Card>

      {/* Liste des comptes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes comptes</CardTitle>
              <CardDescription>Vue d'ensemble de vos comptes bancaires</CardDescription>
            </div>
            <Button onClick={() => setShowAddAccount(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un compte
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getAccountTypeIcon(account.type)}</span>
                      <div>
                        <CardTitle className="text-lg">{account.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {account.institution} • {account.accountNumber}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">{getAccountTypeLabel(account.type)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Solde</p>
                      <p className="text-2xl font-bold">
                        {account.balance.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <ArrowRightLeft className="w-4 h-4 mr-1" />
                        Transactions
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Détails
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour ajouter un compte */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un compte</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau compte bancaire ou produit financier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="account-name">Nom du compte</Label>
              <Input id="account-name" placeholder="Ex: Compte chèque principal" />
            </div>
            <div>
              <Label htmlFor="account-type">Type de compte</Label>
              <select id="account-type" aria-label="Type de compte" className="w-full px-3 py-2 border rounded-lg">
                {accountTypes.map((type) => (
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
            <div>
              <Label htmlFor="account-number">Numéro de compte (optionnel)</Label>
              <Input id="account-number" placeholder="****1234" />
            </div>
            <div>
              <Label htmlFor="balance">Solde initial</Label>
              <Input id="balance" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)}>
              Annuler
            </Button>
            <Button onClick={() => setShowAddAccount(false)}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

