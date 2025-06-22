export const BUDGET_STATUS_DICTIONARY = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  APPROVED: "Aprovado",
  EXPIRED: "Expirado",
  REJECTED: "Rejeitado",
} as const;

export type BudgetStatus = keyof typeof BUDGET_STATUS_DICTIONARY;

export function getBudgetStatusLabel(status: string): string {
  return BUDGET_STATUS_DICTIONARY[status as BudgetStatus] || status;
}

export function getBudgetStatusColor(status: string): string {
  switch (status) {
    case "DRAFT":
      return "gray";
    case "SENT":
      return "blue";
    case "APPROVED":
      return "green";
    case "EXPIRED":
      return "red";
    case "REJECTED":
      return "red";
    default:
      return "gray";
  }
}