import React, { useState, useEffect } from 'react';
import { User, ArrowLeft, Edit2, Save, X, LogOut } from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useCustomerAuth} from '../../context/CustomerAuthContext';
import api from '../../api';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { customer, logout, loading: authLoading, fetchCustomer } = useCustomerAuth();

  const [isEditingAllergens, setIsEditingAllergens] = useState(false);
  const [isEditingDietary, setIsEditingDietary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [customAllergen, setCustomAllergen] = useState('');

  //profile data
  const [profile, setProfile] = useState(null);
  const [allergens, setAllergens] = useState([]);
  const [tempAllergens, setTempAllergens] = useState([]);
  const [dietaryPrefs, setDietaryPrefs] = useState([]);
  const [tempDietaryPrefs, setTempDietaryPrefs] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  //available options
  const [availableAllergens, setAvailableAllergens] = useState([]);
  const [availableDietaryPrefs, setAvailableDietaryPrefs] = useState([]);
  
  //redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !customer) {
      navigate('/customer/login');
    }
  }, [authLoading, customer, navigate]);

  // Fetch profile data
  useEffect(() => {
    if (customer) {
      fetchProfileData();
    }
  }, [customer]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const profileRes = await api.get('/api/customer/profile/');
      setProfile(profileRes.data);
      setAllergens(profileRes.data.allergens || []);
      setTempAllergens(profileRes.data.allergens || []);
      setDietaryPrefs(profileRes.data.dietary_preferences || []);
      setTempDietaryPrefs(profileRes.data.dietary_preferences || []);

      // Fetch available options
      const optionsRes = await api.get('/api/customer/profile/options');
      setAvailableAllergens(optionsRes.data.available_allergens);
      setAvailableDietaryPrefs(optionsRes.data.available_dietary_preferences);

      // Fetch order history
      const ordersRes = await api.get('/api/customer/orders/history');
      setOrderHistory(ordersRes.data);

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllergens = async () => {
    try {
      setSaving(true);
      await api.put('/api/customer/profile/', {
        allergens: tempAllergens
      });
      setAllergens([...tempAllergens]);
      setIsEditingAllergens(false);
    } catch (error) {
      console.error('Error saving allergens:', error);
      alert('Failed to save allergens. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAllergens = () => {
    setTempAllergens([...allergens]);
    setCustomAllergen('');
    setIsEditingAllergens(false);
  };

  const handleSaveDietary = async () => {
    try {
      setSaving(true);
      await api.put('/api/customer/profile/', {
        dietary_preferences: tempDietaryPrefs
      });
      setDietaryPrefs([...tempDietaryPrefs]);
      setIsEditingDietary(false);
    } catch (error) {
      console.error('Error saving dietary preferences:', error);
      alert('Failed to save dietary preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelDietary = () => {
    setTempDietaryPrefs([...dietaryPrefs]);
    setIsEditingDietary(false);
  };

  const toggleAllergen = (allergen) => {
    if (tempAllergens.includes(allergen)) {
      setTempAllergens(tempAllergens.filter(a => a !== allergen));
    } else {
      setTempAllergens([...tempAllergens, allergen]);
    }
  };

  const toggleDietaryPref = (pref) => {
    if (tempDietaryPrefs.includes(pref)) {
      setTempDietaryPrefs(tempDietaryPrefs.filter(p => p !== pref));
    } else {
      setTempDietaryPrefs([...tempDietaryPrefs, pref]);
    }
  };

  // CHANGE 1: handleSaveInfo — saves name and phone, then refreshes customer context
  const handleSaveInfo = async () => {
    try {
      setSaving(true);
      await api.put('/api/customer/profile/', {
        name: tempName,
        phone_number: tempPhone
      });
      await fetchCustomer();
      setIsEditingInfo(false);
    } catch (error) {
      console.error('Error saving info:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // CHANGE 2: addCustomAllergen — adds a user-typed allergen to tempAllergens
  const addCustomAllergen = () => {
    const val = customAllergen.trim().toLowerCase();
    if (val && !tempAllergens.includes(val)) {
      setTempAllergens([...tempAllergens, val]);
    }
    setCustomAllergen('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  //loading state
  if (authLoading || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6'
      }}>
        <p style={{ fontSize: '18px', color: '#718096' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      paddingBottom: '40px'
    }}>
      {/* Header — unchanged */}
      <div style={{
        background: 'linear-gradient(to right, #f97316, #ea580c)',
        padding: '24px 20px',
        color: 'white'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={24} />
            </button>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: 0
            }}>
              My Profile
            </h1>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '24px 20px'
      }}>
        
        {/*
          CHANGE 1: Profile Info Card
          - Added Edit button top-right
          - When editing: shows name + phone inputs (email stays read-only)
          - Save calls handleSaveInfo → PUT /api/customer/profile/ → fetchCustomer()
          - Cancel resets to current customer values
        */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={40} color="white" />
              </div>
              <div>
                {!isEditingInfo ? (
                  <>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#2d3748' }}>
                      {customer?.name || 'Customer'}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#718096', margin: '4px 0' }}>
                      {customer?.email}
                    </p>
                    {customer?.phone_number && customer.phone_number !== 'string' && (
                      <p style={{ fontSize: '14px', color: '#718096', margin: '4px 0' }}>
                        {customer.phone_number}
                      </p>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Name"
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        outline: 'none',
                        width: '220px'
                      }}
                    />
                    <input
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      placeholder="Phone number"
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '14px',
                        outline: 'none',
                        width: '220px'
                      }}
                    />
                    <p style={{ fontSize: '14px', color: '#718096', margin: 0 }}>
                      {customer?.email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Edit / Save / Cancel buttons for profile info */}
            {!isEditingInfo ? (
              <button
                onClick={() => {
                  setTempName(customer?.name || '');
                  setTempPhone(customer?.phone_number || '');
                  setIsEditingInfo(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f97316',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <Edit2 size={16} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveInfo}
                  disabled={saving}
                  style={{
                    background: saving ? '#cbd5e0' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditingInfo(false)}
                  disabled={saving}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/*
          CHANGE 2: Allergens Card
          - Edit mode outer div changed to flexDirection column
          - First row: all preset allergen toggle buttons + custom allergens rendered as removable tags
          - Second row: text input + Add button for custom allergens
          - Cancel also clears the customAllergen input state
        */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              margin: 0,
              color: '#2d3748'
            }}>
              Allergen Preferences
            </h3>
            {!isEditingAllergens ? (
              <button
                onClick={() => setIsEditingAllergens(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f97316',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <Edit2 size={16} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveAllergens}
                  disabled={saving}
                  style={{
                    background: saving ? '#cbd5e0' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelAllergens}
                  disabled={saving}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            )}
          </div>

          {!isEditingAllergens ? (
            // View mode — unchanged
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {allergens.length > 0 ? (
                allergens.map((allergen, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {allergen}
                  </span>
                ))
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>No allergens selected</p>
              )}
            </div>
          ) : (
            // Edit mode — column layout: buttons row + custom input row
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Row 1: preset allergen toggles + any custom allergens already added */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {availableAllergens.map((allergen, index) => (
                  <button
                    key={index}
                    onClick={() => toggleAllergen(allergen)}
                    disabled={saving}
                    style={{
                      backgroundColor: tempAllergens.includes(allergen) ? '#fee2e2' : '#f3f4f6',
                      color: tempAllergens.includes(allergen) ? '#dc2626' : '#4b5563',
                      border: tempAllergens.includes(allergen) ? '2px solid #dc2626' : '2px solid transparent',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'capitalize'
                    }}
                  >
                    {allergen}
                  </button>
                ))}
                {/* Custom allergens (not in preset list) shown as removable tags */}
                {tempAllergens
                  .filter(a => !availableAllergens.includes(a))
                  .map((allergen, index) => (
                    <button
                      key={`custom-${index}`}
                      onClick={() => toggleAllergen(allergen)}
                      disabled={saving}
                      style={{
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '2px solid #dc2626',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        textTransform: 'capitalize'
                      }}
                    >
                      {allergen} ✕
                    </button>
                  ))}
              </div>

              {/* Row 2: custom allergen input */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  value={customAllergen}
                  onChange={(e) => setCustomAllergen(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomAllergen(); }}
                  placeholder="Add custom allergen..."
                  style={{
                    border: '1px solid #d1d5db',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    outline: 'none',
                    flex: 1
                  }}
                />
                <button
                  onClick={addCustomAllergen}
                  disabled={saving}
                  style={{
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 20px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dietary Preferences Card — unchanged */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              margin: 0,
              color: '#2d3748'
            }}>
              Dietary Preferences
            </h3>
            {!isEditingDietary ? (
              <button
                onClick={() => setIsEditingDietary(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f97316',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                <Edit2 size={16} /> Edit
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveDietary}
                  disabled={saving}
                  style={{
                    background: saving ? '#cbd5e0' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelDietary}
                  disabled={saving}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            )}
          </div>

          {!isEditingDietary ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {dietaryPrefs.length > 0 ? (
                dietaryPrefs.map((pref, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {pref}
                  </span>
                ))
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '14px' }}>No dietary preferences selected</p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableDietaryPrefs.map((pref, index) => (
                <button
                  key={index}
                  onClick={() => toggleDietaryPref(pref)}
                  disabled={saving}
                  style={{
                    backgroundColor: tempDietaryPrefs.includes(pref) ? '#dcfce7' : '#f3f4f6',
                    color: tempDietaryPrefs.includes(pref) ? '#16a34a' : '#4b5563',
                    border: tempDietaryPrefs.includes(pref) ? '2px solid #16a34a' : '2px solid transparent',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textTransform: 'capitalize'
                  }}
                >
                  {pref}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order History Card — unchanged */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: '#2d3748'
          }}>
            Order History
          </h3>
          {orderHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orderHistory.map((order, index) => (
                <div
                  key={order.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px',
                    transition: 'box-shadow 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: 0,
                      color: '#2d3748'
                    }}>
                      Order #{orderHistory.length - index}
                    </h4>
                    <span style={{
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {order.status}
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    margin: '4px 0'
                  }}>
                    {new Date(order.finalized_at || order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  
                  {order.items && order.items.length > 0 ? (
                    <div style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      margin: '8px 0'
                    }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '4px' }}>
                          • {item.quantity}x {item.menu_item.name}
                          {item.notes && <span style={{ color: '#9ca3af', fontSize: '13px' }}> - {item.notes}</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      margin: '8px 0'
                    }}>
                      No items
                    </p>
                  )}
                  
                  <p style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#f97316',
                    margin: '8px 0 0 0'
                  }}>
                    ${parseFloat(order.total_price || 0).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af', fontSize: '14px' }}>No orders yet</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default CustomerProfile;
