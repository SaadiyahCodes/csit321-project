//frontend/src/components/RestaurantCard.jsx
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/restaurant/${restaurant.id}/menu`);
  };

  return (
    <div 
      onClick={handleClick}
      style={{
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid #f3f4f6'
      }}
    >
      <div style={{ position: 'relative', height: '120px', overflow: 'hidden' }}>
        <img
          src={restaurant.image}
          alt={restaurant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <button
        onClick={(e) => {e.stopPropagation();}}
        style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none'
          }}
        >
          <Heart size={14} style={{ color: '#4b5563' }} />
        </button>
      </div>
      
      <div style={{ padding: '12px' }}>
        <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
          {restaurant.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {restaurant.category}
          </span>
          <span style={{
            fontSize: '12px',
            backgroundColor: '#ffedd5',
            color: '#ea580c',
            padding: '4px 8px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            ⭐ {restaurant.rating}
          </span>
        </div>
      </div>
    </div>
  );
}