#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations with verbosity for debugging
echo "Running initial migrations..."
python CodeX/manage.py migrate auth --verbosity 3
python CodeX/manage.py migrate sites --verbosity 3
python CodeX/manage.py migrate --verbosity 3

# Verify database structure
echo "Checking database structure..."
cd CodeX
python -c "
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CodeX.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute(\"SELECT name FROM sqlite_master WHERE type='table';\")
    tables = [row[0] for row in cursor.fetchall()]
    print('Tables in database:', tables)
"
cd ..

# Collect static files
python CodeX/manage.py collectstatic --no-input
