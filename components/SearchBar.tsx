
import React, { useState, useEffect, useRef } from 'react';
import { Post } from '../types';

interface SearchBarProps {
  posts: Post[];
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ posts, onSearch, placeholder = "Rechercher un livre, un auteur..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);

    if (val.length > 1) {
      const filtered = posts
        .filter(p => 
          p.book_title.toLowerCase().includes(val.toLowerCase()) || 
          p.book_author.toLowerCase().includes(val.toLowerCase()) ||
          p.title.toLowerCase().includes(val.toLowerCase())
        )
        .map(p => p.book_title)
        .filter((v, i, a) => a.indexOf(v) === i) // Uniques
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (s: string) => {
    setQuery(s);
    onSearch(s);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative group">
        <input 
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 1 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all pl-14 text-stone-800"
        />
        <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400 group-focus-within:text-amber-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {query && (
          <button 
            onClick={() => { setQuery(''); onSearch(''); }}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            <p className="px-4 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Suggestions</p>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-3 hover:bg-stone-50 rounded-xl transition-colors flex items-center gap-3 text-stone-700"
              >
                <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9 4.804A7.993 7.993 0 0111 5a7.993 7.993 0 012 .196V12.164a7.993 7.993 0 01-2-.164 7.993 7.993 0 01-2 .164V4.804z" /></svg>
                <span className="truncate">{s}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
