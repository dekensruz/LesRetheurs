
import React, { useState } from 'react';
import { supabase } from '../supabase';
import { Button } from './Button';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        setSuccessMsg("Inscription réussie ! Veuillez vérifier votre boîte mail pour valider votre compte avant de vous connecter.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (error: any) {
      alert("Erreur d'authentification : " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (successMsg) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl text-stone-900 mb-4">Vérifiez vos emails</h2>
          <p className="text-stone-600 mb-8 leading-relaxed">{successMsg}</p>
          <Button onClick={onClose} className="w-full">J'ai compris</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        
        <h2 className="font-serif text-3xl text-stone-900 mb-6 text-center">
          {isSignUp ? 'Rejoindre le Salon' : 'Se Connecter'}
        </h2>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Nom Complet</label>
              <input 
                required
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Mot de passe</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <Button type="submit" isLoading={loading} className="w-full mt-6">
            {isSignUp ? "S'inscrire" : "Se Connecter"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          {isSignUp ? "Déjà membre ?" : "Nouveau ici ?"} 
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 text-amber-600 font-bold hover:underline"
          >
            {isSignUp ? "Se connecter" : "Créer un compte"}
          </button>
        </p>
      </div>
    </div>
  );
};
