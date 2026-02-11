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
  userId: string;
  email: string;
  name: string | null;
  picture: string | null;
  globalRole: GlobalRole;
  roles: string[];
  isInstitutionAdmin: boolean;
  isTeacher: boolean;
  institutionMemberships: InstitutionMembership[];
  assignedClasses: AssignedClass[];
}

export interface InstitutionMembership {
  institutionId: string;
  institutionName: string;
  role: InstitutionRole;
}

export interface AssignedClass {
  classId: string;
  className: string;
  institutionId: string;
  institutionName: string;
}

// Institution Types
export interface Institution {
  id: string;
  name: string;
  memo: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    institutionClasses: number;
    members: number;
    students: number;
    sharedTablets: number;
  };
}

export interface CreateInstitutionPayload {
  name: string;
  memo?: string;
}

export interface UpdateInstitutionPayload {
  name?: string;
  memo?: string;
}

// Class Types
export interface InstitutionClass {
  id: string;
  name: string;
  memo: string | null;
  institutionId: string;
  institution?: Institution;
  createdAt: string;
  updatedAt: string;
  _count?: {
    students: number;
    teachers: number;
    sharedTablets: number;
  };
}

export interface CreateClassPayload {
  name: string;
  memo?: string;
  institutionId: string;
}

export interface UpdateClassPayload {
  name?: string;
  memo?: string;
}

// Student Types
export interface Student {
  id: string;
  userId: string;
  username: string | null;
  name: string;
  studentNumber: string | null;
  grade: string | null;
  memo: string | null;
  institutionId?: string;
  institutionClassId?: string;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    portfolios: number;
  };
  // For detail view (nested objects)
  institution?: {
    id: string;
    name: string;
  };
  institutionClass?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

export interface CreateStudentPayload {
  institutionId: string;
  institutionClassId: string;
  username: string;
  password: string;
  name: string;
  studentNumber?: string;
  grade?: string;
  memo?: string;
}

export interface UpdateStudentPayload {
  name?: string;
  studentNumber?: string;
  grade?: string;
  memo?: string;
  password?: string;
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
export type ProfileType = "B2C" | "B2B";

export interface StudentProfile {
  id: string;
  name: string;
  picture: string | null;
  type?: ProfileType;
  institutionName?: string;
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
  createdAt: string;
}

export interface AssignTeacherPayload {
  userId: string;
}

export interface AssignPortalTeacherPayload {
  teacherUserId: string;
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
export interface SharedTablet {
  id: string;
  userId: string;
  username: string | null;
  name: string;
  institutionId: string;
  institutionClassId: string;
  memo: string | null;
  createdAt: string;
  updatedAt?: string;
  // For detail view (nested objects)
  institution?: {
    id: string;
    name: string;
  };
  institutionClass?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
  };
}

export interface CreateSharedTabletPayload {
  institutionId: string;
  institutionClassId: string;
  name: string;
  username: string;
  password: string;
  memo?: string;
}

export interface UpdateSharedTabletPayload {
  name?: string;
  memo?: string;
  password?: string;
}
