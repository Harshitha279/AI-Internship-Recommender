# Backend Deployment on Render

## Steps

1. **Push your latest code to GitHub.**

2. **Create a new Web Service on Render:**
   - Go to https://dashboard.render.com/
   - Click 'New' → 'Web Service'.
   - Connect your GitHub repo.
   - Set Root Directory to `backend`.
   - Set the Start Command to:
     ```sh
     gunicorn app:app
     ```
   - Select Python 3.11+ environment.

3. **Set environment variables in Render:**
   - `DATABASE_URL` (Postgres recommended)
   - `SECRET_KEY`
   - Any other variables your app needs

4. **Dependencies:**
   - Render will install from `backend/requirements.txt` automatically.

5. **Access your backend:**
   - After deploy, your backend will be available at `https://<your-service-name>.onrender.com`
   - Test endpoints like `/api/health`.

6. **Connect frontend:**
   - In your frontend (Vercel), set the API base URL to your Render backend URL.

---

**Note:**
- SQLite is not recommended for production on Render. Use Postgres or another managed DB.
- CORS is already enabled in your Flask app for `/api/*` routes.
- If you need a custom domain, set it up in Render dashboard.
