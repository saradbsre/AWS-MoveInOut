export const BranchRoles = [
  "branch",
  "asst. branch",
  "branch incharge"
];

export const SysAdminRoles = [
  "system administrator",
  "maintenance"
];

// Utility to get normalized role group
export function getRoleGroup(role: string): "branch" | "system administrator" | undefined {
  const r = (role || "").trim().toLowerCase();
  if (BranchRoles.includes(r)) return "branch";
  if (SysAdminRoles.includes(r)) return "system administrator";
  return undefined;
}