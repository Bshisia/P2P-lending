import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      });
    }

    // Fetch available loans
    fetch('/api/loans')
      .then(res => res.json())
      .then(data => {
        setLoans(data.loans || []);
        setFilteredLoans(data.loans || []);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.reload();
  };

  const filterLoans = (type) => {
    setActiveFilter(type);
    if (type === 'all') {
      setFilteredLoans(loans);
    } else {
      setFilteredLoans(loans.filter(loan => loan.lender_type === type));
    }
  };

  const getLenderTypeIcon = (type) => {
    switch(type) {
      case 'sacco': return 'fas fa-university';
      case 'chama': return 'fas fa-users';
      default: return 'fas fa-user';
    }
  };

  const getLenderTypeBadge = (type) => {
    switch(type) {
      case 'sacco': return 'SACCO';
      case 'chama': return 'CHAMA';
      default: return 'Individual';
    }
  };

  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>
      
      <nav className="navbar">
        <div className="container">
          <div className="logo">LendConnect</div>
          <button className={`hamburger ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
            <a href="#loans">Loans</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            {user ? (
              <div className="user-menu">
                <span>Welcome, {user.name}</span>
                <button className="cta-btn" onClick={() => router.push('/create-loan')}>
                  <i className="fas fa-plus"></i> Create Loan
                </button>
                <button className="secondary-btn" onClick={() => router.push('/dashboard')}>
                  <i className="fas fa-tachometer-alt"></i> Dashboard
                </button>
                <button className="secondary-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <button className="secondary-btn" onClick={() => router.push('/login')}>
                  <i className="fas fa-sign-in-alt"></i> Login
                </button>
                <button className="cta-btn" onClick={() => router.push('/register')}>
                  <i className="fas fa-user-plus"></i> Register
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="container">
          <h1>Connect. Lend. Grow.</h1>
          <p>Access loans from individuals, SACCOs, and CHAMAs. Better rates, transparent terms, trusted platform.</p>
          {!user && (
            <div className="hero-buttons">
              <button className="cta-btn" onClick={() => router.push('/register')}>Start Lending</button>
              <button className="secondary-btn" onClick={() => router.push('/register')}>Apply for Loan</button>
            </div>
          )}
        </div>
      </section>

      <div className="main-content" id="loans">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>{loans.length}</h3>
            <p><i className="fas fa-handshake"></i> Active Loans</p>
          </div>
          <div className="stat-item">
            <h3>{loans.filter(l => l.lender_type === 'sacco').length}</h3>
            <p><i className="fas fa-university"></i> SACCO Loans</p>
          </div>
          <div className="stat-item">
            <h3>{loans.filter(l => l.lender_type === 'chama').length}</h3>
            <p><i className="fas fa-users"></i> CHAMA Loans</p>
          </div>
          <div className="stat-item">
            <h3>{loans.filter(l => l.lender_type === 'individual').length}</h3>
            <p><i className="fas fa-user"></i> Individual Loans</p>
          </div>
        </div>

        <div className="loan-filters">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => filterLoans('all')}
          >
            <i className="fas fa-th"></i> All Loans
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'individual' ? 'active' : ''}`}
            onClick={() => filterLoans('individual')}
          >
            <i className="fas fa-user"></i> Individual
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'sacco' ? 'active' : ''}`}
            onClick={() => filterLoans('sacco')}
          >
            <i className="fas fa-university"></i> SACCOs
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'chama' ? 'active' : ''}`}
            onClick={() => filterLoans('chama')}
          >
            <i className="fas fa-users"></i> CHAMAs
          </button>
        </div>

        <div className="section">
          <h2><i className="fas fa-handshake"></i> Available Loans</h2>
          {filteredLoans.length === 0 ? (
            <div className="loan-card">
              <div className="feature-icon">
                <i className="fas fa-info-circle"></i>
              </div>
              <h3>No loans available</h3>
              <p>Be the first to create a loan offer!</p>
            </div>
          ) : (
            filteredLoans.map(loan => (
              <div key={loan.id} className="loan-card">
                <div className="loan-header">
                  <div className="feature-icon">
                    <i className={getLenderTypeIcon(loan.lender_type)}></i>
                  </div>
                  <div className="loan-info">
                    <h3>${loan.amount.toLocaleString()}</h3>
                    <span className={`lender-badge ${loan.lender_type}`}>
                      {getLenderTypeBadge(loan.lender_type)}
                    </span>
                  </div>
                </div>
                <p><i className="fas fa-user"></i> Lender: {loan.lender_name}</p>
                <p><i className="fas fa-percentage"></i> Interest Rate: {loan.interest_rate}%</p>
                <p><i className="fas fa-calendar"></i> Term: {loan.term_months} months</p>
                <p><i className="fas fa-info-circle"></i> Purpose: {loan.purpose}</p>
                {user && (
                  <button className="cta-btn" onClick={() => router.push(`/apply/${loan.id}`)}>
                    <i className="fas fa-hand-paper"></i> Apply Now
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}