
import { db } from '../db';
import { purchaseRequestsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type UpdatePurchaseRequestStatusInput, type PurchaseRequest } from '../schema';

export const updatePurchaseRequestStatus = async (input: UpdatePurchaseRequestStatusInput): Promise<PurchaseRequest> => {
  try {
    // Update the purchase request status
    const result = await db.update(purchaseRequestsTable)
      .set({
        status: input.status,
        approver_id: input.approver_id,
        approved_at: new Date(), // Set timestamp when status changes
        updated_at: new Date()
      })
      .where(eq(purchaseRequestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Purchase request with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const purchaseRequest = result[0];
    return {
      ...purchaseRequest,
      item_price: purchaseRequest.item_price ? parseFloat(purchaseRequest.item_price) : null,
      item_images: purchaseRequest.item_images as string[] | null
    };
  } catch (error) {
    console.error('Purchase request status update failed:', error);
    throw error;
  }
};
