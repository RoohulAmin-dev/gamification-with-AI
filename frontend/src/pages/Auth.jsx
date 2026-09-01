import { useState } from "react";
import { useAuth } from "../context/AuthContext";

 const Auth = ({ onSuccess }) => {
  const { signUp, signIn, resetPassword, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { error: resetError } = await resetPassword(email.trim());
      if (resetError) {
        throw resetError;
      }
      setEmailSent(true);
      setMessage("Password reset link sent to your email. Please check your inbox.");
    } catch (err) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        throw googleError;
      }
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await signUp(
          email.trim(),
          password,
          fullName.trim()
        );

        if (signUpError) {
          throw signUpError;
        }

        if (data?.user) {
          setMessage(
            "Account created. Please check your email to confirm your account."
          );

          if (onSuccess) {
            onSuccess();
          }
        }
      } else {
        const { data, error: signInError } = await signIn(
          email.trim(),
          password
        );

        if (signInError) {
          throw signInError;
        }

        if (data?.user && onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((current) => (current === "login" ? "signup" : "login"));
    setError("");
    setMessage("");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>
            {mode === "login" ? "Welcome back" : "Start your learning journey"}
          </h1>

          <p>
            {mode === "login"
              ? "Sign in to continue learning."
              : "Create an account and keep your learning progress."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="auth-field">
              <label htmlFor="fullName">Name</label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          {error && <div className="auth-message auth-error">{error}</div>}

          {message && (
            <div className="auth-message auth-success">{message}</div>
          )}

          {mode === "login" && !emailSent && (
            <button
              type="button"
              className="auth-link-button"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot your password?
            </button>
          )}

          <button
            type="submit"
            className="button-primary auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="google-auth-button"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <span className="google-icon">G</span>
            {mode === "login" ? "Sign in with Google" : "Create account with Google"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}

          <button type="button" onClick={switchMode}>
            {mode === "login" ? "Create one" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;``