import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "attendance.db")

def setup_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            token TEXT PRIMARY KEY,
            name TEXT NOT NULL
        )
    """)
    
    # Create Daily Logs table
    # This table stores one row per user per day.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT NOT NULL,
            scan_date TEXT NOT NULL,
            in_time TEXT,
            out_time TEXT,
            in_status TEXT,
            out_status TEXT,
            duration_status TEXT,
            FOREIGN KEY(token) REFERENCES users(token),
            UNIQUE(token, scan_date)
        )
    """)
    
    # Insert mock user if it doesn't exist
    cursor.execute("INSERT OR IGNORE INTO users (token, name) VALUES (?, ?)", 
                   ("USR-RAJTILAK-998877", "Rajtilak"))
    
    conn.commit()
    conn.close()
    print(f"Database setup successfully at {DB_PATH}")

if __name__ == "__main__":
    setup_database()
