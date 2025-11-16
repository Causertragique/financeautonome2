import { useMemo } from "react";

/**
 * Calcule l'année fiscale actuelle en fonction du mois de début de l'année fiscale
 * @param fiscalYearStartMonth - Mois de début de l'année fiscale (0 = janvier, 3 = avril, 6 = juillet)
 * @returns L'année fiscale actuelle
 */
export function useFiscalYear(fiscalYearStartMonth: number = 0): number {
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = janvier, 11 = décembre

    // Si le mois actuel est avant le mois de début de l'année fiscale,
    // l'année fiscale est l'année précédente
    if (currentMonth < fiscalYearStartMonth) {
      return currentYear - 1;
    }

    return currentYear;
  }, [fiscalYearStartMonth]);
}

/**
 * Obtient l'année fiscale depuis localStorage ou utilise la valeur par défaut
 */
export function getFiscalYearStartMonth(): number {
  const saved = localStorage.getItem("fiscalYearStartMonth");
  if (saved) {
    return parseInt(saved, 10);
  }
  // Par défaut, janvier (0)
  return 0;
}

/**
 * Sauvegarde le mois de début de l'année fiscale
 */
export function setFiscalYearStartMonth(month: number): void {
  localStorage.setItem("fiscalYearStartMonth", month.toString());
}

