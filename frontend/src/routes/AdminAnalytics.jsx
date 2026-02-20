// frontend/src/routes/AdminAnalytics.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('7days');
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const restaurantId = 1; 
      const result = await analyticsService.getDashboard(restaurantId, dateRange);
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const pageStyle = {
  position: 'fixed',
  inset: 0,
  background: '#FAFAFA',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid #FED7AA',
            borderTopColor: '#F97316',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <p style={{ color: '#6B7280', fontWeight: 500, fontSize: 14 }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #FED7AA', borderRadius: 14, padding: '40px 48px', textAlign: 'center', maxWidth: 380, boxShadow: '0 4px 24px rgba(249,115,22,0.08)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#F97316" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 style={{ color: '#111827', fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>Error Loading Analytics</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>{error}</p>
          <button onClick={fetchAnalytics} style={{
            padding: '10px 28px', background: 'linear-gradient(135deg, #F97316, #EA580C)',
            color: '#fff', fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
          }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        html, body, #root { margin: 0; padding: 0; width: 100%; }
      `}</style>

      {/* Header */}
      <div style={{
  background: '#fff',
  borderBottom: '1px solid #F3F4F6',
  boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
  flexShrink: 0
}}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8,
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#EA580C', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFEDD5'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFF7ED'}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
                Analytics Dashboard
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>
                {dateRange === '7days' ? 'Last 7 days' : 'Last 30 days'} overview
              </p>
            </div>
          </div>

          {/* Date Range Toggle */}
          <div style={{ display: 'flex', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 9, padding: 3, gap: 3 }}>
            {[['7days', 'Last 7 Days'], ['30days', 'Last 30 Days']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setDateRange(val)}
                style={{
                  padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                  background: dateRange === val ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'transparent',
                  color: dateRange === val ? '#fff' : '#6B7280',
                  boxShadow: dateRange === val ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
  flex: 1,
  overflow: 'auto',
  padding: '28px 32px 48px'
}}>
  <div style={{ maxWidth: 1400, margin: '0 auto' }}>

  </div>
  
        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {data.alerts.map((alert, index) => (
              <div key={index} style={{
                padding: '14px 18px',
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderLeft: `4px solid ${alert.severity === 'red' ? '#EF4444' : alert.severity === 'yellow' ? '#F59E0B' : '#10B981'}`,
                borderRadius: 10,
                display: 'flex', alignItems: 'flex-start', gap: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ marginTop: 1 }}>
                  {alert.severity === 'red' && (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {alert.severity === 'yellow' && (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#F59E0B" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  )}
                  {alert.severity === 'green' && (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#10B981" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>{alert.title}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6B7280' }}>{alert.message}</p>
                  {alert.action && <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: '#EA580C' }}>💡 {alert.action}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          <KPICard title="Total Conversations" value={data?.kpi?.total_conversations || 0} icon="💬" accent="#F97316" />
          <KPICard title="Total Orders" value={data?.kpi?.total_orders || 0} icon="🛒" accent="#EA580C" />
          <KPICard title="Conversion Rate" value={`${data?.kpi?.conversion_rate || 0}%`} icon="📈" accent="#F59E0B" />
          <KPICard
            title="Avg Order Value"
            value={`$${data?.kpi?.chatbot_aov || 0}`}
            subtitle={`${data?.kpi?.aov_increase_percent > 0 ? '+' : ''}${data?.kpi?.aov_increase_percent || 0}% vs baseline`}
            icon="💰"
            accent="#FBBF24"
          />
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <Panel title="Conversation & Order Timeline">
            <TimelineChart data={data?.conversation_timeline || []} />
          </Panel>
          <Panel title="Language Distribution">
            <LanguageChart data={data?.language_distribution || []} />
          </Panel>
        </div>

        {/* Top Questions */}
        <Panel title="Top Customer Questions">
          <TopQuestions data={data?.top_questions || []} />
        </Panel>
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────
function Panel({ title, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #F3F4F6',
      borderRadius: 14,
      padding: '22px 24px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
    }}>
      <h2 style={{
        margin: '0 0 18px',
        fontSize: 14,
        fontWeight: 700,
        color: '#111827',
        letterSpacing: '-0.01em',
        paddingBottom: 14,
        borderBottom: '1px solid #F3F4F6',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ width: 3, height: 14, background: 'linear-gradient(180deg, #F97316, #FBBF24)', borderRadius: 99, display: 'inline-block', flexShrink: 0 }} />
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────
function KPICard({ title, value, subtitle, icon, accent }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #F3F4F6',
        borderRadius: 14,
        padding: '20px 20px 18px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 24px rgba(0,0,0,0.07)`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>{title}</span>
        <span style={{ fontSize: 22, lineHeight: 1, background: `${accent}18`, padding: '6px 8px', borderRadius: 8 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {subtitle && <div style={{ marginTop: 8, fontSize: 12, color: accent, fontWeight: 600 }}>{subtitle}</div>}
    </div>
  );
}

// ── Timeline Chart ────────────────────────────────────────────────────────
function TimelineChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#D1D5DB', padding: '32px 0', fontSize: 14 }}>No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => Math.max(d.conversations || 0, d.orders || 0)), 1);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '76px 1fr 1fr', gap: 10, marginBottom: 10 }}>
        <span />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Conversations</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Orders</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {data.map((day, index) => (
          <div key={index} style={{ display: 'grid', gridTemplateColumns: '76px 1fr 1fr', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{day.date}</span>
            <div style={{ height: 22, background: '#FFF7ED', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0,
                width: `${((day.conversations || 0) / maxValue) * 100}%`,
                background: 'linear-gradient(90deg, #F97316, #FB923C)',
                borderRadius: 5,
                transition: 'width 0.5s ease',
                display: 'flex', alignItems: 'center', paddingLeft: 8,
                minWidth: (day.conversations || 0) > 0 ? 28 : 0,
              }}>
                {(day.conversations || 0) > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{day.conversations}</span>}
              </div>
            </div>
            <div style={{ height: 22, background: '#FFFBEB', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0,
                width: `${((day.orders || 0) / maxValue) * 100}%`,
                background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                borderRadius: 5,
                transition: 'width 0.5s ease',
                display: 'flex', alignItems: 'center', paddingLeft: 8,
                minWidth: (day.orders || 0) > 0 ? 28 : 0,
              }}>
                {(day.orders || 0) > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{day.orders}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 14, borderTop: '1px solid #F3F4F6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(135deg, #F97316, #FB923C)' }} />
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Conversations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'linear-gradient(135deg, #F59E0B, #FBBF24)' }} />
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Orders</span>
        </div>
      </div>
    </div>
  );
}

// ── Language Chart ────────────────────────────────────────────────────────
function LanguageChart({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#D1D5DB', padding: '32px 0', fontSize: 14 }}>No data available</div>;
  }

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0) || 1;
  const palette = ['#F97316', '#EA580C', '#F59E0B', '#FBBF24', '#FCD34D'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {data.map((lang, index) => {
        const percentage = ((lang.value / total) * 100).toFixed(1);
        return (
          <div key={index}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{lang.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: palette[index % palette.length] }}>{percentage}%</span>
            </div>
            <div style={{ height: 7, background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                background: palette[index % palette.length],
                borderRadius: 99,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Top Questions ─────────────────────────────────────────────────────────
function TopQuestions({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#D1D5DB', padding: '32px 0', fontSize: 14 }}>No questions yet</div>;
  }

  const maxCount = Math.max(...data.map(d => d.count || 0), 1);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 52px', gap: 12, padding: '0 12px 10px', borderBottom: '1px solid #F3F4F6', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>#</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Question</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Frequency</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', textAlign: 'right' }}>Count</span>
      </div>
      {data.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'grid', gridTemplateColumns: '32px 1fr 100px 52px', gap: 12,
            alignItems: 'center', padding: '11px 12px',
            borderBottom: index < data.length - 1 ? '1px solid #F9FAFB' : 'none',
            borderRadius: 8, transition: 'background 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 12, fontWeight: 800, color: '#FDBA74' }}>{String(index + 1).padStart(2, '0')}</span>
          <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{item.question}</span>
          <div style={{ height: 5, background: '#FEF3C7', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(item.count / maxCount) * 100}%`,
              background: 'linear-gradient(90deg, #F97316, #FBBF24)',
              borderRadius: 99,
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#EA580C', textAlign: 'right' }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}