
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Profile } from '../types';
import { Button } from './Button';

interface ProfileModalProps {
  userId: string;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ userId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getProfile();
  }, [userId]);

  async function getProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`username, full_name, avatar_url, bio`)
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile({ 
        full_name: data?.full_name || '',
        username: data?.username || '',
        avatar_url: data?.avatar_url || '',
        bio: data?.bio || '',
        id: userId 
      } as Profile);
    } catch (error: any) {
      console.error('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setUpdating(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        full_name: profile.full_name,
        username: profile.username || null,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      
      if (error) throw error;
      alert("Profil mis à jour avec succès !");
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      alert("Erreur lors de la mise à jour: " + error.message);
    } finally {
      setUpdating(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Vous devez sélectionner une image.');
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
    } catch (error: any) {
      alert("Erreur d'upload: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white p-8 rounded-xl animate-pulse">Chargement du profil...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
        <h2 className="font-serif text-3xl text-stone-900 mb-6">Mon Profil</h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-100 bg-stone-100">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300 font-serif text-4xl">
                  {profile?.full_name?.charAt(0) || '?'}
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <span className="text-white text-xs font-bold uppercase tracking-widest">Éditer</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={uploadAvatar} 
                disabled={uploading} 
              />
            </label>
          </div>
          {uploading && <span className="text-[10px] text-amber-600 font-bold mt-2 animate-pulse">CHARGEMENT...</span>}
        </div>

        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Nom Complet</label>
            <input 
              required
              type="text" 
              value={profile?.full_name || ''}
              onChange={e => setProfile({ ...profile!, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Nom d'utilisateur</label>
            <input 
              type="text" 
              value={profile?.username || ''}
              onChange={e => setProfile({ ...profile!, username: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="@votre_nom"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Bio</label>
            <textarea 
              rows={3}
              value={profile?.bio || ''}
              onChange={e => setProfile({ ...profile!, bio: e.target.value })}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg outline-none resize-none focus:ring-2 focus:ring-amber-500"
              placeholder="Amoureux des lettres..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" isLoading={updating} className="flex-1">Sauvegarder</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
