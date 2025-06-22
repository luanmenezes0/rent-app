import * as z from "zod";

export const BudgetItemSchema = z.object({
  rentableId: z.string().min(1, "O item é obrigatório"),
  quantity: z.string().min(1, "A quantidade é obrigatória"),
  days: z.string().min(1, "O número de dias é obrigatório"),
  unitPrice: z.string().min(1, "O preço unitário é obrigatório"),
  discount: z.string().optional(),
});

export const BudgetSchema = z.object({
  clientId: z.string().min(1, "O cliente é obrigatório"),
  buildingSiteId: z.string().min(1, "O canteiro é obrigatório"),
  validityDate: z.string().min(1, "A data de validade é obrigatória"),
  deliveryFee: z.string().min(1, "A taxa de entrega é obrigatória"),
  notes: z.string().optional(),
  items: z.array(BudgetItemSchema).min(1, "Adicione pelo menos um item"),
}); 