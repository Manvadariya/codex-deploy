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
        
        # Check database engine type
        from django.conf import settings
        db_engine = settings.DATABASES['default']['ENGINE']
        print(f"Using database engine: {db_engine}")
        
        # First, check if the migration history table exists
        from django.db import connection
        with connection.cursor() as cursor:
            if 'sqlite' in db_engine:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [row[0] for row in cursor.fetchall()]
            elif 'postgresql' in db_engine:
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """)
                tables = [row[0] for row in cursor.fetchall()]
            else:
                tables = ['Unknown database engine']
            
            print(f"Existing tables before migration: {tables}")
        
        # Make sure we explicitly run migrations for critical apps in order
        critical_apps = ['auth', 'admin', 'contenttypes', 'sessions', 'sites', 'socialaccount', 'core']
        for app in critical_apps:
            print(f"Running migrations for {app}...")
            try:
                call_command('migrate', app, verbosity=3)
            except Exception as e:
                print(f"Error migrating {app}: {str(e)}")
        
        # Then migrate any remaining apps
        print("Running remaining migrations...")
        call_command('migrate', verbosity=3)
        
        # Verify critical tables exist after migration
        critical_tables = ['auth_user', 'django_site', 'socialaccount_socialapp']
        missing_tables = []
        
        with connection.cursor() as cursor:
            for table in critical_tables:
                try:
                    if 'sqlite' in db_engine:
                        cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    elif 'postgresql' in db_engine:
                        cursor.execute(f"SELECT COUNT(*) FROM \"{table}\"")
                    
                    count = cursor.fetchone()[0]
                    print(f"Table {table}: {count} rows")
                except Exception as e:
                    print(f"Error checking table {table}: {str(e)}")
                    missing_tables.append(table)
        
        if missing_tables:
            print(f"WARNING: The following tables are still missing: {missing_tables}")
        else:
            print("All critical tables exist!")
        
        # Create the Site entry manually to ensure it exists
        print("Setting up Site entry...")
        from django.db import transaction
        
        with transaction.atomic():
            # Try two different methods to create the site
            try:
                # Method 1: Use get_or_create
                site, created = Site.objects.get_or_create(
                    id=1,
                    defaults={
                        'domain': "codex-j9wc.onrender.com",
                        'name': "CodeX"
                    }
                )
                if created:
                    print(f"Created new site: {site.domain}")
                else:
                    site.domain = "codex-j9wc.onrender.com"
                    site.name = "CodeX"
                    site.save()
                    print(f"Updated existing site: {site.domain}")
            except Exception as e:
                print(f"Method 1 failed: {str(e)}")
                
                try:
                    # Method 2: Direct SQL insertion
                    with connection.cursor() as cursor:
                        if 'sqlite' in db_engine:
                            cursor.execute("""
                                INSERT OR REPLACE INTO django_site (id, domain, name)
                                VALUES (1, 'codex-j9wc.onrender.com', 'CodeX')
                            """)
                        elif 'postgresql' in db_engine:
                            cursor.execute("""
                                INSERT INTO django_site (id, domain, name)
                                VALUES (1, 'codex-j9wc.onrender.com', 'CodeX')
                                ON CONFLICT (id) DO UPDATE
                                SET domain = 'codex-j9wc.onrender.com', name = 'CodeX'
                            """)
                    print("Created/updated site using direct SQL")
                except Exception as e2:
                    print(f"Method 2 also failed: {str(e2)}")
                    # At this point both methods failed, but we continue
        
        print("Setup complete!")
    except Exception as e:
        import traceback
        print(f"ERROR during migration: {str(e)}")
        print(traceback.format_exc())
        # Re-raise to make sure the error is visible
        raise

if __name__ == "__main__":
    main()
