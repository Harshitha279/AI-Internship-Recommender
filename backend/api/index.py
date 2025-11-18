"""Vercel WSGI wrapper placed inside `backend/` so you can deploy the backend folder as a standalone project.

This handler imports the Flask `app` from `backend/app.py` (module `app` when the backend
folder is used as the project root) and delegates request handling to `vercel-wsgi`.
"""
from vercel_wsgi import handle_request
from app import app as application


def handler(request):
    return handle_request(application, request)
