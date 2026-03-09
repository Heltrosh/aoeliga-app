export function isGlobalAdmin(user?: any) {
  return user?.is_admin === 1;
}