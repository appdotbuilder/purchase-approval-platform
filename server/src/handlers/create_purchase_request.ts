
import { db } from '../db';
import { purchaseRequestsTable } from '../db/schema';
import { type CreatePurchaseRequestInput, type PurchaseRequest } from '../schema';
import { enrichItemData } from './enrich_item_data';

export const createPurchaseRequest = async (input: CreatePurchaseRequestInput): Promise<PurchaseRequest> => {
  try {
    // First, enrich the item data using the Amazon ASIN
    const enrichedData = await enrichItemData(input.amazon_asin);

    // Insert purchase request record with enriched data
    const result = await db.insert(purchaseRequestsTable)
      .values({
        employee_id: input.employee_id,
        ebay_url: input.ebay_url,
        amazon_asin: input.amazon_asin,
        // Use enriched data from external API
        item_name: enrichedData.name,
        item_description: enrichedData.description,
        item_price: enrichedData.price.toString(), // Convert number to string for numeric column
        item_images: enrichedData.images, // JSONB handles the array directly
        status: 'pending',
        approver_id: null,
        approved_at: null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers for return (item_images is already parsed by jsonb)
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
