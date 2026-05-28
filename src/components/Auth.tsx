import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../supabase";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  Sun, 
  Moon, 
  Chrome, 
  ShieldCheck, 
  Info,
  Loader2,
  LockKeyhole
} from "lucide-react";

// Blocklist of disposable/temporary email domains (direct domain check and partial match)
const DISPOSABLE_DOMAINS = [
  "10minutemail",
  "temp-mail",
  "guerrillamail",
  "yopmail",
  "mailinator",
  "dispostable",
  "getairmail",
  "throwawaymail",
  "tempmail",
  "fakeinbox",
  "tempmailaddress",
  "maildrop",
  "sharklasers"
];

interface AuthProps {
  onAuthSuccess: (userSession: any) => void;
}

export function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Checkbox requirements status
  const [pwReqs, setPwReqs] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  // Evaluate password live
  useEffect(() => {
    setPwReqs({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  // Listen for success message from popup (after callback completes)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const session = event.data.session;
        setSuccessMessage("Sign-in successful! Launching optimizer dashboard...");
        setTimeout(() => {
          onAuthSuccess(session);
        }, 1200);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAuthSuccess]);

  // Handle OAuth Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!supabase) {
        throw new Error("Supabase is not configured.");
      }

      // Use skipBrowserRedirect: true to fetch the direct provider login URL
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
          skipBrowserRedirect: true,
        }
      });
      if (error) throw error;

      if (data?.url) {
        setSuccessMessage("Opening secure Google login...");
        const width = 600;
        const height = 750;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const authWindow = window.open(
          data.url,
          "oauth_popup",
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );

        if (!authWindow) {
          throw new Error("Popup blocked! Please allow popups for this site so the Google Sign-In helper can open.");
        }
      } else {
        throw new Error("Google login URL could not be constructed.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to launch Google auth session.");
      setLoading(false);
    }
  };

  // Basic email checks
  const validateEmailAddress = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) return "Email address is required";

    // RFC-compliant base validation pattern with explicit domain check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return "Please enter a valid format (e.g., user@domain.com). 'test@123' is not valid.";
    }

    const parts = trimmed.split("@");
    if (parts.length !== 2) return "Invalid email structure";
    const domain = parts[1].toLowerCase();

    if (!domain.includes(".")) {
      return "Ensure your email contains a completed top-level domain extension (e.g. .com, .org).";
    }

    // Check against disposable blocklist
    const matched = DISPOSABLE_DOMAINS.some(disp => domain.includes(disp));
    if (matched) {
      return "Registration via temporary or disposable email domains is blocked for security.";
    }

    return null;
  };

  // Sign In / Sign Up handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate email
    const emailError = validateEmailAddress(email);
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    // Validate password constraints
    const allPassed = Object.values(pwReqs).every(val => val);
    if (!allPassed) {
      setErrorMessage("Password does not comply with the required security factors below.");
      return;
    }

    setLoading(true);

    if (!supabase) {
      // Simulate real auth state so the app is accessible instantly in the sandbox developer preview
      setTimeout(() => {
        setLoading(false);
        if (isSignUp) {
          setSuccessMessage("Account registered successfully! Welcome to OptiResume AI.");
          setTimeout(() => {
            setIsSignUp(false);
          }, 1800);
        } else {
          setSuccessMessage("Successfully authenticated! Launching optimizer dashboard...");
          setTimeout(() => {
            onAuthSuccess({
              user: {
                id: "sandbox-usr-100",
                email: email.trim(),
                user_metadata: { full_name: email.trim().split("@")[0] }
              }
            });
          }, 1200);
        }
      }, 1500);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: email.trim().split("@")[0]
            }
          }
        });
        if (error) throw error;
        
        if (data.user && data.session) {
          setSuccessMessage("Account created successfully!");
          setTimeout(() => {
            onAuthSuccess(data.session);
          }, 1000);
        } else {
          setSuccessMessage("Account created! Please check your mailbox to confirm your email verification.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        });
        if (error) throw error;
        
        setSuccessMessage("Successfully logged in!");
        setTimeout(() => {
          onAuthSuccess(data.session);
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength computations
  const getStrengthData = () => {
    let score = 0;
    if (pwReqs.hasMinLength) score += 20;
    if (pwReqs.hasUppercase) score += 20;
    if (pwReqs.hasLowercase) score += 20;
    if (pwReqs.hasNumber) score += 20;
    if (pwReqs.hasSpecial) score += 20;

    if (score === 0) return { label: "Type to evaluate", pct: 0, color: "bg-slate-300 dark:bg-slate-700", textClass: "text-slate-400" };
    if (score <= 40) return { label: "Weak Strength", pct: score, color: "bg-rose-500", textClass: "text-rose-500" };
    if (score <= 60) return { label: "Medium Strength", pct: score, color: "bg-amber-500", textClass: "text-amber-500" };
    if (score <= 80) return { label: "Strong Shield", pct: score, color: "bg-blue-500", textClass: "text-blue-500" };
    return { label: "Excellent & Secure", pct: score, color: "bg-emerald-500", textClass: "text-emerald-500" };
  };

  const strength = getStrengthData();

  return (
    <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-500 ${theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} px-4 py-12`}>
      {/* BACKGROUND GRAPHIC ACCENTS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 select-none">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-blue-400 blur-[130px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500 blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* UPPER CONTROLS & LOGO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display">
              OptiResume <span className="text-blue-600">AI</span>
            </span>
          </div>
          
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-900 transition-colors shadow-sm cursor-pointer"
            title="Toggle theme"
          >
            {theme === "light" ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* MAIN AUTHENTICATION CARD */}
        <motion.div 
          layout
          className={`p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl transition-colors duration-300 ${theme === "dark" ? "bg-slate-900/90" : "bg-white/95"}`}
        >
          {/* Header titles */}
          <div className="space-y-1.5 text-center mb-6">
            <h1 className="text-2xl font-black font-display tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              {isSignUp ? "Create Secure Account" : "Access Candidate Dashboard"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed">
              {isSignUp 
                ? "Secure login for resume optimization and ATS analysis." 
                : "Manage previous scans and run alignment scans against corporate job descriptions."
              }
            </p>
          </div>

          

          {/* Error and Success signals */}
          <AnimatePresence mode="popLayout">
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs font-medium"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mb-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
              >
               <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="flex-1">{successMessage}</span>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Auth form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-display">
                Personal Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 transition-all font-sans"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-display">
                   Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* PASSWORD COMPLEXITY REALTIME METRICS CHECKLIST */}
            <div className="bg-white dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/40 dark:border-slate-800/40 space-y-2 text-[11px]">
              <div className="flex items-center justify-between font-bold">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display flex items-center gap-1">
                  <LockKeyhole className="w-3 h-3 text-blue-500" />
                  Password Security Checker
                </span>
                <span className={`text-[10px] uppercase font-mono tracking-tight ${strength.textClass}`}>
                  {strength.label}
                </span>
              </div>
              
              {/* STRENGTH PROGRESS BAR */}
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${strength.pct}%` }}
                  className={`h-full ${strength.color} transition-colors duration-300`}
                />
              </div>

              {/* CHECKLIST */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  {pwReqs.hasMinLength ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className={pwReqs.hasMinLength ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""}>Min 8 characters</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  {pwReqs.hasUppercase ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className={pwReqs.hasUppercase ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""}>1 uppercase [A-Z]</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  {pwReqs.hasLowercase ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className={pwReqs.hasLowercase ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""}>1 lowercase [a-z]</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                  {pwReqs.hasNumber ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className={pwReqs.hasNumber ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""}>1 numeric digit [0-9]</span>
                </div>

                <div className="col-span-1 sm:col-span-2 flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5 mt-0.5">
                  {pwReqs.hasSpecial ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                  <span className={pwReqs.hasSpecial ? "text-emerald-700 dark:text-emerald-400 font-semibold" : ""}>1 special symbol (!@#$%^&*)</span>
                </div>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-display shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              {isSignUp ? "Create Account" : "Sign in"}
            </button>
          </form>

          {/* SIGN IN WITH GOOGLE */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-400 font-medium font-sans">
                or Continue with Google
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-2 flex items-center justify-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Chrome className="w-4 h-4 text-rose-500" />
          Sign in with Google          </button>

          {/* Toggle login vs signup */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs hover:underline text-blue-600 font-bold transition-all"
            >
              {isSignUp 
                ? "Already have an account? Access dashboard" 
                : "Need professional resume optimization? Create account"
              }
            </button>
          </div>
        </motion.div>

        {/* METRICS HINT FOOTER */}
        <div className="text-center">
          <p className="text-[10px] text-slate-400">
            Secure authentication powered by modern encryption.
          </p>
        </div>
      </div>
    </div>
  );
}
