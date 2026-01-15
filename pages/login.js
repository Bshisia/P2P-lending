import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        router.push('/');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Login failed');
    }
  };

  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>
      <header>
        <nav className="container">
          <div className="logo">LendConnect</div>
          <button className="cta-btn" onClick={() => router.push('/')}>
            <i className="fas fa-home"></i> Home
          </button>
        </nav>
      </header>

      <section className="hero">
        <div className="container">
          <div className="auth-form">
            <div className="feature-icon">
              <i className="fas fa-sign-in-alt"></i>
            </div>
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
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
                <i className="fas fa-sign-in-alt"></i> Login
              </button>
            </form>
            <p>
              Don't have an account? <a href="/register">Register</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}