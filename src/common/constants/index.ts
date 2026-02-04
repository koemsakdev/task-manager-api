export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
}

export enum RoleType {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
}

export enum ActivityAction {
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
  COMPLETED = 'completed',
  COMMENTED = 'commented',
  UPLOADED = 'uploaded',
}

export enum EntityType {
  PROJECT = 'project',
  TASK = 'task',
  COMMENT = 'comment',
  FILE = 'file',
  MEMBER = 'member',
  TIME_LOG = 'time_log',
}

export const DEFAULT_PERMISSIONS = {
  [RoleType.ADMIN]: {
    project: ['create', 'read', 'update', 'delete', 'manage_members'],
    task: ['create', 'read', 'update', 'delete', 'assign'],
    file: ['upload', 'download', 'delete'],
    message: ['send', 'read', 'delete'],
    report: ['view', 'export'],
    settings: ['manage'],
  },
  [RoleType.MANAGER]: {
    project: ['read', 'update', 'manage_members'],
    task: ['create', 'read', 'update', 'delete', 'assign'],
    file: ['upload', 'download', 'delete'],
    message: ['send', 'read'],
    report: ['view', 'export'],
    settings: [],
  },
  [RoleType.MEMBER]: {
    project: ['read'],
    task: ['create', 'read', 'update'],
    file: ['upload', 'download'],
    message: ['send', 'read'],
    report: ['view'],
    settings: [],
  },
};
