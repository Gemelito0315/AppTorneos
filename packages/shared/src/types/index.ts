import { Role, TournamentStatus } from '../constants';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string | null;
  organizationId?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  country: string;
  createdAt: string;
}

export interface ModalitySummary {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isDefault: boolean;
}

export interface TournamentSummary {
  id: string;
  name: string;
  description?: string | null;
  venue: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  isPublic: boolean;
  contactPhone?: string | null;
  contactEmail?: string | null;
  posterUrl?: string | null;
  organizationId: string;
  organizationName?: string;
  modalityId: string;
  modalityName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  detailsJson?: string | null;
  ipAddress?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserSummary;
  organization?: OrganizationSummary | null;
  tokens: AuthTokens;
}
