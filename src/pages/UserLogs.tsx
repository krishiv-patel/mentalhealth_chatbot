import React from 'react';
import { LogViewer } from '../components/LogViewer';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export function UserLogs() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!user) {
    // Redirect to login if not authenticated
    navigate('/login');
    return null;
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
          <h1 className="text-3xl font-bold">Your Activity Log</h1>
          <p className="text-gray-500 mt-1">View and track how you interact with the mental health chatbot</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/chat')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Return to Chat
          </button>
          <button
            onClick={() => navigate('/history')}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            View Chat History
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-blue-800">About Activity Logs</h3>
              <p className="text-blue-700 mt-1">
                This page shows your activity logs in the application. You can use these logs to track your usage 
                and understand how you interact with the mental health chatbot. Your logs help you maintain awareness 
                of your journey and conversations over time.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <div className="px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm flex items-center gap-1">
                  <span>💬</span> Chat interactions
                </div>
                <div className="px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm flex items-center gap-1">
                  <span>🔒</span> Authentication events
                </div>
                <div className="px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm flex items-center gap-1">
                  <span>⚙️</span> System activities
                </div>
                <div className="px-3 py-1 bg-blue-100 rounded-full text-blue-700 text-sm flex items-center gap-1">
                  <span>📄</span> File operations
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <LogViewer isAdmin={false} />
      </div>
    </motion.div>
  );
} 