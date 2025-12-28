
import React from 'react';
import { Post } from '../types';

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const date = new Date(post.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Nettoyer le HTML pour l'aperçu textuel uniquement
  const plainTextContent = post.content.replace(/<[^>]*>?/gm, ' ');

  return (
    <div 
      onClick={() => onClick(post)}
      className="group bg-white border border-stone-200 rounded-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col h-full relative overflow-hidden paper-texture"
    >
      <div className="h-44 md:h-48 w-full overflow-hidden bg-stone-100 relative">
        {post.cover_url ? (
          <img 
            src={post.cover_url} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
            alt="Cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <svg className="w-12 h-12 text-stone-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
      </div>
      
      <div className="p-6 md:p-8 flex flex-col flex-grow">
        <div className="mb-4">
          <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-widest mb-4 border border-amber-100">
            {post.category}
          </span>
          <h3 className="font-serif text-xl md:text-2xl text-stone-900 mb-2 leading-tight group-hover:text-amber-800 transition-colors duration-300">
            {post.title}
          </h3>
          <p className="text-stone-500 italic text-sm md:text-base">
            {post.book_title} <span className="text-stone-300 mx-1">/</span> {post.book_author}
          </p>
        </div>

        <p className="text-stone-600 line-clamp-3 flex-grow text-sm md:text-base leading-relaxed mb-6 font-light">
          {plainTextContent}
        </p>

        <div className="mt-auto flex items-center justify-between pt-5 border-t border-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-stone-900 flex items-center justify-center text-white text-[10px] md:text-xs font-bold ring-2 ring-white shadow-md transform group-hover:rotate-12 transition-transform">
              {post.user_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-bold text-stone-800">{post.user_name}</span>
              <span className="text-[8px] md:text-[9px] text-stone-400 uppercase tracking-tighter">Lecteur Rhéteur</span>
            </div>
          </div>
          <span className="text-[9px] md:text-[10px] text-stone-400 font-medium tracking-tighter italic">
            {date}
          </span>
        </div>
      </div>
    </div>
  );
};
