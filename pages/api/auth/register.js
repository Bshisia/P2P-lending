const db = require('../../../lib/database');
const { hashPassword, generateToken } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, password, user_type, certificate_number } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  if ((user_type === 'sacco' || user_type === 'chama') && !certificate_number) {
    return res.status(400).json({ message: 'Certificate number is required for SACCOs and CHAMAs' });
  }

  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (row) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      
      db.run(
        'INSERT INTO users (name, email, password, user_type, certificate_number) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, user_type || 'individual', certificate_number || null],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Failed to create user' });
          }

          const token = generateToken(this.lastID);
          return res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: this.lastID, name, email, user_type: user_type || 'individual' }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}