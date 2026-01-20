"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { FolderOpen, KeyRound, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const router = useRouter();
  const { user, setAuth, setPortalInfo, initialize, isInitialized } = useAuthStore();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // PIN 로그인 폼 상태
  const [email, setEmail] = React.useState("");
  const [pinCode, setPinCode] = React.useState("");

  React.useEffect(() => {
    initialize();
  }, [initialize]);

  React.useEffect(() => {
    if (isInitialized && user) {
      router.replace("/dashboard");
    }
  }, [isInitialized, user, router]);

  const handleLoginSuccess = async (authResponse: { user: any; tokens: { accessToken: string; refreshToken: string } }) => {
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
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);

    if (!credentialResponse.credential) {
      setError("No credential received from Google");
      return;
    }

    try {
      const authResponse = await api.loginWithGoogleToken(credentialResponse.credential);
      await handleLoginSuccess(authResponse);
    } catch (err) {
      console.error("Backend auth error:", err);
      setError(err instanceof Error ? err.message : "Failed to authenticate");
    }
  };

  const handleGoogleError = () => {
    setError("Failed to sign in with Google. Please try again.");
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const authResponse = await api.loginWithPin(email, pinCode);
      await handleLoginSuccess(authResponse);
    } catch (err: any) {
      console.error("PIN login error:", err);
      setError(err.message || "Invalid email or PIN");
    } finally {
      setIsLoading(false);
    }
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

          <Tabs defaultValue="pin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pin" className="flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                PIN
              </TabsTrigger>
              <TabsTrigger value="google" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Google
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pin" className="mt-4">
              <form onSubmit={handlePinLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pinCode">PIN Code</Label>
                  <Input
                    id="pinCode"
                    type="password"
                    placeholder="Enter 4-6 digit PIN"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    maxLength={6}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in with PIN"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="google" className="mt-4">
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
            </TabsContent>
          </Tabs>

          <p className="mt-4 text-center text-sm text-gray-500">
            Only authorized users can access this portal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
