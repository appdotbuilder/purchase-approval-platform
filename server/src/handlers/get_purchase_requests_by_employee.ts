
import { db } from '../db';
import { purchaseRequestsTable } from '../db/schema';
import { type PurchaseRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const getPurchaseRequestsByEmployee = async (employeeId: number): Promise<PurchaseRequest[]> => {
  try {
    const results = await db.select()
      .from(purchaseRequestsTable)
      .where(eq(purchaseRequestsTable.employee_id, employeeId))
      .execute();

    // Convert numeric fields back to numbers and handle JSON fields
    return results.map(request => ({
      ...request,
      item_price: request.item_price ? parseFloat(request.item_price) : null,
      item_images: request.item_images ? (request.item_images as string[]) : null
    }));
  } catch (error) {
    console.error('Failed to fetch purchase requests by employee:', error);
    throw error;
  }
};
