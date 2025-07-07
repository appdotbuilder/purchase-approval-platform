
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['employee', 'approver']),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Purchase request status enum
export const purchaseRequestStatusSchema = z.enum(['pending', 'approved', 'rejected']);
export type PurchaseRequestStatus = z.infer<typeof purchaseRequestStatusSchema>;

// Purchase request schema
export const purchaseRequestSchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  ebay_url: z.string().url(),
  amazon_asin: z.string(),
  item_name: z.string().nullable(),
  item_description: z.string().nullable(),
  item_price: z.number().nullable(),
  item_images: z.array(z.string()).nullable(),
  status: purchaseRequestStatusSchema,
  approver_id: z.number().nullable(),
  approved_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>;

// Input schema for creating purchase requests
export const createPurchaseRequestInputSchema = z.object({
  employee_id: z.number(),
  ebay_url: z.string().url(),
  amazon_asin: z.string().min(1, 'Amazon ASIN is required')
});

export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestInputSchema>;

// Input schema for updating purchase request status
export const updatePurchaseRequestStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['approved', 'rejected']),
  approver_id: z.number()
});

export type UpdatePurchaseRequestStatusInput = z.infer<typeof updatePurchaseRequestStatusInputSchema>;

// Input schema for creating users
export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['employee', 'approver'])
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Item enrichment data from external API
export const itemEnrichmentDataSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number(),
  images: z.array(z.string())
});

export type ItemEnrichmentData = z.infer<typeof itemEnrichmentDataSchema>;
