"""
Migration script to add 'payed' status to order_status enum

This script adds the new 'payed' status to the existing order_status enum type in PostgreSQL.
Run this migration after deploying the new code that includes the 'payed' status.

Usage:
    python migrate_add_payed_status.py
"""

import psycopg2
import os

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5433'),
    'database': os.getenv('DB_NAME', 'byteristo_orders'),
    'user': os.getenv('DB_USER', 'byteristo'),
    'password': os.getenv('DB_PASSWORD', 'byteristo123')
}


def migrate():
    """Add 'payed' status to order_status enum"""
    conn = None
    cursor = None
    
    try:
        # Connect to the database
        print(f"Connecting to database {DB_CONFIG['database']}...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("Checking if 'payed' status already exists...")
        
        # Check if the enum value already exists
        cursor.execute("""
            SELECT EXISTS (
                SELECT 1 
                FROM pg_enum 
                WHERE enumlabel = 'payed' 
                AND enumtypid = (
                    SELECT oid 
                    FROM pg_type 
                    WHERE typname = 'order_status'
                )
            );
        """)
        
        exists = cursor.fetchone()[0]
        
        if exists:
            print("✓ 'payed' status already exists in the database. No migration needed.")
            return
        
        print("Adding 'payed' status to order_status enum...")
        
        # Add the new enum value
        # In PostgreSQL, we need to use ALTER TYPE ... ADD VALUE
        cursor.execute("""
            ALTER TYPE order_status ADD VALUE 'payed' AFTER 'delivered';
        """)
        
        conn.commit()
        print("✓ Migration completed successfully!")
        print("  - Added 'payed' status to order_status enum")
        
    except psycopg2.Error as e:
        print(f"✗ Database error: {e}")
        if conn:
            conn.rollback()
        raise
    
    except Exception as e:
        print(f"✗ Error: {e}")
        if conn:
            conn.rollback()
        raise
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        print("Database connection closed.")


def verify_migration():
    """Verify that the migration was successful"""
    conn = None
    cursor = None
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("\nVerifying migration...")
        
        # Get all enum values for order_status
        cursor.execute("""
            SELECT e.enumlabel
            FROM pg_enum e
            JOIN pg_type t ON e.enumtypid = t.oid
            WHERE t.typname = 'order_status'
            ORDER BY e.enumsortorder;
        """)
        
        statuses = [row[0] for row in cursor.fetchall()]
        print(f"Current order_status values: {', '.join(statuses)}")
        
        if 'payed' in statuses:
            print("✓ Verification successful: 'payed' status is present")
        else:
            print("✗ Verification failed: 'payed' status not found")
        
    except Exception as e:
        print(f"✗ Verification error: {e}")
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == '__main__':
    print("=" * 60)
    print("Order Status Migration: Adding 'payed' status")
    print("=" * 60)
    
    try:
        migrate()
        verify_migration()
        print("\n✓ Migration process completed!")
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        exit(1)
