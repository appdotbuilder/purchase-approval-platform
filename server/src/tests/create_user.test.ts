
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input for employee
const testEmployeeInput: CreateUserInput = {
  email: 'employee@test.com',
  name: 'Test Employee',
  role: 'employee'
};

// Test input for approver
const testApproverInput: CreateUserInput = {
  email: 'approver@test.com',
  name: 'Test Approver',
  role: 'approver'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an employee user', async () => {
    const result = await createUser(testEmployeeInput);

    // Basic field validation
    expect(result.email).toEqual('employee@test.com');
    expect(result.name).toEqual('Test Employee');
    expect(result.role).toEqual('employee');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an approver user', async () => {
    const result = await createUser(testApproverInput);

    // Basic field validation
    expect(result.email).toEqual('approver@test.com');
    expect(result.name).toEqual('Test Approver');
    expect(result.role).toEqual('approver');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testEmployeeInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('employee@test.com');
    expect(users[0].name).toEqual('Test Employee');
    expect(users[0].role).toEqual('employee');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique email constraint', async () => {
    // Create first user
    await createUser(testEmployeeInput);

    // Try to create second user with same email
    await expect(createUser(testEmployeeInput)).rejects.toThrow(/unique/i);
  });

  it('should create users with different roles', async () => {
    // Create both employee and approver
    const employee = await createUser(testEmployeeInput);
    const approver = await createUser(testApproverInput);

    // Verify both users exist with correct roles
    const users = await db.select()
      .from(usersTable)
      .execute();

    expect(users).toHaveLength(2);
    
    const employeeUser = users.find(u => u.id === employee.id);
    const approverUser = users.find(u => u.id === approver.id);

    expect(employeeUser?.role).toEqual('employee');
    expect(approverUser?.role).toEqual('approver');
  });
});
