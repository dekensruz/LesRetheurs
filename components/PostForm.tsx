
import React, { useState, useEffect, Suspense } from 'react';
import { Post, PostCategory } from '../types';
import { Button } from './Button';
import { supabase } from '../supabase';

// Chargement paresseux de Quill pour éviter les erreurs de montage asynchrones dans React 19
const ReactQuill = React.lazy(() => import('react-quill'));

interface PostFormProps {
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  initialData?: Post | null;
}

export const PostForm: React.FC<PostFormProps> = ({ onSave, onCancel, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    book_title: initialData?.book_title || '',
    book_author: initialData?.book_author || '',
    content: initialData?.content || '',
    category: (initialData?.category as PostCategory) || PostCategory.FICTION,
    user_name: initialData?.user_name || '',
    cover_url: initialData?.cover_url || '',
  });

  useEffect(() => {
    if (!initialData) {
      async function loadUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
          if (profile?.full_name) {
            setFormData(prev => ({ ...prev, user_name: profile.full_name }));
          }
        }
      }
      loadUser();
    }
  }, [initialData]);

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'blockquote'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const handleUploadCover = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      setUploadingCover(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('covers').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, cover_url: data.publicUrl }));
    } catch (error: any) {
      alert("Erreur d'upload couverture: " + error.message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content || formData.content === '<p><br></p>') {
      alert("Le corps de votre exposé ne peut pas être vide.");
      return;
    }
    
    setLoading(true);
    try {
      await onSave(initialData ? { ...formData, id: initialData.id } : formData);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-6 md:p-10 max-h-[95vh] overflow-y-auto paper-texture">
        <div className="flex justify-between items-center mb-8 border-b border-stone-100 pb-4">
          <h2 className="font-serif text-2xl md:text-3xl text-stone-900">
            {initialData ? 'Retoucher l\'exposé' : 'Nouvel écrit au salon'}
          </h2>
          <button onClick={onCancel} className="text-stone-300 hover:text-stone-900 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          <div className="relative h-44 md:h-52 w-full bg-stone-50 rounded-2xl overflow-hidden border-2 border-dashed border-stone-200 group transition-colors hover:border-amber-300">
            {formData.cover_url ? (
              <>
                <img src={formData.cover_url} className="w-full h-full object-cover" alt="Cover" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                    type="button" 
                    onClick={() => setFormData(p => ({...p, cover_url: ''}))}
                    className="bg-white text-stone-900 px-4 py-2 rounded-full font-bold text-xs shadow-xl"
                  >
                    Changer l'image
                  </button>
                </div>
              </>
            ) : (
              <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-stone-100/50 transition-colors">
                {uploadingCover ? (
                   <div className="flex flex-col items-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-2"></div>
                     <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Traitement...</span>
                   </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <span className="text-stone-500 text-sm font-medium">Image de couverture principale</span>
                    <span className="text-stone-300 text-[10px] uppercase mt-1">PNG, JPG jusqu'à 5MB</span>
                  </>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleUploadCover} disabled={uploadingCover} />
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Votre Nom de Plume</label>
              <input required type="text" value={formData.user_name} onChange={e => setFormData({ ...formData, user_name: e.target.value })} className="w-full bg-stone-50 border-b-2 border-stone-100 focus:border-amber-500 py-2 outline-none transition-colors" placeholder="Ex: Jean Valjean" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Rayon Littéraire</label>
              <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as PostCategory })} className="w-full bg-stone-50 border-b-2 border-stone-100 focus:border-amber-500 py-2 outline-none transition-colors appearance-none">
                {Object.values(PostCategory).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Titre de l'Œuvre</label>
              <input required type="text" value={formData.book_title} onChange={e => setFormData({ ...formData, book_title: e.target.value })} className="w-full bg-stone-50 border-b-2 border-stone-100 focus:border-amber-500 py-2 outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Auteur Originel</label>
              <input type="text" value={formData.book_author} onChange={e => setFormData({ ...formData, book_author: e.target.value })} className="w-full bg-stone-50 border-b-2 border-stone-100 focus:border-amber-500 py-2 outline-none transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Titre de votre Exposé</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full font-serif text-xl md:text-2xl border-b-2 border-stone-100 focus:border-amber-500 py-2 outline-none transition-colors" placeholder="Une réflexion sur..." />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Corps de l'Exposé (Édition Riche)</label>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
              <Suspense fallback={<div className="p-10 text-center italic text-stone-400">Ouverture de l'écritoire...</div>}>
                <ReactQuill 
                  theme="snow"
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  modules={quillModules}
                  placeholder="Laissez courir votre plume... Gras, italique, liens et photos sont à votre disposition."
                />
              </Suspense>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-end gap-3 pt-6">
            <Button type="button" variant="ghost" onClick={onCancel} className="order-2 md:order-1">Abandonner</Button>
            <Button type="submit" isLoading={loading} className="px-12 order-1 md:order-2">{initialData ? 'Sauvegarder les modifications' : 'Publier au salon'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
