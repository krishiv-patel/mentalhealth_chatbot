import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { 
  MessageSquare, 
  Heart, 
  Brain, 
  Sparkles, 
  Shield, 
  ChevronRight, 
  Clock, 
  ArrowRight, 
  PanelRight,
  Smile,
  HeartPulse,
  BookOpen,
  Users
} from 'lucide-react';
import { useProfileStore } from '../store/useProfileStore';
import { Header } from '../components/Header';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 + 0.2 }}
      className="bg-card relative overflow-hidden rounded-2xl p-6 group shadow-md hover:shadow-xl transition-all duration-300 border border-border/50"
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full group-hover:bg-primary/10 transition-all duration-300" />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
};

export const HomePage: React.FC = () => {
  const { profile, fetchProfile } = useProfileStore();
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  // Fetch profile if user is logged in but profile is not loaded
  useEffect(() => {
    if (profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);
  
  const welcomeMessages = [
    "How are you feeling today?",
    "Discuss your thoughts in a safe space...",
    "Find strategies for managing anxiety and stress...",
    "Let's work together on your mental wellbeing...",
  ];

  // Typing animation effect
  useEffect(() => {
    const targetText = welcomeMessages[messageIndex];
    if (isTyping) {
      if (currentText.length < targetText.length) {
        const timeout = setTimeout(() => {
          setCurrentText(targetText.slice(0, currentText.length + 1));
        }, 40);
        return () => clearTimeout(timeout);
      } else {
        setIsTyping(false);
        const timeout = setTimeout(() => {
          setIsTyping(true);
          setMessageIndex((messageIndex + 1) % welcomeMessages.length);
          setCurrentText('');
        }, 3000);
        return () => clearTimeout(timeout);
      }
    } else {
      const timeout = setTimeout(() => {
        setIsTyping(true);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isTyping, currentText, messageIndex, welcomeMessages]);

  // Trigger animation when component mounts
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30 text-foreground transition-colors duration-500">
      {/* Use the Header component */}
      <Header />

      {/* Hero Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                Your Supportive AI
                <span className="block gradient-text mt-2">Mental Health Companion</span>
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-8 text-xl text-muted-foreground"
            >
              <p>A safe space to talk, reflect, and develop coping strategies.</p>
            </motion.div>

            {/* Typing Animation */}
            <div className="bg-card border rounded-xl p-6 mb-10 shadow-lg max-w-3xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-indigo-400 to-teal-400"></div>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex-shrink-0 flex items-center justify-center">
                  <HeartPulse className="h-5 w-5 text-rose-500" />
                </div>
                <div className="flex-1 text-left">
                  <div className="h-6 mb-2 flex items-center">
                    <span className="font-medium">MindfulAI</span>
                    <span className="text-xs px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-full ml-2">Assistant</span>
                  </div>
                  <div className="min-h-[56px] flex items-center">
                    <p className="text-lg">{currentText}
                      <AnimatePresence mode="wait">
                        {isTyping && currentText.length < welcomeMessages[messageIndex].length && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, repeat: Infinity, repeatType: 'reverse' }}
                            className="inline-block w-2 h-4 bg-foreground ml-1"
                          />
                        )}
                      </AnimatePresence>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/chat">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="gap-2 min-w-[200px] bg-gradient-to-r from-rose-500 to-indigo-500 text-white">
                    <Heart className="h-4 w-4" />
                    <span>Start Chatting</span>
                  </Button>
                </motion.div>
              </Link>
              <Link to="/about">
                <Button variant="outline" size="lg" className="gap-2 min-w-[200px]">
                  <PanelRight className="h-4 w-4" />
                  <span>Learn More</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Mental Health Support</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              MindfulAI offers compassionate support for your mental wellbeing with evidence-based 
              approaches and personalized guidance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Heart className="h-6 w-6 text-rose-500" />}
              title="Emotional Support"
              description="24/7 compassionate listening and support for your feelings and concerns without judgment."
              delay={1}
            />
            <FeatureCard
              icon={<Brain className="h-6 w-6 text-indigo-500" />}
              title="CBT Techniques"
              description="Cognitive behavioral therapy strategies to help identify and change negative thought patterns."
              delay={2}
            />
            <FeatureCard
              icon={<Smile className="h-6 w-6 text-amber-500" />}
              title="Mood Tracking"
              description="Monitor your emotional patterns over time to gain insights into your mental wellbeing."
              delay={3}
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-teal-500" />}
              title="Private & Secure"
              description="Your conversations are private and secure, creating a safe space for honest discussion."
              delay={4}
            />
            <FeatureCard
              icon={<BookOpen className="h-6 w-6 text-blue-500" />}
              title="Guided Resources"
              description="Access to mindfulness exercises, meditation guides, and evidence-based mental health information."
              delay={5}
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-purple-500" />}
              title="Crisis Support"
              description="Resources and guidance for difficult moments, with connections to professional help when needed."
              delay={6}
            />
          </div>
        </div>
      </section>

      {/* Get Started */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card rounded-2xl p-8 md:p-12 shadow-xl border relative overflow-hidden">
            <div className="absolute -right-32 -top-32 w-64 h-64 bg-rose-500/10 rounded-full blur-2xl" />
            <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Begin Your Wellness Journey</h2>
                  <p className="text-muted-foreground mb-6">
                    Take the first step toward better mental health with compassionate AI support
                    designed to help you manage stress, anxiety, and more.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 text-green-500 rounded-full px-3 py-1 text-xs font-medium">
                      No Waitlists
                    </div>
                    <div className="bg-indigo-500/20 text-indigo-500 rounded-full px-3 py-1 text-xs font-medium">
                      Available 24/7
                    </div>
                    <div className="bg-amber-500/20 text-amber-500 rounded-full px-3 py-1 text-xs font-medium">
                      Free Access
                    </div>
                  </div>
                </div>
                
                <Link to="/chat">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-block"
                  >
                    <Button size="lg" className="gap-2 px-8 bg-gradient-to-r from-rose-500 to-indigo-500 text-white">
                      <span>Get Started</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> MindfulAI is designed to provide support and information, 
              but is not a replacement for professional mental health care. If you're experiencing 
              a crisis or need immediate help, please contact a mental health professional, 
              call a crisis hotline, or go to your local emergency room.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t bg-card/30">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Branding & About - 4 columns on desktop */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <HeartPulse className="h-6 w-6 text-rose-500" />
                <span className="font-bold text-xl gradient-text">MindfulAI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Your supportive AI mental health companion. A safe space to talk, reflect, 
                and develop coping strategies.
              </p>
              <div className="flex items-center gap-3 pt-4">
                <motion.a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </motion.a>
                <motion.a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                </motion.a>
                <motion.a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </motion.a>
              </div>
            </div>
            
            {/* Links Sections - 8 columns on desktop, divided into 3 parts */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Product Links */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link to="/resources" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Resources
                    </Link>
                  </li>
                  <li>
                    <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Chat Now
                    </Link>
                  </li>
                  <li>
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full ml-1">v1.0.0</span>
                  </li>
                </ul>
              </div>
              
              {/* Legal Links */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">Legal</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/disclaimer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Disclaimer
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* Newsletter / Contact */}
              <div className="space-y-3">
                <h4 className="font-semibold text-primary">Stay Connected</h4>
                <p className="text-sm text-muted-foreground">Get updates on mental health resources</p>
                <div className="flex gap-2 mt-2">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="text-sm rounded-md py-2 px-3 bg-muted/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary flex-1"
                  />
                  <Button variant="outline" size="sm" className="shrink-0">
                    Subscribe
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom footer - Copyright */}
        <div className="border-t mt-12 pt-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-xs text-muted-foreground mb-4 md:mb-0">
                © {new Date().getFullYear()} MindfulAI. All rights reserved.
              </div>
              <div className="text-xs text-muted-foreground">
                Made with <span className="text-rose-500">♥</span> by Krishiv, Yagna & Ayush
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 