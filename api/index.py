"""Vercel WSGI wrapper for the Flask app.

This file exposes a `handler(request)` function which Vercel's Python runtime
will call. It forwards the incoming request to the Flask WSGI `application`.

Notes:
- This wrapper uses `vercel-wsgi` to adapt WSGI apps to Vercel requests.
- Install `vercel-wsgi` in the project dependencies (it's added to root requirements.txt).
- Heavy packages (pandas, scikit-learn) may increase slug size and cold-start time.
"""

from vercel_wsgi import handle_request

# Import the Flask app from the backend package
from backend.app import app as application


def handler(request):
    """Entry point for Vercel. Delegates handling to vercel-wsgi's adapter."""
    return handle_request(application, request)
