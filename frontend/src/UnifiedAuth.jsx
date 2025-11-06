import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
// --- ADDED ICONS ---
import { Mail, Lock, LogIn, UserPlus, Briefcase, Award, TrendingUp, Loader2, Users } from 'lucide-react';


// Dropdown options (unchanged)
const branchOptions = [
  "Information Technology", "Computer Science", "Electronics & Communication",
  "Electrical & Electronics", "Mechanical Engineering", "Civil Engineering",
  "Artificial Intelligence", "Data Science","Chemical Engineering","Aerospace Engineering"
];
const locationOptions = [
  "Remote", "Bangalore", "Hyderabad", "Mumbai", "Pune", "Delhi NCR", "Chennai","Work from home"
];

const UnifiedAuth = () => {
  const [userType, setUserType] = useState("student");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "", email: "", password: "", branch: "", skills: "",
    interests: "", year: "", 
    // --- MODIFIED --- Changed default gpa to empty
    gpa: "", 
    location_pref: [],
  });

  const handleLocationChange = (e) => {
    const options = [...e.target.selectedOptions];
    const values = options.map((option) => option.value);
    setRegisterData({ ...registerData, location_pref: values });
  };

  // handleLoginSubmit and handleRegisterSubmit (logic unchanged)
    const handleLoginSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      try {
        if (userType === "admin") {
          if (
            loginData.email === "admin@internmatch.com" &&
            loginData.password === "admin123"
          ) {
            localStorage.setItem("userType", "admin");
            localStorage.setItem("adminToken", "admin-access-granted");
            navigate("/admin");
          } else {
            setError("Invalid admin credentials");
          }
        } else if (userType === "company") {
          if (
            loginData.email === "company@internmatch.com" &&
            loginData.password === "company123"
          ) {
            localStorage.setItem("userType", "company");
            localStorage.setItem("companyToken", "company-access-granted");
            navigate("/company");
          } else {
            setError("Invalid company credentials");
          }
        } else {
          const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginData),
          });
          const data = await res.json();
          if (res.ok) {
            localStorage.setItem("userType", "student");
            login(data.access_token, data.user);
            navigate("/student");
          } else {
            setError(data.error || "Login failed");
          }
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    const handleRegisterSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      // --- MODIFIED --- Ensure GPA is a number or a default value
      const payload = {
        name: registerData.name, email: registerData.email, password: registerData.password,
        major: registerData.branch, skills: registerData.skills, interests: registerData.interests,
        year: registerData.year, 
        gpa: registerData.gpa ? parseFloat(registerData.gpa) : 3.0, // Send default if empty
        location_pref: registerData.location_pref.join(", "),
      };
      // --- END MODIFIED ---

      try {
        const res = await fetch("http://localhost:5000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("userType", "student");
          login(data.access_token, data.user);
          navigate("/student");
        } else {
          setError(data.error || "Registration failed");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };


  return (
    // --- UPDATED: Full screen gradient, added relative positioning ---
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden flex flex-col lg:flex-row">
        {/* --- ADDED: Animated Background Blobs --- */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      {/* --- UPDATED: Left Side - Hero Section --- */}
      <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-center items-center px-6 md:px-12 py-16 lg:py-0 text-white text-center lg:text-left">
          <div className="w-full max-w-lg">
              {/* Logo/Title */}
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-10">
                <div className="bg-white p-3 rounded-xl shadow-lg">
                    <Briefcase className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold">InternMatch AI</h1>
                    <p className="text-sm text-blue-200">Your AI-Powered Career Partner</p>
                </div>
            </div>

            {/* Main Headline */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
              {userType === "student" && (
                <>
                  Find Your Perfect
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300 mt-1">
                    Internship Match
                  </span>
                </>
              )}
              {userType === "admin" && "Manage Internships"}
              {userType === "company" && "Find Top Talent"}
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-10">
              {userType === "student" &&
                "AI-powered recommendations tailored to your skills, interests, and career goals."}
              {userType === "admin" &&
                "Complete control over internship listings and applications."}
              {userType === "company" &&
                "Access a pool of qualified candidates and manage your postings efficiently."}
            </p>

              {/* Feature Highlights (Student View) */}
            {userType === 'student' && (
                <div className="space-y-4 text-left">
                    <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                        <Award className="w-6 h-6 text-blue-300 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold mb-1">Personalized Recommendations</h3>
                            <p className="text-sm text-blue-200">Get curated matches based on your unique profile.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                        <TrendingUp className="w-6 h-6 text-green-300 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold mb-1">Smart AI Matching</h3>
                            <p className="text-sm text-blue-200">Our algorithm analyzes skills, interests, and more.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-sm">
                        <Users className="w-6 h-6 text-purple-300 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold mb-1">Vast Opportunity Pool</h3>
                            <p className="text-sm text-blue-200">Access thousands of verified internships.</p>
                        </div>
                    </div>
                </div>
            )}
          </div>
      </div>


      {/* --- UPDATED: Right Side - Auth Forms --- */}
      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12 lg:px-10">
          {/* --- UPDATED: Card Styling --- */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
          <div className="text-center mb-8">
              {/* --- UPDATED: Title Size --- */}
            <h2 className="text-3xl font-bold text-gray-900">Welcome!</h2>
            <p className="text-gray-600 mt-2">Choose your portal to continue</p>
          </div>

          {/* User Type Selector - Style Updated */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            <button
              onClick={() => { setUserType("student"); setError(''); setIsLogin(true); }}
              className={`py-3 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                userType === "student"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🎓 Student
            </button>
            <button
                onClick={() => { setUserType("admin"); setError(''); setIsLogin(true); }}
                className={`py-3 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                userType === "admin"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              ⚙️ Admin
            </button>
            <button
                onClick={() => { setUserType("company"); setError(''); setIsLogin(true); }}
                className={`py-3 px-2 sm:px-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 flex items-center justify-center gap-1 ${
                userType === "company"
                    ? "bg-gradient-to-r from-teal-500 to-green-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              🏢 Company
            </button>
          </div>

          {/* Login/Register Toggle - Style Updated */}
          {userType === "student" && (
            <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                  isLogin ? "bg-white text-blue-600 shadow-md" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-semibold transition-all duration-300 ${
                  !isLogin ? "bg-white text-blue-600 shadow-md" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Demo Credentials (unchanged) */}
          {userType !== "student" && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Demo Credentials:</p>
                <p className="text-xs text-blue-700">Email: {userType}@internmatch.com<br />Password: {userType}123</p>
              </div>
            )}

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Login Form - Style Updated */}
          {(isLogin || userType !== "student") ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  {/* --- ADDED Icon and Input Styling --- */}
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" required value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        placeholder="your@email.com"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  {/* --- ADDED Icon and Input Styling --- */}
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="password" required value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>
              </div>
                {/* --- UPDATED Submit Button --- */}
              <button type="submit" disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <> <Loader2 className="w-6 h-6 animate-spin" /> Signing in... </>
                ) : (
                  <> <LogIn className="w-6 h-6" /> Sign In </>
                )}
              </button>
            </form>
          ) : (
            // Register Form - Style Updated
            <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Inputs with Icons and Updated Styling */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <div className="relative">
                          <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input type="text" required value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} placeholder="John Doe"
                              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                        </div>
                  </div>
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="email" required value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} placeholder="john@example.com"
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="password" required value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} placeholder="•••••••• (min 6 chars)"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" />
                  </div>
                </div>
                {/* Other fields (Branch, Year, Skills, etc.) - basic styling updates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
                    <select required value={registerData.branch} onChange={(e) => setRegisterData({ ...registerData, branch: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-auto" >
                      <option value="" disabled>Select branch</option>
                      {branchOptions.map((branch) => (<option key={branch} value={branch}>{branch}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                    <select required value={registerData.year} onChange={(e) => setRegisterData({ ...registerData, year: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-auto" >
                      <option value="">Select</option> <option value="1st">1st Year</option> <option value="2nd">2nd Year</option>
                      <option value="3rd">3rd Year</option> <option value="4th">4th Year</option> <option value="postgraduate">Postgraduate</option>
                    </select>
                  </div>
                </div>

                {/* --- MODIFIED --- Added CGPA Field --- */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CGPA</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="10"
                      value={registerData.gpa} 
                      onChange={(e) => setRegisterData({ ...registerData, gpa: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
                      placeholder="e.g., 8.5" 
                    />
                  </div>
                </div>
                {/* --- END MODIFIED --- */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills *</label>
                  <input type="text" required value={registerData.skills} onChange={(e) => setRegisterData({ ...registerData, skills: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Python, React, ML (comma-separated)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interests *</label>
                  <input type="text" required value={registerData.interests} onChange={(e) => setRegisterData({ ...registerData, interests: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="AI, Web Dev (comma-separated)" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Preferences *</label>
                  <select multiple required value={registerData.location_pref} onChange={handleLocationChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" size="4" >
                    {locationOptions.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                </div>
                {/* --- UPDATED Submit Button --- */}
                <button type="submit" disabled={loading}
                  className="w-full mt-4 py-3.5 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl" >
                {loading ? (
                    <> <Loader2 className="w-6 h-6 animate-spin" /> Creating Account... </>
                  ) : (
                    <> <UserPlus className="w-6 h-6" /> Create Account </>
                  )}
                </button>
            </form>
          )}
            {/* --- ADDED: Terms text --- */}
            <p className="text-xs text-center text-gray-500 mt-8">
                By continuing, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
            </p>
        </div>
      </div>

        {/* --- ADDED: Style tag for scrollbar and animation --- */}
        <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
            @keyframes blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
            }
            .animate-blob { animation: blob 7s infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
            .animation-delay-4000 { animation-delay: 4s; }
        `}</style>
    </div>
  );
};

export default UnifiedAuth;