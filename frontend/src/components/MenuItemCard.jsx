import { Edit2, Trash2 } from 'lucide-react';

export default function MenuItemCard({ item, onEdit, onDelete }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e9ecef',
        overflow: 'hidden',
        transition: 'all 0.3s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
      }}
    >
      {/* Image */}
      {item.image_url && (
        <div style={{ 
          width: '100%', 
          height: '200px', 
          overflow: 'hidden',
          backgroundColor: '#f8f9fa'
        }}>
          <img
            src={item.image_url}
            alt={item.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Name and Price */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '8px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#212529',
            lineHeight: '1.4',
            flex: 1
          }}>
            {item.name}
          </h3>
          <span style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#ff6b35',
            marginLeft: '12px',
            whiteSpace: 'nowrap'
          }}>
            {item.price ? `${item.price.toFixed(2)} AED` : ''}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            color: '#6c757d',
            lineHeight: '1.5'
          }}>
            {item.description}
          </p>
        )}

        {/* Category Badge */}
        <div style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          padding: '4px 12px',
          backgroundColor: '#fff5f0',
          color: '#ff6b35',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          {item.category}
        </div>

        {item.calories && (
          <div style={{
            fontSize: '14px',
            color: '#6c757d',
            marginBottom: '16px',
            fontWeight: '500'
          }}>
            {item.calories} kcal
          </div>
        )}

        {/* Availability Status */}
        {item.is_available !== undefined && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: '500'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: item.is_available ? '#28a745' : '#dc3545'
            }} />
            <span style={{
              color: item.is_available ? '#28a745' : '#dc3545'
            }}>
              {item.is_available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        )}

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#6c757d',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px'
            }}>
              Allergens
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {item.allergens.map((allergen, index) => (
                <div
                  key={index}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#856404',
                    textTransform: 'capitalize'
                  }}
                >
                  {allergen}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          paddingTop: '16px',
          borderTop: '1px solid #e9ecef'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: 'white',
              color: '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
              e.target.style.borderColor = '#ced4da';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.borderColor = '#dee2e6';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Edit2 size={16} />
            Edit
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: 'white',
              color: '#dc3545',
              border: '1px solid #f5c2c7',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#dc3545';
              e.target.style.color = 'white';
              e.target.style.borderColor = '#dc3545';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white';
              e.target.style.color = '#dc3545';
              e.target.style.borderColor = '#f5c2c7';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}