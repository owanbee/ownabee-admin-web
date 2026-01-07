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
  StudentProfile,
  InstitutionMember,
  AddMemberPayload,
  ClassTeacher,
  AssignTeacherPayload,
  Portfolio,
  PortalUserInfo,
  UserSearchResult,
  ApiError,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onTokenRefresh: ((tokens: { accessToken: string; refreshToken: string }) => void) | null = null;
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
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

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
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

  async getMyClasses(): Promise<InstitutionClass[]> {
    return this.request<InstitutionClass[]>("/portal/classes");
  }

  async getClassStudents(classId: string): Promise<StudentProfile[]> {
    return this.request<StudentProfile[]>(`/portal/classes/${classId}/students`);
  }

  async getStudentPortfolios(profileId: string): Promise<Portfolio[]> {
    return this.request<Portfolio[]>(`/portal/students/${profileId}/portfolios`);
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

  async addInstitutionMember(institutionId: string, payload: AddMemberPayload): Promise<InstitutionMember> {
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
    return this.request<UserSearchResult[]>(`/admin/users/search?email=${encodeURIComponent(email)}`);
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
    formData.append("id", id);
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
}

export const api = new ApiClient();
