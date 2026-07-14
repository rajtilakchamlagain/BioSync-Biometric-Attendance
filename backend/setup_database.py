"""
BioSync Database Setup Script
This script creates the MySQL database and tables needed for the BioSync system.

Usage:
    python setup_database.py
"""

import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "")
DB_NAME = os.getenv("DB_NAME", "biosync")

def create_database():
    """Create the BioSync database and attendance table"""
    try:
        # Connect to MySQL server
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASS
        )
        cursor = conn.cursor()
        
        # Create database if it doesn't exist
        print(f"Creating database '{DB_NAME}'...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"[OK] Database '{DB_NAME}' ready")
        
        # Use the database
        cursor.execute(f"USE {DB_NAME}")
        
        # Create attendance table
        print("Creating 'attendance' table...")
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(255) NOT NULL,
            scan_date DATE NOT NULL,
            scan_time TIME NOT NULL,
            status ENUM('IN', 'OUT') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        cursor.execute(create_table_sql)
        print("[OK] 'attendance' table ready")
        
        # Create users table (optional - for future use)
        print("Creating 'users' table...")
        create_users_sql = """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            face_image_path VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        cursor.execute(create_users_sql)
        print("[OK] 'users' table ready")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print("\n[SUCCESS] Database setup completed successfully!")
        
    except Error as e:
        print(f"\nDatabase Error: {e}")
        print("\nTroubleshooting:")
        print("  1. Make sure MySQL server is running")
        print("  2. Check DB_USER and DB_PASS in .env file")
        print("  3. Verify DB_HOST is correct")
        return False
    
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("BioSync Database Setup")
    print("=" * 60)
    print(f"\nConnecting to MySQL:")
    print(f"  Host: {DB_HOST}")
    print(f"  User: {DB_USER}")
    print(f"  Database: {DB_NAME}\n")
    
    if create_database():
        print("\nAll systems ready. You can now run main2.py!")
    else:
        print("\nSetup failed. Please check your configuration.")
