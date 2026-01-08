//frontend/src/routes/AdminDashboard.jsx
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from "../api";
import MenuItemCard from "../components/MenuItemCard";
import MenuItemForm from "../components/MenuItemForm";

const CATEGORIES = ["mains", "sides", "dessert", "drinks"];

// API Functions
const apiCalls = {
  getMyRestaurant: () => api.get('/api/admin/restaurant'),
  getMyMenuItems: () => api.get('/api/admin/menu'),
  createMenuItem: (item) => api.post('/api/admin/menu', item),
  updateMenuItem: (id, data) => api.patch(`/api/admin/menu/${id}`, data),
  deleteMenuItem: (id) => api.delete(`/api/admin/menu/${id}`)
};


export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [restaurantRes, menuRes] = await Promise.all([
        apiCalls.getMyRestaurant(),
        apiCalls.getMyMenuItems()
      ]);
      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleSave = async (formData) => {
    try {
      if (editingItem) {
        const response = await apiCalls.updateMenuItem(editingItem.id, formData);
        setMenuItems(menuItems.map(item => item.id === editingItem.id ? response.data : item));
      } else {
        const response = await apiCalls.createMenuItem(formData);
        setMenuItems([...menuItems, response.data]);
      }
      setShowForm(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving menu item');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await apiCalls.deleteMenuItem(id);
      setMenuItems(menuItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting menu item');
    }
  };

  const filteredItems = filterCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === filterCategory);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>
              {restaurant?.name} - Admin Dashboard
            </h1>
            <p style={{ margin: 0, color: '#6b7280' }}>
              {restaurant?.category} • Rating: {restaurant?.rating} ⭐
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              {user?.email}
            </p>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Actions Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setFilterCategory('all')}
              style={{
                padding: '8px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: filterCategory === 'all' ? '#3b82f6' : 'white',
                color: filterCategory === 'all' ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: filterCategory === cat ? '#3b82f6' : 'white',
                  color: filterCategory === cat ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontWeight: '500',
                  textTransform: 'capitalize'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={handleAddClick}
            style={{
              padding: '12px 24px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={20} />
            Add Menu Item
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: 'white',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>
                No menu items found. Add your first item!
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={handleEditClick}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <MenuItemForm
          item={editingItem}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}