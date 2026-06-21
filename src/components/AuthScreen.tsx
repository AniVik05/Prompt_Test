/**
 * IdolSync · AuthScreen.tsx
 *
 * K-pop themed login and sign-up screen (React web / Tailwind).
 * Handles: Sign In · Sign Up · Forgot Password
 */

import { useCallback, useRef, useState } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Star,
  AtSign,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { sendPasswordResetEmail, signInWithEmail, signUpWithEmail } from "@/lib/supabaseClient";

type Mode = "signin" | "signup" | "forgot";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const COLORS = {
  neonRose: "#FF2D78",
  softPink: "#FF85B3",
  lavender: "#C9A8FF",
  glacialWhite: "#F4EFFF",
  textMuted: "rgba(244,239,255,0.50)",
  error: "#FF6B6B",
  success: "#4ADBA2",
};

// ─── Tiny floating star decoration ───────────────────────────────────────────
function StarDeco({ className }: { className?: string }) {
  return (
    <div
      className={`absolute rounded-full opacity-35 ${className ?? ""}`}
      style={{ backgroundColor: COLORS.lavender, width: 8, height: 8 }}
    />
  );
}

// ─── Icon wrapper (maps name → Lucide component) ─────────────────────────────
const ICON_MAP = {
  mail: Mail,
  lock: Lock,
  star: Star,
  at: AtSign,
  shield: ShieldCheck,
} as const;

type IconName = keyof typeof ICON_MAP;

