import { describe, test, expect } from 'vitest'
import { rbacStore } from '../rbac'

describe('RBAC', () => {
  test('creates role', () => {
    const role = rbacStore.createRole({
      name: 'Analyst',
      permissions: ['read', 'write'],
      resourceTypes: ['dataset', 'analysis'],
    })

    expect(role.id).toBeDefined()
    expect(role.name).toBe('Analyst')
    expect(role.permissions).toEqual(['read', 'write'])
    expect(role.resourceTypes).toEqual(['dataset', 'analysis'])

    const retrieved = rbacStore.getRole(role.id)
    expect(retrieved).toEqual(role)
  })

  test('creates user', () => {
    const user = rbacStore.createUser({
      email: 'user@example.com',
      roles: [],
      organizationId: 'org-1',
    })

    expect(user.id).toBeDefined()
    expect(user.email).toBe('user@example.com')
    expect(user.organizationId).toBe('org-1')

    const retrieved = rbacStore.getUser(user.id)
    expect(retrieved).toEqual(user)
  })

  test('creates policy', () => {
    const policy = rbacStore.createPolicy({
      userId: 'user-1',
      resourceType: 'dataset',
      permissions: ['read', 'write'],
    })

    expect(policy.id).toBeDefined()
    expect(policy.userId).toBe('user-1')
    expect(policy.resourceType).toBe('dataset')
    expect(policy.permissions).toEqual(['read', 'write'])
  })

  test('checks permission and logs audit', () => {
    const user = rbacStore.createUser({
      email: 'user@example.com',
      roles: [],
    })

    const role = rbacStore.createRole({
      name: 'Reader',
      permissions: ['read'],
      resourceTypes: ['dataset'],
    })

    user.roles.push(role.id)

    const hasPermission = rbacStore.checkPermission(user.id, 'dataset', 'read')
    expect(hasPermission).toBe(true)

    const logs = rbacStore.getAuditLogs(user.id)
    expect(logs.length).toBeGreaterThan(0)
    expect(logs[0].action).toBe('check_permission')
    expect(logs[0].result).toBe('allowed')
  })

  test('denies permission for non-existent user', () => {
    const hasPermission = rbacStore.checkPermission('non-existent', 'dataset', 'read')
    expect(hasPermission).toBe(false)

    const logs = rbacStore.getAuditLogs('non-existent')
    expect(logs.length).toBeGreaterThan(0)
    expect(logs[0].result).toBe('denied')
  })

  test('gets audit logs with filters', () => {
    const user = rbacStore.createUser({
      email: 'user@example.com',
      roles: [],
    })

    rbacStore.checkPermission(user.id, 'dataset', 'read')
    rbacStore.checkPermission(user.id, 'analysis', 'write')

    const datasetLogs = rbacStore.getAuditLogs(undefined, 'dataset')
    expect(datasetLogs.length).toBeGreaterThan(0)
    expect(datasetLogs.every((l) => l.resourceType === 'dataset')).toBe(true)

    const userLogs = rbacStore.getAuditLogs(user.id)
    expect(userLogs.length).toBeGreaterThan(0)
    expect(userLogs.every((l) => l.userId === user.id)).toBe(true)
  })

  test('filters audit logs by date range', () => {
    const user = rbacStore.createUser({
      email: 'user@example.com',
      roles: [],
    })

    const startDate = new Date().toISOString()
    rbacStore.checkPermission(user.id, 'dataset', 'read')
    const endDate = new Date().toISOString()

    const logs = rbacStore.getAuditLogs(undefined, undefined, startDate, endDate)
    expect(logs.length).toBeGreaterThanOrEqual(1)
  })

  test('limits audit log size', () => {
    const user = rbacStore.createUser({
      email: 'user@example.com',
      roles: [],
    })

    // Create many audit logs
    for (let i = 0; i < 10001; i++) {
      rbacStore.logAudit(user.id, 'test', 'dataset', undefined, 'allowed')
    }

    const logs = rbacStore.getAuditLogs()
    expect(logs.length).toBeLessThanOrEqual(10000)
  })
})
