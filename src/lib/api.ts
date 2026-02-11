import type {
  AuthResponse,
  Institution,
  CreateInstitutionPayload,
  UpdateInstitutionPayload,
  InstitutionClass,
  CreateClassPayload,
  UpdateClassPayload,
  StudentCode,
  CreateStudentCodePayload,
  BatchCreateStudentCodesPayload,
  InstitutionMember,
  AddMemberPayload,
  ClassTeacher,
  AssignTeacherPayload,
  Portfolio,
  PortalUserInfo,
  UserSearchResult,
  ApiError,
  SharedTablet,
  CreateSharedTabletPayload,
  UpdateSharedTabletPayload,
  Student,
  CreateStudentPayload,
  UpdateStudentPayload,
  AssignPortalTeacherPayload,
  InstitutionRole,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onTokenRefresh: ((tokens: { accessToken: string; refreshToken: string }) => void) | null =
    null;
  private onAuthError: (() => void) | null = null;

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  setOnTokenRefresh(callback: (tokens: { accessToken: string; refreshToken: string }) => void) {
    this.onTokenRefresh = callback;
  }

  setOnAuthError(callback: () => void) {
    this.onAuthError = callback;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: HeadersInit = {
      ...(options.headers || {}),
    };

    // Add auth header if we have a token
    if (this.accessToken) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${this.accessToken}`;
    }

    // Add content-type for JSON requests (unless it's FormData)
    if (!(options.body instanceof FormData)) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 - attempt token refresh
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.attemptTokenRefresh();
      if (refreshed) {
        // Retry the original request
        (headers as Record<string, string>)["Authorization"] = `Bearer ${this.accessToken}`;
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });

        if (!retryResponse.ok) {
          const error = await this.parseError(retryResponse);
          throw error;
        }

        return retryResponse.json() as Promise<T>;
      } else {
        this.onAuthError?.();
        throw { message: "Session expired", status: 401 } as ApiError;
      }
    }

    if (!response.ok) {
      const error = await this.parseError(response);
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.onTokenRefresh?.({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        });
        return true;
      }
    } catch {
      // Refresh failed
    }

    return false;
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const data = await response.json();
      return {
        message: data.message || data.error || "An error occurred",
        status: response.status,
      };
    } catch {
      return {
        message: response.statusText || "An error occurred",
        status: response.status,
      };
    }
  }

  // ========================================
  // Auth APIs
  // ========================================

  async loginWithGoogleToken(idToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/google/token", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  }

  async loginWithIdPassword(id: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: id, password }),
    });
  }

  async loginWithPin(email: string, pinCode: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/auth/admin/pin-login", {
      method: "POST",
      body: JSON.stringify({ email, pinCode }),
    });
  }

  async refreshTokens(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.request("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  }

  // ========================================
  // Portal APIs
  // ========================================

  async getMyPortalInfo(): Promise<PortalUserInfo> {
    return this.request<PortalUserInfo>("/portal/me");
  }

  // Portal: My Resources
  async getMyInstitutions(): Promise<Institution[]> {
    return this.request<Institution[]>("/portal/my-institutions");
  }

  async getMyClasses(): Promise<InstitutionClass[]> {
    return this.request<InstitutionClass[]>("/portal/my-classes");
  }

  async getMyStudents(): Promise<{ students: Student[]; total: number }> {
    return this.request<{ students: Student[]; total: number }>("/portal/my-students");
  }

  async getMySharedTablets(): Promise<{ tablets: SharedTablet[]; total: number }> {
    return this.request<{ tablets: SharedTablet[]; total: number }>("/portal/my-shared-tablets");
  }

  // Portal: Classes
  async createPortalClass(payload: CreateClassPayload): Promise<InstitutionClass> {
    return this.request<InstitutionClass>("/portal/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPortalClass(classId: string): Promise<InstitutionClass> {
    return this.request<InstitutionClass>(`/portal/classes/${classId}`);
  }

  async updatePortalClass(classId: string, payload: UpdateClassPayload): Promise<InstitutionClass> {
    return this.request<InstitutionClass>(`/portal/classes/${classId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deletePortalClass(classId: string): Promise<void> {
    return this.request<void>(`/portal/classes/${classId}`, {
      method: "DELETE",
    });
  }

  async getPortalClassTeachers(classId: string): Promise<ClassTeacher[]> {
    return this.request<ClassTeacher[]>(`/portal/classes/${classId}/teachers`);
  }

  async assignPortalTeacher(
    classId: string,
    payload: AssignPortalTeacherPayload
  ): Promise<ClassTeacher> {
    return this.request<ClassTeacher>(`/portal/classes/${classId}/teachers`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async removePortalTeacher(classId: string, userId: string): Promise<void> {
    return this.request<void>(`/portal/classes/${classId}/teachers/${userId}`, {
      method: "DELETE",
    });
  }

  // Portal: Students
  async getPortalStudents(params?: {
    classId?: string;
    institutionId?: string;
    institutionClassId?: string;
  }): Promise<{ students: Student[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.institutionId) queryParams.append("institutionId", params.institutionId);
    if (params?.institutionClassId) queryParams.append("institutionClassId", params.institutionClassId);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<{ students: Student[]; total: number }>(`/portal/students${query}`);
  }

  async createPortalStudent(payload: CreateStudentPayload): Promise<Student> {
    return this.request<Student>("/portal/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPortalStudent(studentId: string): Promise<Student> {
    return this.request<Student>(`/portal/students/${studentId}`);
  }

  async updatePortalStudent(studentId: string, payload: UpdateStudentPayload): Promise<Student> {
    return this.request<Student>(`/portal/students/${studentId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deletePortalStudent(studentId: string): Promise<void> {
    return this.request<void>(`/portal/students/${studentId}`, {
      method: "DELETE",
    });
  }

  async getStudentPortfolios(
    studentId: string
  ): Promise<{ portfolios: Portfolio[]; total: number }> {
    return this.request<{ portfolios: Portfolio[]; total: number }>(
      `/portal/students/${studentId}/portfolios`
    );
  }

  // Portal: Shared Tablets
  async getPortalSharedTablets(params?: {
    classId?: string;
    institutionId?: string;
    institutionClassId?: string;
  }): Promise<{ tablets: SharedTablet[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append("classId", params.classId);
    if (params?.institutionId) queryParams.append("institutionId", params.institutionId);
    if (params?.institutionClassId) queryParams.append("institutionClassId", params.institutionClassId);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : "";
    return this.request<{ tablets: SharedTablet[]; total: number }>(
      `/portal/shared-tablets${query}`
    );
  }

  async createPortalSharedTablet(payload: CreateSharedTabletPayload): Promise<SharedTablet> {
    return this.request<SharedTablet>("/portal/shared-tablets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPortalSharedTablet(id: string): Promise<SharedTablet> {
    return this.request<SharedTablet>(`/portal/shared-tablets/${id}`);
  }

  async updatePortalSharedTablet(
    id: string,
    payload: UpdateSharedTabletPayload
  ): Promise<SharedTablet> {
    return this.request<SharedTablet>(`/portal/shared-tablets/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deletePortalSharedTablet(id: string): Promise<void> {
    return this.request<void>(`/portal/shared-tablets/${id}`, {
      method: "DELETE",
    });
  }

  // Portal: Portfolios
  async createPortalPortfolio(studentId: string, formData: FormData): Promise<Portfolio> {
    return this.request<Portfolio>(`/portal/students/${studentId}/portfolios`, {
      method: "POST",
      body: formData,
    });
  }

  async getPortalPortfolio(studentId: string, portfolioId: string): Promise<Portfolio> {
    return this.request<Portfolio>(`/portal/students/${studentId}/portfolios/${portfolioId}`);
  }

  // Portal: Members
  async getPortalMembers(institutionId: string): Promise<InstitutionMember[]> {
    return this.request<InstitutionMember[]>(
      `/portal/members?institutionId=${encodeURIComponent(institutionId)}`
    );
  }

  async addPortalMember(
    institutionId: string,
    payload: { memberUserId: string; role: InstitutionRole }
  ): Promise<InstitutionMember> {
    return this.request<InstitutionMember>("/portal/members", {
      method: "POST",
      body: JSON.stringify({ ...payload, institutionId }),
    });
  }

  async removePortalMember(memberUserId: string, institutionId: string): Promise<void> {
    return this.request<void>(
      `/portal/members/${memberUserId}?institutionId=${encodeURIComponent(institutionId)}`,
      {
        method: "DELETE",
      }
    );
  }

  // Portal: User Search
  async searchPortalUser(email: string): Promise<UserSearchResult[]> {
    return this.request<UserSearchResult[]>(
      `/portal/users/search?email=${encodeURIComponent(email)}`
    );
  }

  // ========================================
  // Admin: Institution APIs
  // ========================================

  async getInstitutions(): Promise<Institution[]> {
    return this.request<Institution[]>("/admin/institutions");
  }

  async getInstitution(id: string): Promise<Institution> {
    return this.request<Institution>(`/admin/institutions/${id}`);
  }

  async createInstitution(payload: CreateInstitutionPayload): Promise<Institution> {
    return this.request<Institution>("/admin/institutions", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateInstitution(id: string, payload: UpdateInstitutionPayload): Promise<Institution> {
    return this.request<Institution>(`/admin/institutions/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteInstitution(id: string): Promise<void> {
    return this.request<void>(`/admin/institutions/${id}`, {
      method: "DELETE",
    });
  }

  // ========================================
  // Admin: Class APIs
  // ========================================

  async getClasses(institutionId?: string): Promise<InstitutionClass[]> {
    const query = institutionId ? `?institutionId=${institutionId}` : "";
    return this.request<InstitutionClass[]>(`/admin/institutions/classes${query}`);
  }

  async getClass(id: string): Promise<InstitutionClass> {
    return this.request<InstitutionClass>(`/admin/institutions/classes/${id}`);
  }

  async createClass(payload: CreateClassPayload): Promise<InstitutionClass> {
    return this.request<InstitutionClass>("/admin/institutions/classes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateClass(id: string, payload: UpdateClassPayload): Promise<InstitutionClass> {
    return this.request<InstitutionClass>(`/admin/institutions/classes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteClass(id: string): Promise<void> {
    return this.request<void>(`/admin/institutions/classes/${id}`, {
      method: "DELETE",
    });
  }

  // ========================================
  // Admin: Student APIs
  // ========================================

  async getStudents({
    institutionId,
    institutionClassId,
  }: {
    institutionId?: string;
    institutionClassId?: string;
  }): Promise<{ students: Student[]; total: number }> {
    const params = new URLSearchParams();
    if (institutionId) params.append("institutionId", institutionId);
    if (institutionClassId) params.append("institutionClassId", institutionClassId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ students: Student[]; total: number }>(`/admin/students${query}`);
  }

  async getStudent(id: string): Promise<Student> {
    return this.request<Student>(`/admin/students/${id}`);
  }

  async createStudent(payload: CreateStudentPayload): Promise<Student> {
    return this.request<Student>("/admin/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateStudent(id: string, payload: UpdateStudentPayload): Promise<Student> {
    return this.request<Student>(`/admin/students/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteStudent(id: string): Promise<void> {
    return this.request<void>(`/admin/students/${id}`, {
      method: "DELETE",
    });
  }

  // ========================================
  // Admin: Student Code APIs
  // ========================================

  async getStudentCodes(classId?: string, status?: string): Promise<StudentCode[]> {
    const params = new URLSearchParams();
    if (classId) params.append("classId", classId);
    if (status) params.append("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<StudentCode[]>(`/admin/institutions/student-codes${query}`);
  }

  async createStudentCode(payload: CreateStudentCodePayload): Promise<StudentCode> {
    return this.request<StudentCode>("/admin/institutions/student-codes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async batchCreateStudentCodes(payload: BatchCreateStudentCodesPayload): Promise<StudentCode[]> {
    return this.request<StudentCode[]>("/admin/institutions/student-codes/batch", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async deactivateStudentCode(id: string): Promise<StudentCode> {
    return this.request<StudentCode>(`/admin/institutions/student-codes/${id}/deactivate`, {
      method: "PATCH",
    });
  }

  async activateStudentCode(id: string): Promise<StudentCode> {
    return this.request<StudentCode>(`/admin/institutions/student-codes/${id}/activate`, {
      method: "PATCH",
    });
  }

  // ========================================
  // Admin: Member APIs
  // ========================================

  async getInstitutionMembers(institutionId: string): Promise<InstitutionMember[]> {
    return this.request<InstitutionMember[]>(`/admin/institutions/${institutionId}/members`);
  }

  async addInstitutionMember(
    institutionId: string,
    payload: AddMemberPayload
  ): Promise<InstitutionMember> {
    return this.request<InstitutionMember>(`/admin/institutions/${institutionId}/members`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async removeInstitutionMember(institutionId: string, userId: string): Promise<void> {
    return this.request<void>(`/admin/institutions/${institutionId}/members/${userId}`, {
      method: "DELETE",
    });
  }

  // ========================================
  // Admin: Teacher Assignment APIs
  // ========================================

  async getClassTeachers(classId: string): Promise<ClassTeacher[]> {
    return this.request<ClassTeacher[]>(`/admin/classes/${classId}/teachers`);
  }

  async assignTeacher(classId: string, payload: AssignTeacherPayload): Promise<ClassTeacher> {
    return this.request<ClassTeacher>(`/admin/classes/${classId}/teachers`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async unassignTeacher(classId: string, userId: string): Promise<void> {
    return this.request<void>(`/admin/classes/${classId}/teachers/${userId}`, {
      method: "DELETE",
    });
  }

  // ========================================
  // Admin: User Search APIs
  // ========================================

  async searchUserByEmail(email: string): Promise<UserSearchResult[]> {
    return this.request<UserSearchResult[]>(
      `/admin/users/search?email=${encodeURIComponent(email)}`
    );
  }

  // ========================================
  // Portfolio APIs
  // ========================================

  async getPortfolios(profileId: string): Promise<Portfolio[]> {
    return this.request<Portfolio[]>(`/portfolio?profileId=${profileId}`);
  }

  async getPortfolio(id: string): Promise<Portfolio> {
    return this.request<Portfolio>(`/portfolio/${id}`);
  }

  async createPortfolio(formData: FormData): Promise<Portfolio> {
    return this.request<Portfolio>("/portfolio", {
      method: "POST",
      body: formData,
    });
  }

  async updatePortfolio(id: string, formData: FormData): Promise<Portfolio> {
    // id is already appended in PortfolioForm
    return this.request<Portfolio>("/portfolio", {
      method: "POST",
      body: formData,
    });
  }

  async deletePortfolio(id: string): Promise<void> {
    return this.request<void>(`/portfolio/${id}`, {
      method: "DELETE",
    });
  }

  // ========================================
  // Admin: Shared Tablet APIs
  // ========================================

  async getSharedTablets({
    institutionId,
    institutionClassId,
  }: {
    institutionId?: string;
    institutionClassId?: string;
  } = {}): Promise<{ tablets: SharedTablet[]; total: number }> {
    const params = new URLSearchParams();
    if (institutionId) params.append("institutionId", institutionId);
    if (institutionClassId) params.append("institutionClassId", institutionClassId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ tablets: SharedTablet[]; total: number }>(
      `/admin/shared-tablets${query}`
    );
  }

  async getSharedTablet(id: string): Promise<SharedTablet> {
    return this.request<SharedTablet>(`/admin/shared-tablets/${id}`);
  }

  async createSharedTablet(payload: CreateSharedTabletPayload): Promise<SharedTablet> {
    return this.request<SharedTablet>("/admin/shared-tablets", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async updateSharedTablet(id: string, payload: UpdateSharedTabletPayload): Promise<SharedTablet> {
    return this.request<SharedTablet>(`/admin/shared-tablets/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async deleteSharedTablet(id: string): Promise<void> {
    return this.request<void>(`/admin/shared-tablets/${id}`, {
      method: "DELETE",
    });
  }

  async updateTabletPin(id: string, pinCode: string): Promise<void> {
    return this.request<void>(`/admin/shared-tablets/${id}/pin`, {
      method: "PUT",
      body: JSON.stringify({ pinCode }),
    });
  }
}

export const api = new ApiClient();
