
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabase';
import { Post, Profile, PostCategory } from './types';
import { PostCard } from './components/PostCard';
import { PostModal } from './components/PostModal';
import { PostForm } from './components/PostForm';
import { Button } from './components/Button';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { PublicProfileModal } from './components/PublicProfileModal';
import { SearchBar } from './components/SearchBar';
import { Dashboard } from './components/Dashboard';
import { CirclesView } from './components/CirclesView';

type AppView = 'salon' | 'dashboard' | 'circles';

const App: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const [currentView, setCurrentView] = useState<AppView>('salon');
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data));
    } else {
      setProfile(null);
      if (currentView === 'dashboard') setCurrentView('salon');
    }
  }, [session]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles:user_id(avatar_url)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) { console.error(error); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Handle post ID in URL for sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    if (postId && posts.length > 0) {
      const found = posts.find(p => p.id === postId);
      if (found) setSelectedPost(found);
    }
  }, [posts]);

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const handleSavePost = async (postData: any) => {
    try {
      if (postData.id) {
        const { error } = await supabase.from('posts').update(postData).eq('id', postData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('posts').insert([{ ...postData, user_id: session?.user?.id || null }]);
        if (error) throw error;
      }
      setIsFormOpen(false); setEditingPost(null); await fetchPosts();
    } catch (err: any) { alert(err.message); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Supprimer cet exposé ?")) return;
    await supabase.from('posts').delete().eq('id', postId);
    if (selectedPost?.id === postId) setSelectedPost(null);
    await fetchPosts();
  };

  const handleProtectedAction = (action: () => void) => {
    if (!session) {
      setIsAuthOpen(true);
    } else {
      action();
    }
  };

  const displayPosts = useMemo(() => {
    let result = posts;
    if (currentView === 'dashboard' && session?.user?.id) result = result.filter(p => p.user_id === session.user.id);
    if (filter !== 'all') result = result.filter(p => p.category === filter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.book_title.toLowerCase().includes(q) || 
        p.book_author.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, currentView, filter, searchQuery, session]);

  const categories = useMemo(() => ['all', ...Object.values(PostCategory)], []);

  return (
    <div className="min-h-screen pb-12 bg-[#fdfbf7]">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-stone-900 to-amber-200 z-[60]"></div>
      
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="h-14 md:h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentView('salon'); window.scrollTo(0,0); }}>
              <div className="w-8 h-8 md:w-11 md:h-11 bg-stone-900 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-lg"><span className="font-serif text-lg md:text-2xl font-bold">R</span></div>
              <h1 className="font-serif text-lg md:text-2xl font-extrabold text-stone-900 hidden sm:block">Les Rhéteurs</h1>
            </div>

            <div className="hidden md:flex items-center gap-6 mx-8">
              {['salon', 'circles', 'dashboard'].map((view) => (
                (!session && view === 'dashboard') ? null : (
                <button key={view} onClick={() => setCurrentView(view as AppView)} className={`text-xs font-bold uppercase tracking-[0.2em] transition-all pb-1 border-b-2 ${currentView === view ? 'text-stone-900 border-amber-500' : 'text-stone-400 border-transparent hover:text-stone-700'}`}>
                  {view === 'salon' ? 'Le Salon' : view === 'circles' ? 'Cercles' : 'Mon Espace'}
                </button>)
              ))}
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <Button variant="primary" className="hidden sm:flex px-6 py-2.5" onClick={() => handleProtectedAction(() => { setEditingPost(null); setIsFormOpen(true); })}>Partager</Button>
              <button onClick={() => handleProtectedAction(() => { setEditingPost(null); setIsFormOpen(true); })} className="sm:hidden w-8 h-8 bg-amber-500 text-stone-900 rounded-full flex items-center justify-center shadow-lg"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg></button>
              {session ? (
                <button onClick={() => setIsProfileOpen(true)} className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-stone-200 overflow-hidden shadow-sm">
                  {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-stone-100" />}
                </button>
              ) : (
                <button onClick={() => setIsAuthOpen(true)} className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-widest px-2">Connexion</button>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center justify-center gap-4 h-10 pb-2">
            {[
              { id: 'salon', label: 'Salon' },
              { id: 'circles', label: 'Cercles' },
              { id: 'dashboard', label: 'Moi', auth: true }
            ].map((tab) => {
              if (tab.auth && !session) return null;
              const active = currentView === tab.id;
              return (
                <button key={tab.id} onClick={() => { setCurrentView(tab.id as AppView); }} className={`relative px-1 text-[10px] font-bold uppercase tracking-widest ${active ? 'text-stone-900' : 'text-stone-400'}`}>
                  {tab.label} {active && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-amber-500"></span>}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <header className="pt-10 md:pt-20 pb-8 text-center px-4">
        <h2 className="font-serif text-3xl md:text-7xl text-stone-900 mb-6 leading-tight">
          {currentView === 'salon' && <>Le salon des <br/><span className="italic font-normal text-amber-700">belles lettres.</span></>}
          {currentView === 'dashboard' && <>Votre espace <br/><span className="italic font-normal text-amber-700">de réflexion.</span></>}
          {currentView === 'circles' && <>Les cercles <br/><span className="italic font-normal text-amber-700">de lecture.</span></>}
        </h2>
        {currentView !== 'circles' && <div className="max-w-2xl mx-auto px-4 mt-4"><SearchBar posts={posts} onSearch={setSearchQuery} /></div>}
      </header>

      <section className="max-w-7xl mx-auto px-4 md:px-6">
        {currentView !== 'circles' && (
          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-2 rounded-full text-[10px] font-bold border transition-colors ${filter === cat ? 'bg-stone-900 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'}`}>{cat === 'all' ? 'Tout' : cat}</button>
            ))}
          </div>
        )}

        {loading ? <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-stone-100 h-64 rounded-3xl"></div>)}</div> : (
          <div>
            {currentView === 'salon' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">{displayPosts.map(post => <PostCard key={post.id} post={post} onClick={setSelectedPost} onUserClick={setViewedUserId} />)}</div>}
            {currentView === 'dashboard' && <Dashboard posts={displayPosts} onEdit={startEdit} onDelete={handleDeletePost} onView={setSelectedPost} />}
            {currentView === 'circles' && <CirclesView currentUserId={session?.user?.id} onAuthRequired={() => setIsAuthOpen(true)} onUserClick={setViewedUserId} />}
          </div>
        )}
      </section>

      {viewedUserId && <PublicProfileModal userId={viewedUserId} onClose={() => setViewedUserId(null)} onPostClick={(p) => { setViewedUserId(null); setSelectedPost(p); }} />}
      {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} onEdit={startEdit} onDelete={handleDeletePost} currentUserId={session?.user?.id} currentUserName={profile?.full_name || 'Un Rhéteur'} />}
      {isFormOpen && <PostForm onSave={handleSavePost} onCancel={() => { setIsFormOpen(false); setEditingPost(null); }} initialData={editingPost} />}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
      {isProfileOpen && session && <ProfileModal userId={session.user.id} onClose={() => setIsProfileOpen(false)} />}
    </div>
  );
};

export default App;
