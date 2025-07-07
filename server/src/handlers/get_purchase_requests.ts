
import { db } from '../db';
import { purchaseRequestsTable, usersTable } from '../db/schema';
import { type PurchaseRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const getPurchaseRequests = async (): Promise<PurchaseRequest[]> => {
  try {
    const results = await db.select()
      .from(purchaseRequestsTable)
      .leftJoin(usersTable, eq(purchaseRequestsTable.employee_id, usersTable.id))
      .execute();

    return results.map(result => {
      const request = result.purchase_requests;
      return {
        ...request,
        item_price: request.item_price ? parseFloat(request.item_price) : null,
        item_images: request.item_images as string[] | null
      };
    });
  } catch (error) {
    console.error('Failed to get purchase requests:', error);
    throw error;
  }
};
