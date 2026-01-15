import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function ApplyForLoan() {
  const [loan, setLoan] = useState(null);
  const [message, setMessage] = useState('');
  const [requestedAmount, setRequestedAmount] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetch(`/api/loans/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.loan) {
            setLoan(data.loan);
            setRequestedAmount(data.loan.amount);
          }
        });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const amount = parseFloat(requestedAmount);
    if (amount > loan.amount) {
      setError('Requested amount cannot exceed the loan offer amount');
      return;
    }

    if (amount < 100) {
      setError('Minimum loan amount is $100');
      return;
    }

    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          loan_id: parseInt(id),
          message,
          requested_amount: amount
        })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to submit application');
    }
  };

  if (!loan) return <div>Loading...</div>;

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

      <div className="main-content">
        <div className="feature-icon">
          <i className="fas fa-hand-paper"></i>
        </div>
        <h1>Apply for Loan</h1>
        
        <div className="loan-details">
          <h2>Loan Details</h2>
          <p><strong><i className="fas fa-dollar-sign"></i> Available Amount:</strong> ${loan.amount.toLocaleString()}</p>
          <p><strong><i className="fas fa-percentage"></i> Interest Rate:</strong> {loan.interest_rate}%</p>
          <p><strong><i className="fas fa-calendar"></i> Term:</strong> {loan.term_months} months</p>
          <p><strong><i className="fas fa-info-circle"></i> Purpose:</strong> {loan.purpose}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label><i className="fas fa-dollar-sign"></i> Requested Amount ($):</label>
            <input
              type="number"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
              min="100"
              max={loan.amount}
              step="0.01"
              required
            />
            <small>You can request up to ${loan.amount.toLocaleString()}</small>
          </div>
          <div>
            <label><i className="fas fa-comment"></i> Message to lender:</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              placeholder="Explain why you need this loan and how you plan to repay it..."
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="cta-btn">
            <i className="fas fa-paper-plane"></i> Submit Application
          </button>
        </form>
        
        <button className="secondary-btn" onClick={() => router.push('/')}>
          <i className="fas fa-arrow-left"></i> Back to Home
        </button>
      </div>
    </>
  );
}