import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, TrendingUp, Star, ExternalLink, User, BookOpen, Award, DollarSign, Calendar, Building2, CheckCircle, Loader2, AlertCircle, LogOut, ChevronLeft, ChevronRight, Edit, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import Auth from './Auth';

// Copied options
const locationOptions = [
  "Remote", "Vijayawada, AP", "Hyderabad, TS", "Bengaluru, KA", "Chennai, TN",
  "Pune, MH", "Mumbai, MH", "New Delhi, DL", "Gurgaon, HR", "Noida, UP"
];
const branchOptions = [
  "Information Technology", "Computer Science", "Electronics & Communication",
  "Electrical & Electronics", "Mechanical Engineering", "Civil Engineering",
  "Artificial Intelligence", "Data Science"
];

// --- MODIFIED: This component is now simpler ---
export default function InternshipFinderApp() {
  const { user, token, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="w-screen min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center overflow-x-hidden">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-200">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    return <Auth />;
  }
  
  return <AuthenticatedApp />;
}

// --- MODIFIED: This component now gets its own auth context ---
function AuthenticatedApp() {
  // This is much cleaner. No more passing props down.
  const { user, token, logout, updateUser } = useAuth();
  
  const [currentView, setCurrentView] = useState('profile');
  const [recommendations, setRecommendations] = useState([]);
  const [allInternships, setAllInternships] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [applications, setApplications] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  
  const [editableUser, setEditableUser] = useState({
    ...user,
    location_pref: user.location_pref ? user.location_pref.split(',').map(s => s.trim()) : []
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingInternships, setLoadingInternships] = useState(false);
  const perPage = 100;

  useEffect(() => {
    setEditableUser({
      ...user,
      location_pref: user.location_pref ? user.location_pref.split(',').map(s => s.trim()) : []
    });
  }, [user]);
  
  useEffect(() => {
    fetchInternships(1);
  }, []);

  const fetchInternships = async (page = 1) => {
    setLoadingInternships(true);
    try {
      const response = await fetch(`http://localhost:5000/api/internships?page=${page}&per_page=${perPage}`);
      const data = await response.json();
      if (response.ok) {
        setAllInternships(data.internships || []);
        setTotalPages(data.total_pages || 1);
        setTotalCount(data.count || 0);
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) { setError('Failed to load internships'); }
    finally { setLoadingInternships(false); }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/recommendations/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) { throw new Error(data.error || 'Failed to get recommendations'); }
      const transformedRecs = (data.recommendations || []).map((rec, index) => ({
        rank: index + 1,
        internship: {
          id: rec.id, title: rec.title || 'Untitled', company: rec.company || 'Unknown Company',
          description: rec.description || '', location: rec.location || 'Not specified',
          duration: rec.duration || 'Not specified', stipend: rec.stipend || 'Not specified',
          industry: rec.industry || 'Technology', required_skills: rec.required_skills || 'Not specified'
        },
        match_score: (rec.match_score || 0) / 100,
        match_reason: rec.match_reason || 'Good fit for your profile'
      }));
      setRecommendations(transformedRecs);
      setCurrentView('recommendations');
      setSuccess(`Found ${transformedRecs.length} perfect matches!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.message || 'Failed to load recommendations'); }
    finally { setLoading(false); }
  };

  const handleApplication = async (internshipId, status) => {
    try {
      const response = await fetch(`http://localhost:5000/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ user_id: user.id, internship_id: internshipId, status: status }),
      });
      const data = await response.json();
      if (response.ok) {
        setApplications(prev => ({ ...prev, [internshipId]: status }));
        setSuccess(`Successfully ${status}!`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) { console.error('Error tracking application:', err); }
  };

  const handleApplyNow = (internship) => {
    handleApplication(internship.id, 'applied');
    const searchQuery = `${internship.company} ${internship.title} internship apply India`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    window.open(searchUrl, '_blank');
  };

  const getMatchColor = (score) => {
    if (score >= 0.75) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.60) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };
  const getMatchLabel = (score) => {
    if (score >= 0.75) return 'Excellent Match';
    if (score >= 0.60) return 'Good Match';
    return 'Fair Match';
  };
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) { fetchInternships(page); }
  };

  // --- THIS FUNCTION IS THE FIX ---
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const updateData = {
      name: editableUser.name, major: editableUser.major, year: editableUser.year,
      skills: editableUser.skills, interests: editableUser.interests, gpa: editableUser.gpa,
      location_pref: editableUser.location_pref.join(', ')
    };

    try {
      const response = await fetch(`http://localhost:5000/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 'token' is now from useAuth()
        },
        body: JSON.stringify(updateData)
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      // --- THIS IS THE FIX ---
      // Use the correct 'updateUser' function from context
      updateUser(data.user); 
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false); 
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // --- END OF FIX ---

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditableUser(prev => ({ ...prev, [name]: value }));
  };
  const handleLocationChange = (e) => {
    const options = [...e.target.selectedOptions];
    const values = options.map(option => option.value);
    setEditableUser(prev => ({ ...prev, location_pref: values }));
  };

  return (
    <div className="w-screen min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 overflow-x-hidden">
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">InternMatch AI</h1>
                <p className="text-xs text-blue-200">Welcome, {user.name}!</p>
              </div>
            </div>
            <nav className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentView('profile')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  currentView === 'profile'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/90 text-gray-700 hover:bg-white shadow-sm'
                }`}
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button
                onClick={() => {
                  if (recommendations.length > 0) { setCurrentView('recommendations'); }
                  else { fetchRecommendations(); }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  currentView === 'recommendations'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/90 text-gray-700 hover:bg-white shadow-sm'
                }`}
              >
                <Star className="w-4 h-4" /> Matches
                {recommendations.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {recommendations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentView('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  currentView === 'browse'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/90 text-gray-700 hover:bg-white shadow-sm'
                }`}
              >
                <Search className="w-4 h-4" /> Browse All
              </button>
              <div className="border-l border-white/30 h-8 mx-2"></div>
              <button
                onClick={logout}
                className="px-4 py-2 rounded-lg font-medium transition bg-white/90 text-red-600 hover:bg-white shadow-sm flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-red-900/80 border border-red-600 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-100">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-300 hover:text-red-100 text-2xl">&times;</button>
          </div>
        </div>
      )}
      {success && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div className="bg-green-900/80 border border-green-600 rounded-lg p-4 flex items-center gap-3 backdrop-blur-sm">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-100">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-300 hover:text-green-100 text-2xl">&times;</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'profile' ? (
          <form onSubmit={handleProfileUpdate} className="bg-white rounded-2xl shadow-xl p-8 border">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg"> <User className="w-6 h-6 text-blue-600" /> </div>
                  Your Profile
                </h2>
                <p className="text-gray-600">
                  {isEditing ? "Update your profile details below." : "This is your AI-powered profile."}
                </p>
              </div>
              {!isEditing && (
                <button type="button" onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg font-medium transition bg-blue-600 text-white hover:bg-blue-700 shadow-sm flex items-center gap-2"
                > <Edit className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-100 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Branch</label>
                {isEditing ? (
                  <select name="major" value={editableUser.major} onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  > {branchOptions.map(branch => (<option key={branch} value={branch}>{branch}</option>))}
                  </select>
                ) : ( <p className="text-gray-900">{user.major}</p> )}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                {isEditing ? (
                  <select name="year" value={editableUser.year} onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="1st">1st Year</option> <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option> <option value="4th">4th Year</option>
                    <option value="postgraduate">Postgraduate</option>
                  </select>
                ) : ( <p className="text-gray-900 capitalize">{user.year}</p> )}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Skills (comma-separated)</label>
                {isEditing ? (
                  <textarea name="skills" value={editableUser.skills} onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows="3" placeholder="Python, Java, React..." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.skills?.split(',').map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Interests (comma-separated)</label>
                {isEditing ? (
                  <textarea name="interests" value={editableUser.interests} onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows="3" placeholder="AI, Web Development, Startups..." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.interests?.split(',').map((interest, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {interest.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">CGPA (out of 10.0)</label>
                {isEditing ? (
                  <input type="number" name="gpa" value={editableUser.gpa} onChange={handleEditChange}
                    step="0.01" min="0" max="10" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                ) : ( <p className="text-gray-900">{user.gpa}</p> )}
              </div>
              <div className="bg-gray-100 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location Preferences</label>
                {isEditing ? (
                  <>
                    <select multiple name="location_pref" value={editableUser.location_pref}
                      onChange={handleLocationChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" size="4"
                    > {locationOptions.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                    </select>
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      Hold Ctrl (or Cmd on Mac) to select multiple.
                    </p>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {user.location_pref?.split(',').map((loc, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {loc.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {isEditing ? (
              <div className="flex gap-4">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg"
                > {loading ? (<Loader2 className="w-5 h-5 animate-spin" />) : ("Save Changes")}
                </button>
                <button type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditableUser({
                      ...user,
                      location_pref: user.location_pref ? user.location_pref.split(',').map(s => s.trim()) : []
                    });
                    setError('');
                  }}
                  className="px-6 py-4 rounded-lg font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 transition flex items-center justify-center gap-2"
                > <X className="w-5 h-5" /> Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={fetchRecommendations} disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
              > {loading ? (
                  <> <Loader2 className="w-5 h-5 animate-spin" /> Finding Your Perfect Matches... </>
                ) : (
                  <> <Search className="w-5 h-5" /> Get My Recommendations </>
                )}
              </button>
            )}
          </form>
        ) : currentView === 'recommendations' ? (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg"> <Star className="w-6 h-6 text-purple-600" /> </div>
                Your Personalized Matches
              </h2>
              <p className="text-blue-200">
                {recommendations.length > 0 ? `We found ${recommendations.length} internships perfectly tailored to your profile` : 'Click "Get My Recommendations" to see personalized matches'}
              </p>
            </div>
            {recommendations.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"> <Search className="w-8 h-8 text-blue-600" /> </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Recommendations Yet</h3>
                <p className="text-gray-600 mb-6">Click the button below to get AI-powered internship matches</p>
                <button onClick={fetchRecommendations} disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                > {loading ? 'Loading...' : 'Get Recommendations'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {recommendations.map((rec) => (
                  <div key={rec.rank} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition border-2 border-transparent hover:border-blue-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="bg-gradient-to-br from-blue-600 to-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md">
                            {rec.rank}
                          </span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{rec.internship.title}</h3>
                            <p className="text-gray-600 font-medium flex items-center gap-2"> <Building2 className="w-4 h-4" /> {rec.internship.company} </p>
                          </div>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full font-semibold text-sm border-2 ${getMatchColor(rec.match_score)}`}>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 fill-current" />
                          {(rec.match_score * 100).toFixed(0)}%
                          <span className="ml-1 text-xs font-normal">{getMatchLabel(rec.match_score)}</span>
                        </div>
                      </div>
                    </div>
                    {rec.internship.description && (
                      <p className="text-gray-700 mb-4 leading-relaxed"> {rec.internship.description} </p>
                    )}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" /> Why This Match?
                      </p>
                      <p className="text-sm text-gray-700">{rec.match_reason}</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600"> <MapPin className="w-4 h-4 text-blue-600" /> <span className="font-medium">{rec.internship.location}</span> </div>
                      <div className="flex items-center gap-2 text-gray-600"> <Calendar className="w-4 h-4 text-purple-600" /> <span className="font-medium">{rec.internship.duration}</span> </div>
                      <div className="flex items-center gap-2 text-gray-600"> <DollarSign className="w-4 h-4 text-green-600" /> <span className="font-medium">{rec.internship.stipend}</span> </div>
                      <div className="flex items-center gap-2 text-gray-600"> <Award className="w-4 h-4 text-orange-600" /> <span className="font-medium">{rec.internship.industry}</span> </div>
                    </div>
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.internship.required_skills?.split(',').slice(0, 8).map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApplyNow(rec.internship)}
                        disabled={applications[rec.internship.id] === 'applied'}
                        className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                          applications[rec.internship.id] === 'applied'
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md'
                        }`}
                      >
                        {applications[rec.internship.id] === 'applied' ? (
                          <> <CheckCircle className="w-5 h-5" /> Applied </>
                        ) : (
                          <> Apply Now <ExternalLink className="w-4 h-4" /> </>
                        )}
                      </button>
                      <button
                        onClick={() => handleApplication(rec.internship.id, 'saved')}
                        className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
                      > Save
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg"> <BookOpen className="w-6 h-6 text-green-600" /> </div>
                Browse All Internships
              </h2>
              <div className="flex items-center justify-between">
                <p className="text-blue-200">
                  Showing {allInternships.length} of {totalCount.toLocaleString()} internship opportunities
                </p>
                {totalPages > 1 && (
                  <p className="text-sm text-blue-300"> Page {currentPage} of {totalPages} </p>
                )}
              </div>
            </div>
            {loadingInternships ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border">
                <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading internships...</p>
              </div>
            ) : allInternships.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No internships found</p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {allInternships.map((internship) => (
                    <div key={internship.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition border hover:border-blue-300">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{internship.title}</h3>
                      <p className="text-gray-600 font-medium mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{internship.company}</span>
                      </p>
                      {internship.description && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                          {internship.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="flex items-center gap-1 text-gray-600"> <MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{internship.location}</span> </div>
                        <div className="flex items-center gap-1 text-gray-600"> <Calendar className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{internship.duration}</span> </div>
                        <div className="flex items-center gap-1 text-gray-600"> <DollarSign className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{internship.stipend}</span> </div>
                        <div className="flex items-center gap-1 text-gray-600"> <Award className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{internship.industry}</span> </div>
                      </div>
                      <button
                        onClick={() => handleApplyNow(internship)}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition text-sm flex items-center justify-center gap-2"
                      > View & Apply <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="bg-white rounded-xl shadow-md p-6 border">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{(currentPage - 1) * perPage + 1}</span> to{' '}
                        <span className="font-semibold">{Math.min(currentPage * perPage, totalCount)}</span> of{' '}
                        <span className="font-semibold">{totalCount.toLocaleString()}</span> internships
                      </p>
                      <p className="text-sm text-gray-500"> Page {currentPage} of {totalPages} </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => goToPage(1)} disabled={currentPage === 1 || loadingInternships}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      > First
                      </button>
                      <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1 || loadingInternships}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                      > <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {currentPage > 3 && <span className="px-2 text-gray-500">...</span>}
                        {[...Array(totalPages)].map((_, idx) => {
                          const pageNum = idx + 1;
                          if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)) {
                            return (
                              <button key={pageNum} onClick={() => goToPage(pageNum)} disabled={loadingInternships}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                  currentPage === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                } disabled:opacity-50`}
                              > {pageNum}
                              </button>
                            );
                          } else if (pageNum === currentPage - 3 || pageNum === currentPage + 3) {
                            return <span key={pageNum} className="px-2 text-gray-500">...</span>;
                          }
                          return null;
                        })}
                      </div>
                      <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || loadingInternships}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
                      > Next <ChevronRight className="w-4 h-4" />
                      </button>
                      <button onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages || loadingInternships}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      > Last
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <label className="text-sm text-gray-600">Jump to page:</label>
                      <input type="number" min="1" max={totalPages} value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) { goToPage(page); }
                        }}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-500">of {totalPages}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-blue-200">© 2025 InternMatch AI - Powered by Machine Learning</p>
          <p className="text-xs text-blue-300 mt-1">
            {totalCount > 0 && `${totalCount.toLocaleString()} internships available`}
          </p>
        </div>
      </footer>
    </div>
  );
}