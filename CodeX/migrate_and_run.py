"""
Script to automatically migrate the database and create a site object
"""
import os
import django
import sys

# Set up Django
sys.path.append(".")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "CodeX.settings")
django.setup()

# Import Django models
from django.contrib.sites.models import Site
from django.core.management import call_command

def main():
    try:
        # Run migrations with verbosity for debugging
        print("Running database migrations...")
        
        # First, check if the migration history table exists
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = [row[0] for row in cursor.fetchall()]
            print(f"Existing tables: {tables}")
        
        # Run initial migrations for auth app specifically
        print("Running auth migrations first...")
        call_command('migrate', 'auth', verbosity=3)
        
        # Then migrate the rest
        print("Running all other migrations...")
        call_command('migrate', verbosity=3)
        
        # Verify auth_user table exists after migration
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='auth_user';")
            if cursor.fetchone():
                print("auth_user table exists!")
            else:
                print("WARNING: auth_user table still doesn't exist after migrations!")
        
        # Set up the default site
        try:
            site = Site.objects.get(id=1)
            site.domain = "codex-j9wc.onrender.com"
            site.name = "CodeX"
            site.save()
            print(f"Updated site: {site.domain}")
        except Site.DoesNotExist:
            site = Site.objects.create(
                id=1,
                domain="codex-j9wc.onrender.com",
                name="CodeX"
            )
            print(f"Created new site: {site.domain}")
        
        print("Setup complete!")
    except Exception as e:
        import traceback
        print(f"ERROR during migration: {str(e)}")
        print(traceback.format_exc())
        # Re-raise to make sure the error is visible
        raise

if __name__ == "__main__":
    main()
