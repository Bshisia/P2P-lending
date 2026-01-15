import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Dashboard() {
  const [myLoans, setMyLoans] = useState([]);
  const [applications, setApplications] = useState([]);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get user info
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.user) setUser(data.user);
    });

    // Get my loans (as lender)
    fetch('/api/loans/my-loans', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setMyLoans(data.loans || []));

    // Get my applications (as borrower)
    fetch('/api/loans/my-applications', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setApplications(data.applications || []));
  }, []);

  const handleApproveApplication = async (applicationId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/loans/approve/${applicationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to approve application');
    }
  };

  if (!user) return <div>Loading...</div>;

  const totalLent = myLoans.reduce((sum, loan) => sum + loan.amount, 0);
  const activeLoanCount = myLoans.filter(loan => loan.status === 'available').length;
  const fundedLoanCount = myLoans.filter(loan => loan.status === 'funded').length;
  const pendingApplications = applications.filter(app => app.status === 'pending').length;

  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>
      <header>
        <nav className="container">
          <div className="logo">LendConnect</div>
          <div className="header">
            <span>Dashboard - {user.name}</span>
            <button className="secondary-btn" onClick={() => router.push('/')}>
              <i className="fas fa-home"></i> Home
            </button>
          </div>
        </nav>
      </header>

      <div className="main-content">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>{myLoans.length}</h3>
            <p><i className="fas fa-handshake"></i> Total Offers</p>
          </div>
          <div className="stat-item">
            <h3>${totalLent.toLocaleString()}</h3>
            <p><i className="fas fa-dollar-sign"></i> Total Lent</p>
          </div>
          <div className="stat-item">
            <h3>{fundedLoanCount}</h3>
            <p><i className="fas fa-check-circle"></i> Funded</p>
          </div>
          <div className="stat-item">
            <h3>{pendingApplications}</h3>
            <p><i className="fas fa-clock"></i> Pending Apps</p>
          </div>
        </div>

        <div className="actions">
          <button className="cta-btn" onClick={() => router.push('/create-loan')}>
            <i className="fas fa-plus"></i> Create New Loan
          </button>
        </div>
        
        <div className="section">
          <h2><i className="fas fa-briefcase"></i> My Loan Offers</h2>
          {myLoans.length === 0 ? (
            <div className="loan-card">
              <div className="feature-icon">
                <i className="fas fa-info-circle"></i>
              </div>
              <h3>No loan offers yet</h3>
              <p>Create your first loan offer to start lending!</p>
            </div>
          ) : (
            myLoans.map(loan => (
              <div key={loan.id} className="loan-card">
                <div className="loan-header">
                  <div className="feature-icon">
                    <i className="fas fa-dollar-sign"></i>
                  </div>
                  <div className="loan-info">
                    <h3>${loan.amount.toLocaleString()}</h3>
                    <span className={`status ${loan.status}`}>
                      <i className={`fas ${loan.status === 'available' ? 'fa-clock' : loan.status === 'funded' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                      {loan.status}
                    </span>
                  </div>
                </div>
                <p><i className="fas fa-percentage"></i> {loan.interest_rate}% | <i className="fas fa-calendar"></i> {loan.term_months} months</p>
                <p><i className="fas fa-info-circle"></i> {loan.purpose}</p>
                
                {loan.applications && loan.applications.length > 0 && (
                  <div className="applications">
                    <h4><i className="fas fa-users"></i> Applications ({loan.applications.length})</h4>
                    {loan.applications.map(app => (
                      <div key={app.id} className="application">
                        <div className="app-header">
                          <strong>{app.borrower_name}</strong>
                          <span className={`status ${app.status}`}>{app.status}</span>
                        </div>
                        <p>"{app.message}"</p>
                        {app.status === 'pending' && (
                          <button className="cta-btn" onClick={() => handleApproveApplication(app.id)}>
                            <i className="fas fa-check"></i> Approve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="section">
          <h2><i className="fas fa-file-alt"></i> My Applications</h2>
          {applications.length === 0 ? (
            <div className="application-card">
              <div className="feature-icon">
                <i className="fas fa-info-circle"></i>
              </div>
              <h3>No applications submitted</h3>
              <p>Browse available loans to apply!</p>
            </div>
          ) : (
            applications.map(app => (
              <div key={app.id} className="application-card">
                <div className="loan-header">
                  <div className="feature-icon">
                    <i className="fas fa-hand-paper"></i>
                  </div>
                  <div className="loan-info">
                    <h3>${app.loan_amount.toLocaleString()}</h3>
                    <span className={`status ${app.status}`}>
                      <i className={`fas ${app.status === 'pending' ? 'fa-clock' : app.status === 'approved' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                      {app.status}
                    </span>
                  </div>
                </div>
                <p><i className="fas fa-percentage"></i> {app.interest_rate}% | <i className="fas fa-calendar"></i> {app.term_months} months</p>
                <p><i className="fas fa-user"></i> Lender: {app.lender_name}</p>
                <p><i className="fas fa-comment"></i> Your message: "{app.message}"</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}