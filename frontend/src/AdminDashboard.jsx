import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

// --- MODIFIED ---
// Added pagination icons
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdminDashboard = () => {
  const [internships, setInternships] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { token } = useAuth();

  // --- MODIFIED ---
  // Added state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInternships, setTotalInternships] = useState(0); // For stats
  const [activeInternships, setActiveInternships] = useState(0); // For stats
  const [expiredInternships, setExpiredInternships] = useState(0); // For stats

  const [newInternship, setNewInternship] = useState({
    company: "",
    title: "",
    description: "",
    required_skills: "",
    location: "",
    duration: "",
    stipend: "",
    deadline: "",
    industry: "Technology",
  });

  // --- MODIFIED ---
  // useEffect now depends on currentPage.
  // It will re-run fetchInternships whenever the page changes.
  useEffect(() => {
    fetchInternships(currentPage);
  }, [currentPage]);

  // --- MODIFIED ---
  // fetchInternships now takes a 'page' argument
  const fetchInternships = async (page) => {
    setLoading(true);
    try {
      // We now request a specific page, e.g., /api/internships?page=1
      const res = await fetch(`http://localhost:5000/api/internships?page=${page}`);
      const data = await res.json();

      if (res.ok) {
        // We expect the backend to send paginated data
        setInternships(data.internships || []);
        setTotalPages(data.total_pages || 1);
        setTotalInternships(data.total_internships || 0);
        setActiveInternships(data.active_internships || 0);
        setExpiredInternships(data.expired_internships || 0);
      } else {
        throw new Error(data.error || "Failed to fetch internships");
      }
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAddInternship = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/api/internships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newInternship),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess("Internship added successfully!");
        setShowAddForm(false);
        setNewInternship({
          company: "",
          title: "",
          description: "",
          required_skills: "",
          location: "",
          duration: "",
          stipend: "",
          deadline: "",
          industry: "Technology",
        });
        // --- MODIFIED ---
        // Fetch the first page to see the new addition
        setCurrentPage(1); 
        fetchInternships(1);
      } else {
        setError(data.error || "Failed to add internship");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleDeleteInternship = async (id) => {
    if (!window.confirm("Are you sure you want to delete this internship?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/internships/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Internship deleted successfully!");
        // --- MODIFIED ---
        // Refetch the current page after deleting
        fetchInternships(currentPage);
      } else {
        setError("Failed to delete internship");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  // --- MODIFIED ---
  // This logic is now handled by the backend.
  // This button will now call a new API route.
  const checkAndDeleteExpired = async () => {
    if (!window.confirm(`This will delete ALL expired internships from the database. Are you sure?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/internships/delete_expired`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(`${data.deleted_count} expired internships deleted successfully!`);
        setCurrentPage(1); // Go back to page 1
        fetchInternships(1); // Refresh data
      } else {
        setError("Failed to delete expired internships");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  // --- MODIFIED ---
  // Added pagination button handlers
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };


  if (loading && internships.length === 0) { // Only show full-page loader on initial load
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage internship listings</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={checkAndDeleteExpired}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium"
              >
                Delete Expired
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-medium shadow-lg"
              >
                {showAddForm ? "Cancel" : "+ Add Internship"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Internship Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Add New Internship</h2>
            <form onSubmit={handleAddInternship} className="space-y-4">
              {/* Form content is unchanged... */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInternship.company}
                    onChange={(e) => setNewInternship({ ...newInternship, company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Google"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInternship.title}
                    onChange={(e) => setNewInternship({ ...newInternship, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Software Engineering Intern"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={newInternship.description}
                  onChange={(e) => setNewInternship({ ...newInternship, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the internship role, responsibilities, and requirements..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Required Skills *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInternship.required_skills}
                    onChange={(e) => setNewInternship({ ...newInternship, required_skills: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Python, React, JavaScript"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInternship.location}
                    onChange={(e) => setNewInternship({ ...newInternship, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Remote / New York, NY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newInternship.duration}
                    onChange={(e) => setNewInternship({ ...newInternship, duration: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="3 months"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stipend
                  </label>
                  <input
                    type="text"
                    value={newInternship.stipend}
                    onChange={(e) => setNewInternship({ ...newInternship, stipend: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="$2000/month"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={newInternship.deadline}
                    onChange={(e) => setNewInternship({ ...newInternship, deadline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <select
                    value={newInternship.industry}
                    onChange={(e) => setNewInternship({ ...newInternship, industry: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Consulting">Consulting</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition shadow-lg"
                >
                  Add Internship
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- MODIFIED --- Statistics now use the new state variables */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Internships</p>
                {/* Now shows the total count from the DB */}
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalInternships}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Listings</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {/* Now shows the active count from the DB */}
                  {activeInternships}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Expired</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {/* Now shows the expired count from the DB */}
                  {expiredInternships}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Internships List */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold">All Internships</h2>
            {/* --- MODIFIED --- Added a loading spinner for page changes */}
            {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>}
          </div>
          <div className="divide-y divide-gray-200">
            {internships.map((internship) => {
              const isExpired = internship.deadline && internship.deadline < new Date().toISOString().split('T')[0];
              return (
                <div key={internship.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{internship.title}</h3>
                        {isExpired && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            EXPIRED
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{internship.company}</p>
                      <p className="text-gray-700 mb-3 line-clamp-2">{internship.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {internship.location}
                        </span>
                        <span>💰 {internship.stipend}</span>
                        <span>⏱️ {internship.duration}</span>
                        <span>📅 {internship.deadline || 'Rolling'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteInternship(internship.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete internship"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* --- MODIFIED --- Added Pagination Controls */}
          <div className="p-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 flex items-center gap-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 flex items-center gap-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;