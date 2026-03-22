import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/services/api";
import { loginUser, setApiToken } from "@/services/backend";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Phone, UtensilsCrossed } from "lucide-react";

type LoginAudience = "customer" | "chef";
const BACKEND_UNREACHABLE_MESSAGE = "Unable to reach the backend";

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [audience, setAudience] = useState<LoginAudience>("customer");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOtpSend = () => {
    if (!phone.trim()) {
      toast({
        title: "Phone number required",
        description: "Enter a phone number to continue with OTP onboarding.",
        variant: "destructive",
      });
      return;
    }

    setOtpSent(true);
    toast({
      title: "OTP sent",
      description: "Use any 4-digit code in this prototype flow to continue.",
    });
  };

  const handleOtpVerify = () => {
    if (otp.trim().length < 4) {
      toast({
        title: "Enter OTP",
        description: "Please enter the 4-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Phone verified",
      description:
        audience === "chef"
          ? "Continue your chef partner onboarding."
          : "Complete your account setup to start your subscription.",
    });

    if (audience === "chef") {
      navigate("/register", { state: { prefillPhone: phone.trim(), registrationType: "chef", otpVerified: true } });
      return;
    }

    navigate("/register", { state: { prefillPhone: phone.trim(), registrationType: "customer", otpVerified: true } });
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const backendResult = await loginUser(email.trim(), password);
      if (backendResult.success && backendResult.token && backendResult.user) {
        setApiToken(backendResult.token);
        login({
          id: String(backendResult.user.id),
          email: backendResult.user.email,
          password: "",
          name: backendResult.user.fullName,
          role: backendResult.user.role,
          createdAt: new Date().toISOString(),
        });
        toast({ title: "Welcome back!", description: `Logged in as ${backendResult.user.fullName}` });
        navigate(backendResult.user.role === "admin" ? "/admin" : "/dashboard");
        return;
      }

      if (backendResult.message?.includes(BACKEND_UNREACHABLE_MESSAGE)) {
        const mockResponse = api.login(email, password);
        if (mockResponse.success && mockResponse.data) {
          login(mockResponse.data);
          toast({ title: "Welcome back!", description: `Logged in as ${mockResponse.data.name} (demo mode)` });
          navigate("/dashboard");
          return;
        }

        toast({
          title: "Login failed",
          description: mockResponse.error || backendResult.message || "Invalid credentials",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login failed",
        description: backendResult.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,#f7fff8_0%,#ffffff_52%,#f8fafc_100%)]">
        <div className="container px-4 py-10 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">OTP-first onboarding</Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Sign in the fast way, then complete your subscription setup.
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Customers can verify their phone, choose a chef, and pay in minutes. Chef partners can start onboarding their kitchen from the same entry point.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "OTP-style phone verification for quick onboarding",
                  "Mandatory address setup before subscription checkout",
                  "Razorpay-backed subscription activation",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-soft">
                    <ArrowRight className="h-4 w-4 text-emerald-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                <CardContent className="p-6 md:p-8">
                  <div className="flex gap-2 rounded-full bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setAudience("customer")}
                      className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                        audience === "customer" ? "bg-white text-slate-900 shadow-soft" : "text-slate-500"
                      }`}
                    >
                      Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setAudience("chef")}
                      className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                        audience === "chef" ? "bg-white text-slate-900 shadow-soft" : "text-slate-500"
                      }`}
                    >
                      Chef Partner
                    </button>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-emerald-100 bg-emerald-50/60 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500">
                        <Phone className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">Phone verification</p>
                        <p className="text-sm text-slate-500">
                          {audience === "chef" ? "Start chef onboarding with OTP" : "Start your customer signup with OTP"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone number</Label>
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(event) => setPhone(event.target.value)}
                          placeholder="+91 98765 43210"
                          className="h-12 rounded-2xl"
                        />
                      </div>

                      {otpSent && (
                        <div className="space-y-2">
                          <Label htmlFor="otp">4-digit OTP</Label>
                          <Input
                            id="otp"
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                            placeholder="1234"
                            maxLength={4}
                            className="h-12 rounded-2xl tracking-[0.4em]"
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row">
                        {!otpSent ? (
                          <Button className="h-12 rounded-full px-8" onClick={handleOtpSend}>
                            Send OTP
                          </Button>
                        ) : (
                          <Button className="h-12 rounded-full px-8" onClick={handleOtpVerify}>
                            Verify & continue
                          </Button>
                        )}
                        {otpSent && (
                          <Button variant="outline" className="h-12 rounded-full px-8" onClick={() => setOtpSent(false)}>
                            Edit phone
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-slate-200 shadow-soft">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                      <LockKeyhole className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Existing member sign in</p>
                      <p className="text-sm text-slate-500">Use your live backend account for subscriptions and payments.</p>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="john@example.com"
                        className="h-12 rounded-2xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Enter your password"
                          className="h-12 rounded-2xl pr-12"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button type="submit" className="h-12 w-full rounded-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <UtensilsCrossed className="mr-2 h-4 w-4 animate-spin" />
                          Signing in
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Sign in with password
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 border-t border-slate-200 pt-6 text-sm text-slate-500">
                    <p>
                      Need an account?{" "}
                      <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-700">
                        Create one
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};
