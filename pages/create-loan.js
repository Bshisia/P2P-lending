import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function CreateLoan() {
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [termMonths, setTermMonths] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/loans/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          interest_rate: parseFloat(interestRate),
          term_months: parseInt(termMonths),
          purpose
        })
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/dashboard');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to create loan');
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

      <div className="main-content">
        <div className="feature-icon">
          <i className="fas fa-plus-circle"></i>
        </div>
        <h1>Create Loan Offer</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label><i className="fas fa-dollar-sign"></i> Loan Amount ($):</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              step="0.01"
              required
            />
          </div>
          <div>
            <label><i className="fas fa-percentage"></i> Interest Rate (%):</label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              min="0.1"
              step="0.1"
              required
            />
          </div>
          <div>
            <label><i className="fas fa-calendar"></i> Term (months):</label>
            <input
              type="number"
              value={termMonths}
              onChange={(e) => setTermMonths(e.target.value)}
              min="1"
              max="60"
              required
            />
          </div>
          <div>
            <label><i className="fas fa-info-circle"></i> Purpose/Description:</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows="3"
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="cta-btn">
            <i className="fas fa-plus"></i> Create Loan Offer
          </button>
        </form>
        <button className="secondary-btn" onClick={() => router.push('/')}>
          <i className="fas fa-arrow-left"></i> Back to Home
        </button>
      </div>
    </>
  );
}