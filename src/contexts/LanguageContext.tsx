import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "fr" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  fr: {
    // Dashboard
    "dashboard.title": "Bonjour ! 👋",
    "dashboard.subtitle": "Voici un aperçu de votre situation financière aujourd'hui",
    "dashboard.revenue": "Revenus totaux",
    "dashboard.expenses": "Dépenses totales",
    "dashboard.income": "Revenu net",
    "dashboard.margin": "Marge bénéficiaire",
    "dashboard.revenueVsExpenses": "Revenus vs Dépenses",
    "dashboard.expenseCategories": "Catégories de dépenses",
    "dashboard.monthlyBreakdown": "Répartition mensuelle",
    "dashboard.recentTransactions": "Transactions récentes",
    "dashboard.viewAll": "Voir tout",
    "dashboard.vsLastPeriod": "vs période précédente",
    "dashboard.date": "Date",
    "dashboard.description": "Description",
    "dashboard.category": "Catégorie",
    "dashboard.type": "Type",
    "dashboard.amount": "Montant",
    "dashboard.incomeType": "Revenu",
    "dashboard.expenseType": "Dépense",
    "dashboard.periodThisMonth": "Ce mois",
    "dashboard.periodThisQuarter": "Ce trimestre",
    "dashboard.periodYearToDate": "Année en cours",
    "dashboard.periodAllTime": "Tout",
    "dashboard.moreFilters": "Plus de filtres",
    "dashboard.revenueLabel": "Revenus",
    "dashboard.expensesLabel": "Dépenses",
    
    // Dashboard - Months
    "dashboard.monthJan": "Jan",
    "dashboard.monthFeb": "Fév",
    "dashboard.monthMar": "Mar",
    "dashboard.monthApr": "Avr",
    "dashboard.monthMay": "Mai",
    "dashboard.monthJun": "Jun",
    "dashboard.monthJul": "Jul",
    "dashboard.monthAug": "Aoû",
    "dashboard.monthSep": "Sep",
    "dashboard.monthOct": "Oct",
    "dashboard.monthNov": "Nov",
    "dashboard.monthDec": "Déc",
    
    // Dashboard - Expense Categories
    "dashboard.categorySalaries": "Salaires",
    "dashboard.categoryOfficeSupplies": "Fournitures de bureau",
    "dashboard.categoryTravel": "Voyage",
    "dashboard.categoryEquipment": "Équipement",
    "dashboard.categoryOther": "Autre",
    
    // Dashboard - Transaction Categories
    "dashboard.transactionCategoryConsulting": "Conseil",
    "dashboard.transactionCategoryOfficeSupplies": "Fournitures de bureau",
    "dashboard.transactionCategoryMealsEntertainment": "Repas et divertissement",
    "dashboard.transactionCategorySoftware": "Logiciel",
    
    // Dashboard - Transaction Descriptions
    "dashboard.transactionClientInvoice": "Facture client",
    "dashboard.transactionOfficeSupplies": "Fournitures de bureau",
    "dashboard.transactionTeamLunch": "Déjeuner d'équipe",
    "dashboard.transactionSoftwareLicense": "Licence logicielle",
    "dashboard.transactionFreelancePayment": "Paiement freelance",
    
    // Settings
    "settings.title": "Paramètres",
    "settings.subtitle": "Gérez vos préférences de compte et d'application.",
    "settings.general": "Général",
    "settings.account": "Compte",
    "settings.notifications": "Notifications",
    "settings.billing": "Facturation",
    "settings.language": "Langue",
    "settings.languageDescription": "Choisissez la langue d'affichage de l'application",
    "settings.save": "Enregistrer les modifications",
    
    // Sidebar
    "sidebar.dashboard": "Tableau de bord",
    "sidebar.companies": "Entreprises",
    "sidebar.transactions": "Transactions",
    "sidebar.accounting": "Comptabilité",
    "sidebar.taxFiling": "Déclaration fiscale",
    "sidebar.reports": "Rapports",
    "sidebar.anomalies": "Anomalies",
    "sidebar.assets": "Actifs",
    "sidebar.settings": "Paramètres",
    "sidebar.brand": "NovaFinance",
    "sidebar.tagline": "Gestion Financière",
    "sidebar.footer": "© 2024 NovaFinance",
    "sidebar.footerTagline": "La finance simplifiée ✨",
    
    // Header
    "header.search": "Rechercher transactions, entreprises...",
    "header.user": "Utilisateur",
    "header.admin": "Admin",
    
    // Settings - General
    "settings.generalSettings": "Paramètres généraux",
    "settings.defaultCurrency": "Devise par défaut",
    "settings.fiscalYearStart": "Début de l'année fiscale",
    "settings.theme": "Thème",
    "settings.themeLight": "Clair",
    "settings.themeDark": "Sombre",
    "settings.currencyCAD": "Dollar canadien (CAD)",
    "settings.currencyUSD": "Dollar américain (USD)",
    "settings.currencyEUR": "Euro (EUR)",
    "settings.monthJanuary": "Janvier",
    "settings.monthApril": "Avril",
    "settings.monthJuly": "Juillet",
    
    // Settings - Account
    "settings.accountSettings": "Paramètres du compte",
    "settings.fullName": "Nom complet",
    "settings.email": "Email",
    "settings.phone": "Téléphone",
    "settings.updateAccount": "Mettre à jour le compte",
    
    // Settings - Notifications
    "settings.notificationPreferences": "Préférences de notification",
    "settings.taxDeadlineReminders": "Rappels d'échéances fiscales",
    "settings.taxDeadlineDesc": "Recevoir des notifications sur les échéances fiscales à venir",
    "settings.monthlyReports": "Rapports mensuels",
    "settings.monthlyReportsDesc": "Recevoir des résumés financiers mensuels",
    "settings.largeTransactions": "Transactions importantes",
    "settings.largeTransactionsDesc": "Notifier pour les transactions supérieures à 5 000 $",
    "settings.systemUpdates": "Mises à jour système",
    "settings.systemUpdatesDesc": "Recevoir des notifications sur les mises à jour de l'application",
    
    // Settings - Billing
    "settings.billingSubscription": "Facturation et abonnement",
    "settings.currentPlan": "Plan actuel",
    "settings.professional": "Professionnel",
    "settings.paymentMethod": "Méthode de paiement",
    "settings.edit": "Modifier",
    
    // Settings - Security
    "settings.security": "Sécurité",
    "settings.changePassword": "Changer le mot de passe",
    "settings.currentPassword": "Mot de passe actuel",
    "settings.newPassword": "Nouveau mot de passe",
    "settings.confirmPassword": "Confirmer le mot de passe",
    "settings.updatePassword": "Mettre à jour le mot de passe",
    "settings.twoFactorAuth": "Authentification à deux facteurs",
    "settings.twoFactorDesc": "Ajoutez une couche de sécurité supplémentaire à votre compte.",
    "settings.enable2FA": "Activer l'A2F",
    
    // NotFound
    "notFound.title": "Page introuvable",
    "notFound.message": "Désolé, nous n'avons pas pu trouver la page que vous recherchez. Retournons au tableau de bord.",
    "notFound.backToDashboard": "Retour au tableau de bord",
    
    // Companies
    "companies.title": "Entreprises",
    "companies.subtitle": "Gérez vos profils d'entreprise et informations fiscales.",
    "companies.addCompany": "Ajouter une entreprise",
    "companies.businessNumber": "Numéro d'entreprise",
    "companies.neq": "NEQ",
    "companies.taxNumber": "Numéro fiscal",
    "companies.owner": "Propriétaire",
    "companies.contactEmail": "Email de contact",
    "companies.integrations": "Intégrations",
    "companies.stripeConnected": "✓ Stripe Connecté",
    "companies.stripe": "Stripe",
    "companies.ytdRevenue": "Revenus",
    "companies.addNewCompany": "Ajouter une nouvelle entreprise",
    "companies.companyName": "Nom de l'entreprise",
    "companies.companyNamePlaceholder": "Entrez le nom de l'entreprise",
    "companies.legalName": "Nom légal",
    "companies.legalNamePlaceholder": "Entrez le nom légal de l'entreprise",
    "companies.businessNumberPlaceholder": "123-456-789",
    "companies.neqPlaceholder": "1234 5678 90",
    "companies.cancel": "Annuler",
    "companies.createCompany": "Créer l'entreprise",
    "companies.moreOptions": "Plus d'options",
    "companies.editCompany": "Modifier l'entreprise",
    "companies.deleteCompany": "Supprimer l'entreprise",
    
    // Transactions
    "transactions.title": "Dépenses et Revenus",
    "transactions.subtitle": "Suivez et gérez toutes vos transactions financières.",
    "transactions.addTransaction": "Ajouter une transaction",
    "transactions.totalIncome": "Revenus totaux",
    "transactions.totalExpenses": "Dépenses totales",
    "transactions.net": "Net",
    "transactions.searchPlaceholder": "Rechercher des transactions...",
    "transactions.allTransactions": "Toutes les transactions",
    "transactions.incomeOnly": "Revenus uniquement",
    "transactions.expensesOnly": "Dépenses uniquement",
    "transactions.export": "Exporter",
    "transactions.print": "Imprimer",
    "transactions.company": "Entreprise",
    "transactions.tags": "Tags",
    "transactions.actions": "Actions",
    "transactions.addTransactionTitle": "Ajouter une transaction",
    "transactions.type": "Type",
    "transactions.description": "Description",
    "transactions.descriptionPlaceholder": "Entrez la description",
    "transactions.amount": "Montant",
    "transactions.amountPlaceholder": "0.00",
    "transactions.category": "Catégorie",
    "transactions.date": "Date",
    "transactions.income": "Revenu",
    "transactions.expense": "Dépense",
    "transactions.addCustomCategory": "Ajouter une catégorie personnalisée",
    "transactions.customCategoryPlaceholder": "Nom de la catégorie",
    "transactions.categoryUtilities": "Services publics",
    
    // Tax Filing
    "taxFiling.title": "Déclaration fiscale",
    "taxFiling.subtitle": "Gérez les déclarations fiscales du Canada et du Québec et les échéances.",
    "taxFiling.newFiling": "Nouvelle déclaration",
    "taxFiling.taxYear": "Année fiscale",
    "taxFiling.totalFilings": "Déclarations totales",
    "taxFiling.completed": "Terminées",
    "taxFiling.pending": "En attente",
    "taxFiling.totalTaxOwing": "Impôt total dû",
    "taxFiling.taxFilings": "Déclarations fiscales",
    "taxFiling.income": "Revenus",
    "taxFiling.expenses": "Dépenses",
    "taxFiling.netIncome": "Revenu net",
    "taxFiling.deadline": "Échéance",
    "taxFiling.taxOwing": "Impôt dû",
    "taxFiling.filed": "Déposé",
    "taxFiling.viewDetails": "Voir les détails",
    "taxFiling.importantDates": "Dates fiscales importantes",
    "taxFiling.federalProvincial": "Fédéral et Provincial",
    "taxFiling.federalOnly": "Fédéral uniquement",
    "taxFiling.createNewFiling": "Créer une nouvelle déclaration",
    "taxFiling.company": "Entreprise",
    "taxFiling.filingType": "Type de déclaration",
    "taxFiling.jurisdiction": "Juridiction",
    "taxFiling.totalIncome": "Revenus totaux",
    "taxFiling.totalExpenses": "Dépenses totales",
    "taxFiling.createFiling": "Créer la déclaration",
    
    // Reports
    "reports.title": "Rapports",
    "reports.subtitle": "Générez et gérez les rapports financiers.",
    "reports.generateReport": "Générer un rapport",
    "reports.templates": "Modèles de rapports",
    "reports.incomeStatement": "État des résultats",
    "reports.incomeStatementDesc": "Résumé des revenus et dépenses",
    "reports.balanceSheet": "Bilan",
    "reports.balanceSheetDesc": "Vue d'ensemble des actifs, passifs et capitaux propres",
    "reports.cashFlow": "Flux de trésorerie",
    "reports.cashFlowDesc": "Suivre les mouvements de trésorerie dans le temps",
    "reports.taxSummary": "Résumé fiscal",
    "reports.taxSummaryDesc": "Préparer la déclaration fiscale",
    "reports.expenseAnalysis": "Analyse des dépenses",
    "reports.expenseAnalysisDesc": "Répartition détaillée des dépenses",
    "reports.revenueForecast": "Prévision des revenus",
    "reports.revenueForecastDesc": "Projeter les revenus futurs",
    "reports.generate": "Générer",
    "reports.recentReports": "Rapports récents",
    "reports.reportName": "Nom du rapport",
    "reports.type": "Type",
    "reports.generated": "Généré",
    "reports.download": "Télécharger",
    "reports.scheduledReports": "Rapports programmés",
    "reports.scheduledDesc": "Générer automatiquement des rapports selon un calendrier.",
    "reports.scheduleReport": "Programmer un rapport",
    "reports.typeAnnual": "Rapport annuel",
    "reports.typeQuarterly": "Rapport trimestriel",
    "reports.typeMonthly": "Rapport mensuel",
  },
  en: {
    // Dashboard
    "dashboard.title": "Hello! 👋",
    "dashboard.subtitle": "Here's an overview of your financial situation today",
    "dashboard.revenue": "Total Revenue (YTD)",
    "dashboard.expenses": "Total Expenses (YTD)",
    "dashboard.income": "Net Income (YTD)",
    "dashboard.margin": "Profit Margin",
    "dashboard.revenueVsExpenses": "Revenue vs Expenses",
    "dashboard.expenseCategories": "Expense Categories",
    "dashboard.monthlyBreakdown": "Monthly Breakdown",
    "dashboard.recentTransactions": "Recent Transactions",
    "dashboard.viewAll": "View All",
    "dashboard.vsLastPeriod": "vs last period",
    "dashboard.date": "Date",
    "dashboard.description": "Description",
    "dashboard.category": "Category",
    "dashboard.type": "Type",
    "dashboard.amount": "Amount",
    "dashboard.incomeType": "Income",
    "dashboard.expenseType": "Expense",
    "dashboard.periodThisMonth": "This Month",
    "dashboard.periodThisQuarter": "This Quarter",
    "dashboard.periodYearToDate": "Year to Date",
    "dashboard.periodAllTime": "All Time",
    "dashboard.moreFilters": "More Filters",
    "dashboard.revenueLabel": "Revenue",
    "dashboard.expensesLabel": "Expenses",
    
    // Dashboard - Months
    "dashboard.monthJan": "Jan",
    "dashboard.monthFeb": "Feb",
    "dashboard.monthMar": "Mar",
    "dashboard.monthApr": "Apr",
    "dashboard.monthMay": "May",
    "dashboard.monthJun": "Jun",
    "dashboard.monthJul": "Jul",
    "dashboard.monthAug": "Aug",
    "dashboard.monthSep": "Sep",
    "dashboard.monthOct": "Oct",
    "dashboard.monthNov": "Nov",
    "dashboard.monthDec": "Dec",
    
    // Dashboard - Expense Categories
    "dashboard.categorySalaries": "Salaries",
    "dashboard.categoryOfficeSupplies": "Office Supplies",
    "dashboard.categoryTravel": "Travel",
    "dashboard.categoryEquipment": "Equipment",
    "dashboard.categoryOther": "Other",
    
    // Dashboard - Transaction Categories
    "dashboard.transactionCategoryConsulting": "Consulting",
    "dashboard.transactionCategoryOfficeSupplies": "Office Supplies",
    "dashboard.transactionCategoryMealsEntertainment": "Meals & Entertainment",
    "dashboard.transactionCategorySoftware": "Software",
    
    // Dashboard - Transaction Descriptions
    "dashboard.transactionClientInvoice": "Client Invoice",
    "dashboard.transactionOfficeSupplies": "Office Supplies",
    "dashboard.transactionTeamLunch": "Team Lunch Meeting",
    "dashboard.transactionSoftwareLicense": "Software License",
    "dashboard.transactionFreelancePayment": "Freelance Payment",
    
    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your account and application preferences.",
    "settings.general": "General",
    "settings.account": "Account",
    "settings.notifications": "Notifications",
    "settings.billing": "Billing",
    "settings.language": "Language",
    "settings.languageDescription": "Choose the display language for the application",
    "settings.save": "Save Changes",
    
    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.companies": "Companies",
    "sidebar.transactions": "Transactions",
    "sidebar.accounting": "Accounting",
    "sidebar.taxFiling": "Tax Filing",
    "sidebar.reports": "Reports",
    "sidebar.anomalies": "Anomalies",
    "sidebar.assets": "Assets",
    "sidebar.settings": "Settings",
    "sidebar.brand": "NovaFinance",
    "sidebar.tagline": "Financial Management",
    "sidebar.footer": "© 2024 NovaFinance",
    "sidebar.footerTagline": "Accounting Made Simple ✨",
    
    // Header
    "header.search": "Search transactions, companies...",
    "header.user": "User",
    "header.admin": "Admin",
    
    // Settings - General
    "settings.generalSettings": "General Settings",
    "settings.defaultCurrency": "Default Currency",
    "settings.fiscalYearStart": "Fiscal Year Start",
    "settings.theme": "Theme",
    "settings.themeLight": "Light",
    "settings.themeDark": "Dark",
    "settings.currencyCAD": "Canadian Dollar (CAD)",
    "settings.currencyUSD": "US Dollar (USD)",
    "settings.currencyEUR": "Euro (EUR)",
    "settings.monthJanuary": "January",
    "settings.monthApril": "April",
    "settings.monthJuly": "July",
    
    // Settings - Account
    "settings.accountSettings": "Account Settings",
    "settings.fullName": "Full Name",
    "settings.email": "Email",
    "settings.phone": "Phone",
    "settings.updateAccount": "Update Account",
    
    // Settings - Notifications
    "settings.notificationPreferences": "Notification Preferences",
    "settings.taxDeadlineReminders": "Tax Deadline Reminders",
    "settings.taxDeadlineDesc": "Get notified about upcoming tax deadlines",
    "settings.monthlyReports": "Monthly Reports",
    "settings.monthlyReportsDesc": "Receive monthly financial summaries",
    "settings.largeTransactions": "Large Transactions",
    "settings.largeTransactionsDesc": "Notify for transactions above $5,000",
    "settings.systemUpdates": "System Updates",
    "settings.systemUpdatesDesc": "Receive notifications about app updates",
    
    // Settings - Billing
    "settings.billingSubscription": "Billing & Subscription",
    "settings.currentPlan": "Current Plan",
    "settings.professional": "Professional",
    "settings.paymentMethod": "Payment Method",
    "settings.edit": "Edit",
    
    // Settings - Security
    "settings.security": "Security",
    "settings.changePassword": "Change Password",
    "settings.currentPassword": "Current Password",
    "settings.newPassword": "New Password",
    "settings.confirmPassword": "Confirm Password",
    "settings.updatePassword": "Update Password",
    "settings.twoFactorAuth": "Two-Factor Authentication",
    "settings.twoFactorDesc": "Add an extra layer of security to your account.",
    "settings.enable2FA": "Enable 2FA",
    
    // NotFound
    "notFound.title": "Page Not Found",
    "notFound.message": "Sorry, we couldn't find the page you're looking for. Let's get you back on track.",
    "notFound.backToDashboard": "Back to Dashboard",
    
    // Companies
    "companies.title": "Companies",
    "companies.subtitle": "Manage your business profiles and tax information.",
    "companies.addCompany": "Add Company",
    "companies.businessNumber": "Business Number",
    "companies.neq": "NEQ",
    "companies.taxNumber": "Tax Number",
    "companies.owner": "Owner",
    "companies.contactEmail": "Contact Email",
    "companies.integrations": "Integrations",
    "companies.stripeConnected": "✓ Stripe Connected",
    "companies.stripe": "Stripe",
    "companies.ytdRevenue": "YTD Revenue",
    "companies.addNewCompany": "Add New Company",
    "companies.companyName": "Company Name",
    "companies.companyNamePlaceholder": "Enter company name",
    "companies.legalName": "Legal Name",
    "companies.legalNamePlaceholder": "Enter legal business name",
    "companies.businessNumberPlaceholder": "123-456-789",
    "companies.neqPlaceholder": "1234 5678 90",
    "companies.cancel": "Cancel",
    "companies.createCompany": "Create Company",
    "companies.moreOptions": "More options",
    "companies.editCompany": "Edit company",
    "companies.deleteCompany": "Delete company",
    
    // Transactions
    "transactions.title": "Expenses & Income",
    "transactions.subtitle": "Track and manage all financial transactions.",
    "transactions.addTransaction": "Add Transaction",
    "transactions.totalIncome": "Total Income",
    "transactions.totalExpenses": "Total Expenses",
    "transactions.net": "Net",
    "transactions.searchPlaceholder": "Search transactions...",
    "transactions.allTransactions": "All Transactions",
    "transactions.incomeOnly": "Income Only",
    "transactions.expensesOnly": "Expenses Only",
    "transactions.export": "Export",
    "transactions.print": "Print",
    "transactions.company": "Company",
    "transactions.tags": "Tags",
    "transactions.actions": "Actions",
    "transactions.addTransactionTitle": "Add Transaction",
    "transactions.type": "Type",
    "transactions.description": "Description",
    "transactions.descriptionPlaceholder": "Enter description",
    "transactions.amount": "Amount",
    "transactions.amountPlaceholder": "0.00",
    "transactions.category": "Category",
    "transactions.date": "Date",
    "transactions.income": "Income",
    "transactions.expense": "Expense",
    "transactions.addCustomCategory": "Add custom category",
    "transactions.customCategoryPlaceholder": "Category name",
    "transactions.categoryUtilities": "Utilities",
    
    // Tax Filing
    "taxFiling.title": "Tax Filing",
    "taxFiling.subtitle": "Manage Canada and Quebec tax filings and deadlines.",
    "taxFiling.newFiling": "New Filing",
    "taxFiling.taxYear": "Tax Year",
    "taxFiling.totalFilings": "Total Filings",
    "taxFiling.completed": "Completed",
    "taxFiling.pending": "Pending",
    "taxFiling.totalTaxOwing": "Total Tax Owing",
    "taxFiling.taxFilings": "Tax Filings",
    "taxFiling.income": "Income",
    "taxFiling.expenses": "Expenses",
    "taxFiling.netIncome": "Net Income",
    "taxFiling.deadline": "Deadline",
    "taxFiling.taxOwing": "Tax Owing",
    "taxFiling.filed": "Filed",
    "taxFiling.viewDetails": "View Details",
    "taxFiling.importantDates": "Important Tax Dates",
    "taxFiling.federalProvincial": "Federal & Provincial",
    "taxFiling.federalOnly": "Federal Only",
    "taxFiling.createNewFiling": "Create New Tax Filing",
    "taxFiling.company": "Company",
    "taxFiling.filingType": "Filing Type",
    "taxFiling.jurisdiction": "Jurisdiction",
    "taxFiling.totalIncome": "Total Income",
    "taxFiling.totalExpenses": "Total Expenses",
    "taxFiling.createFiling": "Create Filing",
    
    // Reports
    "reports.title": "Reports",
    "reports.subtitle": "Generate and manage financial reports.",
    "reports.generateReport": "Generate Report",
    "reports.templates": "Report Templates",
    "reports.incomeStatement": "Income Statement",
    "reports.incomeStatementDesc": "Summary of revenues and expenses",
    "reports.balanceSheet": "Balance Sheet",
    "reports.balanceSheetDesc": "Assets, liabilities, and equity overview",
    "reports.cashFlow": "Cash Flow",
    "reports.cashFlowDesc": "Track cash movement over time",
    "reports.taxSummary": "Tax Summary",
    "reports.taxSummaryDesc": "Prepare for tax filing",
    "reports.expenseAnalysis": "Expense Analysis",
    "reports.expenseAnalysisDesc": "Detailed expense breakdown",
    "reports.revenueForecast": "Revenue Forecast",
    "reports.revenueForecastDesc": "Project future revenues",
    "reports.generate": "Generate",
    "reports.recentReports": "Recent Reports",
    "reports.reportName": "Report Name",
    "reports.type": "Type",
    "reports.generated": "Generated",
    "reports.download": "Download",
    "reports.scheduledReports": "Scheduled Reports",
    "reports.scheduledDesc": "Automatically generate reports on a schedule.",
    "reports.scheduleReport": "Schedule Report",
    "reports.typeAnnual": "Annual Report",
    "reports.typeQuarterly": "Quarterly Report",
    "reports.typeMonthly": "Monthly Report",
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language") as Language;
    return saved || "fr";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations.fr];
    if (translation) {
      return translation;
    }
    // Si la traduction n'existe pas, essayer de formater la clé de manière lisible
    // au lieu d'afficher "dashboard.monthAug", afficher "Août" par exemple
    if (key.includes("month")) {
      const monthMap: { [key: string]: string } = {
        "monthJan": language === "fr" ? "Jan" : "Jan",
        "monthFeb": language === "fr" ? "Fév" : "Feb",
        "monthMar": language === "fr" ? "Mar" : "Mar",
        "monthApr": language === "fr" ? "Avr" : "Apr",
        "monthMay": language === "fr" ? "Mai" : "May",
        "monthJun": language === "fr" ? "Jun" : "Jun",
        "monthJul": language === "fr" ? "Jul" : "Jul",
        "monthAug": language === "fr" ? "Aoû" : "Aug",
        "monthSep": language === "fr" ? "Sep" : "Sep",
        "monthOct": language === "fr" ? "Oct" : "Oct",
        "monthNov": language === "fr" ? "Nov" : "Nov",
        "monthDec": language === "fr" ? "Déc" : "Dec",
      };
      const monthKey = key.split(".").pop() || "";
      if (monthMap[monthKey]) {
        return monthMap[monthKey];
      }
    }
    // Pour les autres clés manquantes, retourner un message d'erreur en mode dev, ou la clé formatée
    if (import.meta.env.DEV) {
      console.warn(`Traduction manquante pour la clé: ${key}`);
    }
    // Retourner la dernière partie de la clé (après le dernier point) formatée
    const lastPart = key.split(".").pop() || key;
    return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/([A-Z])/g, " $1");
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

