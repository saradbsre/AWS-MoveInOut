export interface ModulePermissions {
  access: boolean;
  add: boolean;
  delete: boolean;
  modify: boolean;
  print: boolean;
}

export interface UserModule {
  name: string;
  path: string;
  accessKey: string;
  permissions: ModulePermissions;
}

export const getUserModules = (): UserModule[] => {
  const storedModules = sessionStorage.getItem('userModules');
  return storedModules ? JSON.parse(storedModules) : [];
};

export const hasModuleAccess = (modulePath: string): boolean => {
  const modules = getUserModules();
  return modules.some(module => module.path === modulePath && module.permissions.access);
};

export const getModulePermissions = (modulePath: string): ModulePermissions | null => {
  const modules = getUserModules();
  const module = modules.find(m => m.path === modulePath);
  return module ? module.permissions : null;
};

export const canUserAdd = (modulePath: string): boolean => {
  const permissions = getModulePermissions(modulePath);
  return permissions ? permissions.add : false;
};

export const canUserModify = (modulePath: string): boolean => {
  const permissions = getModulePermissions(modulePath);
  return permissions ? permissions.modify : false;
};

export const canUserDelete = (modulePath: string): boolean => {
  const permissions = getModulePermissions(modulePath);
  return permissions ? permissions.delete : false;
};

export const canUserPrint = (modulePath: string): boolean => {
  const permissions = getModulePermissions(modulePath);
  return permissions ? permissions.print : false;
};