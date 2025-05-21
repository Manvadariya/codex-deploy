#!/bin/bash

# This script is designed to be run on Render before starting the application
# It ensures the database is properly set up

set -e  # Exit immediately if a command exits with a non-zero status

# Display Python version
echo "Python version:"
python --version

# Display Django version
echo "Django version:"
python -c "import django; print(django.get_version())"

# Display environment variables (excluding secrets)
echo "Environment:"
env | grep -v SECRET | grep -v PASSWORD

# Go to the Django project directory
cd /opt/render/project/src/CodeX

# Make sure migrations are created
echo "Making migrations..."
python manage.py makemigrations --noinput

# Run migrations for core Django apps first
echo "Running migrations for auth app..."
python manage.py migrate auth --noinput
echo "Running migrations for contenttypes app..."
python manage.py migrate contenttypes --noinput
echo "Running migrations for sites app..."
python manage.py migrate sites --noinput

# Run all remaining migrations
echo "Running all remaining migrations..."
python manage.py migrate --noinput

# Create Site object
echo "Setting up Site object..."
python - << EOF
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CodeX.settings')
django.setup()

from django.contrib.sites.models import Site

try:
    site, created = Site.objects.get_or_create(
        id=1,
        defaults={
            'domain': 'codex-j9wc.onrender.com',
            'name': 'CodeX'
        }
    )
    
    if not created:
        site.domain = 'codex-j9wc.onrender.com'
        site.name = 'CodeX'
        site.save()
    
    print(f"Site {'created' if created else 'updated'}: {site.domain}")
except Exception as e:
    print(f"Error setting up site: {str(e)}")
EOF

# Check database tables
echo "Checking database tables..."
python - << EOF
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CodeX.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    if 'postgresql' in connection.vendor:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    else:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    
    tables = [row[0] for row in cursor.fetchall()]
    print(f"Tables in database: {tables}")

    # Check critical tables
    critical_tables = ['auth_user', 'django_site']
    for table in critical_tables:
        if table.lower() in [t.lower() for t in tables]:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table};")
                count = cursor.fetchone()[0]
                print(f"Table {table}: {count} rows")
            except Exception as e:
                print(f"Error checking {table}: {e}")
        else:
            print(f"ERROR: Table {table} is missing!")
EOF

echo "Database setup completed."
