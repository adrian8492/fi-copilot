import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo } from "react";

export type AppRole = "admin" | "manager" | "viewer";

export type PageAccess = "admin" | "manager" | "all";

/** Maps page paths to their required access level */
export const PAGE_ACCESS: Record<string, PageAccess> = {
  "/admin": "admin",
  "/settings": "admin",
  "/compliance-rules": "admin",
  "/upload": "manager",
  "/eagle-eye": "manager",
  "/scorecard": "manager",
};

export function useRole() {
  const { user } = useAuth();

  const role: AppRole = useMemo(() => {
    if (!user) return "viewer";
    if (user.isSuperAdmin || user.isGroupAdmin || user.role === "admin") return "admin";
    // Default authenticated users are managers (F&I managers)
    return "manager";
  }, [user]);

  const canAccess = (path: string): boolean => {
    const required = PAGE_ACCESS[path];
    if (!required || required === "all") return true;
    if (required === "admin") return role === "admin";
    if (required === "manager") return role === "admin" || role === "manager";
    return true;
  };

  return { role, canAccess, user };
}
