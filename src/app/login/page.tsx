"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { FolderOpen } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { user, setAuth, setPortalInfo, initialize, isInitialized } = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  React.useEffect(() => {
    if (isInitialized && user) {
      router.replace("/dashboard");
    }
  }, [isInitialized, user, router]);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);

    if (!credentialResponse.credential) {
      setError("No credential received from Google");
      return;
    }

    try {
      // Send the ID token to our backend
      const authResponse = await api.loginWithGoogleToken(credentialResponse.credential);

      // Set auth state
      setAuth(authResponse.user, authResponse.tokens);

      // Fetch portal info
      api.setTokens(authResponse.tokens.accessToken, authResponse.tokens.refreshToken);
      try {
        const portalInfo = await api.getMyPortalInfo();
        setPortalInfo(portalInfo);
      } catch (portalError) {
        console.warn("Failed to fetch portal info:", portalError);
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Backend auth error:", err);
      setError(err instanceof Error ? err.message : "Failed to authenticate");
    }
  };

  const handleGoogleError = () => {
    setError("Failed to sign in with Google. Please try again.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
            <FolderOpen className="h-6 w-6 text-primary-600" />
          </div>
          <CardTitle className="text-2xl">Welcome to Ownabee</CardTitle>
          <CardDescription>
            Sign in to access the admin portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              type="standard"
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="300"
            />
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Only authorized users can access this portal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
