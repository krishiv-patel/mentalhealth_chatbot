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
            <img 
              src={profile?.avatar_url || "https://img.icons8.com/?size=100&id=tZuAOUGm9AuS&format=png&color=000000"} 
              alt={user?.email || ''} 
              className="w-full h-full object-cover"
            />
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