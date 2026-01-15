import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('individual');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if ((userType === 'sacco' || userType === 'chama') && !certificateNumber) {
      setError('Certificate number is required for SACCOs and CHAMAs');
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          user_type: userType,
          certificate_number: certificateNumber 
        })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Registration failed');
    }
  };

  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>
      
      <nav className="navbar">
        <div className="container">
          <div className="logo" onClick={() => router.push('/')}>LendConnect</div>
          <div className="nav-menu">
            <a href="#loans">Loans</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <button className="secondary-btn" onClick={() => router.push('/login')}>
              <i className="fas fa-sign-in-alt"></i> Login
            </button>
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <div className="auth-form">
            <div className="feature-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <h1>Join LendConnect</h1>
            <form onSubmit={handleSubmit}>
              <div>
                <label><i className="fas fa-users"></i> Account Type:</label>
                <select 
                  value={userType} 
                  onChange={(e) => setUserType(e.target.value)}
                  required
                >\n                  <option value="individual">Individual</option>\n                  <option value="sacco">SACCO</option>\n                  <option value="chama">CHAMA</option>\n                </select>
              </div>
              <div>
                <label><i className="fas fa-user"></i> {userType === 'individual' ? 'Full Name' : 'Organization Name'}:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              {(userType === 'sacco' || userType === 'chama') && (
                <div>
                  <label><i className="fas fa-certificate"></i> Certificate Number:</label>
                  <input
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    placeholder="Enter your registration certificate number"
                    required
                  />
                </div>
              )}
              <div>
                <label><i className="fas fa-envelope"></i> Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label><i className="fas fa-lock"></i> Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" className="cta-btn">
                <i className="fas fa-user-plus"></i> Create Account
              </button>
            </form>
            <p>
              Already have an account? <a href="/login">Login here</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}