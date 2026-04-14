// frontend/src/routes/AdminAnalytics.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { MessageSquare, ShoppingCart, TrendingUp, DollarSign, 
         AlertCircle, AlertTriangle, CheckCircle, Bot } from 'lucide-react';


// ── Rule-based AI summary ─────────────────────────────────────────────────────
function generateSummary(data, baseline = 42) {
  if (!data) return null;
  const { kpi, language_distribution, alerts, top_menu_items } = data;

  const lines = [];

  // Conversations
  if (kpi.total_conversations === 0) {
    lines.push("No customer conversations were recorded in this period.");
  } else {
    lines.push(
      `${kpi.total_conversations} customer conversation${kpi.total_conversations !== 1 ? 's' : ''} took place, with a ${kpi.conversion_rate}% conversion rate${kpi.conversion_rate >= 60 ? ' — strong performance' : kpi.conversion_rate >= 30 ? '' : ' — room to improve'}.`
    );
  }

  // AOV
  if (kpi.chatbot_aov > 0) {
    const aov = kpi.chatbot_aov;
    const pct = baseline > 0 ? Math.round(((aov - baseline) / baseline) * 100 * 10) / 10 : 0;
    const dir = pct >= 0 ? 'above' : 'below';
    lines.push(
      `Average order value via chatbot is $${aov}, ${Math.abs(pct)}% ${dir} the $${baseline} baseline.`
    );
  }

  // Top language
  if (language_distribution && language_distribution.length > 0) {
    const top = language_distribution.reduce((a, b) => a.value > b.value ? a : b);
    lines.push(`Most sessions were in ${top.name}${language_distribution.length > 1 ? `, with ${language_distribution.length} languages represented overall` : ''}.`);
  }

  // Top item
  if (top_menu_items && top_menu_items.length > 0) {
    const top = top_menu_items[0];
    lines.push(
      `"${top.name}" is the most ordered item with ${top.total_orders} order${top.total_orders !== 1 ? 's' : ''}${top.chatbot_percent > 0 ? `, ${top.chatbot_percent}% placed via chatbot` : ''}.`
    );
  }

  // Alert highlight
  if (alerts && alerts.length > 0) {
    const red = alerts.find(a => a.severity === 'red');
    const green = alerts.find(a => a.severity === 'green');
    const highlight = red || green;
    if (highlight) lines.push(`⚑ ${highlight.title}: ${highlight.message}.`);
  }

  return lines;
}

