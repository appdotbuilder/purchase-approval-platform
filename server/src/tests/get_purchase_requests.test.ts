
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, purchaseRequestsTable } from '../db/schema';
import { type CreateUserInput, type CreatePurchaseRequestInput } from '../schema';
import { getPurchaseRequests } from '../handlers/get_purchase_requests';

describe('getPurchaseRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no purchase requests exist', async () => {
    const results = await getPurchaseRequests();

    expect(results).toEqual([]);
  });

  it('should return all purchase requests', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'employee@test.com',
          name: 'Test Employee',
          role: 'employee'
        },
        {
          email: 'approver@test.com',
          name: 'Test Approver',
          role: 'approver'
        }
      ])
      .returning()
      .execute();

    const employee = users[0];
    const approver = users[1];

    // Create test purchase requests
    await db.insert(purchaseRequestsTable)
      .values([
        {
          employee_id: employee.id,
          ebay_url: 'https://ebay.com/item1',
          amazon_asin: 'B01234567',
          item_name: 'Test Item 1',
          item_description: 'Test description 1',
          item_price: '99.99',
          item_images: JSON.stringify(['https://example.com/image1.jpg']),
          status: 'pending'
        },
        {
          employee_id: employee.id,
          ebay_url: 'https://ebay.com/item2',
          amazon_asin: 'B09876543',
          item_name: 'Test Item 2',
          item_description: 'Test description 2',
          item_price: '149.50',
          item_images: JSON.stringify(['https://example.com/image2.jpg', 'https://example.com/image3.jpg']),
          status: 'approved',
          approver_id: approver.id,
          approved_at: new Date()
        }
      ])
      .execute();

    const results = await getPurchaseRequests();

    expect(results).toHaveLength(2);
    
    // Check first request
    const request1 = results.find(r => r.amazon_asin === 'B01234567');
    expect(request1).toBeDefined();
    expect(request1!.employee_id).toEqual(employee.id);
    expect(request1!.ebay_url).toEqual('https://ebay.com/item1');
    expect(request1!.item_name).toEqual('Test Item 1');
    expect(request1!.item_description).toEqual('Test description 1');
    expect(request1!.item_price).toEqual(99.99);
    expect(typeof request1!.item_price).toBe('number');
    expect(request1!.item_images).toEqual(['https://example.com/image1.jpg']);
    expect(request1!.status).toEqual('pending');
    expect(request1!.approver_id).toBeNull();
    expect(request1!.approved_at).toBeNull();
    expect(request1!.created_at).toBeInstanceOf(Date);
    expect(request1!.updated_at).toBeInstanceOf(Date);

    // Check second request
    const request2 = results.find(r => r.amazon_asin === 'B09876543');
    expect(request2).toBeDefined();
    expect(request2!.employee_id).toEqual(employee.id);
    expect(request2!.ebay_url).toEqual('https://ebay.com/item2');
    expect(request2!.item_name).toEqual('Test Item 2');
    expect(request2!.item_description).toEqual('Test description 2');
    expect(request2!.item_price).toEqual(149.50);
    expect(typeof request2!.item_price).toBe('number');
    expect(request2!.item_images).toEqual(['https://example.com/image2.jpg', 'https://example.com/image3.jpg']);
    expect(request2!.status).toEqual('approved');
    expect(request2!.approver_id).toEqual(approver.id);
    expect(request2!.approved_at).toBeInstanceOf(Date);
  });

  it('should handle null numeric and json fields correctly', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'employee@test.com',
        name: 'Test Employee',
        role: 'employee'
      })
      .returning()
      .execute();

    const employee = user[0];

    // Create purchase request with null optional fields
    await db.insert(purchaseRequestsTable)
      .values({
        employee_id: employee.id,
        ebay_url: 'https://ebay.com/item',
        amazon_asin: 'B01234567',
        item_name: null,
        item_description: null,
        item_price: null,
        item_images: null,
        status: 'pending'
      })
      .execute();

    const results = await getPurchaseRequests();

    expect(results).toHaveLength(1);
    const request = results[0];
    expect(request.item_name).toBeNull();
    expect(request.item_description).toBeNull();
    expect(request.item_price).toBeNull();
    expect(request.item_images).toBeNull();
    expect(request.status).toEqual('pending');
  });
});
