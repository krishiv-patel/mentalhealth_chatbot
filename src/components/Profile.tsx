import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, X } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import UserType from '@supabase/supabase-js'
interface ProfilePopupProps {
  user: UserType.User | null;
}

const Profile: React.FC<ProfilePopupProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="hover:scale-105 transition-transform"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center">
          {user?
          //.imageUrl ? 
          (
            <img 
              src="https://avatars.githubusercontent.com/u/134359857?s=96&v=4"//{user.imageUrl} 
              alt={user?.email} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-zinc-500" />
          )}
        </div>
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
                "w-full max-w-md p-6 rounded-lg shadow-lg",
                "bg-white dark:bg-zinc-900",
                "border border-zinc-200 dark:border-zinc-800"
              )}
            >
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="hover:rotate-90 transition-transform"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center">
                  {user? (
                    <img 
                      src="https://avatars.githubusercontent.com/u/134359857?s=96&v=4"//{user.imageUrl} 
                      alt={user?.email} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-zinc-500" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {user?.email}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Profile;