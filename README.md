# P2P Lending Platform

A peer-to-peer lending platform built with Next.js where investors can offer loans with specific terms and borrowers can apply for them.

## Features

- **User Authentication**: Register and login system
- **Loan Creation**: Lenders can create loan offers with custom terms (amount, interest rate, duration)
- **Loan Applications**: Borrowers can browse and apply for available loans
- **Dashboard**: Users can manage their loans and applications
- **Loan Approval**: Lenders can approve or reject loan applications

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## How it Works

1. **Lenders** create loan offers specifying:
   - Loan amount
   - Interest rate
   - Term (in months)
   - Purpose/description

2. **Borrowers** can:
   - Browse available loans
   - Apply for loans with a message explaining their need
   - Track application status

3. **Lenders** can:
   - View applications for their loans
   - Approve applications (automatically rejects others for the same loan)
   - Track funded loans

## Database

Uses SQLite with the following tables:
- `users`: User accounts
- `loans`: Loan offers
- `loan_applications`: Applications from borrowers

The database is automatically initialized when the app starts.