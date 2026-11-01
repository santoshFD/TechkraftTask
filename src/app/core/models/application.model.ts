export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type ReviewDecision = 'APPROVE' | 'REJECT';

export interface RiskEvent {
  id: string;
  at: string;
  actorName: string;
  actorRole: string;
  summary: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface BusinessInfo {
  legalName: string;
  dba: string;
  taxId: string;
  mcc: string;
  website: string;
  monthlyVolume: number | null;
}

export interface OwnerInfo {
  fullName: string;
  email: string;
  phone: string;
  ownershipPercent: number | null;
  ssn: string;
}

export interface BankingInfo {
  accountHolder: string;
  routingNumber: string;
  accountNumber: string;
}

export interface MerchantApplication {
  id: string;
  status: ApplicationStatus;
  createdByUserId: string;
  createdByName: string;
  assignedReviewerId: string | null;
  assignedReviewerName: string | null;
  business: BusinessInfo;
  owner: OwnerInfo;
  banking: BankingInfo;
  riskHistory: RiskEvent[];
  updatedAt: string;
  submittedAt: string | null;
}

export interface ApplicationListItem {
  id: string;
  status: ApplicationStatus;
  legalName: string;
  createdByUserId: string;
  createdByName: string;
  assignedReviewerName: string | null;
  assignedReviewerId: string | null;
  updatedAt: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ApplicationListSortField =
  | 'legalName'
  | 'status'
  | 'createdByName'
  | 'assignedReviewerName'
  | 'updatedAt';

export type ApplicationSortDirection = 'asc' | 'desc';

export interface ApplicationQuery {
  page: number;
  pageSize: number;
  status?: ApplicationStatus | '';
  search?: string;
  sortBy?: ApplicationListSortField;
  sortDirection?: ApplicationSortDirection;
}

/** Aggregated counts for dashboard KPI cards (role-scoped on server). */
export interface ApplicationDashboardStats {
  draft: number;
  pendingReview: number;
  completed: number;
  total: number;
}

export type ApplicationUniqueField = 'legalName' | 'taxId';

export interface ApplicationFieldCheck {
  field: ApplicationUniqueField;
  value: string;
  excludeApplicationId: string;
}

export interface FieldAvailabilityResult {
  available: boolean;
}

export interface ReviewPayload {
  decision: ReviewDecision;
  notes: string;
  riskLevel: RiskEvent['level'];
}

export interface ReviewerOption {
  id: string;
  displayName: string;
  email: string;
}

export interface AssignReviewerPayload {
  reviewerId: string | null;
}
