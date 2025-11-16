/**
 * RBAC (Role-Based Access Control) and audit trail
 * Org/tenant permissions on datasets, analyses, and outputs
 */

export type Permission = 'read' | 'write' | 'delete' | 'admin'
export type ResourceType = 'dataset' | 'analysis' | 'output' | 'project' | 'aoi'

export interface Role {
  id: string
  name: string
  permissions: Permission[]
  resourceTypes: ResourceType[]
}

export interface User {
  id: string
  email: string
  organizationId?: string
  roles: string[] // Role IDs
}

export interface Policy {
  id: string
  organizationId?: string
  userId?: string
  resourceType: ResourceType
  resourceId?: string // Specific resource, or undefined for all resources of type
  permissions: Permission[]
  conditions?: Record<string, any> // Additional conditions
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resourceType: ResourceType
  resourceId?: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
  details?: Record<string, any>
  result: 'allowed' | 'denied'
}

/**
 * Simple in-memory RBAC store (in production, use database)
 */
class RBACStore {
  private users: Map<string, User> = new Map()
  private roles: Map<string, Role> = new Map()
  private policies: Map<string, Policy> = new Map()
  private auditLogs: AuditLog[] = []

  createRole(role: Omit<Role, 'id'>): Role {
    const id = `role-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const fullRole: Role = { ...role, id }
    this.roles.set(id, fullRole)
    return fullRole
  }

  getRole(id: string): Role | undefined {
    return this.roles.get(id)
  }

  createUser(user: Omit<User, 'id'>): User {
    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const fullUser: User = { ...user, id }
    this.users.set(id, fullUser)
    return fullUser
  }

  getUser(id: string): User | undefined {
    return this.users.get(id)
  }

  createPolicy(policy: Omit<Policy, 'id'>): Policy {
    const id = `policy-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const fullPolicy: Policy = { ...policy, id }
    this.policies.set(id, fullPolicy)
    return fullPolicy
  }

  checkPermission(
    userId: string,
    resourceType: ResourceType,
    permission: Permission,
    resourceId?: string
  ): boolean {
    const user = this.users.get(userId)
    if (!user) {
      this.logAudit(userId, 'check_permission', resourceType, resourceId, 'denied', {
        reason: 'User not found',
      })
      return false
    }

    // Check user's roles
    for (const roleId of user.roles) {
      const role = this.roles.get(roleId)
      if (role && role.permissions.includes(permission) && role.resourceTypes.includes(resourceType)) {
        this.logAudit(userId, 'check_permission', resourceType, resourceId, 'allowed', {
          reason: 'Role-based permission',
          roleId,
        })
        return true
      }
    }

    // Check policies
    for (const policy of this.policies.values()) {
      // Check if policy applies
      if (policy.userId && policy.userId !== userId) continue
      if (policy.organizationId && policy.organizationId !== user.organizationId) continue
      if (policy.resourceType !== resourceType) continue
      if (policy.resourceId && policy.resourceId !== resourceId) continue

      // Check permission
      if (policy.permissions.includes(permission) || policy.permissions.includes('admin')) {
        this.logAudit(userId, 'check_permission', resourceType, resourceId, 'allowed', {
          reason: 'Policy-based permission',
          policyId: policy.id,
        })
        return true
      }
    }

    this.logAudit(userId, 'check_permission', resourceType, resourceId, 'denied', {
      reason: 'No matching policy or role',
    })
    return false
  }

  logAudit(
    userId: string,
    action: string,
    resourceType: ResourceType,
    resourceId: string | undefined,
    result: 'allowed' | 'denied',
    details?: Record<string, any>
  ): void {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      userId,
      action,
      resourceType,
      resourceId,
      timestamp: new Date().toISOString(),
      result,
      details,
    }
    this.auditLogs.push(log)

    // Keep only last 10000 logs (in production, use proper log storage)
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000)
    }
  }

  getAuditLogs(
    userId?: string,
    resourceType?: ResourceType,
    startDate?: string,
    endDate?: string
  ): AuditLog[] {
    let logs = [...this.auditLogs]

    if (userId) {
      logs = logs.filter((l) => l.userId === userId)
    }
    if (resourceType) {
      logs = logs.filter((l) => l.resourceType === resourceType)
    }
    if (startDate) {
      logs = logs.filter((l) => l.timestamp >= startDate)
    }
    if (endDate) {
      logs = logs.filter((l) => l.timestamp <= endDate)
    }

    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  }
}

export const rbacStore = new RBACStore()
