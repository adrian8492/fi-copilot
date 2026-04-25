/**
 * Multi-tenant query enforcement layer.
 *
 * The schema already carries `dealershipId` on every tenant-scoped table.
 * This module is the *enforcement* — it derives a TenantScope from the
 * authenticated user and gives query call sites three primitives:
 *
 *   - resolveTenantScope(user)    → TenantScope
 *   - assertTenantAccess(scope, row) → throws FORBIDDEN if cross-tenant
 *   - tenantFilter(scope, col)    → SQL fragment for Drizzle WHERE
 *
 * Tenancy semantics for `dealershipIds`:
 *   - null  → super admin, no restriction
 *   - []    → user has no dealership assignment, sees nothing
 *   - [n]   → regular user/admin scoped to one dealership
 *   - [n,m] → group admin scoped to all dealerships in their group
 *
 * Pilot context: Korum and Paragon will share this database. Any forgotten
 * tenant filter is a leak across two NADA-visible dealer groups.
 */

import { TRPCError } from "@trpc/server";
import { eq, inArray, type Column, type SQL } from "drizzle-orm";
import type { User } from "../drizzle/schema";
import { getUserAccessibleDealershipIds } from "./db";

export type TenantScope = {
  /** null = super admin, sees everything. [] = no access. Otherwise allow-list of dealership IDs. */
  dealershipIds: number[] | null;
  isSuperAdmin: boolean;
  /** The user's primary dealership (the one their identity is tied to). */
  primaryDealershipId: number | null;
  userId: number;
};

/**
 * Build the tenant scope for the request's authenticated user.
 *
 * @throws TRPCError UNAUTHORIZED if user is null/missing.
 */
export async function resolveTenantScope(user: User | null): Promise<TenantScope> {
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  if (user.isSuperAdmin) {
    return {
      dealershipIds: null,
      isSuperAdmin: true,
      primaryDealershipId: user.dealershipId ?? null,
      userId: user.id,
    };
  }
  if (user.isGroupAdmin) {
    const ids = await getUserAccessibleDealershipIds(user.id);
    return {
      dealershipIds: ids,
      isSuperAdmin: false,
      primaryDealershipId: user.dealershipId ?? null,
      userId: user.id,
    };
  }
  const ids = user.dealershipId != null ? [user.dealershipId] : [];
  return {
    dealershipIds: ids,
    isSuperAdmin: false,
    primaryDealershipId: user.dealershipId ?? null,
    userId: user.id,
  };
}

/**
 * Assert the row belongs to the user's tenant scope.
 *
 * Use after any DB read that returns rows callable code might inspect or
 * forward to the client. Throws FORBIDDEN on cross-tenant access.
 */
export function assertTenantAccess(
  scope: TenantScope,
  row: { dealershipId: number | null }
): void {
  if (scope.isSuperAdmin || scope.dealershipIds === null) return;
  if (row.dealershipId == null) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Resource is not assigned to a dealership",
    });
  }
  if (!scope.dealershipIds.includes(row.dealershipId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Resource belongs to a different dealership",
    });
  }
}

/**
 * Build a Drizzle WHERE clause restricting a query to the tenant scope.
 *
 *   - super admin → undefined (no SQL restriction)
 *   - empty scope → never-true sentinel (no rows)
 *   - single id   → eq(col, id)
 *   - multi id    → inArray(col, ids)
 *
 * Compose with other WHERE conditions via drizzle-orm `and()`:
 *
 *   await db.select().from(transcripts)
 *     .where(and(eq(transcripts.sessionId, n), tenantFilter(scope, transcripts.dealershipId)));
 */
export function tenantFilter(scope: TenantScope, col: Column): SQL | undefined {
  if (scope.isSuperAdmin || scope.dealershipIds === null) return undefined;
  if (scope.dealershipIds.length === 0) {
    // Auto-increment dealership IDs are positive; -1 matches nothing.
    return eq(col, -1);
  }
  if (scope.dealershipIds.length === 1) {
    return eq(col, scope.dealershipIds[0]);
  }
  return inArray(col, scope.dealershipIds);
}

/**
 * Non-throwing variant of assertTenantAccess. Useful for branching logic
 * (e.g., "if super admin show extra columns, else hide them").
 */
export function canAccessDealership(
  scope: TenantScope,
  dealershipId: number | null
): boolean {
  if (scope.isSuperAdmin || scope.dealershipIds === null) return true;
  if (dealershipId == null) return false;
  return scope.dealershipIds.includes(dealershipId);
}
