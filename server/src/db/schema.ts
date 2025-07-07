
import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['employee', 'approver']);
export const purchaseRequestStatusEnum = pgEnum('purchase_request_status', ['pending', 'approved', 'rejected']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Purchase requests table
export const purchaseRequestsTable = pgTable('purchase_requests', {
  id: serial('id').primaryKey(),
  employee_id: integer('employee_id').notNull().references(() => usersTable.id),
  ebay_url: text('ebay_url').notNull(),
  amazon_asin: text('amazon_asin').notNull(),
  item_name: text('item_name'), // Nullable - populated after API enrichment
  item_description: text('item_description'), // Nullable - populated after API enrichment
  item_price: numeric('item_price', { precision: 10, scale: 2 }), // Nullable - populated after API enrichment
  item_images: jsonb('item_images'), // Nullable - array of image URLs as JSON
  status: purchaseRequestStatusEnum('status').notNull().default('pending'),
  approver_id: integer('approver_id').references(() => usersTable.id), // Nullable - set when approved/rejected
  approved_at: timestamp('approved_at'), // Nullable - set when status changes from pending
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  purchaseRequests: many(purchaseRequestsTable, { relationName: 'employee_requests' }),
  approvedRequests: many(purchaseRequestsTable, { relationName: 'approver_requests' }),
}));

export const purchaseRequestsRelations = relations(purchaseRequestsTable, ({ one }) => ({
  employee: one(usersTable, {
    fields: [purchaseRequestsTable.employee_id],
    references: [usersTable.id],
    relationName: 'employee_requests'
  }),
  approver: one(usersTable, {
    fields: [purchaseRequestsTable.approver_id],
    references: [usersTable.id],
    relationName: 'approver_requests'
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type PurchaseRequest = typeof purchaseRequestsTable.$inferSelect;
export type NewPurchaseRequest = typeof purchaseRequestsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  purchaseRequests: purchaseRequestsTable 
};
