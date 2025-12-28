
import React, { useState } from 'react';
import { Post } from '../types';
import { Button } from './Button';

interface PostModalProps {
  post: Post | null;
  onClose: () => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
  currentUserId?: string;
}

export const PostModal: React.FC<PostModalProps> = ({ post, onClose, onEdit, onDelete, currentUserId }) => {
  const [fullScreenImage, setFullScreenImage] = useState(false);

  if (!post) return null;

  const isOwner = currentUserId && post.user_id === currentUserId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      {/* Visionneuse plein écran */}
      {fullScreenImage && post.cover_url && (
        <div 
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center cursor-zoom-out animate-in zoom-in duration-300"
          onClick={() => setFullScreenImage(false)}
        >
          <img src={post.cover_url} className="max-w-full max-h-full object-contain" alt="Full view" />
          <button className="absolute top-10 right-10 text-white/50 hover:text-white p-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="bg-[#fdfbf7] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] shadow-2xl relative paper-texture">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 z-10 text-stone-400 hover:text-stone-900 bg-white/80 backdrop-blur-md rounded-full p-2 transition-all hover:rotate-90 shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {post.cover_url && (
          <div 
            className="h-64 md:h-96 w-full relative cursor-zoom-in group"
            onClick={() => setFullScreenImage(true)}
          >
            <img src={post.cover_url} className="w-full h-full object-cover shadow-inner" alt="Cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
               <span className="text-white opacity-0 group-hover:opacity-100 font-bold uppercase tracking-widest text-sm bg-black/50 px-4 py-2 rounded-full">Voir en grand</span>
            </div>
          </div>
        )}

        <div className="px-6 md:px-20 py-10 md:py-16">
          <header className="mb-12 text-center">
            <div className="flex justify-center mb-6">
              <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-widest border border-amber-200">
                {post.category}
              </span>
            </div>
            
            <h2 className="font-serif text-4xl md:text-6xl text-stone-900 mb-6 leading-tight">{post.title}</h2>
            
            <div className="flex flex-col items-center gap-2 mb-8">
              <div className="flex items-center gap-2 text-stone-500 italic text-lg md:text-xl">
                <span>Une réflexion sur</span>
                <span className="font-semibold text-stone-900">"{post.book_title}"</span>
              </div>
              <span className="text-stone-400">de {post.book_author}</span>
            </div>

            <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center text-white text-[8px]">
                   {post.user_name.charAt(0).toUpperCase()}
                </div>
                <span>{post.user_name}</span>
              </div>
              <span>•</span>
              <span>Publié le {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </header>

          <article className="prose prose-stone prose-lg max-w-none mb-16">
            {/* Rendu sécurisé du contenu HTML de l'éditeur riche */}
            <div 
              className="text-stone-800 leading-relaxed font-light ql-editor !p-0"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </article>

          <footer className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-stone-100">
            <div className="flex gap-4">
              {isOwner && (
                <>
                  <button 
                    onClick={() => onEdit(post)}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-50 text-amber-700 font-bold rounded-2xl hover:bg-amber-100 transition-colors border border-amber-100 shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Modifier
                  </button>
                  <button 
                    onClick={() => onDelete(post.id)}
                    className="flex items-center gap-2 px-6 py-3 text-red-500 font-bold rounded-2xl hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Supprimer
                  </button>
                </>
              )}
            </div>
            <Button onClick={onClose} variant="outline" className="px-12 w-full md:w-auto">Quitter la lecture</Button>
          </footer>
        </div>
      </div>
    </div>
  );
};
