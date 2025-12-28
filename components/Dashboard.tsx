
import React from 'react';
import { Post } from '../types';
import { Button } from './Button';

interface DashboardProps {
  posts: Post[];
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
  onView: (post: Post) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ posts, onEdit, onDelete, onView }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-200">
        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </div>
        <p className="text-stone-500 font-serif text-lg italic">Votre plume est encore au repos.</p>
        <p className="text-stone-400 text-sm mt-1 mb-6">Partagez votre première lecture pour la voir apparaître ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:grid grid-cols-6 gap-4 px-6 py-4 bg-stone-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest">
        <div className="col-span-2">Titre de l'exposé</div>
        <div>Livre</div>
        <div>Catégorie</div>
        <div>Date</div>
        <div className="text-right">Actions</div>
      </div>
      
      {posts.map(post => (
        <div key={post.id} className="bg-white border border-stone-100 rounded-2xl p-4 md:px-6 md:py-4 flex flex-col md:grid md:grid-cols-6 gap-4 items-center group hover:shadow-lg transition-all duration-300">
          <div className="col-span-2 w-full">
            <h4 className="font-serif text-lg text-stone-900 truncate group-hover:text-amber-800 transition-colors">{post.title}</h4>
            <span className="md:hidden text-xs text-stone-400">{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          <div className="w-full text-stone-500 text-sm italic truncate">
            {post.book_title}
          </div>
          <div className="w-full">
            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full border border-amber-100">
              {post.category}
            </span>
          </div>
          <div className="hidden md:block text-stone-400 text-sm">
            {new Date(post.created_at).toLocaleDateString()}
          </div>
          <div className="flex justify-end gap-2 w-full md:w-auto">
            <button 
              onClick={() => onView(post)}
              className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
              title="Voir"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
            <button 
              onClick={() => onEdit(post)}
              className="p-2 text-stone-400 hover:text-amber-600 transition-colors"
              title="Modifier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </button>
            <button 
              onClick={() => onDelete(post.id)}
              className="p-2 text-stone-400 hover:text-red-600 transition-colors"
              title="Supprimer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
