import React, { useState, useEffect } from 'react';
import { User, ArrowLeft, Edit2, Save, X, LogOut } from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {useCustomerAuth} from '../../context/CustomerAuthContext';
import api from '../../api';
import { useToast } from "../../components/Toast";
import LanguageSelector from "../../components/LanguageSelector";
import TranslatedText from "../../components/TranslatedText";
import { useLanguage } from "../../context/LanguageContext";

const ALLERGENS_EN = ["nuts","peanuts","dairy","gluten","shellfish","soy","eggs","fish","wheat","sesame","mustard"];
const DIETARY_EN = ["vegetarian","vegan","gluten-free","dairy-free","nut-free","halal","kosher","pescatarian","paleo","keto"];

const CustomerProfile = () => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { customer, logout, loading: authLoading, setCustomer } = useCustomerAuth();
  const { showToast, ToastContainer } = useToast();
  const [translatedOrderItems, setTranslatedOrderItems] = useState({});
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
  const [allergenTranslationMap, setAllergenTranslationMap] = useState({});
  const [dietaryTranslationMap, setDietaryTranslationMap] = useState({});
  
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

  useEffect(() => {
    if (!orderHistory.length || language === "en") return;
    const translateNames = async () => {
      const map = {};
      for (const order of orderHistory) {
        for (const item of order.items || []) {
          const name = item.menu_item.name;
          if (!map[name]) map[name] = await t(name);
        }
      }
      setTranslatedOrderItems(map);
    };
    translateNames();
  }, [orderHistory, language]);

  useEffect(() => {
    if (!customer) return;
    const fetchOptions = async () => {
      try {
        const optionsRes = await api.get(`/api/customer/profile/options?lang=${language}`);
        setAvailableAllergens(optionsRes.data.available_allergens);
        setAvailableDietaryPrefs(optionsRes.data.available_dietary_preferences);

        const aMap = {};
        ALLERGENS_EN.forEach((en, i) => { aMap[en] = optionsRes.data.available_allergens[i]; });
        setAllergenTranslationMap(aMap);

        const dMap = {};
        DIETARY_EN.forEach((en, i) => { dMap[en] = optionsRes.data.available_dietary_preferences[i]; });
        setDietaryTranslationMap(dMap);
      } catch (err) {
        console.error("Error fetching options:", err);
      }
    };
    fetchOptions();
  }, [language, customer]);

  // OPTIMIZATION 1: Parallelize all 3 API calls instead of sequential
  const fetchProfileData = async () => {
    try {
      setLoading(true);

      const [profileRes, ordersRes] = await Promise.all([
        api.get('/api/customer/profile/'),
        api.get('/api/customer/orders/history')
      ]);

      setProfile(profileRes.data);
      setAllergens(profileRes.data.allergens || []);
      setTempAllergens(profileRes.data.allergens || []);
      setDietaryPrefs(profileRes.data.dietary_preferences || []);
      setTempDietaryPrefs(profileRes.data.dietary_preferences || []);
      
      setOrderHistory(ordersRes.data);

    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('Failed to load profile. Please try again.', "error");
    } finally {
      setLoading(false);
    }
  };

  // OPTIMIZATION 2: Update local state only, no context refetch
  const handleSaveAllergens = async () => {
    try {
      setSaving(true);
      await api.put('/api/customer/profile/', {
        allergens: tempAllergens
      });
      // Update local state immediately (optimistic update)
      setAllergens([...tempAllergens]);
      setIsEditingAllergens(false);
      showToast('Allergens updated successfully!', "success");
    } catch (error) {
      console.error('Error saving allergens:', error);
      showToast('Failed to save allergens. Please try again.', "error");
      // Revert on error
      setTempAllergens([...allergens]);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAllergens = () => {
    setTempAllergens([...allergens]);
    setCustomAllergen('');
    setIsEditingAllergens(false);
  };

  // OPTIMIZATION 3: Update local state only, no context refetch
  const handleSaveDietary = async () => {
    try {
      setSaving(true);
      await api.put('/api/customer/profile/', {
        dietary_preferences: tempDietaryPrefs
      });
      // Update local state immediately (optimistic update)
      setDietaryPrefs([...tempDietaryPrefs]);
      setIsEditingDietary(false);
      showToast('Dietary preferences updated successfully!', "success");
    } catch (error) {
      console.error('Error saving dietary preferences:', error);
      showToast('Failed to save dietary preferences. Please try again.', "error");
      // Revert on error
      setTempDietaryPrefs([...dietaryPrefs]);
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

  // OPTIMIZATION 4: Update context directly, no refetch needed
  const handleSaveInfo = async () => {
    try {
      setSaving(true);
      await api.put('/api/customer/profile/', {
        name: tempName,
        phone_number: tempPhone
      });
      
      // Update context customer object directly (no API refetch)
      setCustomer(prev => ({
        ...prev,
        name: tempName,
        phone_number: tempPhone
      }));
      
      setIsEditingInfo(false);
      showToast('Profile updated successfully!', "success");
    } catch (error) {
      console.error('Error saving info:', error);
      showToast('Failed to save. Please try again.', "error");
    } finally {
      setSaving(false);
    }
  };

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
              <TranslatedText>My Profile</TranslatedText>
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LanguageSelector variant="navbar" />
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
              <TranslatedText>Logout</TranslatedText>
            </button>
          </div>
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
                <Edit2 size={16} /> <TranslatedText>Edit</TranslatedText>
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
                  <Save size={16} /> {saving ? <TranslatedText>Saving...</TranslatedText> : <TranslatedText>Save</TranslatedText>}
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
                  <X size={16} /> <TranslatedText>Cancel</TranslatedText>
                </button>
              </div>
            )}
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
              <TranslatedText>Allergen Preferences</TranslatedText>
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
                <Edit2 size={16} /> <TranslatedText>Edit</TranslatedText>
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
                  <Save size={16} /> {saving ? <TranslatedText>Saving...</TranslatedText> : <TranslatedText>Save</TranslatedText>}
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
                  <X size={16} /> <TranslatedText>Cancel</TranslatedText>
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
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {allergenTranslationMap[allergen] || allergen}
                  </span>
                ))
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '14px' }}><TranslatedText>No allergens selected</TranslatedText></p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Row 1: preset allergen toggles + custom allergens */}
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
                {/* Custom allergens shown as removable tags */}
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
              <TranslatedText>Dietary Preferences</TranslatedText>
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
                <Edit2 size={16} /> <TranslatedText>Edit</TranslatedText>
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
                  <Save size={16} /> {saving ? <TranslatedText>Saving...</TranslatedText> : <TranslatedText>Save</TranslatedText>}
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
                  <X size={16} /> <TranslatedText>Cancel</TranslatedText>
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
                    {dietaryTranslationMap[pref] || pref}
                  </span>
                ))
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '14px' }}><TranslatedText>No dietary preferences selected</TranslatedText></p>
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
            <TranslatedText>Order History</TranslatedText>
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
                      <TranslatedText>Order</TranslatedText> #{orderHistory.length - index}
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
                      <TranslatedText>{order.status.toLowerCase()}</TranslatedText>
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
                          • {item.quantity}x {translatedOrderItems[item.menu_item.name] || item.menu_item.name}
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
                      <TranslatedText>No items</TranslatedText>
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
            <p style={{ color: '#9ca3af', fontSize: '14px' }}><TranslatedText>No orders yet</TranslatedText></p>
          )}
        </div>

      </div>
      {ToastContainer}
    </div>
  );
};

export default CustomerProfile;
