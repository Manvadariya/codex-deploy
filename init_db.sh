#!/bin/bash
# init_db.sh - Direct database initialization script for Render

set -e  # Exit immediately if a command exits with a non-zero status

echo "=== DATABASE INITIALIZATION SCRIPT ==="

# Determine database type and configure connection
DB_URL="${DATABASE_URL}"
if [[ $DB_URL == sqlite* ]]; then
  echo "Using SQLite database"
  DB_TYPE="sqlite"
  SQLITE_FILE="${DB_URL#sqlite:///}"
  echo "Database file: $SQLITE_FILE"
elif [[ $DB_URL == postgres* ]]; then
  echo "Using PostgreSQL database"
  DB_TYPE="postgres"
  # Extract connection details from DATABASE_URL
  DB_HOST=$(echo $DATABASE_URL | cut -d@ -f2 | cut -d/ -f1 | cut -d: -f1)
  DB_PORT=$(echo $DATABASE_URL | cut -d@ -f2 | cut -d/ -f1 | cut -d: -f2)
  DB_NAME=$(echo $DATABASE_URL | cut -d/ -f4 | cut -d? -f1)
  DB_USER=$(echo $DATABASE_URL | cut -d: -f2 | cut -d@ -f1 | cut -d/ -f3)
  DB_PASS=$(echo $DATABASE_URL | cut -d: -f3 | cut -d@ -f1)
  echo "Database details: Host=$DB_HOST, Port=$DB_PORT, Name=$DB_NAME, User=$DB_USER"
else
  echo "Unknown database URL format: $DB_URL"
  exit 1
fi

# Create essential tables directly if they don't exist
if [[ $DB_TYPE == "sqlite" ]]; then
  echo "Creating essential tables in SQLite..."
  
  sqlite3 "$SQLITE_FILE" <<EOF
  -- Check if auth_user exists
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

  -- Check if django_site exists
  CREATE TABLE IF NOT EXISTS django_site (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL
  );
  
  -- Insert default site if not exists
  INSERT OR IGNORE INTO django_site (id, domain, name) 
  VALUES (1, 'codex-j9wc.onrender.com', 'CodeX');
  
  -- Check if django_content_type exists
  CREATE TABLE IF NOT EXISTS django_content_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    UNIQUE (app_label, model)
  );
  
  -- Check if auth_permission exists
  CREATE TABLE IF NOT EXISTS auth_permission (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_type_id INTEGER NOT NULL REFERENCES django_content_type (id),
    codename VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE (content_type_id, codename)
  );

  -- Check if django_migrations exists
  CREATE TABLE IF NOT EXISTS django_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied DATETIME NOT NULL
  );
EOF

elif [[ $DB_TYPE == "postgres" ]]; then
  echo "Creating essential tables in PostgreSQL..."
  
  # Create temporary SQL file
  TMP_SQL=$(mktemp)
  cat > "$TMP_SQL" <<EOF
  -- Check if auth_user exists
  CREATE TABLE IF NOT EXISTS auth_user (
    id SERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE NULL,
    is_superuser BOOLEAN NOT NULL,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    email VARCHAR(254) NOT NULL,
    is_staff BOOLEAN NOT NULL,
    is_active BOOLEAN NOT NULL,
    date_joined TIMESTAMP WITH TIME ZONE NOT NULL
  );

  -- Check if django_site exists
  CREATE TABLE IF NOT EXISTS django_site (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(100) NOT NULL,
    name VARCHAR(50) NOT NULL
  );
  
  -- Insert default site if not exists
  INSERT INTO django_site (id, domain, name) 
  VALUES (1, 'codex-j9wc.onrender.com', 'CodeX')
  ON CONFLICT (id) DO UPDATE 
  SET domain = 'codex-j9wc.onrender.com', name = 'CodeX';
  
  -- Check if django_content_type exists
  CREATE TABLE IF NOT EXISTS django_content_type (
    id SERIAL PRIMARY KEY,
    app_label VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    UNIQUE (app_label, model)
  );
  
  -- Check if auth_permission exists
  CREATE TABLE IF NOT EXISTS auth_permission (
    id SERIAL PRIMARY KEY,
    content_type_id INTEGER NOT NULL REFERENCES django_content_type (id),
    codename VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE (content_type_id, codename)
  );

  -- Check if django_migrations exists
  CREATE TABLE IF NOT EXISTS django_migrations (
    id SERIAL PRIMARY KEY,
    app VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    applied TIMESTAMP WITH TIME ZONE NOT NULL
  );
EOF

  # Run SQL commands
  export PGPASSWORD="$DB_PASS"
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$TMP_SQL"
  
  # Clean up
  rm "$TMP_SQL"
fi

echo "Tables created directly. Now running Django migrations..."
cd /opt/render/project/src/CodeX
python manage.py migrate auth --noinput || echo "Warning: auth migration failed"
python manage.py migrate contenttypes --noinput || echo "Warning: contenttypes migration failed"
python manage.py migrate sites --noinput || echo "Warning: sites migration failed"
python manage.py migrate allauth --noinput || echo "Warning: allauth migration failed"
python manage.py migrate --noinput || echo "Warning: general migrations failed"

echo "Running post-migration checks..."
python - <<EOF
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CodeX.settings')
django.setup()

from django.db import connection

print("Checking essential tables...")
tables_to_check = ['auth_user', 'django_site', 'socialaccount_socialaccount']
with connection.cursor() as cursor:
    for table in tables_to_check:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM \"{table}\"")
            count = cursor.fetchone()[0]
            print(f"Table {table}: {count} rows")
        except Exception as e:
            print(f"Error checking {table}: {str(e)}")

print("Ensuring Site entry exists...")
from django.contrib.sites.models import Site
try:
    site, created = Site.objects.get_or_create(
        id=1,
        defaults={
            'domain': 'codex-j9wc.onrender.com',
            'name': 'CodeX'
        }
    )
    print(f"Site {'created' if created else 'already exists'}: {site.domain}")
except Exception as e:
    print(f"Error creating site: {str(e)}")
EOF

echo "=== DATABASE INITIALIZATION COMPLETED ==="
