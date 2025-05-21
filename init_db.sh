#!/bin/bash
# init_db.sh - Direct database initialization script for Render

set -e  # Exit immediately if a command exits with a non-zero status

echo "=== DATABASE INITIALIZATION SCRIPT (init_db.sh) STARTING ==="

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set."
  exit 1
fi

echo "DATABASE_URL: $DATABASE_URL" # Log the DATABASE_URL to verify it's being picked up

DB_TYPE=""
SQLITE_FILE=""

if [[ $DATABASE_URL == sqlite* ]]; then
  echo "Using SQLite database"
  DB_TYPE="sqlite"
  SQLITE_FILE="${DATABASE_URL#sqlite:///}"
  # Ensure the directory for the SQLite file exists if it's not in the root
  SQLITE_DIR=$(dirname "$SQLITE_FILE")
  if [ "$SQLITE_DIR" != "." ] && [ ! -d "$SQLITE_DIR" ]; then
    mkdir -p "$SQLITE_DIR"
    echo "Created directory for SQLite database: $SQLITE_DIR"
  fi
  echo "SQLite database file: $SQLITE_FILE"
elif [[ $DATABASE_URL == postgres* ]] || [[ $DATABASE_URL == postgresql* ]]; then
  echo "Using PostgreSQL database"
  DB_TYPE="postgres"
  # Connection details will be used by psql via DATABASE_URL
else
  echo "Unknown or unsupported database URL format: $DATABASE_URL"
  exit 1
fi

# Create essential tables directly if they don't exist
# This section is primarily for SQLite or as a fallback.
# For PostgreSQL, Django migrations should handle this if the DB user has permissions.

