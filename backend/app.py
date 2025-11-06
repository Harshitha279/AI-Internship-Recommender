from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from dotenv import load_dotenv
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)

# CORS Configuration
CORS(app,
     resources={r"/api/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///internships.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "my-super-secret-key-12345")
app.config['JWT_SECRET_KEY'] = os.getenv("SECRET_KEY", "my-super-secret-key-12345")
app.config['JWT_ACCESS_TOKEN_EXPRES'] = timedelta(days=1)
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

db = SQLAlchemy(app)
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# ============================================
# DATABASE MODELS
# ============================================

class User(db.Model):
    # ... (User model remains unchanged) ...
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    major = db.Column(db.String(255))
    skills = db.Column(db.Text)
    interests = db.Column(db.Text)
    year = db.Column(db.String(50))
    gpa = db.Column(db.Float, default=3.0)
    location_pref = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    applications = db.relationship('Application', backref='user', lazy=True)
    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    def check_password(self, password):
        if self.password_hash is None: return False
        return bcrypt.check_password_hash(self.password_hash, password)
    def to_dict_safe(self):
        return {'id': self.id, 'name': self.name, 'email': self.email, 'major': self.major, 'skills': self.skills, 'interests': self.interests, 'year': self.year, 'gpa': self.gpa, 'location_pref': self.location_pref, 'created_at': self.created_at.isoformat() if self.created_at else None}


# --- HELPER FUNCTION (CORRECTED SUFFIX REGEX) ---
def clean_db_string(s, field_name):
    """Cleans the messy strings coming from the database."""
    if s is None:
        if field_name == 'description': return ''
        if field_name == 'deadline': return 'Rolling'
        return 'Not specified'

    s = str(s).strip()

    # 1. Check for literal "No description available" (case-insensitive)
    if field_name == 'description' and s.lower() == 'no description available':
        return ''

    # 2. Remove the pandas "dtype" junk (from anywhere in the string)
    s = re.sub(r'Name: \d+,\s*dtype: object', '', s).strip()

    # 3. --- THIS IS THE FIX ---
    # Remove the generic " field_name Not specified" SUFFIX, making field name optional
    # This matches " Not specified" at the END ($), potentially preceded by the field name
    suffix_pattern = rf'(?:\s*{field_name})?\s+Not\s+specified\s*$'
    s = re.sub(suffix_pattern, '', s, flags=re.IGNORECASE).strip()

    # 4. Remove the repetitive "field Not specified" prefix (ONLY at the start) - Keep this as backup
    prefix_pattern = rf'^{field_name}\s+Not\s+specified\s*'
    s = re.sub(prefix_pattern, '', s, flags=re.IGNORECASE).strip()


    # 5. After cleaning, check if it's empty or just "Not specified" (case-insensitive)
    if not s or s.lower() == 'not specified':
        if field_name == 'description': return ''
        if field_name == 'deadline': return 'Rolling'
        # Return empty string for other fields too if they end up empty after cleaning
        return '' if field_name != 'deadline' else 'Not specified' # Avoid returning empty for deadline


    # 6. Remove the field name itself ONLY if it's a prefix
    # (e.g., "location Bangalore" -> "Bangalore")
    prefix_pattern_2 = rf'^{field_name}\s*'
    s = re.sub(prefix_pattern_2, '', s, flags=re.IGNORECASE).strip()

    # 7. Check *again* if it's empty after prefix removal
    if not s:
        if field_name == 'description': return ''
        if field_name == 'deadline': return 'Rolling'
        # Return empty string for other fields too if they end up empty
        return '' if field_name != 'deadline' else 'Not specified'

    return s


class Internship(db.Model):
    # ... (Internship model definition remains mostly unchanged) ...
    __tablename__ = 'internships'
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(255), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    required_skills = db.Column(db.Text)
    location = db.Column(db.String(255))
    duration = db.Column(db.String(100))
    stipend = db.Column(db.String(100))
    deadline = db.Column(db.String(100))
    industry = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    applications = db.relationship('Application', backref='internship', lazy=True)

    # Use the corrected cleaning function
    def to_dict(self):
        return {
            'id': self.id,
            'company': clean_db_string(self.company, 'company'),
            'title': clean_db_string(self.title, 'title'),
            'description': clean_db_string(self.description, 'description'),
            'required_skills': clean_db_string(self.required_skills, 'required_skills'),
            'location': clean_db_string(self.location, 'location'),
            'duration': clean_db_string(self.duration, 'duration'),
            'stipend': clean_db_string(self.stipend, 'stipend'),
            'deadline': clean_db_string(self.deadline, 'deadline'),
            'industry': clean_db_string(self.industry, 'industry'),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Application(db.Model):
    # ... (Application model remains unchanged) ...
    __tablename__ = 'applications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    internship_id = db.Column(db.Integer, db.ForeignKey('internships.id'), nullable=False)
    status = db.Column(db.String(50), default='viewed')
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {'id': self.id, 'user_id': self.user_id, 'internship_id': self.internship_id, 'status': self.status, 'applied_at': self.applied_at.isoformat() if self.applied_at else None}

# ============================================
# RECOMMENDATION ENGINE (IMPROVED)
# ============================================

class RecommendationEngine:
    # Use the corrected cleaning logic via Internship.to_dict()
    def __init__(self):
        self.vectorizer = CountVectorizer(max_features=1000, stop_words='english', ngram_range=(1, 2), min_df=1)
    def safe_str(self, value):
        if value is None: return ""
        return str(value).strip()
    def get_recommendations(self, user_skills, user_interests, user_location, internships, top_n=10):
        try:
            if not internships: return []
            # Use the cleaned to_dict() method directly
            df = pd.DataFrame([i.to_dict() for i in internships])
            df = df[['id', 'company', 'title', 'required_skills', 'location', 'description', 'stipend', 'duration', 'industry']]
            df["combined"] = (df["title"].fillna('') + " " + df["required_skills"].fillna('') + " " + df["description"].fillna('') + " " + df["industry"].fillna(''))
            user_profile = (self.safe_str(user_skills) + " " + self.safe_str(user_interests) + " " + self.safe_str(user_location))
            if user_profile.strip():
                try:
                    vectors = self.vectorizer.fit_transform(df["combined"].tolist() + [user_profile])
                    similarity = cosine_similarity(vectors[-1:], vectors[:-1])[0]
                    df["match_score"] = (similarity * 100).round(2)
                except Exception as e:
                    print(f"Vectorization error: {e}")
                    df["match_score"] = 50.0
            else: df["match_score"] = 50.0
            if user_location and self.safe_str(user_location).strip():
                user_locs = [loc.strip().lower() for loc in user_location.split(',')]
                df["location_match"] = df["location"].apply(lambda x: any(loc in x.lower() for loc in user_locs) if pd.notna(x) and x else False)
                df.loc[df["location_match"], "match_score"] *= 1.2
            df = df.sort_values(by="match_score", ascending=False)
            df = df[df["match_score"] >= 10]
            recommendations = []
            for idx, row in df.head(top_n).iterrows():
                desc = row["description"]
                recommendations.append({"id": int(row["id"]), "company": row["company"], "title": row["title"], "required_skills": row["required_skills"], "location": row["location"], "stipend": row["stipend"], "duration": row["duration"], "industry": row["industry"], "description": desc[:200] + "..." if pd.notna(desc) and len(str(desc)) > 200 else desc, "match_score": float(row["match_score"]), "match_reason": self._get_match_reason(row["match_score"])})
            return recommendations
        except Exception as e:
            print(f"Recommendation error: {e}")
            return []
    def _get_match_reason(self, score):
        if score >= 80: return "Excellent match for your skills and interests"
        elif score >= 60: return "Strong match based on your profile"
        elif score >= 40: return "Good fit for your background"
        else: return "Potential opportunity to explore"

recommender = RecommendationEngine()

# ============================================
# API ROUTES
# ============================================
# ... (All other API routes remain unchanged) ...
@app.route('/')
def home():
    return jsonify({'message': 'Internship Recommendation API', 'version': '2.0', 'status': 'active', 'internships_count': Internship.query.count()})
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.utcnow().isoformat(), 'database': 'connected', 'total_internships': Internship.query.count()})
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        required = ['name', 'email', 'password', 'major', 'skills', 'interests', 'year', 'location_pref']
        for field in required:
            if field not in data: return jsonify({'error': f'Missing required field: {field}'}), 400
        if User.query.filter_by(email=data['email'].lower()).first(): return jsonify({'error': 'Email already registered'}), 400
        if len(data['password']) < 6: return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user = User(name=data['name'], email=data['email'].lower(), major=data['major'], skills=data['skills'], interests=data['interests'], year=data['year'], gpa=data.get('gpa', 3.0), location_pref=data['location_pref'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        access_token = create_access_token(identity=user.id)
        return jsonify({'message': 'User registered successfully', 'access_token': access_token, 'user': user.to_dict_safe()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        if 'email' not in data or 'password' not in data: return jsonify({'error': 'Email and password required'}), 400
        user = User.query.filter_by(email=data['email'].lower()).first()
        if not user or not user.check_password(data['password']): return jsonify({'error': 'Invalid email or password'}), 401
        access_token = create_access_token(identity=user.id)
        return jsonify({'message': 'Login successful', 'access_token': access_token, 'user': user.to_dict_safe()}), 200
    except Exception as e: return jsonify({'error': str(e)}), 500
@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user: return jsonify({'error': 'User not found'}), 404
        return jsonify(user.to_dict_safe())
    except Exception as e: return jsonify({'error': str(e)}), 500
@app.route('/api/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict_safe())

# ============================================
# MODIFIED ROUTE
# ============================================
@app.route('/api/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        if current_user_id != user_id: 
            return jsonify({'error': 'Forbidden: You can only update your own profile'}), 403
        
        user = User.query.get(user_id)
        if not user: 
            return jsonify({'error': 'User not found'}), 404
        
        # --- THIS IS THE NEW FIX ---
        # Use get_json(silent=True)
        # This returns None if Content-Type is wrong OR if JSON is malformed
        data = request.get_json(silent=True)
        
        # If data is None, it means the JSON was invalid or not provided correctly
        if data is None:
            return jsonify({'error': 'Invalid request: Malformed JSON or incorrect Content-Type header. Must be application/json.'}), 400
        # --- END OF NEW FIX ---
            
        updateable = ['name', 'major', 'skills', 'interests', 'year', 'gpa', 'location_pref']
        
        updated_something = False
        for field in updateable:
            if field in data: 
                setattr(user, field, data[field])
                updated_something = True
        
        # If you want to ensure at least one field was updated, you could add:
        # if not updated_something:
        #    return jsonify({'error': 'No updateable fields provided'}), 400
        
        user.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Profile updated successfully', 'user': user.to_dict_safe()})
    
    except Exception as e:
        db.session.rollback()
        print(f"Error updating user {user_id}: {e}")
        return jsonify({'error': f'An internal error occurred: {str(e)}'}), 500
# ============================================
# END OF MODIFIED ROUTE
# ============================================

@app.route('/api/internships', methods=['GET', 'POST'])
def handle_internships():
    if request.method == 'POST':
        try:
            data = request.json
            required_fields = ['company', 'title', 'description', 'required_skills', 'location']
            if not all(field in data and data[field] for field in required_fields): return jsonify({'error': 'Missing required fields (company, title, description, skills, location)'}), 400
            new_internship = Internship(company=data.get('company'), title=data.get('title'), description=data.get('description'), required_skills=data.get('required_skills'), location=data.get('location'), duration=data.get('duration'), stipend=data.get('stipend'), deadline=data.get('deadline'), industry=data.get('industry', 'Technology'), is_active=True)
            db.session.add(new_internship)
            db.session.commit()
            return jsonify(new_internship.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    if request.method == 'GET':
        try:
            total_internships = Internship.query.count()
            active_internships = Internship.query.filter_by(is_active=True).count()
            today_str = datetime.utcnow().strftime('%Y-%m-%d')
            expired_internships = Internship.query.filter(Internship.deadline != None, Internship.deadline != 'Rolling', Internship.deadline < today_str).count()
            query = Internship.query
            location = request.args.get('location', '').lower()
            industry = request.args.get('industry', '').lower()
            if location: query = query.filter(Internship.location.ilike(f'%{location}%'))
            if industry: query = query.filter(Internship.industry.ilike(f'%{industry}%'))
            query = query.order_by(Internship.created_at.desc())
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 50, type=int)
            paginated = query.paginate(page=page, per_page=per_page, error_out=False)
            return jsonify({'page': page, 'per_page': per_page, 'total_pages': paginated.pages, 'internships': [i.to_dict() for i in paginated.items], 'total_internships': total_internships, 'active_internships': active_internships, 'expired_internships': expired_internships, 'count': paginated.total,})
        except Exception as e: return jsonify({'error': str(e)}), 500
@app.route('/api/internships/<int:internship_id>', methods=['GET'])
def get_internship(internship_id):
    internship = Internship.query.get(internship_id)
    if not internship: return jsonify({'error': 'Internship not found'}), 404
    return jsonify(internship.to_dict())
@app.route('/api/recommendations/<int:user_id>', methods=['GET'])
def get_user_recommendations(user_id):
    try:
        user = User.query.get(user_id)
        if not user: return jsonify({'error': 'User not found'}), 404
        internships = Internship.query.filter_by(is_active=True).limit(1000).all()
        if not internships: return jsonify({'user_id': user_id, 'recommendations': [], 'message': 'No internships available'})
        recommendations = recommender.get_recommendations(user.skills, user.interests, user.location_pref, internships, top_n=10)
        return jsonify({'user_id': user_id, 'count': len(recommendations), 'recommendations': recommendations, 'generated_at': datetime.utcnow().isoformat()})
    except Exception as e:
        print(f"Error in recommendations: {e}")
        return jsonify({'error': str(e)}), 500
@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json
        skills = data.get("skills", "")
        interests = data.get("interests", "")
        location = data.get("location", "")
        internships = Internship.query.filter_by(is_active=True).limit(1000).all()
        if not internships: return jsonify({'recommendations': [], 'message': 'No internships available'})
        recommendations = recommender.get_recommendations(skills, interests, location, internships, top_n=10)
        return jsonify({'count': len(recommendations), 'recommendations': recommendations})
    except Exception as e:
        print(f"Error in recommend: {e}")
        return jsonify({'error': str(e)}), 500
@app.route('/api/applications', methods=['POST'])
@jwt_required()
def create_application():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        if 'user_id' not in data or 'internship_id' not in data: return jsonify({'error': 'Missing user_id or internship_id'}), 400
        if data['user_id'] != current_user_id: return jsonify({'error': 'Forbidden: Cannot track application for another user'}), 403
        existing_app = Application.query.filter_by(user_id=data['user_id'], internship_id=data['internship_id']).first()
        if existing_app:
            existing_app.status = data.get('status', existing_app.status)
            existing_app.applied_at = datetime.utcnow()
            db.session.commit()
            return jsonify({'message': 'Application status updated', 'application': existing_app.to_dict()}), 200
        application = Application(user_id=data['user_id'], internship_id=data['internship_id'], status=data.get('status', 'viewed'))
        db.session.add(application)
        db.session.commit()
        return jsonify({'message': 'Application tracked successfully', 'application': application.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/applications/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_applications(user_id):
    current_user_id = get_jwt_identity()
    if user_id != current_user_id: return jsonify({'error': 'Forbidden'}), 403
    applications = Application.query.filter_by(user_id=user_id).all()
    return jsonify({'user_id': user_id, 'applications': [a.to_dict() for a in applications]})
@app.route('/api/users/all', methods=['GET'])
def get_all_users():
    try:
        users = User.query.all()
        return jsonify({'users': [user.to_dict_safe() for user in users]})
    except Exception as e: return jsonify({'error': str(e)}), 500
@app.route('/api/applications/all', methods=['GET'])
def get_all_applications():
    try:
        applications = Application.query.all()
        return jsonify({'applications': [app.to_dict() for app in applications]})
    except Exception as e: return jsonify({'error': str(e)}), 500
@app.route('/api/internships/<int:internship_id>', methods=['DELETE'])
def delete_internship(internship_id):
    try:
        internship = Internship.query.get(internship_id)
        if not internship: return jsonify({'error': 'Internship not found'}), 404
        Application.query.filter_by(internship_id=internship_id).delete()
        db.session.delete(internship)
        db.session.commit()
        return jsonify({'message': 'Deleted', 'id': internship_id}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
@app.route('/api/internships/delete_expired', methods=['DELETE'])
def delete_expired_internships():
    try:
        today_str = datetime.utcnow().strftime('%Y-%m-%d')
        expired = Internship.query.filter(Internship.deadline != None, Internship.deadline != 'Rolling', Internship.deadline < today_str).all()
        deleted_count = len(expired)
        if deleted_count == 0: return jsonify({'message': 'No expired internships found to delete.', 'deleted_count': 0}), 200
        for internship in expired:
            Application.query.filter_by(internship_id=internship.id).delete()
            db.session.delete(internship)
        db.session.commit()
        return jsonify({'message': f'Successfully deleted {deleted_count} expired internships.', 'deleted_count': deleted_count}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================
# APP RUNNER
# ============================================
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print(f"✅ Database ready with {Internship.query.count()} internships")

    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=True)