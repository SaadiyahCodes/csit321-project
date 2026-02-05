import React, { useState } from 'react';

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '60px 80px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Welcome Header */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#2d3748',
          marginBottom: '12px',
          textAlign: 'center'
        }}>
          Welcome Back
        </h1>
        
        <p style={{
          fontSize: '16px',
          color: '#718096',
          marginBottom: '40px',
          textAlign: 'center'
        }}>
          Sign in to your account
        </p>

        {/* Error Message */}
        {error && (
          <div style={{
            background: '#fed7d7',
            color: '#c53030',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '8px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '15px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: '#f7fafc'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '15px',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: '15px',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: '#f7fafc'
              }}
              onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(255, 107, 53, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)';
            }}
          >
            Login
          </button>
        </form>

        {/* Sign Up Link */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#718096'
        }}>
          Don't have an account?{' '}
          <a
            href="/signup"
            style={{
              color: '#ff6b35',
              fontWeight: '600',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;