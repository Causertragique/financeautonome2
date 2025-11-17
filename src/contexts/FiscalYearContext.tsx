import React, { createContext, useContext, useState, ReactNode } from "react";
import { useFiscalYear, getFiscalYearStartMonth } from "../hooks/use-fiscal-year";

interface FiscalYearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
}

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(undefined);

export function useFiscalYearContext() {
  const context = useContext(FiscalYearContext);
  if (context === undefined) {
    throw new Error("useFiscalYearContext doit être utilisé dans un FiscalYearProvider");
  }
  return context;
}

interface FiscalYearProviderProps {
  children: ReactNode;
}

export function FiscalYearProvider({ children }: FiscalYearProviderProps) {
  const fiscalYearStartMonth = getFiscalYearStartMonth();
  const fiscalYear = useFiscalYear(fiscalYearStartMonth);
  const [selectedYear, setSelectedYear] = useState(fiscalYear);
  
  // Générer la liste des années (année fiscale actuelle et 5 années précédentes)
  const availableYears = Array.from({ length: 6 }, (_, i) => fiscalYear - i);

  const value: FiscalYearContextType = {
    selectedYear,
    setSelectedYear,
    availableYears,
  };

  return <FiscalYearContext.Provider value={value}>{children}</FiscalYearContext.Provider>;
}

