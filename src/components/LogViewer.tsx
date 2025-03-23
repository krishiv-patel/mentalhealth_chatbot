import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LogLevel, LogCategory } from '../lib/logging';
import { useAuthStore } from '../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  user_id: string | null;
  conversation_id: string | null;
  metadata: Record<string, any> | null;
}

interface LogViewerProps {
  isAdmin?: boolean;
}

export function LogViewer({ isAdmin = false }: LogViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [expandedFilter, setExpandedFilter] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    
    // Count total logs for pagination info
    const countLogs = async () => {
      try {
        let countQuery = supabase
          .from('logs')
          .select('id', { count: 'exact', head: true });
          
        // Apply filters
        if (!isAdmin) {
          // Non-admin users can only see their own logs
          countQuery = countQuery.eq('user_id', user.id);
        }
        
        if (levelFilter) {
          countQuery = countQuery.eq('level', levelFilter.toLowerCase());
        }
        
        if (categoryFilter) {
          countQuery = countQuery.eq('category', categoryFilter.toLowerCase());
        }
        
        if (dateFrom) {
          countQuery = countQuery.gte('timestamp', new Date(dateFrom).toISOString());
        }
        
        if (dateTo) {
          countQuery = countQuery.lte('timestamp', new Date(dateTo).toISOString());
        }
        
        const { count } = await countQuery;
        setTotalLogs(count || 0);
      } catch (error) {
        console.error('Error counting logs:', error);
      }
    };

    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let query = supabase
          .from('logs')
          .select('*');
          
        // Apply filters
        if (!isAdmin) {
          // Non-admin users can only see their own logs
          query = query.eq('user_id', user.id);
        }
        
        if (levelFilter) {
          query = query.eq('level', levelFilter.toLowerCase());
        }
        
        if (categoryFilter) {
          query = query.eq('category', categoryFilter.toLowerCase());
        }
        
        if (dateFrom) {
          query = query.gte('timestamp', new Date(dateFrom).toISOString());
        }
        
        if (dateTo) {
          query = query.lte('timestamp', new Date(dateTo).toISOString());
        }
        
        // Pagination
        query = query
          .order('timestamp', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        }
        
        setLogs(data || []);
      } catch (error: any) {
        console.error('Error fetching logs:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
    countLogs();
  }, [user, isAdmin, levelFilter, categoryFilter, dateFrom, dateTo, page, pageSize]);
  
  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'debug':
        return { text: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300' };
      case 'info':
        return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'warning':
        return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'error':
        return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
      default:
        return { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'chat':
        return '💬';
      case 'auth':
        return '🔒';
      case 'system':
        return '⚙️';
      case 'encryption':
        return '🔐';
      case 'file':
        return '📄';
      default:
        return '•';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(date);
  };

  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000; // seconds in a year
    if (interval > 1) {
      return Math.floor(interval) + ' years ago';
    }
    
    interval = seconds / 2592000; // seconds in a month
    if (interval > 1) {
      return Math.floor(interval) + ' months ago';
    }
    
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) {
      return Math.floor(interval) + ' days ago';
    }
    
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) {
      return Math.floor(interval) + ' hours ago';
    }
    
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) {
      return Math.floor(interval) + ' minutes ago';
    }
    
    return 'just now';
  };
  
  const exportLogs = () => {
    const csv = [
      ['ID', 'Timestamp', 'Level', 'Category', 'Message', 'User ID', 'Conversation ID', 'Metadata'],
      ...logs.map(log => [
        log.id,
        log.timestamp,
        log.level,
        log.category,
        log.message,
        log.user_id || '',
        log.conversation_id || '',
        log.metadata ? JSON.stringify(log.metadata) : ''
      ])
    ].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetFilters = () => {
    setLevelFilter('');
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const setQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setDateFrom(start.toISOString().split('T')[0]);
    setDateTo(end.toISOString().split('T')[0]);
  };
  
  // Function to get readable date format
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  if (!user) {
    return <div className="text-center p-6">Please log in to view logs.</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">System Logs {isAdmin ? <span className="text-sm bg-purple-100 text-purple-800 py-1 px-2 rounded-full ml-2">Admin View</span> : <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded-full ml-2">Your Activity</span>}</h1>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setExpandedFilter(!expandedFilter)}
            className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md flex items-center gap-2 hover:bg-gray-200 transition-colors text-gray-700 shadow-sm"
            aria-expanded={expandedFilter}
            aria-controls="filter-panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filters</span>
          </button>
          
          <button 
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="px-3 py-2 bg-green-600 text-white rounded-md flex items-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            aria-label="Export logs to CSV file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>Export CSV</span>
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {expandedFilter && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Filter Logs</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Log Level</label>
                  <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                  >
                    <option value="">All Levels</option>
                    {Object.values(LogLevel).map(level => (
                      <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Category</label>
                  <select
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {Object.values(LogCategory).map(category => (
                      <option key={category} value={category}>{getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Date Range</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type="date"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        aria-label="From date"
                      />
                      {dateFrom && (
                        <div className="absolute right-2 top-2">
                          <button 
                            onClick={() => setDateFrom('')}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Clear from date"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-gray-500">to</span>
                    <div className="relative flex-1">
                      <input
                        type="date"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        aria-label="To date"
                      />
                      {dateTo && (
                        <div className="absolute right-2 top-2">
                          <button 
                            onClick={() => setDateTo('')}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Clear to date"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {(dateFrom || dateTo) && (
                    <div className="mt-1 text-xs text-blue-600">
                      {dateFrom && dateTo ? 
                        `Showing logs from ${formatDateForDisplay(dateFrom)} to ${formatDateForDisplay(dateTo)}` : 
                        dateFrom ? 
                          `Showing logs from ${formatDateForDisplay(dateFrom)}` : 
                          `Showing logs until ${formatDateForDisplay(dateTo)}`
                      }
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">Quick filters:</span>
                <button 
                  onClick={() => setQuickDateRange(1)}
                  className="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 transition-colors border border-blue-200 text-blue-700 font-medium shadow-sm"
                >
                  Today
                </button>
                <button 
                  onClick={() => setQuickDateRange(7)}
                  className="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 transition-colors border border-blue-200 text-blue-700 font-medium shadow-sm"
                >
                  Last 7 days
                </button>
                <button 
                  onClick={() => setQuickDateRange(30)}
                  className="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 transition-colors border border-blue-200 text-blue-700 font-medium shadow-sm"
                >
                  Last 30 days
                </button>
                <button 
                  onClick={() => setLevelFilter('error')}
                  className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors border border-red-200 font-medium shadow-sm"
                >
                  Errors only
                </button>
                <button 
                  onClick={() => setCategoryFilter('chat')}
                  className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors border border-blue-200 font-medium shadow-sm"
                >
                  Chat logs
                </button>
              </div>

              {(levelFilter || categoryFilter || dateFrom || dateTo) && (
                <div className="mt-2 mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  <span className="font-semibold">Filters applied:</span>{' '}
                  {levelFilter && <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded mr-1 text-xs">Level: {levelFilter}</span>}
                  {categoryFilter && <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded mr-1 text-xs">Category: {categoryFilter}</span>}
                  {dateFrom && <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded mr-1 text-xs">From: {formatDateForDisplay(dateFrom)}</span>}
                  {dateTo && <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded mr-1 text-xs">To: {formatDateForDisplay(dateTo)}</span>}
                </div>
              )}
              
              <div className="flex justify-between mt-4 border-t pt-4">
                <div className="text-sm text-gray-500">
                  {totalLogs > 0 && (
                    <span>Found <strong className="text-blue-700">{totalLogs}</strong> log entries</span>
                  )}
                </div>
                <button 
                  onClick={resetFilters}
                  className="px-3 py-1 text-sm bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors text-red-700"
                >
                  Reset filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="text-center p-10">
          <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Loading your activity logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No logs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No logs match your current filters. Try changing your filters or check back later.
          </p>
          {(levelFilter || categoryFilter || dateFrom || dateTo) && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 text-sm rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border shadow-sm mb-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    {isAdmin && (
                      <>
                        <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversation</th>
                      </>
                    )}
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <div className="font-medium">{formatTimestamp(log.timestamp)}</div>
                        <div className="text-xs text-gray-500">{timeAgo(log.timestamp)}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(log.level).text} ${getLevelColor(log.level).bg} border ${getLevelColor(log.level).border}`}>
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center">
                          <span className="mr-1 text-lg" aria-hidden="true">{getCategoryIcon(log.category)}</span>
                          <span className={`px-2 py-1 rounded ${
                            log.category.toLowerCase() === 'auth' 
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                              : log.category.toLowerCase() === 'system'
                                ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                : log.category.toLowerCase() === 'chat'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : 'bg-gray-100 text-gray-800 border border-gray-300'
                          }`}>
                            {log.category.charAt(0).toUpperCase() + log.category.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">
                        {log.message}
                      </td>
                      {isAdmin && (
                        <>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {log.user_id ? (
                              <span className="px-2 py-1 text-xs rounded bg-gray-100">{log.user_id.substring(0, 8)}...</span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {log.conversation_id ? (
                              <span className="px-2 py-1 text-xs rounded bg-gray-100">{log.conversation_id.substring(0, 8)}...</span>
                            ) : '-'}
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4 text-sm">
                        {log.metadata ? (
                          <div>
                            <button 
                              onClick={() => setDetailsOpen(detailsOpen === log.id ? null : log.id)}
                              className="bg-blue-600 border-2 border-blue-400 text-white hover:bg-blue-700 flex items-center text-sm transition-colors px-3 py-1.5 rounded-md w-fit shadow-md font-medium"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-2 transition-transform ${detailsOpen === log.id ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                              {detailsOpen === log.id ? 'Hide Details' : 'View Details'}
                            </button>
                            
                            {detailsOpen === log.id && (
                              <div className="mt-3 bg-white rounded-lg border-2 border-blue-300 overflow-hidden shadow-lg">
                                <div className="bg-blue-100 px-4 py-2 border-b-2 border-blue-300 text-blue-800 font-medium text-sm">
                                  Details for log entry
                                </div>
                                <pre className="p-4 bg-white text-sm overflow-auto max-h-40 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 text-gray-900">
                                  <code className="block whitespace-pre-wrap">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </code>
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-600 px-3 py-1.5 bg-gray-100 rounded-md border border-gray-300 inline-block font-medium">No details</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-semibold">{logs.length}</span> results
              {totalLogs > 0 && (
                <span> - Page <span className="font-semibold">{page + 1}</span> of <span className="font-semibold">{Math.ceil(totalLogs / pageSize)}</span></span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                aria-label="Previous page"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={logs.length < pageSize}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                aria-label="Next page"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 