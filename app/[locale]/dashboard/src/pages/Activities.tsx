import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Clock, CircleAlert as AlertCircle } from 'lucide-react';

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  created_at: string;
}

export function Activities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching activities:', error);
      } else {
        setActivities(data || []);
      }
      setLoading(false);
    };

    fetchActivities();
  }, [user]);

  const getActivityColor = (type: string) => {
    const colors: { [key: string]: string } = {
      login: '#3b82f6',
      logout: '#6b7280',
      signup: '#10b981',
      create: '#10b981',
      update: '#f59e0b',
      delete: '#ef4444',
    };
    return colors[type] || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="activities-page">
      <div className="activities-header">
        <h2>Activity Feed</h2>
        <p>Your recent activities and events</p>
      </div>

      {activities.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} color="#9ca3af" />
          <h3>No activities yet</h3>
          <p>Your activities will appear here as you use the platform</p>
        </div>
      ) : (
        <div className="activities-list">
          {activities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div
                className="activity-dot"
                style={{ backgroundColor: getActivityColor(activity.activity_type) }}
              />
              <div className="activity-content">
                <div className="activity-header">
                  <span
                    className="activity-type"
                    style={{ color: getActivityColor(activity.activity_type) }}
                  >
                    {activity.activity_type.toUpperCase()}
                  </span>
                  <span className="activity-time">
                    <Clock size={14} />
                    {formatDate(activity.created_at)}
                  </span>
                </div>
                <p className="activity-description">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
