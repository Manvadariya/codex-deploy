"""
Script to manually check database connection and structure
"""
import os
import django
import sys
import traceback

# Set up Django
sys.path.append(".")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "CodeX.settings")
django.setup()

def check_db():
    print("\n--- DATABASE CONNECTION CHECK ---\n")
    
    # Import models
    from django.db import connection
    from django.conf import settings
    
    # Print database settings
    print(f"DATABASE SETTINGS:")
    print(f"  ENGINE: {settings.DATABASES['default']['ENGINE']}")
    print(f"  NAME: {settings.DATABASES['default']['NAME']}")
    
    # Check connection
    print("\nTesting database connection...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            print(f"  Connection test result: {result}")
    except Exception as e:
        print(f"  Connection ERROR: {str(e)}")
        print(traceback.format_exc())
    
    # List tables
    print("\nListing all tables in database...")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"  Tables found: {len(tables)}")
            for table in tables:
                print(f"    - {table}")
    except Exception as e:
        print(f"  Table listing ERROR: {str(e)}")
        print(traceback.format_exc())
    
    # Check specific important tables
    important_tables = ['auth_user', 'django_site', 'django_migrations']
    print("\nChecking important tables...")
    for table in important_tables:
        try:
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"  {table}: {count} rows")
        except Exception as e:
            print(f"  {table}: ERROR - {str(e)}")
    
    print("\n--- END DATABASE CHECK ---\n")

if __name__ == "__main__":
    check_db()
