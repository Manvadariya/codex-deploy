@echo off
cd CodeX
python manage.py migrate
python manage.py runserver
