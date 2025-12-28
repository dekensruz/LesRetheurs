
import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { supabase } from './supabase';
import { Post, Profile } from './types';
import { PostCard } from './components/PostCard';
import { PostModal } from './components/PostModal';
import { PostForm } from './components/PostForm';
import { Button } from './components/Button';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { SearchBar } from './components/SearchBar';
import { Dashboard } from './components/Dashboard';

type AppView = 'salon' | 'dashboard';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      supabase.from('profiles').select('*').eq('id', session.user.id).single()
        .then(({ data }) => setProfile(data));
    } else {
      setProfile(null);
      setCurrentView('salon');
    }
  }, [session]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSavePost = async (postData: any) => {
    try {
      if (postData.id) {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postData.id);
        if (error) throw error;
      } else {
        const postToSave = {
          ...postData,
          user_id: session?.user?.id || null
        };
        const { error } = await supabase.from('posts').insert([postToSave]);
        if (error) throw error;
      }
      
      setIsFormOpen(false);
      setEditingPost(null);
      await fetchPosts();
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet exposé ?")) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      if (selectedPost?.id === postId) setSelectedPost(null);
      await fetchPosts();
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  const startEdit = (post: Post) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayPosts = useMemo(() => {
    let result = posts;
    if (currentView === 'dashboard' && session?.user?.id) {
      result = result.filter(p => p.user_id === session.user.id);
    }
    if (filter !== 'all') {
      result = result.filter(p => p.category === filter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.book_title.toLowerCase().includes(q) || 
        p.book_author.toLowerCase().includes(q) ||
        p.user_name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, currentView, filter, searchQuery, session]);

  return (
    <div className="min-h-screen pb-20 selection:bg-amber-200 bg-[#fdfbf7]">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-stone-900 to-amber-200 z-50"></div>
      
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4 group cursor-pointer" onClick={() => { setCurrentView('salon'); scrollToTop(); }}>
            <div className="w-8 h-8 md:w-11 md:h-11 bg-stone-900 rounded-xl flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
              <span className="font-serif text-lg md:text-2xl font-bold">R</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-serif text-sm md:text-2xl font-extrabold text-stone-900 tracking-tight leading-none">Les Rhéteurs</h1>
              <span className="hidden xs:block text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-amber-600 mt-0.5 md:mt-1">L'Agora Littéraire</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-4">
            {session ? (
              <>
                <button 
                  onClick={() => setCurrentView(currentView === 'salon' ? 'dashboard' : 'salon')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${currentView === 'dashboard' ? 'bg-amber-100 text-amber-900' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'}`}
                >
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="xs:inline">{currentView === 'salon' ? 'Mon Espace' : 'Le Salon'}</span>
                </button>
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-stone-200 overflow-hidden hover:scale-105 transition-transform shadow-sm shrink-0"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-[10px]">
                      {profile?.full_name?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>
              </>
            ) : (
              <button onClick={() => setIsAuthOpen(true)} className="text-[10px] md:text-sm font-bold text-stone-600 hover:text-stone-900 uppercase tracking-widest mr-1">
                Connexion
              </button>
            )}
            <Button variant="primary" className="text-[10px] md:text-base px-2.5 py-1.5 md:px-6 md:py-2.5 shrink-0" onClick={() => { setEditingPost(null); setIsFormOpen(true); }}>
              Partager
            </Button>
          </div>
        </div>
      </nav>

      <header className="relative pt-12 md:pt-20 pb-8 md:pb-12 text-center px-4">
        <h2 className="font-serif text-3xl md:text-7xl text-stone-900 mb-6 leading-tight">
          {currentView === 'salon' ? (
            <>Le salon des <br/><span className="italic font-normal text-amber-700">belles lettres.</span></>
          ) : (
            <>Votre espace <br/><span className="italic font-normal text-amber-700">de réflexion.</span></>
          )}
        </h2>
        
        <div className="max-w-2xl mx-auto px-2 mt-8">
          <SearchBar 
            posts={posts} 
            onSearch={setSearchQuery} 
            placeholder={currentView === 'salon' ? "Chercher au salon..." : "Chercher vos exposés..."}
          />
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Bouton Mon Espace positionné juste avant la section du salon */}
        {session && (
          <div className="flex justify-center mb-10">
            <button 
              onClick={() => setCurrentView(currentView === 'salon' ? 'dashboard' : 'salon')}
              className="group flex items-center gap-3 px-6 py-3 bg-white border border-stone-200 rounded-2xl shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <span className="font-bold text-[10px] md:text-xs text-stone-600 tracking-widest uppercase">
                {currentView === 'salon' ? 'Accéder à mon espace personnel' : 'Retourner au salon public'}
              </span>
            </button>
          </div>
        )}

        <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex flex-nowrap md:flex-wrap justify-start md:justify-center gap-2 md:gap-3">
            {['all', 'Fiction', 'Non-Fiction', 'Philosophie', 'Poésie', 'Histoire'].map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] md:text-sm font-bold transition-all duration-300 border ${filter === cat ? 'bg-stone-900 border-stone-900 text-white shadow-lg' : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'}`}
              >
                {cat === 'all' ? 'Toutes catégories' : cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="animate-pulse bg-stone-100 h-64 rounded-3xl"></div>)}
          </div>
        ) : (
          <div className="animate-in fade-in duration-700">
            {currentView === 'salon' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {displayPosts.map(post => (
                  <PostCard key={post.id} post={post} onClick={setSelectedPost} />
                ))}
              </div>
            ) : (
              <Dashboard 
                posts={displayPosts} 
                onEdit={startEdit} 
                onDelete={handleDeletePost} 
                onView={setSelectedPost} 
              />
            )}
            
            {displayPosts.length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-stone-200">
                <p className="text-stone-400 font-serif italic text-xl">Aucun résultat trouvé...</p>
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="mt-4 text-amber-600 font-bold hover:underline">Réinitialiser la recherche</button>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {selectedPost && (
        <PostModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
          onEdit={startEdit}
          onDelete={handleDeletePost}
          currentUserId={session?.user?.id}
        />
      )}
      {isFormOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white font-serif italic text-xl">Préparation de l'écritoire...</div>}>
          <PostForm 
            onSave={handleSavePost} 
            onCancel={() => { setIsFormOpen(false); setEditingPost(null); }} 
            initialData={editingPost}
          />
        </Suspense>
      )}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
      {isProfileOpen && session && <ProfileModal userId={session.user.id} onClose={() => setIsProfileOpen(false)} />}

      <footer className="mt-24 py-16 bg-stone-900 text-white rounded-t-[3rem] text-center px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-8">
             <div className="w-8 h-8 bg-amber-500 rounded rotate-12"></div>
             <p className="font-serif text-xl md:text-2xl italic text-amber-200">"Savoir lire, c'est savoir vivre."</p>
          </div>
          <span className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-medium">Les Rhéteurs — MMXXV</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
