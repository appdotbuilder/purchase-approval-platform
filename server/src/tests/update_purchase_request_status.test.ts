
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, purchaseRequestsTable } from '../db/schema';
import { type UpdatePurchaseRequestStatusInput, type CreateUserInput } from '../schema';
import { updatePurchaseRequestStatus } from '../handlers/update_purchase_request_status';
import { eq } from 'drizzle-orm';

describe('updatePurchaseRequestStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update purchase request status to approved', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values({
        email: 'employee@test.com',
        name: 'Test Employee',
        role: 'employee'
      })
      .returning()
      .execute();

    // Create test approver
    const approverResult = await db.insert(usersTable)
      .values({
        email: 'approver@test.com',
        name: 'Test Approver',
        role: 'approver'
      })
      .returning()
      .execute();

    // Create test purchase request
    const purchaseRequestResult = await db.insert(purchaseRequestsTable)
      .values({
        employee_id: employeeResult[0].id,
        ebay_url: 'https://ebay.com/item/123',
        amazon_asin: 'B01234567'
      })
      .returning()
      .execute();

    const testInput: UpdatePurchaseRequestStatusInput = {
      id: purchaseRequestResult[0].id,
      status: 'approved',
      approver_id: approverResult[0].id
    };

    const result = await updatePurchaseRequestStatus(testInput);

    // Verify the updated fields
    expect(result.id).toEqual(purchaseRequestResult[0].id);
    expect(result.status).toEqual('approved');
    expect(result.approver_id).toEqual(approverResult[0].id);
    expect(result.approved_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.employee_id).toEqual(employeeResult[0].id);
    expect(result.ebay_url).toEqual('https://ebay.com/item/123');
    expect(result.amazon_asin).toEqual('B01234567');
  });

  it('should update purchase request status to rejected', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values({
        email: 'employee2@test.com',
        name: 'Test Employee 2',
        role: 'employee'
      })
      .returning()
      .execute();

    // Create test approver
    const approverResult = await db.insert(usersTable)
      .values({
        email: 'approver2@test.com',
        name: 'Test Approver 2',
        role: 'approver'
      })
      .returning()
      .execute();

    // Create test purchase request
    const purchaseRequestResult = await db.insert(purchaseRequestsTable)
      .values({
        employee_id: employeeResult[0].id,
        ebay_url: 'https://ebay.com/item/456',
        amazon_asin: 'B09876543'
      })
      .returning()
      .execute();

    const testInput: UpdatePurchaseRequestStatusInput = {
      id: purchaseRequestResult[0].id,
      status: 'rejected',
      approver_id: approverResult[0].id
    };

    const result = await updatePurchaseRequestStatus(testInput);

    // Verify the updated fields
    expect(result.status).toEqual('rejected');
    expect(result.approver_id).toEqual(approverResult[0].id);
    expect(result.approved_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated purchase request to database', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values({
        email: 'employee3@test.com',
        name: 'Test Employee 3',
        role: 'employee'
      })
      .returning()
      .execute();

    // Create test approver
    const approverResult = await db.insert(usersTable)
      .values({
        email: 'approver3@test.com',
        name: 'Test Approver 3',
        role: 'approver'
      })
      .returning()
      .execute();

    // Create test purchase request
    const purchaseRequestResult = await db.insert(purchaseRequestsTable)
      .values({
        employee_id: employeeResult[0].id,
        ebay_url: 'https://ebay.com/item/789',
        amazon_asin: 'B05555555'
      })
      .returning()
      .execute();

    const testInput: UpdatePurchaseRequestStatusInput = {
      id: purchaseRequestResult[0].id,
      status: 'approved',
      approver_id: approverResult[0].id
    };

    const result = await updatePurchaseRequestStatus(testInput);

    // Query the database to verify the update
    const updatedRequest = await db.select()
      .from(purchaseRequestsTable)
      .where(eq(purchaseRequestsTable.id, result.id))
      .execute();

    expect(updatedRequest).toHaveLength(1);
    expect(updatedRequest[0].status).toEqual('approved');
    expect(updatedRequest[0].approver_id).toEqual(approverResult[0].id);
    expect(updatedRequest[0].approved_at).toBeInstanceOf(Date);
    expect(updatedRequest[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent purchase request', async () => {
    const testInput: UpdatePurchaseRequestStatusInput = {
      id: 99999, // Non-existent ID
      status: 'approved',
      approver_id: 1
    };

    await expect(updatePurchaseRequestStatus(testInput)).rejects.toThrow(/not found/i);
  });

  it('should handle purchase request with enriched item data', async () => {
    // Create test employee
    const employeeResult = await db.insert(usersTable)
      .values({
        email: 'employee4@test.com',
        name: 'Test Employee 4',
        role: 'employee'
      })
      .returning()
      .execute();

    // Create test approver
    const approverResult = await db.insert(usersTable)
      .values({
        email: 'approver4@test.com',
        name: 'Test Approver 4',
        role: 'approver'
      })
      .returning()
      .execute();

    // Create test purchase request with enriched item data
    const purchaseRequestResult = await db.insert(purchaseRequestsTable)
      .values({
        employee_id: employeeResult[0].id,
        ebay_url: 'https://ebay.com/item/999',
        amazon_asin: 'B01111111',
        item_name: 'Test Item',
        item_description: 'A test item description',
        item_price: '29.99',
        item_images: JSON.stringify(['https://example.com/image1.jpg', 'https://example.com/image2.jpg'])
      })
      .returning()
      .execute();

    const testInput: UpdatePurchaseRequestStatusInput = {
      id: purchaseRequestResult[0].id,
      status: 'approved',
      approver_id: approverResult[0].id
    };

    const result = await updatePurchaseRequestStatus(testInput);

    // Verify enriched data is preserved and numeric conversion works
    expect(result.item_name).toEqual('Test Item');
    expect(result.item_description).toEqual('A test item description');
    expect(result.item_price).toEqual(29.99);
    expect(typeof result.item_price).toBe('number');
    expect(result.item_images).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result.status).toEqual('approved');
    expect(result.approver_id).toEqual(approverResult[0].id);
  });
});
