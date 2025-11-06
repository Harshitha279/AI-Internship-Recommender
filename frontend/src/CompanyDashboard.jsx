import React, { useState, useEffect } from "react";

const CompanyDashboard = () => {
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [internships, setInternships] = useState([]);
  const [selectedInternship, setSelectedInternship] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersRes = await fetch("http://localhost:5000/api/users/all");
      const usersData = await usersRes.json();
      
      // Fetch internships
      const internshipsRes = await fetch("http://localhost:5000/api/internships");
      const internshipsData = await internshipsRes.json();
      
      // Fetch applications
      const appsRes = await fetch("http://localhost:5000/api/applications/all");
      const appsData = await appsRes.json();

      setUsers(usersData.users || []);
      setInternships(internshipsData.internships || []);
      setApplications(appsData.applications || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch data");
      setLoading(false);
    }
  };

  const getApplicantsForInternship = (internshipId) => {
    return applications
      .filter(app => app.internship_id === internshipId)
      .map(app => users.find(user => user.id === app.user_id))
      .filter(user => user !== undefined);
  };

  const getAllApplicants = () => {
    const applicantIds = [...new Set(applications.map(app => app.user_id))];
    return users.filter(user => applicantIds.includes(user.id));
  };

  const displayedUsers = selectedInternship === "all" 
    ? getAllApplicants() 
    : getApplicantsForInternship(parseInt(selectedInternship));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Company Portal</h1>
          <p className="text-purple-100 mt-2">View and manage applicant details</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Applications</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{applications.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Internships</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {internships.filter(i => i.is_active).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"/>
                  <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Applicants</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{getAllApplicants().length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Internship
          </label>
          <select
            value={selectedInternship}
            onChange={(e) => setSelectedInternship(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Applicants ({getAllApplicants().length})</option>
            {internships.map(internship => (
              <option key={internship.id} value={internship.id}>
                {internship.title} at {internship.company} ({getApplicantsForInternship(internship.id).length} applicants)
              </option>
            ))}
          </select>
        </div>

        {/* Applicants List */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold">
              {selectedInternship === "all" 
                ? "All Applicants" 
                : `Applicants for ${internships.find(i => i.id === parseInt(selectedInternship))?.title}`}
            </h2>
            <span className="text-sm text-gray-600">{displayedUsers.length} users</span>
          </div>

          {displayedUsers.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No applicants yet</h3>
              <p className="text-gray-600">There are no applicants for this internship</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {displayedUsers.map((user) => {
                const userApplications = applications.filter(app => app.user_id === user.id);
                return (
                  <div key={user.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        {/* User Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{user.name}</h3>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                              {user.year || "Not specified"}
                            </span>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                              </svg>
                              <span className="text-sm">{user.email}</span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-sm font-medium">{user.major}</span>
                            </div>

                            {user.gpa && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm">GPA: {user.gpa}</span>
                              </div>
                            )}

                            {user.location_pref && (
                              <div className="flex items-center gap-2 text-gray-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                                </svg>
                                <span className="text-sm">{user.location_pref}</span>
                              </div>
                            )}
                          </div>

                          {/* Skills */}
                          {user.skills && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {user.skills.split(',').map((skill, idx) => (
                                  <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                                    {skill.trim()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Interests */}
                          {user.interests && (
                            <div className="mb-3">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Interests</p>
                              <p className="text-sm text-gray-700">{user.interests}</p>
                            </div>
                          )}

                          {/* Applied Positions */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              Applied to {userApplications.length} position(s)
                            </p>
                            <div className="space-y-1">
                              {userApplications.map(app => {
                                const internship = internships.find(i => i.id === app.internship_id);
                                return internship ? (
                                  <div key={app.id} className="text-sm text-gray-600 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    {internship.title} at {internship.company}
                                    <span className="text-xs text-gray-500">
                                      ({new Date(app.applied_at).toLocaleDateString()})
                                    </span>
                                  </div>
                                ) : null;
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 ml-4">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium">
                          Shortlist
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                          Contact
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboard;