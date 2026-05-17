/**
 * Anti Gravity Developer Hub Permissions Engine
 * Defines which roles can edit which modules (folder paths)
 */

export const DEV_ROLES = {
  LEAD: 'Lead Developer',
  FRONTEND: 'Frontend Developer',
  BACKEND: 'Backend Developer',
  DATABASE: 'Database Engineer',
  DEVOPS: 'DevOps Engineer',
  QA: 'QA Tester',
  REVIEWER: 'Reviewer',
  GUEST: 'Guest Viewer'
};

export const MODULE_OWNERSHIP = {
  'frontend': [DEV_ROLES.LEAD, DEV_ROLES.FRONTEND],
  'backend': [DEV_ROLES.LEAD, DEV_ROLES.BACKEND],
  'database': [DEV_ROLES.LEAD, DEV_ROLES.DATABASE],
  'devops': [DEV_ROLES.LEAD, DEV_ROLES.DEVOPS],
  'docs': [DEV_ROLES.LEAD, DEV_ROLES.FRONTEND, DEV_ROLES.BACKEND, DEV_ROLES.REVIEWER],
  'root': [DEV_ROLES.LEAD] // root files like package.json
};

/**
 * Checks if a user has permission to edit a specific file path
 * @param {string} role - The user's role in the workspace
 * @param {string} path - The file path (e.g., 'frontend/App.jsx')
 * @returns {boolean}
 */
export const canEditPath = (role, path) => {
  if (!role || !path) return false;
  if (role === DEV_ROLES.LEAD) return true;

  // Extract the root module from the path (e.g., 'frontend' from 'frontend/App.jsx')
  const module = path.split('/')[0];
  
  // If the file is in a known module, check ownership
  if (MODULE_OWNERSHIP[module]) {
    return MODULE_OWNERSHIP[module].includes(role);
  }

  // Files in root directory only Lead can edit
  if (!path.includes('/')) {
    return MODULE_OWNERSHIP['root'].includes(role);
  }

  return false;
};

export const getRoleColor = (role) => {
  switch (role) {
    case DEV_ROLES.LEAD: return '#f59e0b'; // Amber
    case DEV_ROLES.FRONTEND: return '#6366f1'; // Indigo
    case DEV_ROLES.BACKEND: return '#10b981'; // Emerald
    case DEV_ROLES.DATABASE: return '#06b6d4'; // Cyan
    case DEV_ROLES.DEVOPS: return '#a855f7'; // Purple
    case DEV_ROLES.QA: return '#f43f5e'; // Rose
    case DEV_ROLES.REVIEWER: return '#84cc16'; // Lime
    default: return '#94a3b8'; // Slate
  }
};