// ── SVG Line/Area Chart ───────────────────────────────────────────────────────
function TimelineChart({ data }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0) {
    return <EmptyState label="No timeline data yet" />;
  }

  const W = 560, H = 180, PAD = { top: 16, right: 20, bottom: 32, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...data.map(d => Math.max(d.conversations, d.orders)), 1);
  const n = data.length;

  const xPos = i => PAD.left + (i / (n - 1)) * innerW;
  const yPos = v => PAD.top + innerH - (v / maxVal) * innerH;

  const buildPath = key => {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d[key]).toFixed(1)}`).join(' ');
  };

  const buildArea = key => {
    const top = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d[key]).toFixed(1)}`).join(' ');
    const bottom = `L${xPos(n - 1).toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + innerH).toFixed(1)} Z`;
    return top + ' ' + bottom;
  };

  // Y-axis ticks
  const midTick = Math.round(maxVal / 2);
  const yTicks = midTick === 0 || midTick === maxVal 
      ? [0, maxVal] 
      : [0, midTick, maxVal];

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="convGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map(tick => (
          <g key={tick}>
            <line
              x1={PAD.left} y1={yPos(tick)}
              x2={PAD.left + innerW} y2={yPos(tick)}
              stroke="#F3F4F6" strokeWidth="1"
            />
            <text x={PAD.left - 6} y={yPos(tick) + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">
              {tick}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          // Show fewer labels if many points
          if (n > 10 && i % 3 !== 0 && i !== n - 1) return null;
          return (
            <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="#9CA3AF">
              {d.date}
            </text>
          );
        })}

        {/* Area fills */}
        <path d={buildArea('conversations')} fill="url(#convGrad)" />
        <path d={buildArea('orders')} fill="url(#ordGrad)" />

        {/* Lines */}
        <path d={buildPath('conversations')} fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={buildPath('orders')} fill="none" stroke="#FBBF24" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Hover interaction areas + dots */}
        {data.map((d, i) => (
          <g key={i}>
            {/* Invisible wide hit area */}
            <rect
              x={xPos(i) - (innerW / n / 2)}
              y={PAD.top}
              width={innerW / n}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHovered({ ...d, x: xPos(i), i })}
            />
            {hovered?.i === i && (
              <>
                <line x1={xPos(i)} y1={PAD.top} x2={xPos(i)} y2={PAD.top + innerH} stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx={xPos(i)} cy={yPos(d.conversations)} r="4.5" fill="#F97316" stroke="white" strokeWidth="2" />
                <circle cx={xPos(i)} cy={yPos(d.orders)} r="4.5" fill="#FBBF24" stroke="white" strokeWidth="2" />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: `calc(${((hovered.x - PAD.left) / (W - PAD.left - PAD.right)) * 100}% + ${PAD.left}px)`,
          transform: 'translateX(-50%)',
          background: '#111827',
          color: 'white',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>{hovered.date}</div>
          <div style={{ color: '#FB923C' }}>💬 {hovered.conversations} conversations</div>
          <div style={{ color: '#FCD34D' }}>🛒 {hovered.orders} orders</div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: '#F97316' }} />
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Conversations</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: '#FBBF24' }} />
          <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Orders</span>
        </div>
      </div>
    </div>
  );
}

