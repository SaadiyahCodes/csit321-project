import React, { useState } from 'react';
import { User, ArrowLeft, Edit2, Save, X } from 'lucide-react';

const CustomerProfile = () => {
  const [isEditingAllergens, setIsEditingAllergens] = useState(false);
  const [isEditingDietary, setIsEditingDietary] = useState(false);
  
  // Sample user data - will come from backend later
  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+971 XX XXX XXXX'
  });

  // Allergen preferences
  const [allergens, setAllergens] = useState(['Peanuts', 'Dairy', 'Shellfish']);
  const [tempAllergens, setTempAllergens] = useState([...allergens]);
  
  const availableAllergens = [
    'Peanuts', 'Tree Nuts', 'Dairy', 'Eggs', 'Soy', 
    'Wheat/Gluten', 'Shellfish', 'Fish', 'Sesame'
  ];

  // Dietary preferences
  const [dietaryPrefs, setDietaryPrefs] = useState(['Vegetarian', 'Low Sodium']);
  const [tempDietaryPrefs, setTempDietaryPrefs] = useState([...dietaryPrefs]);
  
  const availableDietaryPrefs = [
    'Vegetarian', 'Vegan', 'Halal', 
    'Low Carb', 'Low Sodium', 'Gluten-Free', 'Dairy-Free'
  ];

  // Order history
  const orderHistory = [
    {
      id: 1,
      restaurant: 'Spice Garden',
      date: '2026-01-20',
      items: ['Chicken Biryani', 'Mango Lassi'],
      total: 45.50,
      status: 'Completed'
    },
    {
      id: 2,
      restaurant: 'Sushi House',
      date: '2026-01-15',
      items: ['California Roll', 'Salmon Sashimi'],
      total: 62.00,
      status: 'Completed'
    },
  ];

  const handleSaveAllergens = () => {
    setAllergens([...tempAllergens]);
    setIsEditingAllergens(false);
    // TODO: Send to backend
  };

  const handleCancelAllergens = () => {
    setTempAllergens([...allergens]);
    setIsEditingAllergens(false);
  };

  const handleSaveDietary = () => {
    setDietaryPrefs([...tempDietaryPrefs]);
    setIsEditingDietary(false);
    // TODO: Send to backend
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f3f4f6',
      paddingBottom: '40px'
    }}>
      {/* Header */}
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
          gap: '16px'
        }}>
          <button
            onClick={() => window.history.back()}
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
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '24px 20px'
      }}>
        
        {/* Profile Info Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={40} color="white" />
            </div>
            <div>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                margin: '0 0 8px 0',
                color: '#2d3748'
              }}>
                {userData.name}
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#718096',
                margin: '4px 0'
              }}>
                {userData.email}
              </p>
              <p style={{
                fontSize: '14px',
                color: '#718096',
                margin: '4px 0'
              }}>
                {userData.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Allergens Card */}
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
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={handleCancelAllergens}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
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
                      fontWeight: '500'
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {availableAllergens.map((allergen, index) => (
                <button
                  key={index}
                  onClick={() => toggleAllergen(allergen)}
                  style={{
                    backgroundColor: tempAllergens.includes(allergen) ? '#fee2e2' : '#f3f4f6',
                    color: tempAllergens.includes(allergen) ? '#dc2626' : '#4b5563',
                    border: tempAllergens.includes(allergen) ? '2px solid #dc2626' : '2px solid transparent',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {allergen}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dietary Preferences Card */}
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
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={handleCancelDietary}
                  style={{
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
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
                      fontWeight: '500'
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
                  style={{
                    backgroundColor: tempDietaryPrefs.includes(pref) ? '#dcfce7' : '#f3f4f6',
                    color: tempDietaryPrefs.includes(pref) ? '#16a34a' : '#4b5563',
                    border: tempDietaryPrefs.includes(pref) ? '2px solid #16a34a' : '2px solid transparent',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {pref}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order History Card */}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {orderHistory.map((order) => (
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
                    {order.restaurant}
                  </h4>
                  <span style={{
                    backgroundColor: '#dcfce7',
                    color: '#16a34a',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {order.status}
                  </span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '4px 0'
                }}>
                  {new Date(order.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#4b5563',
                  margin: '8px 0'
                }}>
                  {order.items.join(', ')}
                </p>
                <p style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#f97316',
                  margin: '8px 0 0 0'
                }}>
                  ${order.total.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerProfile;