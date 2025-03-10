import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { 
  Brain, 
  Mail, 
  Lock, 
  User, 
  Calendar, 
  Users, 
  AlertCircle, 
  Heart,
  Shield,
  Sparkles,
  HeartPulse
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const FeatureCard = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center gap-2 bg-card/50 backdrop-blur-sm p-2 rounded-lg"
  >
    <div className="text-primary">{icon}</div>
    <span className="text-sm text-muted-foreground">{title}</span>
  </motion.div>
);

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();

  const validateSignupForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!gender) {
      errors.gender = 'Gender is required';
    }
    
    if (!dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});
    setIsLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!validateSignupForm()) {
          setIsLoading(false);
          return;
        }

        const { data, error: signUpError } = await signUp(email, password);
        
        if (signUpError) throw signUpError;
        
        if (data?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              first_name: firstName,
              last_name: lastName,
              gender: gender,
              date_of_birth: dateOfBirth,
            })
            .eq('id', data.user.id);
            
          if (profileError) {
            console.error('Error updating profile:', profileError);
            throw new Error('Failed to create profile. Please try again.');
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.2, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute top-20 left-20 w-[500px] h-[500px] rounded-full bg-rose-300/20 mix-blend-multiply blur-[100px]"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: 1
          }}
          className="absolute bottom-0 right-20 w-[600px] h-[600px] rounded-full bg-indigo-300/20 mix-blend-multiply blur-[120px]"
        />
      </div>

      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Features */}
        <AnimatePresence mode="wait">
          {isLogin ? (
            <motion.div
              key="login-features"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hidden lg:flex flex-col gap-6 p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <HeartPulse className="h-8 w-8 text-rose-500" />
                </motion.div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-indigo-500">
                  MindfulAI Chat
                </h2>
              </div>
              
              <h3 className="text-3xl font-bold mb-4">Your Mental Wellness Journey Begins Here</h3>
              <p className="text-muted-foreground mb-8">
                Join thousands of users who have found support, understanding, and growth through our AI-powered mental wellness platform.
              </p>
              
              <div className="space-y-4">
                <FeatureCard icon={<Heart className="h-5 w-5" />} title="24/7 Emotional Support" />
                <FeatureCard icon={<Shield className="h-5 w-5" />} title="Private & Secure" />
                <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="AI-Powered Insights" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="signup-features"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="hidden lg:flex flex-col gap-6 p-8"
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="h-8 w-8 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
                  Join Our Community
                </h2>
              </div>
              
              <h3 className="text-3xl font-bold mb-4">Start Your Wellness Journey Today</h3>
              <p className="text-muted-foreground mb-8">
                Create your account to access personalized support, track your progress, and connect with our AI-powered wellness companion.
              </p>
              
              <div className="space-y-4">
                <FeatureCard icon={<Heart className="h-5 w-5" />} title="Personalized Support" />
                <FeatureCard icon={<Shield className="h-5 w-5" />} title="Confidential & Safe" />
                <FeatureCard icon={<Sparkles className="h-5 w-5" />} title="Progress Tracking" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Side - Auth Form */}
        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl ring-1 ring-border/50"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="flex justify-center mb-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="absolute -inset-1 rounded-full bg-gradient-to-r from-rose-400/30 to-indigo-400/30 blur-sm"
                  />
                  <Brain className="h-12 w-12 text-primary relative" />
                </div>
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500"
              >
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mt-2"
              >
                {isLogin
                  ? 'Sign in to continue your journey'
                  : 'Start your mental wellness journey'}
              </motion.p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    placeholder="Email address"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                    placeholder="Password"
                  />
                </motion.div>

                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className={cn(
                              "w-full pl-10 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 focus:ring-primary/50 transition-all duration-200",
                              validationErrors.firstName ? "border-red-500" : ""
                            )}
                            placeholder="First Name *"
                          />
                          {validationErrors.firstName && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {validationErrors.firstName}
                            </p>
                          )}
                        </div>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className={cn(
                              "w-full pl-10 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 focus:ring-primary/50 transition-all duration-200",
                              validationErrors.lastName ? "border-red-500" : ""
                            )}
                            placeholder="Last Name *"
                          />
                          {validationErrors.lastName && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {validationErrors.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <select
                          required
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className={cn(
                            "w-full pl-10 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 focus:ring-primary/50 transition-all duration-200 appearance-none",
                            validationErrors.gender ? "border-red-500" : ""
                          )}
                        >
                          <option value="">Select Gender *</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="non-binary">Non-binary</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                        {validationErrors.gender && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {validationErrors.gender}
                          </p>
                        )}
                      </div>

                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <input
                          type="date"
                          required
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className={cn(
                            "w-full pl-10 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 focus:ring-primary/50 transition-all duration-200",
                            validationErrors.dateOfBirth ? "border-red-500" : ""
                          )}
                        />
                        {validationErrors.dateOfBirth && (
                          <p className="text-red-500 text-xs mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {validationErrors.dateOfBirth}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-rose-500 to-indigo-500 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </motion.div>
                  ) : null}
                  {isLoading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
                </Button>
              </motion.div>
            </form>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setValidationErrors({});
              setError('');
            }}
            className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 w-full text-center"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </motion.button>
        </div>
      </div>
    </div>
  );
};