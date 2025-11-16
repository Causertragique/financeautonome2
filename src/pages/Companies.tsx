import { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import { Plus, Edit2, Trash2, MoreVertical } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const companies = [
  {
    id: 1,
    name: "Tech Solutions Inc",
    businessNumber: "123-456-789",
    neq: "1234 5678 90",
    taxNumber: "98-7654-321",
    legalName: "Tech Solutions Incorporated",
    owner: "John Doe",
    email: "john@techsolutions.com",
    stripe: true,
    revenue: "$125,000",
    status: "active",
  },
  {
    id: 2,
    name: "Creative Agency",
    businessNumber: "987-654-321",
    neq: "9876 5432 10",
    taxNumber: "12-3456-789",
    legalName: "Creative Agency Ltd",
    owner: "Jane Smith",
    email: "jane@creativeagency.com",
    stripe: false,
    revenue: "$85,000",
    status: "active",
  },
];

export default function Companies() {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <MainLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("companies.title")}</h1>
          <p className="text-muted-foreground">
            {t("companies.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>{t("companies.addCompany")}</span>
        </button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-card rounded-lg border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {company.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {company.legalName}
                </p>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* Company Details */}
            <div className="space-y-3 mb-4 py-4 border-t border-b border-border">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("companies.businessNumber")}
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {company.businessNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("companies.neq")}
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {company.neq}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("companies.taxNumber")}
                  </p>
                  <p className="text-sm text-foreground font-mono">
                    {company.taxNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {t("companies.owner")}
                  </p>
                  <p className="text-sm text-foreground">{company.owner}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  {t("companies.contactEmail")}
                </p>
                <p className="text-sm text-foreground">{company.email}</p>
              </div>
            </div>

            {/* Integrations */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground font-medium mb-2">
                {t("companies.integrations")}
              </p>
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded text-xs font-medium ${
                    company.stripe
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {company.stripe ? t("companies.stripeConnected") : t("companies.stripe")}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-success">
                {t("companies.ytdRevenue")}: {company.revenue}
              </span>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4 text-foreground" />
                </button>
                <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {t("companies.addNewCompany")}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t("companies.companyName")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("companies.companyNamePlaceholder")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t("companies.legalName")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("companies.legalNamePlaceholder")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t("companies.businessNumber")} (BN)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("companies.businessNumberPlaceholder")}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  {t("companies.neq")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("companies.neqPlaceholder")}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
                >
                  {t("companies.cancel")}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  {t("companies.createCompany")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
