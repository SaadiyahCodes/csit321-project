import { useState, useEffect } from "react";
import { Search, Home, ShoppingCart, Heart, Clipboard, Mic } from "lucide-react";
import RestaurantCard from "../../components/RestaurantCard";
import api from "../../api";

export default function GustoHome() {
  const [searchQuery, setSearchQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      justifyContent: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', padding: '0 16px' }}>
        {/* HEADER */}
        <header style={{
          background: 'linear-gradient(to right, #f97316, #ea580c)',
          borderRadius: '24px',
          padding: '24px',
          marginTop: '16px'
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            Welcome To Gusto
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
              placeholder="Search Restaurants"
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
              All Restaurants
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

          {/* BOTTOM NAV */}
          <nav style={{
            background: 'linear-gradient(to right, #f97316, #ea580c)',
            borderRadius: '16px',
            padding: '12px 24px',
            maxWidth: '500px',
            margin: '0 auto 24px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              color: 'white'
            }}>
              <Home size={20} />
              <ShoppingCart size={20} />
              <Heart size={20} />
              <Clipboard size={20} />
              <Mic size={20} />
            </div>
          </nav>
        </main>
      </div>
    </div>
  );
}