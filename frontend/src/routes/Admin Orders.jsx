// src/routes/AdminOrders.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-AE', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit' })
  );
}

const STATUS_STYLES = {
  finalized: { bg: '#f0fdf4', color: '#166534', dot: '#22c55e', label: 'Confirmed' },
  pending:   { bg: '#fff7ed', color: '#9a3412', dot: '#f97316', label: 'Pending'   },
};

export default function AdminOrders() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      api.get('/api/admin/orders')
        .then(res => setOrders(res.data))
        .catch(err => {
          if (err.response?.status === 401) navigate('/login');
          else setError('Failed to load orders.');
        })
        .finally(() => setLoading(false));
    }
  }, [authLoading, user]);

  const pageStyle = {
    position: 'fixed', inset: 0,
    background: '#FAFAFA',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  };

  if (loading) {
    return (
      <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #FED7AA', borderTopColor: '#F97316', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#6B7280', fontWeight: 500, fontSize: 14 }}>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', border: '1px solid #FED7AA', borderRadius: 14, padding: '40px 48px', textAlign: 'center', maxWidth: 380 }}>
          <p style={{ color: '#111827', fontSize: 17, fontWeight: 700, margin: '0 0 8px' }}>Error Loading Orders</p>
          <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 24 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 28px', background: 'linear-gradient(135deg, #F97316, #EA580C)', color: '#fff', fontWeight: 600, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const toggleOrder = (orderId) => {
    setExpandedOrders(prev => ({
        ...prev,
        [orderId]: !prev[orderId]
    }));
  };

  return (
    <div style={pageStyle}>
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #F3F4F6', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', flexShrink: 0 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16, height: 64 }}>
          <button
            onClick={() => navigate('/admin/analytics')}
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#EA580C' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFEDD5'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFF7ED'}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>Orders</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>{orders.length} total · latest first</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px 48px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 14, boxShadow: '0 1px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>

            {orders.length === 0 ? (
              <div style={{ padding: '64px 24px', textAlign: 'center', color: '#D1D5DB', fontSize: 14 }}>
                No orders yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    {['Order #', 'Date', 'Items', 'Total', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '12px 24px', fontSize: 11, fontWeight: 700,
                        color: '#9CA3AF', textAlign: 'left',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        borderBottom: '1px solid #F3F4F6',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => {
                    const total = order.total_price ?? 0;
                    const itemCount = order.item_count ?? order.items?.length ?? 0;
                    const s = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                    return (
                      <tr
                        key={order.id}
                        style={{ borderBottom: i < orders.length - 1 ? '1px solid #F9FAFB' : 'none', transition: 'background 0.12s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 24px', fontSize: 13 }}>
                          <span style={{ fontWeight: 800, color: '#F97316' }}>#{order.id}</span>
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#374151' }}>
                          {formatDate(order.finalized_at || order.created_at)}
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 13, color: '#6B7280' }}>
                            {!order.items || order.items.length === 0 ? (
                                <span>No items</span>
                            ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {(expandedOrders[order.id] ? order.items : order.items.slice(0, 2)).map((item, i) => (
                                    <span key={i} style={{ color: '#374151' }}>
                                        {item.menu_item?.name} ×{item.quantity}
                                    </span>
                                ))}

                                {order.items.length > 2 && (
                                    <span
                                        onClick={() => toggleOrder(order.id)} 
                                        style={{ 
                                            fontSize: 12, 
                                            color: '#F97316',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            }}
                                    >
                                        {expandedOrders[order.id] 
                                        ? 'Show less' 
                                        : `+${order.items.length - 2} more`}
                                    </span>
                                )}
                            </div>
                            )}  
                        </td>
                        <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                          AED {Number(total).toFixed(2)}
                        </td>
                        <td style={{ padding: '14px 24px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: s.bg, color: s.color,
                            fontSize: 11, fontWeight: 600,
                            padding: '3px 10px', borderRadius: 20,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
                            {s.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}