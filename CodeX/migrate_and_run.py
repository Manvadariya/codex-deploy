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
    # Run migrations
    print("Running database migrations...")
    call_command('migrate')
    
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

if __name__ == "__main__":
    main()
