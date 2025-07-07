
import { db } from '../db';
import { purchaseRequestsTable } from '../db/schema';
import { type CreatePurchaseRequestInput, type PurchaseRequest } from '../schema';

export const createPurchaseRequest = async (input: CreatePurchaseRequestInput): Promise<PurchaseRequest> => {
  try {
    // Insert purchase request record
    const result = await db.insert(purchaseRequestsTable)
      .values({
        employee_id: input.employee_id,
        ebay_url: input.ebay_url,
        amazon_asin: input.amazon_asin,
        // Item details will be null initially (to be enriched later)
        item_name: null,
        item_description: null,
        item_price: null,
        item_images: null,
        status: 'pending',
        approver_id: null,
        approved_at: null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const purchaseRequest = result[0];
    return {
      ...purchaseRequest,
      item_price: purchaseRequest.item_price ? parseFloat(purchaseRequest.item_price) : null,
      item_images: purchaseRequest.item_images as string[] | null
    };
  } catch (error) {
    console.error('Purchase request creation failed:', error);
    throw error;
  }
};