// ── SVG Donut Chart ───────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return <EmptyState label="No language data yet" />;
  }

  const palette = ['#F97316', '#EA580C', '#F59E0B', '#FBBF24', '#FCD34D'];
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 56, r = 32, cx = 72, cy = 72;

  // Build arcs
  let cumAngle = -Math.PI / 2;
  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startA = cumAngle;
    const endA = cumAngle + angle;
    cumAngle = endA;

    const x1 = cx + R * Math.cos(startA), y1 = cy + R * Math.sin(startA);
    const x2 = cx + R * Math.cos(endA),   y2 = cy + R * Math.sin(endA);
    const ix1 = cx + r * Math.cos(startA), iy1 = cy + r * Math.sin(startA);
    const ix2 = cx + r * Math.cos(endA),   iy2 = cy + r * Math.sin(endA);
    const large = angle > Math.PI ? 1 : 0;

    const path = `M${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} L${ix2.toFixed(2)},${iy2.toFixed(2)} A${r},${r} 0 ${large},0 ${ix1.toFixed(2)},${iy1.toFixed(2)} Z`;
    return { ...d, path, color: palette[i % palette.length], percent: ((d.value / total) * 100).toFixed(1) };
  });

  const topLang = data.reduce((a, b) => a.value > b.value ? a : b);

  if (data.length === 1) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: palette[0], flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>100%</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>{data[0].value} sessions</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: palette[0] }} />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>{data[0].name}</span>
            <span style={{ fontSize: 12, color: palette[0], fontWeight: 700 }}>100%</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg viewBox="0 0 144 144" style={{ width: 144, height: 144, flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path
            key={i}
            d={s.path}
            fill={s.color}
            stroke="white"
            strokeWidth="2"
            style={{
              cursor: 'pointer',
              transform: hovered === i ? `scale(1.04)` : 'scale(1)',
              transformOrigin: `${cx}px ${cy}px`,
              transition: 'transform 0.15s',
              opacity: hovered !== null && hovered !== i ? 0.6 : 1,
            }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {/* Centre label */}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="800" fill="#111827">
          {hovered !== null ? slices[hovered].percent + '%' : total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#9CA3AF">
          {hovered !== null ? slices[hovered].name : 'sessions'}
        </text>
      </svg>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.map((s, i) => (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: hovered !== null && hovered !== i ? 0.5 : 1, transition: 'opacity 0.15s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, flex: 1 }}>{s.name}</span>
            <span style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Top Menu Items Panel ──────────────────────────────────────────────────────
function TopMenuItems({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState label="No orders yet in this period" />;
  }
  
  const navigate = useNavigate();
  const maxOrders = Math.max(...data.map(d => d.total_orders), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 80px 110px', gap: 12, padding: '0 12px 10px', borderBottom: '1px solid #F3F4F6' }}>
        {['Item', 'Category', 'Orders', 'Chatbot %'].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
        ))}
      </div>

      {data.map((item, i) => (
        <div
          key={item.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 90px 80px 110px',
            gap: 12,
            alignItems: 'center',
            padding: '11px 12px',
            borderBottom: i < data.length - 1 ? '1px solid #F9FAFB' : 'none',
            borderRadius: 8,
            transition: 'background 0.12s',
            cursor: 'default',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* Name + mini bar */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{item.name}</span>
              <span style={{ fontSize: 11, color: '#6B7280' }}>${item.price}</span>
            </div>
            <div style={{ height: 4, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(item.total_orders / maxOrders) * 100}%`,
                background: 'linear-gradient(90deg, #F97316, #FBBF24)',
                borderRadius: 99,
                transition: 'width 0.5s ease',
              }} />
            </div>
          </div>

          {/* Category */}
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#EA580C',
            background: '#FFF7ED', padding: '3px 8px', borderRadius: 99,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {item.category}
          </span>

          {/* Total orders */}
          <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
            {item.total_orders}
            {item.chatbot_orders > 0 && (
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500, marginLeft: 4 }}>
                total
              </span>
            )}
          </span>
        

          {/* Chatbot % badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.chatbot_orders > 0 ? (
              <>
                <div style={{
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  color: 'white',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 99,
                  whiteSpace: 'nowrap',
                }}>
                  <Bot size={11} color="white" style={{display:'inline', verticalAlign:'middle', marginRight:3}}/>{item.chatbot_percent}%
                </div>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>{item.chatbot_orders} via bot</span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#D1D5DB' }}>—</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function EmptyState({ label }) {
  return (
    <div style={{ textAlign: 'center', color: '#D1D5DB', padding: '32px 0', fontSize: 14 }}>
      {label}
    </div>
  );
}

function Panel({ title, children, style }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #F3F4F6',
      borderRadius: 14,
      padding: '22px 24px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      ...style,
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

function KPICard({ title, value, subtitle, icon, accent, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #F3F4F6',
        borderRadius: 14,
        padding: '20px 20px 18px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.07)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>{title}</span>
        <span style={{ background: `${accent}18`, padding: '6px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {subtitle && <div style={{ marginTop: 8, fontSize: 12, color: accent, fontWeight: 600 }}>{subtitle}</div>}
    </div>
  );
}

function TopQuestions({ data }) {
  if (!data || data.length === 0) return <EmptyState label="No questions yet" />;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 52px', gap: 12, padding: '0 12px 10px', borderBottom: '1px solid #F3F4F6', marginBottom: 4 }}>
        {['#', 'Question', 'Frequency', 'Count'].map(h => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
        ))}
      </div>
      {data.map((item, index) => (
        <div
          key={index}
          style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 52px', gap: 12, alignItems: 'center', padding: '11px 12px', borderBottom: index < data.length - 1 ? '1px solid #F9FAFB' : 'none', borderRadius: 8, transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <span style={{ fontSize: 12, fontWeight: 800, color: '#FDBA74' }}>{String(index + 1).padStart(2, '0')}</span>
          <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{item.question}</span>
          <div style={{ height: 5, background: '#FEF3C7', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(item.count / maxCount) * 100}%`, background: 'linear-gradient(90deg, #F97316, #FBBF24)', borderRadius: 99 }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#EA580C', textAlign: 'right' }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
}

const round = (n, d) => Math.round(n * 10**d) / 10**d;
// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminAnalytics() {

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    return localStorage.getItem('gusto_analytics_range') || '7days';
  });
  const [data, setData] = useState(null);
  const [baseline, setBaseline] = useState(42.0);
  useEffect(() => {
    if (user?.restaurant_id) {
      const stored = localStorage.getItem(`gusto_baseline_${user.restaurant_id}`);
      if (stored) setBaseline(parseFloat(stored));
    }
  }, [user?.restaurant_id]);
  const [editingBaseline, setEditingBaseline] = useState(false);
  const [baselineInput, setBaselineInput] = useState('');
  const [cache, setCache] = useState({});
  const [orbOpen, setOrbOpen] = useState(false);
  const [orbInsight, setOrbInsight] = useState(null);
  const [orbLoading, setOrbLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.restaurant_id) {
      fetchAnalytics();
    } else if (!authLoading && !user?.restaurant_id) {
      setError('No restaurant associated with this account');
      setLoading(false);
    }
  }, [dateRange, authLoading, user?.restaurant_id]);

  // Clear insight when dateRange changes
  useEffect(() => {
      setOrbInsight(null);
      setOrbOpen(false);
  }, [dateRange]);

  const fetchAnalytics = async () => {
      if (cache[dateRange]) {
          setData(cache[dateRange]);
          setLoading(false);
          return;
      }
      try {
          setLoading(true);
          setError(null);
          const result = await analyticsService.getDashboard(user.restaurant_id, dateRange);
          setData(result);
          setCache(prev => ({ ...prev, [dateRange]: result }));
      } catch (err) {
          setError(err.message || 'Failed to load analytics');
      } finally {
          setLoading(false);
      }
  };

  const fetchOrbInsight = async () => {
      setOrbLoading(true);
      try {
          const payload = {
              kpi: data.kpi,
              alerts: data.alerts,
              top_questions: data.top_questions,
              top_menu_items: data.top_menu_items,
              language_distribution: data.language_distribution,
              date_range: dateRange,
          };
          const response = await api.post('/api/analytics/ai-summary', payload);
          if (response.data.summary) {
              setOrbInsight(response.data.summary);
          }
      } catch (err) {
          console.error('Orb insight failed:', err);
          setOrbInsight("Unable to generate insight right now. Try again in a moment.");
      } finally {
          setOrbLoading(false);
      }
  };

  const pageStyle = {
    position: 'fixed', inset: 0,
    background: '#FAFAFA',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  };

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #FED7AA', borderTopColor: '#F97316', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
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
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#F97316" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h2 style={{ color: '#111827', fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>Error Loading Analytics</h2>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>{error}</p>
          <button onClick={fetchAnalytics} style={{ padding: '10px 28px', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Retry</button>
        </div>
      </div>
    );
  }

  const summary = generateSummary(data, baseline);

  return (
    <div style={pageStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; } html,body,#root { margin:0; padding:0; width:100%; }`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F3F4F6', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', flexShrink: 0 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => navigate('/admin')}
              style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EA580C', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FFEDD5'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFF7ED'}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Analytics Dashboard</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{dateRange === '7days' ? 'Last 7 days' : 'Last 30 days'} overview</p>
            </div>
          </div>
          <div style={{ display: 'flex', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 9, padding: 3, gap: 3 }}>
            {[['7days', 'Last 7 Days'], ['30days', 'Last 30 Days']].map(([val, label]) => (
              <button 
                key={val} 
                onClick={() => { setDateRange(val); localStorage.setItem('gusto_analytics_range', val);}}
                style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'all 0.15s', background: dateRange === val ? 'linear-gradient(135deg, #F97316, #EA580C)' : 'transparent', color: dateRange === val ? '#fff' : '#6B7280', boxShadow: dateRange === val ? '0 2px 8px rgba(249,115,22,0.3)' : 'none' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px 48px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          

          {/* Alerts */}
          {data?.alerts && data.alerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.alerts.map((alert, index) => (
                <div key={index} style={{ padding: '14px 18px', background: '#fff', border: '1px solid #E5E7EB', borderLeft: `4px solid ${alert.severity === 'red' ? '#EF4444' : alert.severity === 'yellow' ? '#F59E0B' : '#10B981'}`, borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ marginTop: 1 }}>
                    {alert.severity === 'red' && <AlertCircle size={20} color="#EF4444" style={{flexShrink:0, marginTop:1}} />}
                    {alert.severity === 'yellow' && <AlertTriangle size={20} color="#F59E0B" style={{flexShrink:0, marginTop:1}} />}
                    {alert.severity === 'green' && <CheckCircle size={20} color="#10B981" style={{flexShrink:0, marginTop:1}} />}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <KPICard title="Total Conversations" value={data?.kpi?.total_conversations || 0} icon={<MessageSquare size={18} color="#F97316"/>} accent="#F97316" />
            <KPICard title="Total Orders" value={data?.kpi?.total_orders || 0} icon={<ShoppingCart size={18} color="#EA580C"/>} accent="#EA580C" onClick={() => navigate('/admin/orders')}/>
            <KPICard title="Conversion Rate" value={`${data?.kpi?.conversion_rate || 0}%`} icon={<TrendingUp size={18} color="#F59E0B"/>} accent="#F59E0B" />
            <div style={{ position: 'relative' }}>
              <KPICard
                title="Avg Order Value"
                value={`$${data?.kpi?.chatbot_aov || 0}`}
                subtitle={(() => {
                  const aov = data?.kpi?.chatbot_aov || 0;
                  const pct = baseline > 0 ? round(((aov - baseline) / baseline) * 100, 1) : 0;
                  return `${pct >= 0 ? '+' : ''}${pct}% vs $${baseline} baseline`;
                })()}
                icon={<DollarSign size={18} color="#FBBF24"/>}
                accent="#FBBF24"
              />
              <button
                onClick={() => { setBaselineInput(String(baseline)); setEditingBaseline(true); }}
                title="Edit baseline"
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 12 }}
              >✎</button>
              {editingBaseline && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'white', borderRadius: 14, border: '2px solid #F97316', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>Set Baseline ($)</span>
                  <input
                    type="number"
                    value={baselineInput}
                    onChange={e => setBaselineInput(e.target.value)}
                    style={{ fontSize: 24, fontWeight: 800, border: 'none', outline: 'none', color: '#111827', width: '100%' }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => {
                      const val = parseFloat(baselineInput);
                      if (!isNaN(val) && val > 0) {
                        setBaseline(val);
                        localStorage.setItem(`gusto_baseline_${user?.restaurant_id}`, String(val));
                      }
                      setEditingBaseline(false);
                    }} style={{ flex: 1, background: 'linear-gradient(135deg,#F97316,#EA580C)', color: 'white', border: 'none', borderRadius: 8, padding: '6px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingBaseline(false)} style={{ flex: 1, background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '6px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <Panel title="Conversation & Order Timeline">
              <TimelineChart data={data?.conversation_timeline || []} />
            </Panel>
            <Panel title="Language Distribution">
              <DonutChart data={data?.language_distribution || []} />
            </Panel>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Panel title="Top Customer Questions">
              <TopQuestions data={data?.top_questions || []} />
            </Panel>
            <Panel title="Most Ordered Items">
              <TopMenuItems data={data?.top_menu_items || []} />
            </Panel>
          </div>

        </div>
      </div>
      {/* Floating Orb */}
      {data && (
          <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* Insight Card */}
              {orbOpen && (
                  <div style={{
                      position: 'absolute',
                      bottom: 108,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 340,
                      background: 'white',
                      border: '1px solid #FED7AA',
                      borderRadius: 16,
                      padding: '20px',
                      boxShadow: '0 8px 40px rgba(249,115,22,0.15)',
                      animation: 'fadeUp 0.25s ease',
                  }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, #F97316, #EA580C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span style={{ fontSize: 11, color: 'white' }}>✦</span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Insight</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {orbInsight && !orbLoading && (
                                  <button onClick={fetchOrbInsight} style={{ background: 'none', border: 'none', fontSize: 11, color: '#9CA3AF', cursor: 'pointer', fontWeight: 600 }}>↺ Regenerate</button>
                              )}
                              <button onClick={() => setOrbOpen(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#9CA3AF', cursor: 'pointer', lineHeight: 1 }}>×</button>
                          </div>
                      </div>

                      {orbLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #FED7AA', borderTopColor: '#F97316', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: '#9CA3AF' }}>Finding a non-obvious insight...</span>
                          </div>
                      ) : orbInsight ? (
                          <div>
                              {orbInsight.replace(/[#*_`]/g, '').split('||BREAK||').map((para, i) => (
                                  <div key={i}>
                                      {i === 1 && <div style={{ borderTop: '1px solid #FEF3C7', margin: '12px 0' }} />}
                                      <p style={{ margin: 0, fontSize: 13, color: i === 0 ? '#78350F' : '#92400E', lineHeight: 1.7, fontWeight: i === 1 ? 600 : 400 }}>
                                          {para.trim()}
                                      </p>
                                  </div>
                              ))}
                          </div>
                      ) : null}
                  </div>
              )}

              <style>{`
                  @keyframes orbRotate {
                      0% {
                          transform: rotate(90deg);
                          box-shadow:
                              0 4px 8px 0 rgba(255,255,255,0.6) inset,
                              0 10px 16px 0 rgba(251,191,36,0.7) inset,
                              0 24px 32px 0 rgba(234, 76, 13, 0.6) inset;
                      }
                      50% {
                          transform: rotate(270deg);
                          box-shadow:
                              0 4px 8px 0 rgba(255,255,255,0.6) inset,
                              0 10px 10px 0 rgba(253,186,116,0.8) inset,
                              0 20px 32px 0 rgba(234, 76, 13, 0.6) inset;
                      }
                      100% {
                          transform: rotate(450deg);
                          box-shadow:
                              0 4px 8px 0 rgba(255,255,255,0.6) inset,
                              0 10px 16px 0 rgba(251,191,36,0.7) inset,
                              0 24px 32px 0 rgba(234, 76, 13, 0.6) inset;
                      }
                  }
                  @keyframes letterFloat {
                      0%, 100% { opacity: 0.5; transform: translateY(0); }
                      20% { opacity: 1; transform: scale(1.15); }
                      40% { opacity: 0.7; transform: translateY(0); }
                  }
                  @keyframes fadeUp {
                      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                      to { opacity: 1; transform: translateX(-50%) translateY(0); }
                  }
              `}</style>

              {/* The Orb */}
              <button
                  onClick={() => {
                      setOrbOpen(p => !p);
                      if (!orbInsight && !orbOpen) fetchOrbInsight();
                  }}
                  style={{
                      position: 'relative',
                      width: 72, height: 72,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      background: 'transparent',
                      padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      filter: 'drop-shadow(0 4px 16px rgba(249,115,22,0.35)) drop-shadow(0 2px 6px rgba(249,115,22,0.2))',
                  }}
              >
                  {/* Rotating inset shadow orb */}
                  <div style={{
                      position: 'absolute', inset: 0,
                      borderRadius: '50%',
                      backgroundColor: '#F97316',
                      animation: 'orbRotate 2.5s linear infinite',
                      border: '0.5px solid rgba(222, 156, 76, 0.94)',
                  }} />

                  {/* Letters on top */}
                  <div style={{
                      position: 'relative', zIndex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                      {'Gusto'.split('').map((letter, i) => (
                          <span
                              key={i}
                              style={{
                                  display: 'inline-block',
                                  color: 'white',
                                  fontSize: 14,
                                  fontWeight: 400,
                                  opacity: 0.85,
                                  animation: `letterFloat 2.5s infinite`,
                                  animationDelay: `${i * 0.12}s`,
                                  fontFamily: "'Inter', sans-serif",
                              }}
                          >
                              {letter}
                          </span>
                      ))}
                  </div>
              </button>
          </div>
      )}
    </div>
  );
}