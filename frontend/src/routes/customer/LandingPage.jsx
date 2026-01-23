// src/routes/customer/LandingPage.jsx
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import RestaurantCard from "../../components/RestaurantCard";
import BottomNav from "../../components/BottomNav";
import LanguageSelector from "../../components/LanguageSelector";
import TranslatedText from "../../components/TranslatedText";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";

export default function LandingPage() {
  const { tSync } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNav, setActiveNav] = useState("home");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const response = await api.get("/api/restaurants/");
      setRestaurants(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching restaurants:", err);
      setError("Failed to load restaurants");
      setLoading(false);
    }
  };

  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6',
      display: 'flex',
      justifyContent: 'center',
      paddingBottom: '80px'
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', padding: '0 16px' }}>
        {/* HEADER */}
        <header style={{
          background: 'linear-gradient(to right, #f97316, #ea580c)',
          borderRadius: '24px',
          padding: '24px',
          marginTop: '16px'
        }}>
          {/* Language Selector - top right */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <LanguageSelector variant="compact" />
          </div>

          <h1 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <TranslatedText>Welcome To Gusto</TranslatedText>
          </h1>

          <div style={{
            maxWidth: '500px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <Search style={{ color: '#f97316', marginRight: '8px' }} size={18} />
            <input
              style={{
                flex: '1',
                outline: 'none',
                fontSize: '14px',
                border: 'none'
              }}
              placeholder={tSync("Search Restaurants")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main style={{ marginTop: '24px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h2 style={{
              fontWeight: 'bold',
              fontSize: '20px',
              marginBottom: '20px'
            }}>
              <TranslatedText>All Restaurants</TranslatedText>
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {filtered.map(r => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 left-0 right-0">
        <BottomNav active={activeNav} onChange={setActiveNav} />
      </div>
    </div>
  );
}