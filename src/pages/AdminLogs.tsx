import React, { useState, useEffect } from 'react';
import { LogViewer } from '../components/LogViewer';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { logError, LogCategory } from '../lib/logging';
import { motion } from 'framer-motion';

export function AdminLogs() {
  const { user } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        // Check if user has admin role
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          throw error;
        }

        const hasAdminRole = data?.role === 'admin';
        setIsAdmin(hasAdminRole);

        if (!hasAdminRole) {
          // If not admin, redirect to home
          navigate('/');
        }
      } catch (error: any) {
        console.error('Error checking admin status:', error);
        logError(LogCategory.AUTH, "Admin check failed", user.id, null, { error: error.message });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8">
          <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Verifying administrator access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 mt-12">
          <div className="mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="mb-6 text-gray-600">You do not have administrator permissions to view this page.</p>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">System Logs</h1>
            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">Admin View</span>
          </div>
          <p className="text-gray-500 mt-1">Monitor system-wide logs and user activity</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to App
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
            Admin Dashboard
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-purple-800">Administrator Access</h3>
              <p className="text-purple-700 mt-1">
                As an administrator, you have access to all system logs including user activity, authentication events, and system operations. 
                This data helps you monitor application health, troubleshoot issues, and ensure proper system functioning.
              </p>
              <div className="mt-3">
                <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full mr-2">
                  View logs from all users
                </div>
                <div className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  All log levels visible
                </div>
              </div>
            </div>
          </div>
        </div>

        <LogViewer isAdmin={true} />
      </div>
    </motion.div>
  );
} 