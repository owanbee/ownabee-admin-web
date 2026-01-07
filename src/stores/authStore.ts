import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User, PortalUserInfo, AuthTokens } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  portalInfo: PortalUserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  setPortalInfo: (portalInfo: PortalUserInfo) => void;
  updateTokens: (tokens: AuthTokens) => void;
  logout: () => void;
  initialize: () => Promise<void>;
  fetchPortalInfo: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      portalInfo: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isInitialized: false,

      setAuth: (user, tokens) => {
        api.setTokens(tokens.accessToken, tokens.refreshToken);
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },

      setPortalInfo: (portalInfo) => {
        set({ portalInfo });
      },

      updateTokens: (tokens) => {
        api.setTokens(tokens.accessToken, tokens.refreshToken);
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
      },

      logout: () => {
        api.clearTokens();
        set({
          user: null,
          portalInfo: null,
          accessToken: null,
          refreshToken: null,
        });
      },

      initialize: async () => {
        const { accessToken, refreshToken, isInitialized } = get();

        if (isInitialized) return;

        set({ isLoading: true });

        if (accessToken && refreshToken) {
          api.setTokens(accessToken, refreshToken);

          // Set up token refresh callback
          api.setOnTokenRefresh((tokens) => {
            get().updateTokens(tokens);
          });

          // Set up auth error callback
          api.setOnAuthError(() => {
            get().logout();
          });

          try {
            // Fetch portal info to validate token and get user roles
            const portalInfo = await api.getMyPortalInfo();
            set({
              portalInfo,
              user: {
                id: portalInfo.id,
                email: portalInfo.email,
                name: portalInfo.name,
                picture: portalInfo.picture,
                globalRole: portalInfo.globalRole,
              },
              isLoading: false,
              isInitialized: true,
            });
          } catch {
            // Token is invalid, clear auth state
            get().logout();
            set({ isLoading: false, isInitialized: true });
          }
        } else {
          set({ isLoading: false, isInitialized: true });
        }
      },

      fetchPortalInfo: async () => {
        try {
          const portalInfo = await api.getMyPortalInfo();
          set({
            portalInfo,
            user: {
              id: portalInfo.id,
              email: portalInfo.email,
              name: portalInfo.name,
              picture: portalInfo.picture,
              globalRole: portalInfo.globalRole,
            },
          });
        } catch (error) {
          console.error("Failed to fetch portal info:", error);
        }
      },
    }),
    {
      name: "ownabee-admin-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// Helper hooks
export function useIsOperator(): boolean {
  const user = useAuthStore((state) => state.user);
  return user?.globalRole === "OPERATOR";
}

export function useHasInstitutionAccess(): boolean {
  const portalInfo = useAuthStore((state) => state.portalInfo);
  const isOperator = useIsOperator();

  return isOperator || (portalInfo?.institutionRoles?.length ?? 0) > 0;
}

export function useCanManagePortfolios(): boolean {
  // All authenticated users with institution roles can manage portfolios
  return useHasInstitutionAccess();
}
