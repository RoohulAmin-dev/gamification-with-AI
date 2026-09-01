import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ""));
  const code = searchParams.get("code") || hashParams.get("code");
  const hasCode = !!code;
  const codeError = !code
    ? "Invalid or missing reset code. Please use the link from your email."
    : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForPassword(code);
      if (exchangeError) {
        throw exchangeError;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }

      setSuccess("Your password has been reset successfully. Redirecting to your learning space...");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "420px" }}>
        <div className="auth-header">
          <h1>Reset Your Password</h1>
          <p>Enter a new password below to continue.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="new-password">New Password</label>
            <div className="password-input-wrapper">
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength={6}
                required
                disabled={!hasCode}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={!hasCode}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirm-password">Confirm New Password</label>

            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              minLength={6}
              required
              disabled={!hasCode}
            />
          </div>

          {codeError && <div className="auth-message auth-error">{codeError}</div>}
          {error && <div className="auth-message auth-error">{error}</div>}

          {success && <div className="auth-message auth-success">{success}</div>}

          <button
            type="submit"
            className="button-primary auth-submit"
            disabled={loading || !hasCode}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          <div className="auth-switch">
            <button type="button" onClick={() => navigate("/")}>
              Back to home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
