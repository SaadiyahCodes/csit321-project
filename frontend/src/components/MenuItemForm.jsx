import { X, Save } from 'lucide-react';
import { useState } from 'react';

const CATEGORIES = ["mains", "sides", "dessert", "drinks"];
export default function MenuItemForm({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState(item || {
    name: '',
    description: '',
    price: '',
    category: 'mains',
    allergens: '',
    is_available: true,
    image_url: '',
    ar_model_url: ''
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            {item ? 'Edit Menu Item' : 'Add Menu Item'}
          </h2>
          <button
            onClick={onCancel}
            style={{
              padding: '8px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Margherita Pizza"
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              placeholder="Describe the dish..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Price *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                style={inputStyle}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={labelStyle}>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={inputStyle}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Allergens</label>
            <input
              type="text"
              value={formData.allergens}
              onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
              style={inputStyle}
              placeholder="e.g., Gluten, Dairy, Nuts"
            />
          </div>

          <div>
            <label style={labelStyle}>Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              style={inputStyle}
              placeholder="https://..."
            />
          </div>

          <div>
            <label style={labelStyle}>AR Model URL</label>
            <input
              type="url"
              value={formData.ar_model_url}
              onChange={(e) => setFormData({ ...formData, ar_model_url: e.target.value })}
              style={inputStyle}
              placeholder="https://..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="available"
              checked={formData.is_available}
              onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="available" style={{ fontSize: '14px', cursor: 'pointer' }}>
              Item is available
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={handleSubmit}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Save size={18} />
              {item ? 'Update' : 'Create'}
            </button>
            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}