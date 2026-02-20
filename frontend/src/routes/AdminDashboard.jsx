import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, LogOut, Filter, Search, BarChart3 } from 'lucide-react';
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
  const navigate = useNavigate(); 
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const restaurantRes = await apiCalls.getMyRestaurant();
      setRestaurant(restaurantRes.data);
      
      const menuRes = await apiCalls.getMyMenuItems();
      setMenuItems(menuRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading dashboard data: ' + (error.response?.data?.message || error.message));
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

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed',
        inset: 0,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ff6b35 0%, #ffa726 50%, #ffd54f 100%)'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '45px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontSize: '16px',
          color: '#333'
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed',
      inset: 0,
      background: 'linear-gradient(135deg, #ff6b35 0%, #ffa726 50%, #ffd54f 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #ddd',
        padding: '20px 30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        flexShrink: 0
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{ 
              margin: '0 0 5px 0', 
              fontSize: '28px', 
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              {restaurant?.name}
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#666',
              fontSize: '14px'
            }}>
              {restaurant?.category} • ⭐ {restaurant?.rating}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => navigate('/admin/analytics')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4338ca'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#4f46e5'}
            >
              <BarChart3 size={16} />
              Analytics
            </button>
          
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>
                Logged in as
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ff7a45',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        overflow: 'auto',
        padding: '25px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Stats Cards */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '25px'
          }}>
            {CATEGORIES.map(cat => {
              const count = menuItems.filter(item => item.category === cat).length;
              const isActive = filterCategory === cat;
              return (
                <div 
                  key={cat} 
                  style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    border: isActive ? '2px solid #ff7a45' : '2px solid transparent'
                  }}
                  onClick={() => setFilterCategory(cat)}
                >
                  <div style={{ fontSize: '24px', fontWeight: '600', color: '#ff7a45', marginBottom: '5px' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', textTransform: 'capitalize' }}>
                    {cat}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions Bar */}
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '6px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Filter size={16} />
                  Filter:
                </span>
                <button
                  onClick={() => setFilterCategory('all')}
                  style={{
                    padding: '6px 14px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: filterCategory === 'all' ? '#ff7a45' : 'white',
                    color: filterCategory === 'all' ? 'white' : '#333',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: filterCategory === cat ? '#ff7a45' : 'white',
                      color: filterCategory === cat ? 'white' : '#333',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textTransform: 'capitalize'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ 
                    position: 'absolute', 
                    left: '10px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#999',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '7px 10px 7px 35px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                      width: '200px',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  onClick={handleAddClick}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '15px' 
          }}>
            {filteredItems.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '60px 20px',
                backgroundColor: 'white',
                borderRadius: '6px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🍽️</div>
                <p style={{ fontSize: '16px', color: '#333', margin: '0 0 5px 0' }}>
                  {searchQuery ? 'No items found' : 'No menu items yet'}
                </p>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
                  {searchQuery ? 'Try searching for something else' : 'Click "Add Item" to get started'}
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