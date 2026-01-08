import { Edit2, Trash2 } from 'lucide-react';

export default function MenuItemCard({ item, onEdit, onDelete }) {
  return (
    <div style={{
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: 'white',
      display: 'flex',
      gap: '16px'
    }}>
      <img 
        src={item.image_url || 'https://via.placeholder.com/100'}
        alt={item.name}
        style={{
          width: '100px',
          height: '100px',
          objectFit: 'cover',
          borderRadius: '8px',
          backgroundColor: '#f3f4f6'
        }}
      />
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {item.name}
            </h3>
            <p style={{ margin: '0 0 8px 0', color: '#6b7280', fontSize: '14px' }}>
              {item.description}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onEdit(item)}
              style={{
                padding: '8px',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#3b82f6',
                cursor: 'pointer'
              }}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              style={{
                padding: '8px',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#ef4444',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#374151' }}>
          <span style={{ fontWeight: 'bold', color: '#059669' }}>${item.price}</span>
          <span style={{ 
            padding: '2px 8px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '4px',
            textTransform: 'capitalize'
          }}>
            {item.category}
          </span>
          <span style={{ color: item.is_available ? '#059669' : '#ef4444' }}>
            {item.is_available ? '✓ Available' : '✗ Unavailable'}
          </span>
        </div>
        {item.allergens && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Allergens: {item.allergens}
          </p>
        )}
      </div>
    </div>
  );
}