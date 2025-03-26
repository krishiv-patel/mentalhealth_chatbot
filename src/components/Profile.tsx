import React, { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from './ui/Button';
import ProfileModal from './ProfileModal';
import UserType from '@supabase/supabase-js';
import { useProfileStore } from '../store/useProfileStore';

interface ProfileProps {
  user: UserType.User | null;
}

const Profile: React.FC<ProfileProps> = ({ user }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useProfileStore();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="hover:scale-105 transition-transform"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 flex items-center justify-center">
          {user ? (
            profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile?.first_name || user?.email || ''} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-400 to-indigo-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
            )
          ) : (
            <User className="h-4 w-4 text-zinc-500" />
          )}
        </div>
      </Button>

      <ProfileModal 
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default Profile;