
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable).values([
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
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Check first user
    expect(result[0].email).toEqual('employee@test.com');
    expect(result[0].name).toEqual('Test Employee');
    expect(result[0].role).toEqual('employee');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second user
    expect(result[1].email).toEqual('approver@test.com');
    expect(result[1].name).toEqual('Test Approver');
    expect(result[1].role).toEqual('approver');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return users with correct field types', async () => {
    // Create test user
    await db.insert(usersTable).values({
      email: 'test@example.com',
      name: 'Test User',
      role: 'employee'
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    
    expect(typeof user.id).toBe('number');
    expect(typeof user.email).toBe('string');
    expect(typeof user.name).toBe('string');
    expect(typeof user.role).toBe('string');
    expect(user.created_at).toBeInstanceOf(Date);
  });
});