if [[ $DB_TYPE == "sqlite" ]]; then
  echo "Attempting to create essential tables in SQLite (if they don't exist)..."
  
  # Ensure the SQLite file exists before trying to run commands against it
  touch "$SQLITE_FILE" 

  sqlite3 "$SQLITE_FILE" <<EOF
  CREATE TABLE IF NOT EXISTS django_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS django_content_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    UNIQUE (app_label, model)
  );

  CREATE TABLE IF NOT EXISTS auth_permission (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type_id INTEGER NOT NULL REFERENCES django_content_type (id) DEFERRABLE INITIALLY DEFERRED,
    codename VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE (content_type_id, codename)
  );
  
  CREATE TABLE IF NOT EXISTS auth_group (
    id integer NOT NULL PRIMARY KEY AUTOINCREMENT,
    name varchar(150) NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS auth_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password VARCHAR(128) NOT NULL,
    last_login DATETIME NULL,
    is_superuser BOOLEAN NOT NULL,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    is_staff BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL,
    date_joined DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS django_site (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL
  );
EOF
  echo "SQLite table creation/check complete."

elif [[ $DB_TYPE == "postgres" ]]; then
  echo "For PostgreSQL, table creation is expected to be handled by Django migrations."
  # Optionally, you could add psql commands here to create tables if migrations fail,
  # but it's generally better to let Django manage the schema.
  # Example:
  # echo "Verifying PostgreSQL connection..."
  # PGPASSWORD=${DATABASE_URL##*:} psql -h ${DATABASE_URL%%:*} -U ${DATABASE_URL##*@} -d ${DATABASE_URL##*/} -c "\\dt"
  # The above is complex due to DATABASE_URL parsing, prefer direct psql if needed and parse components.
fi

echo "Changing directory to /opt/render/project/src/CodeX for manage.py"
cd /opt/render/project/src/CodeX

# It's crucial that DATABASE_URL is correctly interpreted by Django/dj_database_url
echo "Running Django makemigrations for core app (and others if needed)..."
python manage.py makemigrations core || echo "Makemigrations for core failed or no changes."
python manage.py makemigrations || echo "Makemigrations for other apps failed or no changes."


echo "Running Django migrate..."
# Run migrations for specific apps first if there are dependencies
python manage.py migrate contenttypes --noinput
python manage.py migrate auth --noinput
python manage.py migrate sites --noinput 
# Then run all other migrations
python manage.py migrate --noinput

echo "Running post-migration checks and Site object creation..."
python - <<EOF
import os
import django
from django.conf import settings
from django.db import connection, utils

print(f"Attempting to set up Django with DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
if not os.environ.get('DJANGO_SETTINGS_MODULE'):
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CodeX.settings')

try:
    django.setup()
    print("Django setup successful.")
except Exception as e:
    print(f"Error during Django setup: {e}")
    # Attempt to load settings to see if DATABASES is configured
    try:
        from CodeX import settings as app_settings
        print(f"DATABASES configured in settings: {hasattr(app_settings, 'DATABASES')}")
        if hasattr(app_settings, 'DATABASES'):
            print(f"Default DB Engine: {app_settings.DATABASES['default']['ENGINE']}")
    except Exception as se:
        print(f"Could not load settings directly: {se}")
    exit(1)

print(f"Using database: {settings.DATABASES['default']['ENGINE']}")
if 'sqlite' in settings.DATABASES['default']['ENGINE']:
    print(f"SQLite DB Name: {settings.DATABASES['default']['NAME']}")

print("Checking essential tables post-migration...")
tables_to_check = ['auth_user', 'django_site', 'django_content_type', 'auth_permission', 'socialaccount_socialaccount', 'socialaccount_socialapp']
with connection.cursor() as cursor:
    for table_name in tables_to_check:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}") # Standard SQL, should work for both
            count = cursor.fetchone()[0]
            print(f"Table '{table_name}': {count} rows")
        except utils.ProgrammingError:
            print(f"Table '{table_name}' does not exist or query failed.")
        except Exception as e:
            print(f"Error checking table '{table_name}': {str(e)}")

print("Ensuring Site entry (ID=1) exists or is created...")
from django.contrib.sites.models import Site
from django.conf import settings

site_id = getattr(settings, 'SITE_ID', 1)
render_domain = os.environ.get('RENDER_EXTERNAL_HOSTNAME', f'codex-{os.environ.get("RENDER_SERVICE_ID", "xxxx")}.onrender.com')

try:
    site, created = Site.objects.get_or_create(
        id=site_id,
        defaults={'domain': render_domain, 'name': 'CodeX'}
    )
    if not created and site.domain != render_domain:
        print(f"Site ID {site_id} exists, updating domain from {site.domain} to {render_domain}")
        site.domain = render_domain
        site.name = 'CodeX' # Ensure name is also set/updated
        site.save()
        print(f"Site domain updated to: {site.domain}")
    else:
        print(f"Site {'created' if created else 'already exists and is current'}: ID={site.id}, Domain={site.domain}, Name={site.name}")

except Exception as e:
    print(f"Error ensuring Site object: {str(e)}")
    # If Site table doesn't exist, this will fail. The check above should indicate this.

# For allauth, ensure the Google provider has the correct site
if 'allauth.socialaccount' in settings.INSTALLED_APPS:
    print("Checking/Updating SocialApp for Google provider...")
    from allauth.socialaccount.models import SocialApp
    try:
        google_provider_app = SocialApp.objects.filter(provider='google').first()
        if google_provider_app:
            if site not in google_provider_app.sites.all():
                google_provider_app.sites.add(site)
                print(f"Added site '{site.domain}' to Google SocialApp.")
            else:
                print(f"Site '{site.domain}' already associated with Google SocialApp.")
        else:
            print("Google SocialApp not found. Please configure it in Django Admin if using Google OAuth.")
            # Optionally, create it if client_id and secret are available, but admin setup is safer.
            # if settings.SOCIALACCOUNT_PROVIDERS.get('google', {}).get('APP', {}).get('client_id'):
            #     SocialApp.objects.create(
            #         provider='google',
            #         name='Google',
            #         client_id=settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id'],
            #         secret=settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['secret'],
            #     ).sites.add(site)
            #     print("Created Google SocialApp and associated with site.")

    except Exception as e:
        print(f"Error configuring SocialApp for Google: {str(e)}")
        print("This might be due to 'socialaccount_socialapp' or 'socialaccount_socialapp_sites' tables not existing.")

EOF

echo "=== DATABASE INITIALIZATION SCRIPT (init_db.sh) COMPLETED ==="
