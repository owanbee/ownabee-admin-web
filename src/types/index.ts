// User and Auth Types
export type GlobalRole = "USER" | "OPERATOR";

export type InstitutionRole = "INSTITUTION_ADMIN" | "TEACHER";

export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  globalRole: GlobalRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: User;
}

// Portal Types
export interface PortalUserInfo {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  globalRole: GlobalRole;
  institutionRoles: InstitutionMembership[];
}

export interface InstitutionMembership {
  institutionId: string;
  institutionName: string;
  role: InstitutionRole;
  assignedClasses?: AssignedClass[];
}

export interface AssignedClass {
  classId: string;
  className: string;
}

// Institution Types
export interface Institution {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    classes: number;
    members: number;
  };
}

export interface CreateInstitutionPayload {
  name: string;
  description?: string;
}

export interface UpdateInstitutionPayload {
  name?: string;
  description?: string;
}

// Class Types
export interface InstitutionClass {
  id: string;
  name: string;
  description: string | null;
  institutionId: string;
  institution?: Institution;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
    teachers: number;
  };
}

export interface CreateClassPayload {
  name: string;
  description?: string;
  institutionId: string;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string;
}

// Student Code Types
export type StudentCodeStatus = "AVAILABLE" | "USED" | "DEACTIVATED";

export interface StudentCode {
  id: string;
  code: string;
  status: StudentCodeStatus;
  classId: string;
  class?: InstitutionClass;
  profileId: string | null;
  profile?: StudentProfile | null;
  createdAt: string;
  usedAt: string | null;
}

export interface CreateStudentCodePayload {
  classId: string;
}

export interface BatchCreateStudentCodesPayload {
  classId: string;
  count: number;
}

// Student Profile Types
export interface StudentProfile {
  id: string;
  name: string;
  picture: string | null;
  createdAt: string;
  userId: string;
}

// Member Types
export interface InstitutionMember {
  id: string;
  userId: string;
  institutionId: string;
  role: InstitutionRole;
  user: User;
  createdAt: string;
}

export interface AddMemberPayload {
  userId: string;
  role: InstitutionRole;
}

export interface ClassTeacher {
  id: string;
  userId: string;
  classId: string;
  user: User;
  assignedAt: string;
}

export interface AssignTeacherPayload {
  userId: string;
}

// Portfolio Types
export type PortfolioContentType = "IMAGE" | "PDF" | "AUDIOBOOK";

export interface Portfolio {
  id: string;
  title: string;
  coverImage: string | null;
  profileId: string;
  createdAt: string;
  updatedAt: string;
  contentItems?: PortfolioContentItem[];
}

export interface PortfolioContentItem {
  id: string;
  type: PortfolioContentType;
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  order: number;
}

export interface CreatePortfolioPayload {
  title: string;
  profileId: string;
  coverImage?: File;
  contentItems?: CreatePortfolioContentItem[];
}

export interface CreatePortfolioContentItem {
  type: PortfolioContentType;
  file?: File;
  audiobookId?: string;
  title?: string;
}

export interface UpdatePortfolioPayload {
  title?: string;
  coverImage?: File;
  contentItems?: CreatePortfolioContentItem[];
}

// User Search
export interface UserSearchResult {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// B2B: Shared Tablet Types
export interface SharedTabletAccount {
  id: string;
  name: string;
  loginId: string | null;
  hasPinCode: boolean;
  institutionId: string;
  institution?: Institution;
  userId: string;
  user?: User;
  profileId: string;
  profile?: StudentProfile;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  _count?: {
    portfolios: number;
  };
}

export interface CreateSharedTabletPayload {
  name: string;
  loginId: string;
  pinCode?: string;
}

export interface UpdateTabletPinPayload {
  pinCode: string;
}

// B2B: Institution Parent Types
export type InstitutionParentStatus = "REGISTERED" | "ACTIVE";

export interface InstitutionParent {
  id: string;
  institutionId: string;
  institution?: Institution;
  userId: string;
  user?: User;
  childName: string;
  phoneNumber: string | null;
  memo: string | null;
  status: InstitutionParentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  transfers?: PortfolioTransfer[];
}

export interface CreateInstitutionParentPayload {
  userId: string;
  childName: string;
  phoneNumber?: string | undefined;
  memo?: string | undefined;
}

export interface UpdateInstitutionParentPayload {
  childName?: string;
  phoneNumber?: string | undefined;
  memo?: string | undefined;
}

// B2B: Portfolio Transfer Types
export type TransferSourceAction = "KEEP" | "DELETE";

export interface PortfolioTransfer {
  id: string;
  portfolioId: string;
  portfolio?: Portfolio;
  sourceProfileId: string;
  sourceProfile?: StudentProfile;
  targetProfileId: string;
  targetProfile?: StudentProfile;
  targetUserId: string;
  targetUser?: User;
  transferredBy: string;
  transferredByUser?: User;
  institutionParentId: string;
  institutionParent?: InstitutionParent;
  sourceAction: TransferSourceAction;
  newPortfolioId: string | null;
  createdAt: string;
}

export interface TransferPortfoliosPayload {
  institutionParentId: string;
  sourceProfileId: string;
  portfolioIds: string[];
  sourceAction: TransferSourceAction;
}

export interface TransferHistoryQuery {
  institutionId?: string;
  startDate?: string;
  endDate?: string;
}
