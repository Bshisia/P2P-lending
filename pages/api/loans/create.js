const db = require('../../../lib/database');
const { verifyToken } = require('../../../lib/auth');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  const { amount, interest_rate, term_months, purpose } = req.body;

  if (!amount || !interest_rate || !term_months) {
    return res.status(400).json({ message: 'Amount, interest rate, and term are required' });
  }

  db.run(
    'INSERT INTO loans (lender_id, amount, interest_rate, term_months, purpose) VALUES (?, ?, ?, ?, ?)',
    [decoded.userId, amount, interest_rate, term_months, purpose || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Failed to create loan' });
      }

      res.status(201).json({
        message: 'Loan created successfully',
        loan_id: this.lastID
      });
    }
  );
}