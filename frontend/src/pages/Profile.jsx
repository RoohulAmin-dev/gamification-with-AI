import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    } else if (user?.email) {
      setFullName(user.email.split('@')[0]);
    }
  }, [profile?.full_name, user?.email]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    const { error: updateError } = await updateProfile({
      full_name: fullName.trim() || null,
    });

    if (updateError) {
      setError(updateError.message || 'Failed to update profile.');
    } else {
      setMessage('Profile updated successfully.');
      setEditing(false);
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="page-container">
      <section className="profile-page">
        <div className="profile-header">
          <div className="profile-avatar-lg">
            {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1>{profile?.full_name?.trim() || 'Your Profile'}</h1>
            <p className="profile-email-text">{user?.email}</p>
          </div>
        </div>

        <div className="profile-card">
          <h2>Personal Information</h2>
          <p className="profile-section-copy">Manage how your name appears across the app.</p>

          <div className="profile-field">
            <label htmlFor="fullName">Full Name</label>
            {editing ? (
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            ) : (
              <div className="profile-value">{profile?.full_name || 'Not set'}</div>
            )}
          </div>

          <div className="profile-field">
            <label>Email</label>
            <div className="profile-value">{user?.email}</div>
            <p className="profile-hint">Email is managed by your authentication provider.</p>
          </div>

          {editing ? (
            <div className="profile-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setMessage('');
                  if (profile?.full_name) {
                    setFullName(profile.full_name);
                  } else if (user?.email) {
                    setFullName(user.email.split('@')[0]);
                  }
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="profile-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </button>
            </div>
          )}

          {error && <div className="profile-message profile-error">{error}</div>}
          {message && <div className="profile-message profile-success">{message}</div>}
        </div>

        <div className="profile-card">
          <h2>Account</h2>
          <div className="profile-meta-row">
            <span className="profile-meta-label">Member since</span>
            <span className="profile-meta-value">{memberSince || '—'}</span>
          </div>
          <div className="profile-actions" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn--ghost profile-sign-out"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
