
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, purchaseRequestsTable } from '../db/schema';
import { getPurchaseRequestsByEmployee } from '../handlers/get_purchase_requests_by_employee';

describe('getPurchaseRequestsByEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when employee has no purchase requests', async () => {
    // Create a user first
    const users = await db.insert(usersTable)
      .values({
        email: 'employee@test.com',
        name: 'Test Employee',
        role: 'employee'
      })
      .returning()
      .execute();

    const result = await getPurchaseRequestsByEmployee(users[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return purchase requests for specific employee', async () => {
    // Create users
    const employees = await db.insert(usersTable)
      .values([
        {
          email: 'employee1@test.com',
          name: 'Employee 1',
          role: 'employee'
        },
        {
          email: 'employee2@test.com',
          name: 'Employee 2',
          role: 'employee'
        }
      ])
      .returning()
      .execute();

    const employee1Id = employees[0].id;
    const employee2Id = employees[1].id;

    // Create purchase requests for both employees
    await db.insert(purchaseRequestsTable)
      .values([
        {
          employee_id: employee1Id,
          ebay_url: 'https://ebay.com/item1',
          amazon_asin: 'ASIN123',
          item_name: 'Test Item 1',
          item_description: 'Description 1',
          item_price: '99.99',
          item_images: JSON.stringify(['image1.jpg', 'image2.jpg']),
          status: 'pending'
        },
        {
          employee_id: employee1Id,
          ebay_url: 'https://ebay.com/item2',
          amazon_asin: 'ASIN456',
          item_name: 'Test Item 2',
          item_description: 'Description 2',
          item_price: '149.99',
          status: 'approved'
        },
        {
          employee_id: employee2Id,
          ebay_url: 'https://ebay.com/item3',
          amazon_asin: 'ASIN789',
          status: 'pending'
        }
      ])
      .execute();

    const result = await getPurchaseRequestsByEmployee(employee1Id);

    expect(result).toHaveLength(2);
    
    // Check that all returned requests belong to employee1
    result.forEach(request => {
      expect(request.employee_id).toEqual(employee1Id);
    });

    // Check specific request details
    const request1 = result.find(r => r.amazon_asin === 'ASIN123');
    expect(request1).toBeDefined();
    expect(request1!.item_name).toEqual('Test Item 1');
    expect(request1!.item_description).toEqual('Description 1');
    expect(request1!.item_price).toEqual(99.99);
    expect(typeof request1!.item_price).toBe('number');
    expect(request1!.item_images).toEqual(['image1.jpg', 'image2.jpg']);
    expect(request1!.status).toEqual('pending');

    const request2 = result.find(r => r.amazon_asin === 'ASIN456');
    expect(request2).toBeDefined();
    expect(request2!.item_name).toEqual('Test Item 2');
    expect(request2!.item_price).toEqual(149.99);
    expect(typeof request2!.item_price).toBe('number');
    expect(request2!.status).toEqual('approved');
  });

  it('should handle null values for optional fields', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        email: 'employee@test.com',
        name: 'Test Employee',
        role: 'employee'
      })
      .returning()
      .execute();

    // Create purchase request with minimal data (nulls for optional fields)
    await db.insert(purchaseRequestsTable)
      .values({
        employee_id: users[0].id,
        ebay_url: 'https://ebay.com/item',
        amazon_asin: 'ASIN123',
        // item_name, item_description, item_price, item_images left as null
        status: 'pending'
      })
      .execute();

    const result = await getPurchaseRequestsByEmployee(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].item_name).toBeNull();
    expect(result[0].item_description).toBeNull();
    expect(result[0].item_price).toBeNull();
    expect(result[0].item_images).toBeNull();
    expect(result[0].status).toEqual('pending');
  });

  it('should return requests with correct field types', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        email: 'employee@test.com',
        name: 'Test Employee',
        role: 'employee'
      })
      .returning()
      .execute();

    // Create purchase request with all fields populated
    await db.insert(purchaseRequestsTable)
      .values({
        employee_id: users[0].id,
        ebay_url: 'https://ebay.com/item',
        amazon_asin: 'ASIN123',
        item_name: 'Test Item',
        item_description: 'Test Description',
        item_price: '299.99',
        item_images: JSON.stringify(['image1.jpg']),
        status: 'pending'
      })
      .execute();

    const result = await getPurchaseRequestsByEmployee(users[0].id);

    expect(result).toHaveLength(1);
    
    const request = result[0];
    expect(typeof request.id).toBe('number');
    expect(typeof request.employee_id).toBe('number');
    expect(typeof request.ebay_url).toBe('string');
    expect(typeof request.amazon_asin).toBe('string');
    expect(typeof request.item_name).toBe('string');
    expect(typeof request.item_description).toBe('string');
    expect(typeof request.item_price).toBe('number');
    expect(Array.isArray(request.item_images)).toBe(true);
    expect(typeof request.status).toBe('string');
    expect(request.created_at).toBeInstanceOf(Date);
    expect(request.updated_at).toBeInstanceOf(Date);
  });
});
