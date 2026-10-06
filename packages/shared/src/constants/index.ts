/**
 * Roles del sistema
 */
export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN_CLUB: 'ADMIN_CLUB',
  ORGANIZADOR: 'ORGANIZADOR',
  ARBITRO: 'ARBITRO',
  ATLETA: 'ATLETA',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Estados del Torneo
 */
export const TOURNAMENT_STATUS = {
  DRAFT: 'DRAFT',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  DRAW_PENDING: 'DRAW_PENDING',
  DRAW_COMPLETED: 'DRAW_COMPLETED',
  IN_PROGRESS: 'IN_PROGRESS',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
} as const;

export type TournamentStatus = (typeof TOURNAMENT_STATUS)[keyof typeof TOURNAMENT_STATUS];

/**
 * Códigos de Modalidades base de billar
 */
export const MODALITY_CODES = {
  THREE_CUSHION: '3_BANDAS',
  FREE_GAME: 'LIBRE',
  EIGHT_BALL: 'BOLA_8',
  NINE_BALL: 'BOLA_9',
  TEN_BALL: 'BOLA_10',
} as const;

export type ModalityCode = (typeof MODALITY_CODES)[keyof typeof MODALITY_CODES];

/**
 * Acciones para el Log de Auditoría
 */
export const AUDIT_ACTIONS = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  ORGANIZATION_CREATED: 'ORGANIZATION_CREATED',
  ORGANIZATION_UPDATED: 'ORGANIZATION_UPDATED',
  TOURNAMENT_CREATED: 'TOURNAMENT_CREATED',
  TOURNAMENT_UPDATED: 'TOURNAMENT_UPDATED',
  TOURNAMENT_DELETED: 'TOURNAMENT_DELETED',
  DRAW_EXECUTED: 'DRAW_EXECUTED',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
