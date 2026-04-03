import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Calendar, Save } from 'lucide-react';

interface Profile {
  full_name: string;
  email: string;
  created_at: string;
  avatar_url: string | null;
}

export function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data as Profile);
        setFullName((data as Profile).full_name);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      setMessage('Error updating profile');
    } else {
      setMessage('Profile updated successfully');
      setProfile((prev) => prev ? { ...prev, full_name: fullName } : null);

      await supabase.from('activities').insert({
        user_id: user.id,
        activity_type: 'update',
        description: 'Updated profile information',
      } as any);
    }

    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-container">
        <p>Unable to load profile</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{profile.full_name}</h2>
            <p>{profile.email}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-item">
            <User size={20} />
            <div>
              <span className="detail-label">User ID</span>
              <span className="detail-value">{user?.id.slice(0, 8)}...</span>
            </div>
          </div>
          <div className="detail-item">
            <Mail size={20} />
            <div>
              <span className="detail-label">Email</span>
              <span className="detail-value">{profile.email}</span>
            </div>
          </div>
          <div className="detail-item">
            <Calendar size={20} />
            <div>
              <span className="detail-label">Member Since</span>
              <span className="detail-value">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-edit-card">
        <h3>Edit Profile</h3>
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="disabled"
            />
            <span className="form-hint">Email cannot be changed</span>
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
