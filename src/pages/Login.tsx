import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [fbLoading, setFbLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Logged in!");
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Account created!");
      navigate("/");
    },
    onError: (err) => toast.error(err.message),
  });

  const facebookLoginMutation = trpc.auth.facebookLogin.useMutation({
    onSuccess: () => {
      toast.success("Logged in with Facebook!");
      window.location.href = "/";
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegister) {
      registerMutation.mutate({ email, password, name });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  const pending = loginMutation.isPending || registerMutation.isPending || facebookLoginMutation.isPending;

  const handleFacebookLogin = () => {
    setFbLoading(true);

    const loginWithToken = (accessToken: string) => {
      // Get user info from Facebook
      window.FB.api("/me", { fields: "name,email" }, (response: any) => {
        if (response.error) {
          toast.error("Failed to get user info from Facebook");
          setFbLoading(false);
          return;
        }

        // Store token for later use (page connections, etc.)
        localStorage.setItem("fb_access_token", accessToken);

        // Send to backend to create/find user and auto-fetch pages
        facebookLoginMutation.mutate({
          accessToken,
          email: response.email || "",
          name: response.name || "",
        });
      });
    };

    // Check if already logged in
    window.FB.getLoginStatus((response: any) => {
      if (response.status === "connected") {
        // Already logged in, but we need fresh permissions
        window.FB.login(
          (loginResponse: any) => {
            if (loginResponse.authResponse) {
              loginWithToken(loginResponse.authResponse.accessToken);
            } else {
              setFbLoading(false);
              toast.error("Facebook login cancelled");
            }
          },
          {
            scope: "pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,pages_read_user_content",
            return_scopes: true,
          }
        );
      } else {
        // Not logged in, trigger login
        window.FB.login(
          (loginResponse: any) => {
            if (loginResponse.authResponse) {
              loginWithToken(loginResponse.authResponse.accessToken);
            } else {
              setFbLoading(false);
              toast.error("Facebook login cancelled");
            }
          },
          {
            scope: "pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,pages_read_user_content",
            return_scopes: true,
          }
        );
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-50" />
            <div className="relative h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">SocialSync</h1>
          <p className="text-gray-400">Manage all your social accounts in one place</p>
        </div>

        {/* Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-white">
              {isRegister ? "Create your account" : "Welcome back"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {isRegister ? "Sign up to get started" : "Sign in to your account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Facebook Login */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 bg-[#1877F2] border-[#1877F2] text-white hover:bg-[#166FE5] transition-all font-medium"
              onClick={handleFacebookLogin}
              disabled={pending || fbLoading}
            >
              {fbLoading || facebookLoginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connecting to Facebook...
                </div>
              ) : (
                <>
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Continue with Facebook
                </>
              )}
            </Button>

            {/* Permissions info */}
            <p className="text-[10px] text-center text-gray-500">
              This will request access to your Facebook Pages and Instagram accounts
            </p>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-3 text-gray-500">or</span>
              </div>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={isRegister ? 8 : undefined}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all"
                disabled={pending}
              >
                {pending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Please wait...
                  </div>
                ) : isRegister ? "Create Account" : "Sign In"}
              </Button>
            </form>

            {/* Toggle */}
            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-400 hover:text-white hover:bg-white/5"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          By continuing, you agree to our{" "}
          <a href="/terms.html" className="text-purple-400 hover:text-purple-300">Terms</a>
          {" "}and{" "}
          <a href="/privacy.html" className="text-purple-400 hover:text-purple-300">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
