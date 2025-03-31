import React, { useState } from 'react';
import { X, Download, FileText, Clock, MessageSquare, ClipboardCheck, ArrowRight, Share2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';

interface ReportPreviewModalProps {
  title: string;
  timestamp: string;
  stats: {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    attachments: number;
    averageResponseTime: string;
    totalDuration: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload: (phoneNumber?: string) => void;
  userPhoneNumber?: string | null;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  title,
  timestamp,
  stats,
  isOpen,
  onClose,
  onDownload,
  userPhoneNumber
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'details'>('preview');
  const [downloadHovered, setDownloadHovered] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('+918799399723');
  const [sendSms, setSendSms] = useState(true);

  if (!isOpen) return null;

  const handleDownload = () => {
    onDownload(phoneNumber);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300 
              }}
              className="w-full max-w-3xl bg-background rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Blurred decorative elements */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl opacity-20" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/30 rounded-full blur-3xl opacity-20" />
              
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary to-secondary p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Export Chat Report</h2>
                    <p className="text-white/80 mt-1">{title}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full h-8 w-8 p-0 text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="mt-4 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'preview' 
                          ? 'bg-white/20 text-white' 
                          : 'hover:bg-white/10 text-white/70'
                      }`}
                      onClick={() => setActiveTab('preview')}
                    >
                      Preview
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        activeTab === 'details' 
                          ? 'bg-white/20 text-white' 
                          : 'hover:bg-white/10 text-white/70'
                      }`}
                      onClick={() => setActiveTab('details')}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {activeTab === 'preview' ? (
                  <div className="space-y-6">
                    <div className="bg-card rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">{title}</h3>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{timestamp}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Messages</span>
                          </div>
                          <span className="text-2xl font-bold">{stats.totalMessages}</span>
                          <div className="mt-1 flex justify-center gap-2 text-xs text-muted-foreground">
                            <span>{stats.userMessages} user</span>
                            <span>{stats.assistantMessages} assistant</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Duration</span>
                          </div>
                          <span className="text-2xl font-bold">{stats.totalDuration}</span>
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span>Avg: {stats.averageResponseTime}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardCheck className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Attachments</span>
                          </div>
                          <span className="text-2xl font-bold">{stats.attachments}</span>
                          <div className="mt-1 text-xs text-muted-foreground">
                            <span>Included in report</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="relative mt-4">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card pointer-events-none z-10" />
                        <div className="max-h-64 overflow-hidden rounded-lg border border-border">
                          <div className="p-4 space-y-3">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                                <span className="text-xs text-primary font-medium">You</span>
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">5:44:07 PM</span>
                                </div>
                                <div className="p-3 rounded-lg bg-primary/10">
                                  <p className="text-sm">Hi</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-secondary/20 flex-shrink-0 flex items-center justify-center">
                                <span className="text-xs text-secondary font-medium">AI</span>
                              </div>
                              <div className="flex-1 space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-xs text-muted-foreground">5:44:10 PM</span>
                                </div>
                                <div className="p-3 rounded-lg bg-secondary/10">
                                  <p className="text-sm">Hello! How can I assist you today?</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-card rounded-lg p-4 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">Report Contents</h3>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Complete Message History</p>
                            <p className="text-xs text-muted-foreground">All {stats.totalMessages} messages with timestamps</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </li>
                        
                        <li className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Analytics & Statistics</p>
                            <p className="text-xs text-muted-foreground">Response times, message counts, duration</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </li>
                        
                        {stats.attachments > 0 && (
                          <li className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-accent" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Attachments</p>
                              <p className="text-xs text-muted-foreground">{stats.attachments} file(s) with download links</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </li>
                        )}
                        
                        <li className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                            <Share2 className="h-4 w-4 text-destructive" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Shareable Format</p>
                            <p className="text-xs text-muted-foreground">HTML file viewable in any browser</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="border-t p-4 flex flex-col gap-4 bg-card/50">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="sms-notification" 
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="sms-notification" className="text-sm">
                    Send SMS notification to +918799399723
                  </label>
                </div>
                
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button 
                      onClick={handleDownload}
                      className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white min-w-[200px]"
                      onMouseEnter={() => setDownloadHovered(true)}
                      onMouseLeave={() => setDownloadHovered(false)}
                    >
                      <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: downloadHovered ? 5 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download HTML Report</span>
                      </motion.div>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}; 