import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Users, Activity, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricData {
  recorded_at: string;
  metric_value: number;
}

export function Overview() {
  const { user } = useAuth();
  const [metricsData, setMetricsData] = useState<MetricData[]>([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    weeklyGrowth: 0,
    activeGoals: 0,
    completionRate: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: activities } = await supabase
        .from('activities')
        .select('id')
        .eq('user_id', user.id);

      const { data: metrics } = await supabase
        .from('metrics')
        .select('recorded_at, metric_value')
        .eq('user_id', user.id)
        .eq('metric_type', 'engagement')
        .order('recorded_at', { ascending: true })
        .limit(7);

      setStats({
        totalActivities: activities?.length || 0,
        weeklyGrowth: 12.5,
        activeGoals: 8,
        completionRate: 78,
      });

      if (metrics) {
        setMetricsData(metrics);
      } else {
        const sampleData = Array.from({ length: 7 }, (_, i) => ({
          recorded_at: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          metric_value: Math.floor(Math.random() * 100) + 50,
        }));
        setMetricsData(sampleData);
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    {
      title: 'Total Activities',
      value: stats.totalActivities,
      icon: Activity,
      color: '#3b82f6',
      trend: '+12%',
    },
    {
      title: 'Weekly Growth',
      value: `${stats.weeklyGrowth}%`,
      icon: TrendingUp,
      color: '#10b981',
      trend: '+5.2%',
    },
    {
      title: 'Active Goals',
      value: stats.activeGoals,
      icon: Target,
      color: '#f59e0b',
      trend: '+2',
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: Users,
      color: '#8b5cf6',
      trend: '+8%',
    },
  ];

  const chartData = metricsData.map((item) => ({
    date: new Date(item.recorded_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    value: item.metric_value,
  }));

  return (
    <div className="overview-page">
      <div className="stats-grid">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="stat-card">
              <div className="stat-header">
                <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
                  <Icon size={24} color={stat.color} />
                </div>
                <span className="stat-trend positive">{stat.trend}</span>
              </div>
              <div className="stat-content">
                <h3>{stat.title}</h3>
                <p className="stat-value">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h2>Engagement Trend</h2>
          <p>Last 7 days</p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-card">
            <Activity size={24} />
            <span>Log Activity</span>
          </button>
          <button className="action-card">
            <Target size={24} />
            <span>Set Goal</span>
          </button>
          <button className="action-card">
            <TrendingUp size={24} />
            <span>View Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
