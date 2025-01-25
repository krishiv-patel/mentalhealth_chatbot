import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './ui/Button';
import { Brain, Mail, Lock } from 'lucide-react';

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
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
          onClick={() => setIsLogin(!isLogin)}
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