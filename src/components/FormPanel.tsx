import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Send,
  HelpCircle,
  KeyRound,
  X,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FormPanelProps {
  mode: 'login' | 'signup';
  onToggleMode: (newMode: 'login' | 'signup') => void;
}

export const FormPanel: React.FC<FormPanelProps> = ({ mode, onToggleMode }) => {
  const isLogin = mode === 'login';
  const { login, register, resendConfirmationEmail, resetPassword, isConfigured } = useAuth();
  const navigate = useNavigate();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [signupFullName, setSignupFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  // Status & Feedback state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Clear messages when mode changes
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setResendStatus(null);
  }, [mode]);

  const isEmailNotConfirmed = errorMsg?.toLowerCase().includes('email not confirmed');

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setResendStatus(null);

    if (!loginEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await login(loginEmail.trim(), loginPassword);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to authenticate. Please check your credentials.');
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signupFullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail.trim())) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    if (!signupPassword) {
      setErrorMsg('Please enter a password.');
      return;
    }
    if (signupPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters in length.');
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password confirmation.');
      return;
    }

    setIsSubmitting(true);
    const { error, data } = await register(signupEmail.trim(), signupPassword, signupFullName.trim());
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Failed to create user account.');
    } else {
      if (data?.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setSuccessMsg(
          'Account created successfully! If email confirmation is enabled in your Supabase project, please check your inbox to verify your account, then log in.'
        );
      }
    }
  };

  // Handle Resend Confirmation
  const handleResendConfirmation = async () => {
    const targetEmail = isLogin ? loginEmail.trim() : signupEmail.trim();
    if (!targetEmail) {
      setErrorMsg('Please enter your email address to resend confirmation.');
      return;
    }

    setIsResending(true);
    setResendStatus(null);
    const { error } = await resendConfirmationEmail(targetEmail);
    setIsResending(false);

    if (error) {
      setResendStatus(`Failed to resend: ${error.message}`);
    } else {
      setResendStatus(`Verification email resent to ${targetEmail}! Please check your inbox.`);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus('Please enter your registered email address.');
      return;
    }

    setIsSendingReset(true);
    setForgotStatus(null);
    const { error } = await resetPassword(forgotEmail.trim());
    setIsSendingReset(false);

    if (error) {
      setForgotStatus(`Error: ${error.message}`);
    } else {
      setForgotStatus('Password reset link sent! Check your email inbox to update your password.');
    }
  };

  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto bg-white" id="form-panel-inner">
      {/* Top Section */}
      <div>
        {/* Supabase unconfigured warning banner */}
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <p className="font-semibold text-amber-800">Supabase API Keys Needed</p>
            <p className="mt-0.5 text-amber-700">
              Configure <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> &amp; <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> to enable live database authentication.
            </p>
          </div>
        )}

        {/* Top Badges & Typography */}
        {isLogin ? (
          <div className="mb-6" id="login-form-heading">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 tracking-[0.14em] uppercase mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SECURE WORKSPACE</span>
            </div>
            <h2 className="text-3xl sm:text-[2rem] font-black text-slate-950 tracking-tight leading-tight">
              Welcome Back
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
              Sign in to continue to your sales intelligence workspace.
            </p>
          </div>
        ) : (
          <div className="mb-5" id="signup-form-heading">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800 tracking-[0.14em] uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>CREATE WORKSPACE</span>
            </div>
            <h2 className="text-3xl sm:text-[2rem] font-black text-slate-950 tracking-tight leading-tight">
              Create Account
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
              Start your sales analysis workspace today.
            </p>
          </div>
        )}

        {/* Global Error Alert Banner */}
        {errorMsg && (
          <div className="mb-4 space-y-3" id="form-error-alert-wrapper">
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">{errorMsg}</p>
                {isEmailNotConfirmed && (
                  <p className="text-xs text-red-600">
                    Supabase requires email confirmation before signing in.
                  </p>
                )}
              </div>
            </div>

            {/* Email Not Confirmed Helper */}
            {isEmailNotConfirmed && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <p className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                  Quick resolution for &quot;Email not confirmed&quot;:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                  <li>Check inbox ({loginEmail || 'your email'}) and click the confirmation link.</li>
                  <li>Or disable <em>Confirm email</em> in Supabase Dashboard &rarr; Auth &rarr; Providers.</li>
                </ul>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    id="resend-confirmation-btn"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {isResending ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resending Link...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Resend Confirmation Email
                      </>
                    )}
                  </button>
                </div>
                {resendStatus && (
                  <p className="text-xs font-medium text-emerald-800 bg-white/80 p-2 rounded border border-emerald-200 mt-1">
                    {resendStatus}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Global Success Alert Banner */}
        {successMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Success!</p>
              <p className="mt-0.5 text-emerald-800 leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Forms Rendering */}
        {isLogin ? (
          /* ======================== LOGIN FORM ======================== */
          <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form-active">
            {/* Email Field */}
            <div>
              <label htmlFor="login-email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email-input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-300/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(loginEmail);
                    setForgotModalOpen(true);
                  }}
                  id="forgot-password-link"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-2xs group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  name="password"
                  type={showLoginPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-300/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  id="toggle-login-password-visibility"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  id="login-remember-me-checkbox"
                  className="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-600 accent-emerald-700 cursor-pointer"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="login-primary-submit-btn"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20 rounded-xl shadow-lg shadow-emerald-700/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 mt-2 group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Login to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ======================== SIGNUP FORM ======================== */
          <form onSubmit={handleSignupSubmit} className="space-y-3.5" id="signup-form-active">
            {/* Full Name */}
            <div>
              <label htmlFor="signup-name-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-2xs group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="signup-name-input"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-300/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="signup-email-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="signup-email-input"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="block w-full pl-10 pr-3.5 py-2 text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-300/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="signup-password-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password <span className="text-[10px] font-normal text-slate-500">(Min. 8 characters)</span>
              </label>
              <div className="relative rounded-xl shadow-2xs group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-password-input"
                  name="password"
                  type={showSignupPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="block w-full pl-10 pr-10 py-2 text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-300/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPassword(!showSignupPassword)}
                  id="toggle-signup-password-visibility"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                >
                  {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="signup-confirm-password-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative rounded-xl shadow-2xs group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="signup-confirm-password-input"
                  name="confirmPassword"
                  type={showSignupConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="block w-full pl-10 pr-10 py-2 text-sm text-slate-900 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-300/90 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                  id="toggle-signup-confirm-password-visibility"
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showSignupConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              id="signup-primary-submit-btn"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-700/20 rounded-xl shadow-lg shadow-emerald-700/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 mt-3 group cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Bottom Separator & Mode Switch Area */}
      <div className="pt-5 mt-4 border-t border-slate-200/80 text-center" id="form-panel-footer">
        {isLogin ? (
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Don&apos;t have an account?</p>
            <button
              type="button"
              onClick={() => onToggleMode('signup')}
              id="form-switch-to-signup-btn"
              className="font-bold text-emerald-700 hover:text-emerald-800 text-sm inline-flex items-center gap-1.5 hover:underline cursor-pointer group"
            >
              <span>Create your account</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium">Already have an account?</p>
            <button
              type="button"
              onClick={() => onToggleMode('login')}
              id="form-switch-to-login-btn"
              className="font-bold text-emerald-700 hover:text-emerald-800 text-sm inline-flex items-center gap-1.5 hover:underline cursor-pointer group"
            >
              <span>Sign in to your workspace</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Forgot Password Modal Dialog */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4" id="forgot-password-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-lg">
                <KeyRound className="w-5 h-5 text-emerald-700" />
                Reset Password
              </div>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              Enter your email address and Supabase will send a password reset link to your inbox.
            </p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500"
                />
              </div>

              {forgotStatus && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                  {forgotStatus}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingReset}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {isSendingReset ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