// ─── Reusable Input Field ─────────────────────────────────────────────────────
function IdolInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
  type = "text",
  onKeyDown,
  inputRef,
}: {
  icon: IconName;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = secureTextEntry !== undefined;
  const Icon = ICON_MAP[icon];

  return (
    <div
      className="mb-3 flex items-center rounded-xl border px-3.5 py-3 transition-colors"
      style={{
        backgroundColor: focused ? "rgba(255,45,120,0.07)" : "rgba(255,255,255,0.09)",
        borderColor: focused ? COLORS.neonRose : "rgba(201,168,255,0.25)",
      }}
    >
      <Icon
        size={18}
        color={focused ? COLORS.neonRose : COLORS.lavender}
        className="mr-2.5 shrink-0"
      />
      <input
        ref={inputRef}
        className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-white/50"
        style={{ color: COLORS.glacialWhite, caretColor: COLORS.neonRose }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChangeText(e.target.value)}
        type={isPassword ? (passwordVisible ? "text" : "password") : type}
        autoCapitalize={autoCapitalize}
        autoComplete="off"
        autoCorrect="off"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setPasswordVisible((v) => !v)}
          className="ml-2 shrink-0"
        >
          {passwordVisible ? (
            <EyeOff size={18} color={COLORS.lavender} />
          ) : (
            <Eye size={18} color={COLORS.lavender} />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Primary CTA Button ───────────────────────────────────────────────────────
function GlowButton({
  label,
  onClick,
  loading,
  disabled,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full rounded-[14px] py-4 text-base font-bold text-white shadow-lg transition-all active:scale-[0.96] disabled:opacity-55"
      style={{
        background: `linear-gradient(to right, ${COLORS.neonRose}, #C0006A)`,
        boxShadow: `0 4px 12px ${COLORS.neonRose}88`,
      }}
    >
      {loading ? (
        <svg className="mx-auto h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="4"
          />
          <path
            d="M22 12a10 10 0 0 1-10 10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        label
      )}
    </button>
  );
}

// ─── Banner (error / success) ─────────────────────────────────────────────────
function Banner({ message, type }: { message: string; type: string }) {
  if (!message) return null;
  const isError = type === "error";
  return (
    <div
      className="mb-4 flex items-center rounded-[10px] border p-3"
      style={{
        borderColor: isError ? COLORS.error : COLORS.success,
        backgroundColor: isError ? "rgba(255,107,107,0.12)" : "rgba(74,219,162,0.12)",
      }}
    >
      {isError ? (
        <AlertCircle size={16} color={COLORS.error} className="mr-2 shrink-0" />
      ) : (
        <CheckCircle size={16} color={COLORS.success} className="mr-2 shrink-0" />
      )}
      <span
        className="flex-1 text-[13px] leading-[18px]"
        style={{ color: isError ? COLORS.error : COLORS.success }}
      >
        {message}
      </span>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("signin");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ message: "", type: "" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);

  const showBanner = (message: string, type = "error") => setBanner({ message, type });
  const clearBanner = () => setBanner({ message: "", type: "" });

  const resetForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setUsername("");
    setDisplayName("");
    clearBanner();
  }, []);

  const switchMode = (newMode: Mode) => {
    resetForm();
    setMode(newMode);
  };

  // ── Validation ──────────────────────────────────────────────
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const validatePassword = (p: string) => p.length >= 8;
  const validateUsername = (u: string) => /^[a-z0-9_]{3,20}$/.test(u.trim());

  // ── Handlers ────────────────────────────────────────────────
  const handleSignIn = async () => {
    clearBanner();
    if (!validateEmail(email)) return showBanner("Enter a valid email address.");
    if (!validatePassword(password)) return showBanner("Password must be at least 8 characters.");

    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      showBanner(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password. Try again."
          : error.message,
      );
    }
  };

  const handleSignUp = async () => {
    clearBanner();
    if (!displayName.trim()) return showBanner("Enter your stage name.");
    if (!validateUsername(username))
      return showBanner("Username: 3-20 chars, lowercase letters, numbers, and _ only.");
    if (!validateEmail(email)) return showBanner("Enter a valid email address.");
    if (!validatePassword(password)) return showBanner("Password must be at least 8 characters.");
    if (password !== confirmPassword) return showBanner("Passwords do not match.");

    setLoading(true);
    const { data, error } = await signUpWithEmail(email, password, username, displayName);
    setLoading(false);

    if (error) {
      showBanner(error.message);
    } else if (data?.user && !data.session) {
      showBanner(`Check your inbox! We sent a confirmation link to ${email}.`, "success");
    }
  };

  const handleForgotPassword = async () => {
    clearBanner();
    if (!validateEmail(email)) return showBanner("Enter the email linked to your account.");

    setLoading(true);
    const { error } = await sendPasswordResetEmail(email);
    setLoading(false);

    if (error) {
      showBanner(error.message);
    } else {
      showBanner(`Reset link sent to ${email}. Check your inbox.`, "success");
    }
  };

  const focusNext = (ref: React.RefObject<HTMLInputElement | null>) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      ref.current?.focus();
    }
  };

  const submitOn = (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handler();
    }
  };

  // ── Render helpers ──────────────────────────────────────────
  const renderSignIn = () => (
    <>
      <IdolInput
        inputRef={emailRef}
        icon="mail"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        type="email"
        onKeyDown={focusNext(passwordRef)}
      />
      <IdolInput
        inputRef={passwordRef}
        icon="lock"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onKeyDown={submitOn(handleSignIn)}
      />

      <button
        type="button"
        onClick={() => switchMode("forgot")}
        className="mb-5 -mt-1 self-end text-[13px] font-medium"
        style={{ color: COLORS.softPink }}
      >
        Forgot password?
      </button>

      <GlowButton label="Sign In" onClick={handleSignIn} loading={loading} />

      <div className="mt-5 flex items-center justify-center gap-1">
        <span className="text-[13px]" style={{ color: COLORS.textMuted }}>
          New trainee?
        </span>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className="text-[13px] font-semibold"
          style={{ color: COLORS.softPink }}
        >
          Create account
        </button>
      </div>
    </>
  );

  const renderSignUp = () => (
    <>
      <IdolInput
        inputRef={displayNameRef}
        icon="star"
        placeholder="Stage name (e.g. Lisa)"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        onKeyDown={focusNext(usernameRef)}
      />
      <IdolInput
        inputRef={usernameRef}
        icon="at"
        placeholder="Username (e.g. lisa_idol)"
        value={username}
        onChangeText={(t) => setUsername(t.toLowerCase())}
        onKeyDown={focusNext(emailRef)}
      />
      <IdolInput
        inputRef={emailRef}
        icon="mail"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        type="email"
        onKeyDown={focusNext(passwordRef)}
      />
      <IdolInput
        inputRef={passwordRef}
        icon="lock"
        placeholder="Password (min 8 chars)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        onKeyDown={focusNext(confirmPasswordRef)}
      />
      <IdolInput
        inputRef={confirmPasswordRef}
        icon="shield"
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        onKeyDown={submitOn(handleSignUp)}
      />

      <GlowButton label="Begin Training" onClick={handleSignUp} loading={loading} />

      <div className="mt-5 flex items-center justify-center gap-1">
        <span className="text-[13px]" style={{ color: COLORS.textMuted }}>
          Already a trainee?
        </span>
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className="text-[13px] font-semibold"
          style={{ color: COLORS.softPink }}
        >
          Sign in
        </button>
      </div>
    </>
  );

  const renderForgot = () => (
    <>
      <p className="mb-4 text-sm leading-5" style={{ color: COLORS.textMuted }}>
        Enter your account email and we'll send a reset link.
      </p>
      <IdolInput
        inputRef={emailRef}
        icon="mail"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        type="email"
        onKeyDown={submitOn(handleForgotPassword)}
      />

      <GlowButton label="Send Reset Link" onClick={handleForgotPassword} loading={loading} />

      <button
        type="button"
        onClick={() => switchMode("signin")}
        className="mt-5 flex items-center justify-center gap-1 self-center text-[13px] font-medium"
        style={{ color: COLORS.lavender }}
      >
        <ArrowLeft size={16} />
        Back to Sign In
      </button>
    </>
  );

  const modeTitle: Record<Mode, string> = {
    signin: "Welcome Back",
    signup: "Join IdolSync",
    forgot: "Reset Password",
  };
  const modeSubtitle: Record<Mode, string> = {
    signin: "Sign in to continue your idol journey",
    signup: "Start your path to becoming a K-pop star",
    forgot: "We\u2019ve got you \u2014 just enter your email",
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12"
      style={{ background: "linear-gradient(to bottom, #0D0A1E, #1A0F3C, #2A0845)" }}
    >
      {/* Ambient star decorations */}
      <StarDeco className="top-[60px] left-[30px]" />
      <StarDeco className="top-[120px] right-[50px] !h-1.5 !w-1.5" />
      <StarDeco className="top-[200px] left-[60%] !h-1 !w-1" />
      <StarDeco className="right-[40px] bottom-[180px] !h-[5px] !w-[5px]" />
      <StarDeco className="bottom-[300px] left-[20px] !h-[3px] !w-[3px]" />

      <div className="w-full max-w-md">
        {/* ── Wordmark ── */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-[1.5px]"
            style={{
              borderColor: COLORS.neonRose,
              backgroundColor: "rgba(255,45,120,0.10)",
              boxShadow: `0 0 16px ${COLORS.neonRose}99`,
            }}
          >
            <span className="text-[28px]" style={{ color: COLORS.neonRose }}>
              &#10022;
            </span>
          </div>
          <h1
            className="text-[34px] font-extrabold tracking-wider"
            style={{ color: COLORS.glacialWhite }}
          >
            IdolSync
          </h1>
          <p className="mt-1 text-xs uppercase tracking-[3px]" style={{ color: COLORS.lavender }}>
            K-pop Training Platform
          </p>
        </div>

        {/* ── Card ── */}
        <div
          className="mb-6 flex flex-col rounded-3xl border p-7 shadow-2xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderColor: "rgba(201,168,255,0.25)",
          }}
        >
          <h2 className="mb-1.5 text-[22px] font-bold" style={{ color: COLORS.glacialWhite }}>
            {modeTitle[mode]}
          </h2>
          <p className="mb-5 text-[13px]" style={{ color: COLORS.textMuted }}>
            {modeSubtitle[mode]}
          </p>

          <Banner message={banner.message} type={banner.type} />

          {mode === "signin" && renderSignIn()}
          {mode === "signup" && renderSignUp()}
          {mode === "forgot" && renderForgot()}
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-[11px] leading-[18px]" style={{ color: COLORS.textMuted }}>
          By continuing you agree to IdolSync&apos;s{" "}
          <span className="underline" style={{ color: COLORS.lavender }}>
            Terms of Service
          </span>{" "}
          &amp;{" "}
          <span className="underline" style={{ color: COLORS.lavender }}>
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
}
