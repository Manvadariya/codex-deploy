#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run migrations
python CodeX/manage.py makemigrations
python CodeX/manage.py migrate

# Collect static files
python CodeX/manage.py collectstatic --no-input --clear

# Run database initialization script
bash CodeX/init_db.sh

# The init_db.sh script will handle initial table creation and migrations
echo "Build process complete. Database initialization and migrations will be handled by init_db.sh before server start."
