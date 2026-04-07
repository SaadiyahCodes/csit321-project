import { useAuth } from "../context/AuthContext";
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Plus, LogOut, Search, BarChart3 } from 'lucide-react';
import api from "../api";
import MenuItemCard from "../components/MenuItemCard";
import MenuItemForm from "../components/MenuItemForm";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmDialog";

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
  const { showToast, ToastContainer } = useToast();
  const { confirm, ConfirmContainer } = useConfirm();
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
      showToast('Error loading dashboard data: ' + (error.response?.data?.message || error.message), "error");
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
      showToast(editingItem ? 'Item updated successfully' : 'Item added successfully', 'success');
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
      showToast('Error saving menu item', "error");
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm("Are you sure you want to delete this item?");
    if (!ok) return;

    try {
      await apiCalls.deleteMenuItem(id);
      setMenuItems(menuItems.filter(item => item.id !== id));
      showToast("Item deleted", "success");
    } catch (error) {
      console.error("Error deleting item:", error);
      showToast("Error deleting menu item", "error");
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
        background: '#f8f9fa'
      }}>
        <div style={{
          backgroundColor: '#fffaf7',
          padding: '45px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
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
      background: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef',
        padding: '20px 30px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
              color: '#212529'
            }}>
              {restaurant?.name}
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#6c757d',
              fontSize: '14px'
            }}>
              {restaurant?.category} • ⭐ {restaurant?.rating}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#adb5bd', textTransform: 'uppercase' }}>
                Logged in as
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#495057' }}>
                {user?.email}
              </p>
            </div>
            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#495057',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.transform = 'translateY(0)';
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
          {/* Stats Cards with "All" option */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px',
            marginBottom: '25px'
          }}>
            {/* All Items Card */}
            <div 
              style={{
                backgroundColor: '#fffaf7',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: filterCategory === 'all' 
                  ? '0 4px 12px rgba(255, 107, 53, 0.2)' 
                  : '0 1px 3px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                border: filterCategory === 'all' ? '2px solid #ff6b35' : '2px solid transparent',
                transition: 'all 0.3s',
                transform: filterCategory === 'all' ? 'translateY(-2px)' : 'translateY(0)'
              }}
              onClick={() => setFilterCategory('all')}
              onMouseEnter={(e) => {
                if (filterCategory !== 'all') {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                }
              }}
              onMouseLeave={(e) => {
                if (filterCategory !== 'all') {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                }
              }}
            >
              <div style={{ fontSize: '32px', fontWeight: '700', color: '#ff6b35', marginBottom: '8px' }}>
                {menuItems.length}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>
                All Items
              </div>
            </div>

            {/* Category Cards */}
            {CATEGORIES.map(cat => {
              const count = menuItems.filter(item => item.category === cat).length;
              const isActive = filterCategory === cat;
              return (
                <div 
                  key={cat} 
                  style={{
                    backgroundColor: '#fffaf7',
                    padding: '20px',
                    borderRadius: '12px',
                    boxShadow: isActive 
                      ? '0 4px 12px rgba(255, 107, 53, 0.2)' 
                      : '0 1px 3px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    border: isActive ? '2px solid #ff6b35' : '2px solid transparent',
                    transition: 'all 0.3s',
                    transform: isActive ? 'translateY(-2px)' : 'translateY(0)'
                  }}
                  onClick={() => setFilterCategory(cat)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                    }
                  }}
                >
                  <div style={{ fontSize: '32px', fontWeight: '700', color: '#ff6b35', marginBottom: '8px' }}>
                    {count}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d', textTransform: 'capitalize', fontWeight: '500' }}>
                    {cat}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions Bar */}
          <div style={{
            backgroundColor: '#fffaf7',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '15px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ 
                    position: 'absolute', 
                    left: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#adb5bd',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '10px 12px 10px 40px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      fontSize: '14px',
                      width: '280px',
                      outline: 'none',
                      transition: 'border 0.2s',
                      backgroundColor: '#f8f9fa'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
                    onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => navigate('/admin/analytics')}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: 'white',
                    color: '#495057',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <BarChart3 size={18} />
                  Analytics
                </button>

                <button
                  onClick={handleAddClick}
                  style={{
                    padding: '10px 18px',
                    backgroundColor: '#ff6b35',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#ff5722';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#ff6b35';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  <Plus size={18} />
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
                backgroundColor: '#fffaf7',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🍽️</div>
                <p style={{ fontSize: '16px', color: '#212529', margin: '0 0 5px 0' }}>
                  {searchQuery ? 'No items found' : 'No menu items yet'}
                </p>
                <p style={{ fontSize: '13px', color: '#6c757d', margin: 0 }}>
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
      {ToastContainer}
      {ConfirmContainer}
    </div>
  );
}