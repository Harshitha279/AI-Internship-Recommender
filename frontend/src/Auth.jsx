import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, User, BookOpen, Award, MapPin, Loader2, AlertCircle, Eye, EyeOff, Briefcase, TrendingUp, Users } from 'lucide-react';
import { useAuth } from './AuthContext';

const locationOptions = [
  "Remote",
  "Vijayawada, AP",
  "Hyderabad, TS",
  "Bengaluru, KA",
  "Chennai, TN",
  "Pune, MH",
  "Mumbai, MH",
  "New Delhi, DL",
  "Gurgaon, HR",
  "Noida, UP"
];

const branchOptions = [
  "Information Technology",
  "Computer Science",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence",
  "Data Science"
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login } = useAuth();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    branch: 'Information Technology',
    skills: '',
    interests: '',
    year: '3rd',
    cgpa: 8.5,
    location_pref: []
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      login(data.access_token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          password: signupData.password,
          major: signupData.branch,       // Sends 'branch' as 'major'
          skills: signupData.skills,
          interests: signupData.interests,
          year: signupData.year,
          gpa: signupData.cgpa,           // Sends 'cgpa' as 'gpa'
          location_pref: signupData.location_pref.join(', ')
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      login(data.access_token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (e) => {
    const options = [...e.target.selectedOptions];
    const values = options.map(option => option.value);
    setSignupData({ ...signupData, location_pref: values });
  };

  return (
    // *** THIS IS THE FIX ***
    // Changed 'w-full' to 'w-screen' and 'overflow-hidden' to 'overflow-x-hidden'
    // This forces it to use the full screen width and prevents horizontal scroll.
    <div className="w-screen min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-x-hidden flex flex-col">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">InternMatch AI</h1>
                <p className="text-xs text-blue-200">Your AI-Powered Career Partner</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8 text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-300" />
                <div>
                  <p className="text-sm font-semibold">14,000+</p>
                  <p className="text-xs text-blue-200">Internships</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <div>
                  <p className="text-sm font-semibold">AI Powered</p>
                  <p className="text-xs text-blue-200">Matching</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content (flex-1 and items-center/justify-center center the content) */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            
            {/* Left Side - Hero Content */}
            <div className="text-white space-y-8 hidden md:block">
              <div className="space-y-4">
                <h2 className="text-5xl font-bold leading-tight">
                  Find Your Perfect
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Internship Match
                  </span>
                </h2>
                <p className="text-xl text-blue-200">
                  AI-powered recommendations tailored to your skills, interests, and career goals
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Personalized Recommendations</h3>
                    <p className="text-blue-200 text-sm">Get 3-10 curated matches based on your unique profile and preferences</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <div className="bg-purple-500 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Smart AI Matching</h3>
                    <p className="text-blue-200 text-sm">Our ML algorithm analyzes skills, interests, location, and more</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <div className="bg-pink-500 p-3 rounded-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">14,000+ Opportunities</h3>
                    <p className="text-blue-200 text-sm">Access thousands of verified internships from top companies</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">98%</p>
                  <p className="text-sm text-blue-200">Match Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">5K+</p>
                  <p className="text-sm text-blue-200">Happy Students</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">500+</p>
                  <p className="text-sm text-blue-200">Top Companies</p>
                </div>
              </div>
            </div>

            {/* Right Side - Auth Form */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Form Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">
                  {isLogin ? 'Welcome Back!' : 'Create Account'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {isLogin
                    ? 'Login to access your personalized internship recommendations'
                    : 'Join thousands of students finding their dream internships'}
                </p>
              </div>

              {/* Toggle Buttons */}
              <div className="flex gap-2 p-6 pb-0">
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    isLogin
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                  }}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    !isLogin
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Forms */}
              <div className="p-6">
                {isLogin ? (
                  /* Login Form */
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-gray-600">Remember me</span>
                      </label>
                      <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                        Forgot password?
                      </a>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-6 h-6" />
                          Login to Dashboard
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Signup Form */
                  <form onSubmit={handleSignup} className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            value={signupData.name}
                            onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={signupData.email}
                            onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="john@university.edu"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password * (min 6 chars)
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={signupData.password}
                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Confirm Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={signupData.confirmPassword}
                            onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                            className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* This is the 'Branch' dropdown the user sees */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Branch *
                        </label>
                        <div className="relative">
                          {/* FIX 1: Changed text-gray-40G (a typo) to text-gray-400
                          */}
                          <BookOpen className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <select
                            value={signupData.branch}
                            onChange={(e) => setSignupData({ ...signupData, branch: e.target.value })}
                            /* FIX 2: Added 'appearance-auto' to force the dropdown arrow to show 
                            */
                            className="appearance-auto w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                          >
                            {branchOptions.map(branch => (
                              <option key={branch} value={branch}>{branch}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Year *
                        </label>
                        <select
                          value={signupData.year}
                          onChange={(e) => setSignupData({ ...signupData, year: e.target.value })}
                          /* FIX 2: Added 'appearance-auto' here as well
                          */
                          className="appearance-auto w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        >
                          <option value="1st">1st Year</option>
                          <option value="2nd">2nd Year</option>
                          <option value="3rd">3rd Year</option>
                          <option value="4th">4th Year</option>
                          <option value="postgraduate">Postgraduate</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Skills * (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={signupData.skills}
                        onChange={(e) => setSignupData({ ...signupData, skills: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="Python, JavaScript, React, Machine Learning"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Interests * (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={signupData.interests}
                        onChange={(e) => setSignupData({ ...signupData, interests: e.target.value })}
                        className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        placeholder="AI, Web Development, Startups"
                        required
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* This is the 'CGPA' input the user sees */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          CGPA (out of 10.0)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          value={signupData.cgpa}
                          onChange={(e) => setSignupData({ ...signupData, cgpa: parseFloat(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Location Preferences *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <select
                            multiple
                            value={signupData.location_pref}
                            onChange={handleLocationChange}
                            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            required
                            size="4"
                          >
                            {locationOptions.map(loc => (
                              <option key={loc} value={loc}>{loc}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-gray-600 font-medium mt-1">
                          Hold Ctrl (or Cmd on Mac) to select multiple.
                        </p>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3.5 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl mt-4"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-6 h-6" />
                          Create Account
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Terms */}
                <p className="text-xs text-center text-gray-500 mt-6">
                  By continuing, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-white">
        <p className="text-sm text-blue-200">
          © 2025 InternMatch AI. All rights reserved. | Powered by Machine Learning
        </p>
      </footer>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}