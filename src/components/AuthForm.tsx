import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { Brain, Mail, Lock, User, Calendar, Users, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

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

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        // Validate signup form
        if (!validateSignupForm()) {
          return; // Stop if validation fails
        }

        // Sign up the user
        const { data, error: signUpError } = await signUp(email, password);
        
        if (signUpError) throw signUpError;
        
        // If signup successful, update the profile with required fields
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 px-4">
      <div className="max-w-md w-full animate-scale-in">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12 text-primary animate-bounce-in" />
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-muted-foreground mt-2 animate-fade-in">
            {isLogin
              ? 'Sign in to continue your journey'
              : 'Start your mental wellness journey'}
          </p>
        </div>
        
        <div className="bg-card/50 backdrop-blur-lg rounded-2xl p-8 shadow-xl ring-1 ring-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg animate-shake">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                  placeholder="Email address"
                />
              </div>
              
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background/50 focus:ring-2 focus:ring-primary/50 transition-all duration-200"
                  placeholder="Password"
                />
              </div>

              {!isLogin && (
                <>
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
                      placeholder="Date of Birth *"
                    />
                    {validationErrors.dateOfBirth && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {validationErrors.dateOfBirth}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              type="submit"
              className="w-full hover-lift"
            >
              {isLogin ? 'Sign in' : 'Sign up'}
            </Button>
          </form>
        </div>
        
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setValidationErrors({}); // Clear validation errors when switching modes
            setError('');
          }}
          className="mt-6 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 w-full text-center"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};