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

  const { loan_id, message, requested_amount } = req.body;

  if (!loan_id || !requested_amount) {
    return res.status(400).json({ message: 'Loan ID and requested amount are required' });
  }

  // Check if loan exists and is available
  db.get('SELECT * FROM loans WHERE id = ? AND status = "available"', [loan_id], (err, loan) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found or not available' });
    }

    if (loan.lender_id === decoded.userId) {
      return res.status(400).json({ message: 'Cannot apply for your own loan' });
    }

    if (requested_amount > loan.amount) {
      return res.status(400).json({ message: 'Requested amount exceeds loan offer' });
    }

    if (requested_amount < 100) {
      return res.status(400).json({ message: 'Minimum loan amount is $100' });
    }

    // Check if already applied
    db.get('SELECT id FROM loan_applications WHERE loan_id = ? AND borrower_id = ?', 
      [loan_id, decoded.userId], (err, existing) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (existing) {
          return res.status(400).json({ message: 'Already applied for this loan' });
        }

        // Create application
        db.run(
          'INSERT INTO loan_applications (loan_id, borrower_id, message, requested_amount) VALUES (?, ?, ?, ?)',
          [loan_id, decoded.userId, message || '', requested_amount],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Failed to submit application' });
            }

            return res.status(201).json({
              message: 'Application submitted successfully',
              application_id: this.lastID
            });
          }
        );
      });
  });
}