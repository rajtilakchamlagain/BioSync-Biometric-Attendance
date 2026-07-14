# BioSync Setup Guide

## Fixed Issues

### ✓ ERROR 1: Invalid QR Color Code (FIXED)
- **File**: `backend/test_qr.ipynb`
- **Change**: `fill_color="blacK"` → `fill_color="black"`
- **Status**: Fixed

### ✓ ERROR 2: Empty/Corrupted Notebook (FIXED)
- **File**: `backend/generate_qr.ipynb`
- **Change**: Recreated with proper QR code generation code
- **Status**: Fixed

### ✓ ERROR 3: Placeholder MySQL Password (FIXED)
- **File**: `backend/main2.py`
- **Change**: Now uses environment variables from `.env` file
- **Files Created**:
  - `.env.example` - Template showing required variables
  - `setup_database.py` - Script to initialize MySQL database

---

## Setup Instructions

### Step 1: Create Your .env File

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_actual_mysql_password
   DB_NAME=biosync
   ```

**⚠️ IMPORTANT**: Never commit `.env` to version control (it's in `.gitignore`)

### Step 2: Create the Database

1. Make sure MySQL is running
2. Run the database setup script:
   ```bash
   cd backend
   python setup_database.py
   ```

3. If successful, you'll see:
   ```
   ✓ Database 'biosync' ready
   ✓ 'attendance' table ready
   ✓ 'users' table ready
   ✓ Database setup completed successfully!
   ```

### Step 3: Run Your Application

Now you can run `main2.py` which will:
- Load your database credentials from `.env`
- Connect to MySQL successfully
- Handle QR code verification and attendance logging

---

## Files Changed

| File | Change |
|------|--------|
| `backend/test_qr.ipynb` | Fixed color typo: "blacK" → "black" |
| `backend/generate_qr.ipynb` | Recreated with proper kernel and code |
| `backend/main2.py` | Now uses environment variables (python-dotenv) |
| `.env.example` | Created - template for credentials |
| `backend/setup_database.py` | Created - database initialization script |
| `.gitignore` | Created - protects `.env` from being committed |

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'dotenv'"
This shouldn't happen - `python-dotenv` is already installed in your venv.

### "Can't connect to MySQL server"
1. Is MySQL running? Start it:
   - **Windows**: Services → MySQL → Start
   - **Mac/Linux**: `mysql.server start`

2. Check credentials in `.env` file

3. Try connecting manually:
   ```bash
   mysql -h localhost -u root -p
   ```

### "Access denied for user 'root'@'localhost'"
Your MySQL password in `.env` doesn't match the actual password.
Reset it or update `.env` with the correct password.

---

## All Errors Are Now Fixed! ✓

Your program should now work correctly. Just:
1. Fill in `.env` with your MySQL password
2. Run `backend/setup_database.py`
3. Run `main2.py`
