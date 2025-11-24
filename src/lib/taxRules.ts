// Service pour charger et gérer les règles fiscales depuis tenulivreia.json

export interface TaxRules {
  meta: {
    version: string;
    jurisdiction: {
      country: string;
      province: string;
    };
    supported_entity_types: string[];
    currency: string;
    notes: string;
  };
  tax: {
    federal: {
      income_tax: any;
      sales_tax_GST: any;
      deductible_expenses: any;
      CCA_capital_cost_allowance: any;
    };
    provincial_quebec: {
      income_tax: any;
      sales_tax_QST: any;
      credits_incentives: any;
    };
  };
  bookkeeping_rules: {
    transaction_classification: any;
    expense_validation: any;
    mixed_use_rules: any;
    assets_and_depreciation: any;
  };
  workflows: {
    GST_QST_return: any;
    year_end_closure: any;
    anomaly_detection: any;
  };
}

let taxRulesCache: TaxRules | null = null;

/**
 * Charge les règles fiscales depuis le fichier JSON
 */
export async function loadTaxRules(): Promise<TaxRules> {
  if (taxRulesCache) {
    return taxRulesCache;
  }

  try {
    const response = await fetch('/tenulivreia.json');
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement des règles fiscales: ${response.statusText}`);
    }
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Le fichier tenulivreia.json est vide');
    }
    taxRulesCache = JSON.parse(text);
    return taxRulesCache;
  } catch (error) {
    console.error('Erreur lors du chargement des règles fiscales:', error);
    // Retourner des règles par défaut si le fichier ne peut pas être chargé
    console.warn('Utilisation de règles fiscales par défaut');
    taxRulesCache = getDefaultTaxRules();
    return taxRulesCache;
  }
}

/**
 * Règles fiscales par défaut si le fichier JSON ne peut pas être chargé
 */
function getDefaultTaxRules(): TaxRules {
  return {
    meta: {
      version: "2025-11-16",
      jurisdiction: {
        country: "Canada",
        province: "Quebec"
      },
      supported_entity_types: ["sole_proprietorship", "partnership", "corporation_CCPC"],
      currency: "CAD",
      notes: "Règles par défaut"
    },
    tax: {
      federal: {
        income_tax: {},
        sales_tax_GST: {
          rate: 0.05,
          small_supplier_threshold_last_12_months: 30000
        },
        deductible_expenses: {
          categories: [
            { code: "MEALS", default_deductible_ratio: 0.5 },
            { code: "TELECOM", default_deductible_ratio: 0.5 }
          ]
        },
        CCA_capital_cost_allowance: {
          classes: [
            { class: "8", description: "Mobilier, équipement général", rate_declining_balance: 0.2 },
            { class: "50", description: "Ordinateurs et matériel connexe", rate_declining_balance: 0.55 },
            { class: "12", description: "Logiciels", rate_declining_balance: 1.0 }
          ]
        }
      },
      provincial_quebec: {
        income_tax: {},
        sales_tax_QST: {
          rate: 0.09975,
          small_supplier_threshold_last_12_months: 30000
        },
        credits_incentives: {}
      }
    },
    bookkeeping_rules: {
      transaction_classification: {
        classification_logic_examples: []
      },
      expense_validation: {},
      mixed_use_rules: {
        phone_internet: { default_business_ratio: 0.5 }
      },
      assets_and_depreciation: {}
    },
    workflows: {
      GST_QST_return: {},
      year_end_closure: {},
      anomaly_detection: {
        rules: []
      }
    }
  };
}

/**
 * Obtient les règles fiscales (depuis le cache ou en les chargeant)
 */
export async function getTaxRules(): Promise<TaxRules> {
  if (taxRulesCache) {
    return taxRulesCache;
  }
  return await loadTaxRules();
}

/**
 * Classification automatique des transactions selon les règles
 */
export async function classifyTransaction(
  description: string,
  amount: number,
  accountType?: string
): Promise<{
  type: string;
  confidence: number;
  suggestedCategory?: string;
}> {
  const rules = await getTaxRules();
  const classificationRules = rules.bookkeeping_rules.transaction_classification.classification_logic_examples;

  // Analyser la description
  const descriptionLower = description.toLowerCase();
  
  // Règle IS_revenu
  const revenuKeywords = ['vente', 'client', 'facture', 'paiement', 'honoraire', 'commission'];
  const isrevenu = revenuKeywords.some(keyword => descriptionLower.includes(keyword)) && amount > 0;
  
  if (isrevenu) {
    return {
      type: 'revenu',
      confidence: 0.8,
      suggestedCategory: 'Revenus'
    };
  }

  // Règle IS_ASSET_PURCHASE
  const assetKeywords = ['ordinateur', 'équipement', 'mobilier', 'machine', 'logiciel'];
  const isAsset = assetKeywords.some(keyword => descriptionLower.includes(keyword)) && amount >= 500;
  
  if (isAsset) {
    return {
      type: 'asset_purchase',
      confidence: 0.7,
      suggestedCategory: 'Équipement'
    };
  }

  // Par défaut, considérer comme dépense si montant négatif ou si c'est une dépense
  if (amount < 0) {
    return {
      type: 'expense',
      confidence: 0.6,
      suggestedCategory: 'Autre'
    };
  }

  return {
    type: 'expense',
    confidence: 0.5,
    suggestedCategory: 'Autre'
  };
}

/**
 * Calcule les taxes GST/QST pour un montant
 */
export async function calculateTaxes(
  amount: number,
  isTaxable: boolean = true
): Promise<{
  gst: number;
  qst: number;
  total: number;
  amountBeforeTax: number;
}> {
  const rules = await getTaxRules();
  const gstRate = rules.tax.federal.sales_tax_GST.rate;
  const qstRate = rules.tax.provincial_quebec.sales_tax_QST.rate;

  if (!isTaxable) {
    return {
      gst: 0,
      qst: 0,
      total: amount,
      amountBeforeTax: amount
    };
  }

  // QST est calculée sur le montant incluant la GST
  const gst = amount * gstRate;
  const amountWithGst = amount + gst;
  const qst = amountWithGst * qstRate;
  const total = amount + gst + qst;

  return {
    gst,
    qst,
    total,
    amountBeforeTax: amount
  };
}

/**
 * Vérifie si l'entreprise doit s'enregistrer pour GST/QST
 */
export async function shouldRegisterForTaxes(
  taxablerevenuLast12Months: number
): Promise<{
  gstRequired: boolean;
  qstRequired: boolean;
}> {
  const rules = await getTaxRules();
  const threshold = rules.tax.federal.sales_tax_GST.small_supplier_threshold_last_12_months;

  return {
    gstRequired: taxablerevenuLast12Months > threshold,
    qstRequired: taxablerevenuLast12Months > threshold
  };
}

/**
 * Valide une dépense selon les règles fiscales
 */
export async function validateExpense(expense: {
  amount: number;
  category: string;
  description: string;
  date: string;
  hasReceipt: boolean;
  businessPurpose?: string;
}): Promise<{
  isValid: boolean;
  warnings: string[];
  deductibleRatio: number;
}> {
  const rules = await getTaxRules();
  const validationRules = rules.bookkeeping_rules.expense_validation;
  const warnings: string[] = [];
  let deductibleRatio = 1.0;

  // Vérifier les flags requis
  if (!expense.hasReceipt) {
    warnings.push('Reçu manquant - peut affecter la déductibilité fiscale');
  }

  if (!expense.businessPurpose) {
    warnings.push('Objectif commercial non spécifié');
  }

  // Vérifier les règles d'usage mixte
  const mixedUseRules = rules.bookkeeping_rules.mixed_use_rules;
  
  // Télécommunications (50% par défaut)
  if (expense.category.toLowerCase().includes('téléphone') || 
      expense.category.toLowerCase().includes('internet') ||
      expense.category.toLowerCase().includes('cellulaire')) {
    deductibleRatio = mixedUseRules.phone_internet.default_business_ratio;
    warnings.push(`Usage mixte détecté - ratio déductible par défaut: ${(deductibleRatio * 100).toFixed(0)}%`);
  }

  // Repas et divertissement (50% par défaut)
  if (expense.category.toLowerCase().includes('repas') || 
      expense.category.toLowerCase().includes('divertissement')) {
    deductibleRatio = 0.5;
    warnings.push('Repas et divertissement - limité à 50% du montant admissible');
  }

  const isValid = expense.hasReceipt && !!expense.businessPurpose;

  return {
    isValid,
    warnings,
    deductibleRatio
  };
}

/**
 * Détecte les anomalies dans les transactions
 */
export async function detectAnomalies(transactions: Array<{
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  type: string;
}>): Promise<Array<{
  transactionId: string;
  anomalyType: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}>> {
  const rules = await getTaxRules();
  const anomalyRules = rules.workflows.anomaly_detection.rules;
  const anomalies: Array<{
    transactionId: string;
    anomalyType: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }> = [];

  // Calculer les médianes par catégorie
  const categoryAmounts: { [key: string]: number[] } = {};
  transactions.forEach(t => {
    if (t.type === 'expense') {
      if (!categoryAmounts[t.category]) {
        categoryAmounts[t.category] = [];
      }
      categoryAmounts[t.category].push(Math.abs(t.amount));
    }
  });

  // Détecter les valeurs aberrantes (EXPENSE_OUTLIER)
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      const amounts = categoryAmounts[transaction.category] || [];
      if (amounts.length > 0) {
        const sorted = [...amounts].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const amount = Math.abs(transaction.amount);
        
        if (amount > median * 3) {
          anomalies.push({
            transactionId: transaction.id,
            anomalyType: 'EXPENSE_OUTLIER',
            description: `Dépense significativement plus élevée que la médiane pour la catégorie "${transaction.category}"`,
            severity: 'medium'
          });
        }
      }
    }
  });

  return anomalies;
}

/**
 * Obtient les catégories de dépenses déductibles avec leurs ratios
 */
export async function getDeductibleExpenseCategories(): Promise<Array<{
  code: string;
  label: string;
  defaultDeductibleRatio: number;
  examples: string[];
}>> {
  const rules = await getTaxRules();
  return rules.tax.federal.deductible_expenses.categories.map((cat: any) => ({
    code: cat.code,
    label: cat.label,
    defaultDeductibleRatio: cat.default_deductible_ratio || 1.0,
    examples: cat.examples || []
  }));
}

/**
 * Obtient les classes CCA (amortissement)
 */
export async function getCCAClasses(): Promise<Array<{
  class: string;
  description: string;
  rate: number;
  costLimit?: number;
}>> {
  const rules = await getTaxRules();
  return rules.tax.federal.CCA_capital_cost_allowance.classes.map((cls: any) => ({
    class: cls.class,
    description: cls.description,
    rate: cls.rate_declining_balance,
    costLimit: cls.cost_limit
  }));
}

