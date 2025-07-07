
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { purchaseRequestsTable, usersTable } from '../db/schema';
import { type CreatePurchaseRequestInput } from '../schema';
import { createPurchaseRequest } from '../handlers/create_purchase_request';
import { eq } from 'drizzle-orm';

describe('createPurchaseRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a purchase request', async () => {
    // Create a test user first (required for foreign key)
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput: CreatePurchaseRequestInput = {
      employee_id: testUser.id,
      ebay_url: 'https://www.ebay.com/itm/123456789',
      amazon_asin: 'B08N5WRWNW'
    };

    const result = await createPurchaseRequest(testInput);

    // Basic field validation
    expect(result.employee_id).toEqual(testUser.id);
    expect(result.ebay_url).toEqual('https://www.ebay.com/itm/123456789');
    expect(result.amazon_asin).toEqual('B08N5WRWNW');
    expect(result.item_name).toBeNull();
    expect(result.item_description).toBeNull();
    expect(result.item_price).toBeNull();
    expect(result.item_images).toBeNull();
    expect(result.status).toEqual('pending');
    expect(result.approver_id).toBeNull();
    expect(result.approved_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save purchase request to database', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput: CreatePurchaseRequestInput = {
      employee_id: testUser.id,
      ebay_url: 'https://www.ebay.com/itm/123456789',
      amazon_asin: 'B08N5WRWNW'
    };

    const result = await createPurchaseRequest(testInput);

    // Query database to verify persistence
    const purchaseRequests = await db.select()
      .from(purchaseRequestsTable)
      .where(eq(purchaseRequestsTable.id, result.id))
      .execute();

    expect(purchaseRequests).toHaveLength(1);
    const savedRequest = purchaseRequests[0];
    
    expect(savedRequest.employee_id).toEqual(testUser.id);
    expect(savedRequest.ebay_url).toEqual('https://www.ebay.com/itm/123456789');
    expect(savedRequest.amazon_asin).toEqual('B08N5WRWNW');
    expect(savedRequest.item_name).toBeNull();
    expect(savedRequest.item_description).toBeNull();
    expect(savedRequest.item_price).toBeNull();
    expect(savedRequest.item_images).toBeNull();
    expect(savedRequest.status).toEqual('pending');
    expect(savedRequest.approver_id).toBeNull();
    expect(savedRequest.approved_at).toBeNull();
    expect(savedRequest.created_at).toBeInstanceOf(Date);
    expect(savedRequest.updated_at).toBeInstanceOf(Date);
  });

  it('should handle multiple purchase requests for same employee', async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        role: 'employee'
      })
      .returning()
      .execute();

    const testUser = userResult[0];

    const testInput1: CreatePurchaseRequestInput = {
      employee_id: testUser.id,
      ebay_url: 'https://www.ebay.com/itm/123456789',
      amazon_asin: 'B08N5WRWNW'
    };

    const testInput2: CreatePurchaseRequestInput = {
      employee_id: testUser.id,
      ebay_url: 'https://www.ebay.com/itm/987654321',
      amazon_asin: 'B07XYZ1234'
    };

    const result1 = await createPurchaseRequest(testInput1);
    const result2 = await createPurchaseRequest(testInput2);

    // Both requests should be created successfully
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Both should have the same employee_id
    expect(result1.employee_id).toEqual(testUser.id);
    expect(result2.employee_id).toEqual(testUser.id);

    // But different URLs and ASINs
    expect(result1.ebay_url).toEqual('https://www.ebay.com/itm/123456789');
    expect(result2.ebay_url).toEqual('https://www.ebay.com/itm/987654321');
    expect(result1.amazon_asin).toEqual('B08N5WRWNW');
    expect(result2.amazon_asin).toEqual('B07XYZ1234');
  });
});
