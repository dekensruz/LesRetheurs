
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import { Circle, CircleReading, Profile, CirclePoll, CircleQuote, CircleEvent, CircleThread, CircleThreadMessage, CircleReadingRole, CircleJournalEntry, CircleHistoryEntry, PostCategory } from '../types';
import { Button } from './Button';

interface CirclesViewProps {
  currentUserId?: string;
  onAuthRequired?: () => void;
  onUserClick?: (userId: string) => void;
}

type Tab = 'lecture' | 'fil' | 'citations' | 'journal' | 'histoire' | 'membres';

const ROLE_INFO: Record<string, string> = {
  'Modérateur': 'Il anime les discussions et s’assure que tout le monde se respecte.',
  'Scribe': 'Il écrit les moments importants de la lecture dans le Journal.',
  'Historien': 'Il apporte des informations sur l’auteur et l’époque du livre.'
};

export const CirclesView: React.FC<CirclesViewProps> = ({ currentUserId, onAuthRequired, onUserClick }) => {
  const [circles, setCircles] = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('lecture');
  const [themeFilter, setThemeFilter] = useState('all');

  // Données du cercle
  const [members, setMembers] = useState<Profile[]>([]);
  const [readings, setReadings] = useState<CircleReading[]>([]);
  const [journalEntries, setJournalEntries] = useState<CircleJournalEntry[]>([]);
  const [historyEntries, setHistoryEntries] = useState<CircleHistoryEntry[]>([]);
  const [activePoll, setActivePoll] = useState<CirclePoll | null>(null);
  const [pollVotes, setPollVotes] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<CircleQuote[]>([]);
  const [events, setEvents] = useState<CircleEvent[]>([]);
  const [threads, setThreads] = useState<CircleThread[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<CircleReadingRole[]>([]);
  const [memberProgress, setMemberProgress] = useState<any[]>([]);

  // Discussions (Fil)
  const [selectedThread, setSelectedThread] = useState<CircleThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<CircleThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<CircleThreadMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Formulaires & UI
  const [showPollForm, setShowPollForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [journalFormData, setJournalFormData] = useState({ title: '', content: '', id: '' });
  const [historyFormData, setHistoryFormData] = useState({ content: '', id: '' });
  const [activeRoleInfo, setActiveRoleInfo] = useState<string | null>(null);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);

  const [pollOptions, setPollOptions] = useState([
    { title: '', author: '' },
    { title: '', author: '' },
    { title: '', author: '' }
  ]);
  const [readingFormData, setReadingFormData] = useState({ title: '', author: '', endDate: '', id: '' });
  const [roleData, setRoleData] = useState({ userId: '', roleName: 'Modérateur' });
  const [newQuote, setNewQuote] = useState('');
  const [quotePage, setQuotePage] = useState('');

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('circles').select('*, circle_members(count)').order('created_at', { ascending: false });
      setCircles(data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchCircleDetails = async (circle: any) => {
    setSelectedCircle(circle);
    setLoading(true);
    try {
      const [mRes, rRes, pRes, qRes, eRes, tRes, progRes, roleRes, jRes, hRes] = await Promise.all([
        supabase.from('circle_members').select('profiles:user_id (*)').eq('circle_id', circle.id),
        supabase.from('circle_readings').select('*').eq('circle_id', circle.id).order('created_at', { ascending: false }),
        supabase.from('circle_polls').select('*').eq('circle_id', circle.id).eq('is_closed', false).order('created_at', { ascending: false }).maybeSingle(),
        supabase.from('circle_quotes').select('*, profiles:user_id(*)').eq('circle_id', circle.id).order('created_at', { ascending: false }),
        supabase.from('circle_events').select('*').eq('circle_id', circle.id).order('event_date', { ascending: true }),
        supabase.from('circle_threads').select('*').eq('circle_id', circle.id).order('created_at', { ascending: false }),
        supabase.from('circle_member_progress').select('*').eq('circle_id', circle.id),
        supabase.from('circle_reading_roles').select('*, profiles:user_id(*)').eq('circle_id', circle.id),
        supabase.from('circle_journal').select('*, profiles:user_id(*)').eq('circle_id', circle.id).order('created_at', { ascending: false }),
        supabase.from('circle_history').select('*, profiles:user_id(*)').eq('circle_id', circle.id).order('created_at', { ascending: false })
      ]);

      if (pRes.data) {
        const { data: votes } = await supabase.from('circle_poll_votes').select('*').eq('poll_id', pRes.data.id);
        setPollVotes(votes || []);
      }

      const extractedMembers = mRes.data?.map((m: any) => Array.isArray(m.profiles) ? m.profiles[0] : m.profiles).filter(Boolean) || [];
      setMembers(extractedMembers);
      
      setReadings(rRes.data || []);
      setActivePoll(pRes.data || null);
      setQuotes(qRes.data || []);
      setEvents(eRes.data || []);
      setThreads(tRes.data || []);
      setMemberProgress(progRes.data || []);
      setAssignedRoles(roleRes.data || []);
      setJournalEntries(jRes.data || []);
      setHistoryEntries(hRes.data || []);
    } catch (err) { console.error("Détails error:", err); } finally { setLoading(false); }
  };

  const handleProtectedAction = (action: () => void) => {
    if (!currentUserId) { onAuthRequired?.(); } else { action(); }
  };

  const handleVote = async (optionIndex: number) => {
    if (!activePoll || !currentUserId) return;
    const { error } = await supabase.from('circle_poll_votes').upsert({
      poll_id: activePoll.id,
      user_id: currentUserId,
      option_index: optionIndex
    }, { onConflict: 'poll_id,user_id' });
    
    if (!error) fetchCircleDetails(selectedCircle);
  };

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    const data = {
      circle_id: selectedCircle.id,
      user_id: currentUserId,
      title: journalFormData.title,
      content: journalFormData.content
    };
    const promise = journalFormData.id 
      ? supabase.from('circle_journal').update(data).eq('id', journalFormData.id)
      : supabase.from('circle_journal').insert([data]);

    const { error } = await promise;
    if (!error) {
      setShowJournalForm(false);
      fetchCircleDetails(selectedCircle);
    }
  };

  const deleteJournalEntry = async (id: string) => {
    if (!confirm("Supprimer cette note du journal ?")) return;
    const { error } = await supabase.from('circle_journal').delete().eq('id', id);
    if (!error) fetchCircleDetails(selectedCircle);
  };

  const handleHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    const data = {
      circle_id: selectedCircle.id,
      user_id: currentUserId,
      content: historyFormData.content
    };
    const promise = historyFormData.id 
      ? supabase.from('circle_history').update(data).eq('id', historyFormData.id)
      : supabase.from('circle_history').insert([data]);

    const { error } = await promise;
    if (!error) {
      setShowHistoryForm(false);
      fetchCircleDetails(selectedCircle);
    }
  };

  const deleteHistoryEntry = async (id: string) => {
    if (!confirm("Supprimer cet éclairage ?")) return;
    const { error } = await supabase.from('circle_history').delete().eq('id', id);
    if (!error) fetchCircleDetails(selectedCircle);
  };

  const handleCreateReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCircle) return;
    const data = {
      circle_id: selectedCircle.id,
      book_title: readingFormData.title,
      book_author: readingFormData.author,
      end_date: readingFormData.endDate
    };
    const promise = readingFormData.id 
      ? supabase.from('circle_readings').update(data).eq('id', readingFormData.id)
      : supabase.from('circle_readings').insert([data]);

    const { error } = await promise;
    if (!error) {
      setShowReadingForm(false);
      fetchCircleDetails(selectedCircle);
    }
  };

  const openThread = async (thread: CircleThread) => {
    setSelectedThread(thread);
    const { data } = await supabase.from('circle_thread_messages').select('*, profiles:user_id(*)').eq('thread_id', thread.id).order('created_at', { ascending: true });
    setThreadMessages(data || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
  };

  const sendThreadMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || !currentUserId) return;

    if (editingMessageId) {
      const { error } = await supabase.from('circle_thread_messages').update({ content: newMessage }).eq('id', editingMessageId);
      if (!error) {
        setNewMessage('');
        setEditingMessageId(null);
        openThread(selectedThread);
      }
    } else {
      const { error } = await supabase.from('circle_thread_messages').insert([{
        thread_id: selectedThread.id,
        user_id: currentUserId,
        content: newMessage,
        reply_to_id: replyTo?.id || null
      }]);
      if (!error) {
        setNewMessage('');
        setReplyTo(null);
        openThread(selectedThread);
      }
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    const { error } = await supabase.from('circle_thread_messages').delete().eq('id', id);
    if (!error && selectedThread) openThread(selectedThread);
  };

  const startEditMessage = (msg: CircleThreadMessage) => {
    setNewMessage(msg.content);
    setEditingMessageId(msg.id);
  };

  const handleQuoteSubmit = async () => {
    if (!newQuote.trim() || !currentUserId) return;
    const data = {
      circle_id: selectedCircle.id,
      user_id: currentUserId,
      content: newQuote,
      page_number: quotePage
    };
    const promise = editingQuoteId 
      ? supabase.from('circle_quotes').update(data).eq('id', editingQuoteId)
      : supabase.from('circle_quotes').insert([data]);

    const { error } = await promise;
    if (!error) {
      setNewQuote('');
      setQuotePage('');
      setEditingQuoteId(null);
      fetchCircleDetails(selectedCircle);
    }
  };

  const startEditQuote = (q: CircleQuote) => {
    setNewQuote(q.content);
    setQuotePage(q.page_number || '');
    setEditingQuoteId(q.id);
    document.querySelector('.tab-content-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  const averageProgress = useMemo(() => {
    if (memberProgress.length === 0) return 0;
    const sum = memberProgress.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / memberProgress.length);
  }, [memberProgress]);

  const isCreator = selectedCircle?.creator_id === currentUserId;
  const isScribe = assignedRoles.find(r => r.role_name === 'Scribe')?.user_id === currentUserId || isCreator;
  const isHistorian = assignedRoles.find(r => r.role_name === 'Historien')?.user_id === currentUserId || isCreator;

  return (
    <div className="pb-20">
      {/* Liste des Cercles */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 px-4">
        <div className="w-full text-center md:text-left">
          <h3 className="font-serif text-3xl md:text-5xl text-stone-900 mb-6 tracking-tight">Cercles de lecture</h3>
          <div className="flex flex-wrap justify-center md:justify-start gap-2 overflow-x-auto no-scrollbar pb-2">
            <button onClick={() => setThemeFilter('all')} className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${themeFilter === 'all' ? 'bg-stone-900 text-white shadow-md' : 'bg-white text-stone-400'}`}>Tout</button>
            {Object.values(PostCategory).map(cat => (
              <button key={cat} onClick={() => setThemeFilter(cat)} className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${themeFilter === cat ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-stone-400'}`}>{cat}</button>
            ))}
          </div>
        </div>
        <Button onClick={() => handleProtectedAction(() => {})}>Nouveau Cercle</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {circles.filter(c => themeFilter === 'all' || c.theme === themeFilter).map(circle => (
          <div key={circle.id} className="bg-white border border-stone-100 rounded-[2.5rem] overflow-hidden flex flex-col group shadow-sm hover:shadow-xl transition-all h-[520px] paper-texture">
            <div className="h-48 relative bg-stone-900">
              {circle.cover_url && <img src={circle.cover_url} className="w-full h-full object-cover opacity-80" alt="Cover" />}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-stone-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">{circle.theme}</div>
            </div>
            <div className="p-8 flex-grow">
              <h4 className="font-serif text-2xl text-stone-900 mb-3">{circle.name}</h4>
              <p className="text-stone-500 text-sm line-clamp-3 italic mb-6">"{circle.description}"</p>
              <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase tracking-widest mt-auto">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                {circle.circle_members?.[0]?.count || 0} Membres
              </div>
            </div>
            <div className="px-8 pb-8">
              <Button onClick={() => fetchCircleDetails(circle)} variant="outline" className="w-full text-xs">Ouvrir</Button>
            </div>
          </div>
        ))}
      </div>

      {selectedCircle && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-6 bg-stone-950/90 backdrop-blur-xl">
          <div className="bg-[#fdfbf7] w-full max-w-6xl h-full md:h-[95vh] overflow-hidden rounded-none md:rounded-[3rem] shadow-2xl relative paper-texture flex flex-col">
            <button onClick={() => setSelectedCircle(null)} className="absolute top-6 right-6 z-[80] text-stone-400 hover:text-stone-900 bg-white/50 p-2 rounded-full transition-all hover:rotate-90 shadow-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <header className="p-6 md:p-12 border-b border-stone-100 bg-white/50 shrink-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-center md:text-left">
                <div className="truncate w-full">
                  <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 inline-block">{selectedCircle.theme}</span>
                  <h2 className="font-serif text-3xl md:text-5xl text-stone-900 leading-tight truncate">{selectedCircle.name}</h2>
                </div>
                <div className="w-full md:w-64">
                   <div className="flex justify-between items-end mb-2">
                     <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Synergie</span>
                     <span className="text-amber-600 font-serif italic">{averageProgress}%</span>
                   </div>
                   <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                     <div className="h-full bg-amber-500 transition-all duration-1000" style={{width: `${averageProgress}%`}} />
                   </div>
                </div>
              </div>

              {/* Barre de navigation réorganisée */}
              <div className="mt-10 flex flex-col items-center gap-6">
                 <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 overflow-x-auto no-scrollbar scroll-smooth w-full px-4">
                  {(['lecture', 'fil', 'histoire', 'citations', 'membres'] as Tab[]).map(t => (
                    <button key={t} onClick={() => { setActiveTab(t); setSelectedThread(null); }} className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${activeTab === t ? 'text-stone-900 border-amber-500' : 'text-stone-400 border-transparent hover:text-stone-700'}`}>
                      {t === 'lecture' ? 'Livre' : t === 'fil' ? 'Fil' : t === 'histoire' ? 'Histoire' : t === 'citations' ? 'Mur' : 'Membres'}
                    </button>
                  ))}
                </div>
                {/* Journal centré en dessous */}
                <button 
                  onClick={() => { setActiveTab('journal'); setSelectedThread(null); }} 
                  className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 whitespace-nowrap ${activeTab === 'journal' ? 'text-stone-900 border-amber-500' : 'text-stone-400 border-transparent hover:text-stone-700'}`}
                >
                  Journal
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-12 no-scrollbar bg-[#faf9f6]">
              {/* Onglet Membres */}
              {activeTab === 'membres' && (
                <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
                   <h4 className="font-serif text-3xl text-stone-900 mb-10 text-center italic">Les membres du Cercle</h4>
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
                     {members.map(m => (
                       <div key={m.id} onClick={() => onUserClick?.(m.id)} className="flex flex-col items-center group cursor-pointer">
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-stone-100 group-hover:scale-105 transition-transform duration-300">
                             {m.avatar_url ? <img src={m.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-serif text-3xl text-stone-300">{m.full_name?.charAt(0)}</div>}
                          </div>
                          <span className="mt-4 text-xs font-bold text-stone-700 text-center uppercase tracking-widest group-hover:text-amber-600 transition-colors">{m.full_name}</span>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* Onglet Livre */}
              {activeTab === 'lecture' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 animate-in fade-in duration-500">
                  <div className="lg:col-span-2 space-y-12">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100">
                       <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-8">Livre du moment</h4>
                       {readings[0] ? (
                         <div className="flex flex-col md:flex-row gap-8">
                           <div className="w-32 h-48 bg-stone-900 rounded-2xl shadow-xl shrink-0 overflow-hidden">
                             {selectedCircle.cover_url && <img src={selectedCircle.cover_url} className="w-full h-full object-cover opacity-50" />}
                           </div>
                           <div className="flex-1">
                             <div className="flex justify-between items-start">
                               <div className="truncate">
                                 <p className="font-serif text-3xl text-stone-900 mb-1 truncate">"{readings[0].book_title}"</p>
                                 <p className="text-stone-500 text-lg italic truncate">de {readings[0].book_author}</p>
                               </div>
                               {isCreator && (
                                 <button onClick={() => setShowReadingForm(true)} className="text-stone-300 hover:text-amber-600 transition-colors p-2 shrink-0">
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                 </button>
                               )}
                             </div>
                             <div className="mt-8">
                               <div className="text-[10px] font-black text-amber-600 uppercase border border-amber-100 bg-amber-50 px-4 py-2 rounded-full inline-block">Échéance : {new Date(readings[0].end_date).toLocaleDateString()}</div>
                             </div>
                           </div>
                         </div>
                       ) : <p className="text-stone-400 italic text-center py-10 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-200">Aucune lecture choisie.</p>}
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-stone-100">
                      <div className="flex justify-between items-center mb-8 gap-4">
                         <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] truncate">Choisir le prochain livre</h4>
                         {isCreator && !activePoll && <Button variant="outline" className="text-[9px] py-1 shrink-0" onClick={() => setShowPollForm(true)}>Voter</Button>}
                      </div>
                      {activePoll ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activePoll.options.map((opt, idx) => {
                            const votesCount = pollVotes.filter(v => v.option_index === idx).length;
                            const percentage = pollVotes.length > 0 ? (votesCount / pollVotes.length) * 100 : 0;
                            const hasVoted = pollVotes.some(v => v.user_id === currentUserId && v.option_index === idx);
                            return (
                              <div key={idx} onClick={() => handleVote(idx)} className={`relative p-6 rounded-3xl border transition-all cursor-pointer overflow-hidden ${hasVoted ? 'bg-stone-900 text-white shadow-xl scale-[1.02]' : 'bg-stone-50 border-stone-100 hover:border-amber-300'}`}>
                                <div className={`absolute top-0 left-0 h-full ${hasVoted ? 'bg-amber-500/20' : 'bg-amber-500/10'} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
                                <div className="relative z-10">
                                  <p className={`font-serif text-xl mb-1 truncate ${hasVoted ? 'text-white' : 'text-stone-900'}`}>"{opt.title}"</p>
                                  <p className={`text-xs italic truncate ${hasVoted ? 'text-stone-400' : 'text-stone-500'}`}>{opt.author}</p>
                                  <div className="mt-4 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest">{votesCount} voix</span>
                                    <span className="text-[10px] font-black text-amber-500">{Math.round(percentage)}%</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : <p className="text-stone-400 italic text-sm text-center py-6">Pas de scrutin en cours.</p>}
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div className="bg-stone-900 p-8 rounded-[3rem] text-white shadow-xl">
                      <h4 className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-6">Rendez-vous</h4>
                      {events[0] ? (
                        <div>
                          <p className="font-serif text-2xl mb-2">{events[0].title}</p>
                          <p className="text-stone-400 text-xs mb-6 font-bold uppercase tracking-widest">{new Date(events[0].event_date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</p>
                          {events[0].meeting_link && <a href={events[0].meeting_link} target="_blank" className="inline-block bg-amber-500 text-stone-900 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest w-full text-center hover:bg-amber-400 transition-all shadow-md">Rejoindre</a>}
                        </div>
                      ) : <p className="text-stone-500 italic text-sm">Repos de l'esprit.</p>}
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                       <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-8">Rôles</h4>
                       <div className="space-y-4">
                        {['Modérateur', 'Scribe', 'Historien'].map(roleName => {
                          const assigned = assignedRoles.find(r => r.role_name === roleName);
                          const isShowing = activeRoleInfo === roleName;
                          return (
                            <div key={roleName}>
                              <div 
                                onClick={() => setActiveRoleInfo(isShowing ? null : roleName)}
                                className={`p-4 rounded-2xl flex flex-col gap-2 cursor-pointer transition-all border ${isShowing ? 'bg-amber-50 border-amber-200' : 'bg-stone-50 border-transparent hover:border-stone-200'}`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-white border border-stone-200 overflow-hidden flex items-center justify-center shadow-sm">
                                    {assigned?.profiles?.avatar_url ? <img src={assigned.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="text-stone-300 font-serif text-xl">?</div>}
                                  </div>
                                  <div className="flex-1 truncate">
                                    <span className="block text-[8px] font-black uppercase tracking-widest text-amber-700">{roleName}</span>
                                    <span className="block text-sm font-serif italic text-stone-900 truncate">{assigned?.profiles?.full_name || "Vacant"}</span>
                                  </div>
                                </div>
                                {isShowing && (
                                  <div className="mt-2 text-[10px] leading-relaxed text-stone-600 border-t border-amber-100 pt-2 animate-in fade-in duration-300">
                                    {ROLE_INFO[roleName]}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                       </div>
                       {isCreator && <Button onClick={() => setShowRoleForm(true)} variant="ghost" className="w-full text-[9px] mt-4 uppercase tracking-[0.2em]">Changer</Button>}
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Histoire */}
              {activeTab === 'histoire' && (
                <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
                   <div className="flex flex-col sm:flex-row justify-between items-center border-b border-stone-200 pb-8 mb-12 gap-4">
                     <h4 className="font-serif text-3xl text-stone-900 italic whitespace-nowrap overflow-hidden text-ellipsis text-center">Éclairages historiques</h4>
                     {isHistorian && <Button onClick={() => { setHistoryFormData({content:'', id:''}); setShowHistoryForm(true); }} className="text-[10px] uppercase tracking-widest px-6 py-2 shrink-0">Ajouter</Button>}
                   </div>

                   <div className="space-y-10">
                     {historyEntries.map(entry => (
                       <div key={entry.id} className="bg-white rounded-[2rem] border border-stone-200 shadow-md overflow-hidden paper-texture">
                          <div className="p-8 md:p-10">
                             <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-100 border border-amber-100">
                                      {entry.profiles?.avatar_url && <img src={entry.profiles.avatar_url} className="w-full h-full object-cover" />}
                                   </div>
                                   <span className="text-[9px] font-black uppercase tracking-widest text-amber-700">Historien : {entry.profiles?.full_name}</span>
                                </div>
                                {isHistorian && (
                                  <button onClick={() => deleteHistoryEntry(entry.id)} className="p-2 text-stone-300 hover:text-red-500 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                )}
                             </div>
                             <div className="prose prose-stone max-w-none text-stone-800 font-serif leading-relaxed italic text-lg selection:bg-amber-100">
                                {entry.content}
                             </div>
                             <div className="mt-8 pt-6 border-t border-stone-50 text-right">
                                <span className="text-[9px] text-stone-300 uppercase tracking-widest italic">{new Date(entry.created_at).toLocaleDateString()}</span>
                             </div>
                          </div>
                       </div>
                     ))}
                     {historyEntries.length === 0 && <p className="text-center text-stone-400 italic py-20 bg-white/50 rounded-3xl border border-dashed border-stone-200">L'Historien ne s'est pas encore exprimé.</p>}
                   </div>
                </div>
              )}

              {/* Onglet Fil (Discussions) */}
              {activeTab === 'fil' && (
                <div className="h-full flex flex-col max-w-5xl mx-auto animate-in fade-in duration-500">
                  {!currentUserId ? (
                     <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-stone-200 shadow-sm mx-4">
                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                           <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <p className="font-serif text-2xl text-stone-900 mb-2 italic">Espace réservé aux membres</p>
                        <p className="text-stone-500 text-sm mb-8">Connectez-vous pour rejoindre le fil des échanges.</p>
                        <Button onClick={onAuthRequired}>Se connecter</Button>
                     </div>
                  ) : (
                    <>
                      {!selectedThread ? (
                        <div className="space-y-6 pb-20">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 px-4 gap-4">
                            <h4 className="font-serif text-3xl whitespace-nowrap overflow-hidden text-ellipsis">Le Fil des échanges</h4>
                            <Button onClick={() => { const title = prompt("Sujet du fil ?"); if(title) supabase.from('circle_threads').insert([{circle_id:selectedCircle.id, title}]).then(()=>fetchCircleDetails(selectedCircle)); }} className="shrink-0">Nouveau Fil</Button>
                          </div>
                          <div className="grid gap-3 px-4">
                            {threads.map(t => (
                              <div key={t.id} onClick={() => openThread(t)} className="bg-white p-6 rounded-3xl border border-stone-100 flex items-center justify-between group hover:shadow-lg transition-all cursor-pointer paper-texture">
                                <div className="flex items-center gap-4 truncate">
                                  <div className="bg-stone-50 p-3 rounded-2xl text-stone-400 group-hover:text-amber-600 group-hover:bg-amber-50 transition-colors shrink-0">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                  </div>
                                  <span className="font-serif text-xl group-hover:text-amber-800 transition-colors truncate">{t.title}</span>
                                </div>
                                <div className="text-stone-300 group-hover:text-amber-500 transition-all shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="fixed inset-0 z-[120] flex flex-col bg-[#fdfbf7] animate-in zoom-in-95 duration-300">
                          <header className="p-4 md:p-6 border-b border-stone-100 bg-white flex justify-between items-center shadow-sm shrink-0">
                            <div className="flex items-center gap-4 truncate">
                              <button onClick={() => setSelectedThread(null)} className="text-stone-400 hover:text-stone-900 transition-colors p-2 bg-stone-50 rounded-full shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                              </button>
                              <div className="truncate">
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Discussion active</span>
                                <h3 className="font-serif text-lg md:text-2xl text-stone-900 truncate">{selectedThread.title}</h3>
                              </div>
                            </div>
                          </header>
                          
                          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 no-scrollbar bg-[#faf9f6]/50">
                            {threadMessages.map(msg => {
                              const isMine = msg.user_id === currentUserId;
                              return (
                                <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
                                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border border-white bg-white self-end">
                                    {msg.profiles?.avatar_url ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="bg-stone-900 w-full h-full text-white text-[10px] flex items-center justify-center font-black">{msg.profiles?.full_name?.charAt(0)}</div>}
                                  </div>
                                  <div className={`max-w-[70%] md:max-w-[50%] p-3.5 rounded-2xl shadow-md group relative ${isMine ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-white border border-stone-100 rounded-tl-none'}`}>
                                    <div className="flex justify-between items-center mb-1 gap-4">
                                      <span className={`text-[8px] font-black uppercase tracking-widest truncate ${isMine ? 'text-amber-500' : 'text-stone-400'}`}>{msg.profiles?.full_name}</span>
                                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => setReplyTo(msg)} className="text-[8px] text-amber-500 uppercase font-black tracking-widest">Répondre</button>
                                          {isMine && (
                                            <>
                                              <button onClick={() => startEditMessage(msg)} className="text-stone-400 hover:text-white"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                              <button onClick={() => deleteMessage(msg.id)} className="text-stone-400 hover:text-red-500"><svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </>
                                          )}
                                      </div>
                                    </div>
                                    <p className="text-[13px] leading-relaxed break-words">{msg.content}</p>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndRef} className="h-10" />
                          </div>

                          <div className="p-4 md:p-6 border-t border-stone-100 bg-white shrink-0">
                            <form onSubmit={sendThreadMessage} className="max-w-4xl mx-auto flex gap-3">
                              <input required value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Écrire un message..." className="flex-1 bg-stone-50 p-4 rounded-2xl outline-none border border-stone-100 focus:bg-white transition-all text-sm" />
                              <button type="submit" className="bg-amber-500 text-stone-900 p-4 rounded-2xl hover:bg-amber-400 transition-all shadow-md shrink-0"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                            </form>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Onglet Journal */}
              {activeTab === 'journal' && (
                <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-500">
                   <div className="flex flex-col sm:flex-row justify-between items-center border-b border-stone-200 pb-8 mb-12 gap-4">
                     <h4 className="font-serif text-3xl text-stone-900 italic whitespace-nowrap overflow-hidden text-ellipsis text-center">Le Journal du groupe</h4>
                     {isScribe && <Button onClick={() => { setJournalFormData({title:'', content:'', id:''}); setShowJournalForm(true); }} className="text-[10px] uppercase tracking-widest px-6 py-2 shrink-0">Nouvelle note</Button>}
                   </div>

                   <div className="space-y-10">
                     {journalEntries.map(entry => (
                       <div key={entry.id} className="bg-white rounded-[2rem] border border-stone-200 shadow-md overflow-hidden paper-texture group">
                          <div className="p-8 md:p-10">
                             <div className="flex justify-between items-start mb-6 gap-4">
                                <div className="truncate">
                                   <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest block mb-1">Note de lecture</span>
                                   <h5 className="font-serif text-2xl text-stone-900 truncate overflow-hidden text-ellipsis">{entry.title || "Sans titre"}</h5>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isScribe && (
                                    <>
                                      <button onClick={() => { setJournalFormData({title: entry.title || '', content: entry.content, id: entry.id}); setShowJournalForm(true); }} className="p-2 text-stone-300 hover:text-amber-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                      <button onClick={() => deleteJournalEntry(entry.id)} className="p-2 text-stone-300 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </>
                                  )}
                                </div>
                             </div>
                             <div className="prose prose-stone max-w-none text-stone-700 font-serif italic leading-relaxed whitespace-pre-wrap">
                                {entry.content}
                             </div>
                             <div className="mt-8 pt-6 border-t border-stone-50 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Plume : {entry.profiles?.full_name}</span>
                                <span className="text-[9px] text-stone-300 italic">{new Date(entry.created_at).toLocaleDateString()}</span>
                             </div>
                          </div>
                       </div>
                     ))}
                     {journalEntries.length === 0 && <p className="text-center text-stone-400 italic py-20 bg-white/50 rounded-3xl border border-dashed border-stone-200">Le scribe n'a pas encore rédigé de notes.</p>}
                   </div>
                </div>
              )}

              {/* Onglet Mur de Citations */}
              {activeTab === 'citations' && (
                <div className="space-y-12 animate-in fade-in duration-500 tab-content-top">
                  {currentUserId && (
                    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-stone-100 shadow-sm max-w-2xl mx-auto text-center paper-texture">
                      <textarea required value={newQuote} onChange={e => setNewQuote(e.target.value)} placeholder="Une phrase marquante ?" className="w-full text-xl font-serif italic border-none focus:ring-0 text-center bg-transparent resize-none leading-relaxed text-stone-800" rows={3} />
                      <div className="flex justify-center items-center gap-4 mt-8 pt-8 border-t border-stone-50">
                        <input type="text" value={quotePage} onChange={e => setQuotePage(e.target.value)} placeholder="Page" className="w-20 p-3 bg-stone-50 rounded-2xl text-xs border-none text-center outline-none" />
                        <Button onClick={handleQuoteSubmit}>{editingQuoteId ? "Mettre à jour" : "Épingler"}</Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotes.map(q => (
                      <div key={q.id} className="bg-white p-8 rounded-[2rem] border-t-4 border-amber-500 shadow-md italic font-serif text-lg leading-relaxed paper-texture relative group">
                        "{q.content}"
                        <div className="flex justify-between items-center pt-6 border-t border-stone-50 mt-6 text-[9px] font-black uppercase text-stone-400 not-italic tracking-widest">
                          <span onClick={() => onUserClick?.(q.user_id)} className="cursor-pointer hover:text-amber-600 transition-colors">{q.profiles?.full_name}</span>
                          <span className="text-amber-600">p.{q.page_number}</span>
                        </div>
                        {q.user_id === currentUserId && (
                          <button onClick={() => startEditQuote(q)} className="absolute top-4 right-4 p-2 bg-stone-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-amber-500 shadow-sm">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {quotes.length === 0 && <p className="col-span-full text-center text-stone-400 italic py-20 bg-white/50 rounded-3xl border border-dashed border-stone-200">Pas encore de citations épinglées.</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS D'ÉDITION (Inchangés mais conservés pour intégrité) */}
      {showJournalForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-0 md:p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl h-full md:h-auto md:max-h-[90vh] md:rounded-[2rem] shadow-2xl paper-texture flex flex-col relative">
            <h3 className="shrink-0 p-6 md:p-10 font-serif text-2xl text-stone-900 border-b border-stone-50 italic">Note de lecture</h3>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 no-scrollbar">
              <input required value={journalFormData.title} onChange={e => setJournalFormData({...journalFormData, title: e.target.value})} placeholder="Titre de la note" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 focus:bg-white transition-all font-serif" />
              <textarea required rows={10} value={journalFormData.content} onChange={e => setJournalFormData({...journalFormData, content: e.target.value})} placeholder="Vos réflexions..." className="w-full p-6 bg-stone-50 rounded-2xl outline-none font-serif leading-relaxed border border-stone-100 focus:bg-white transition-all shadow-inner resize-none h-[300px]" />
            </div>
            <div className="shrink-0 p-4 md:p-8 bg-white border-t border-stone-50 flex gap-3 sticky bottom-0">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowJournalForm(false)}>Fermer</Button>
              <Button type="submit" className="flex-1 shadow-lg" onClick={handleJournalSubmit}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}

      {showHistoryForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-0 md:p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl h-full md:h-auto md:max-h-[90vh] md:rounded-[2rem] shadow-2xl paper-texture flex flex-col relative">
            <h3 className="shrink-0 p-6 md:p-10 font-serif text-2xl text-stone-900 border-b border-stone-50 italic text-center">Éclairage Historique</h3>
            <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar">
              <textarea required rows={12} value={historyFormData.content} onChange={e => setHistoryFormData({...historyFormData, content: e.target.value})} placeholder="Décrivez le contexte historique, l'époque de l'œuvre..." className="w-full p-6 bg-stone-50 rounded-2xl outline-none font-serif leading-relaxed italic text-lg border border-stone-100 focus:bg-white transition-all shadow-inner resize-none h-[400px]" />
            </div>
            <div className="shrink-0 p-4 md:p-8 bg-white border-t border-stone-50 flex gap-3 sticky bottom-0">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowHistoryForm(false)}>Fermer</Button>
              <Button type="submit" className="flex-1 shadow-lg" onClick={handleHistorySubmit}>Partager</Button>
            </div>
          </div>
        </div>
      )}

      {showPollForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="font-serif text-2xl mb-8">Lancer un vote</h3>
            <form onSubmit={handleCreatePoll} className="space-y-4">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="space-y-2 p-4 bg-stone-50 rounded-2xl border border-stone-100">
                  <input required placeholder="Titre du livre" value={opt.title} onChange={e => {const n=[...pollOptions];n[idx].title=e.target.value;setPollOptions(n);}} className="w-full p-2 bg-transparent text-sm font-serif outline-none border-b border-stone-200" />
                  <input required placeholder="Auteur" value={opt.author} onChange={e => {const n=[...pollOptions];n[idx].author=e.target.value;setPollOptions(n);}} className="w-full p-2 bg-transparent text-[9px] uppercase font-black tracking-widest outline-none text-amber-700" />
                </div>
              ))}
              <div className="flex gap-4 pt-4"><Button type="button" variant="ghost" className="flex-1" onClick={() => setShowPollForm(false)}>Fermer</Button><Button type="submit" className="flex-1">Valider</Button></div>
            </form>
          </div>
        </div>
      )}

      {showReadingForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="font-serif text-2xl mb-8">Livre choisi</h3>
            <form onSubmit={handleCreateReading} className="space-y-6">
              <input required value={readingFormData.title} onChange={e => setReadingFormData({...readingFormData, title: e.target.value})} placeholder="Titre du livre" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100" />
              <input required value={readingFormData.author} onChange={e => setReadingFormData({...readingFormData, author: e.target.value})} placeholder="Auteur" className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100" />
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-stone-400 block ml-1">À finir pour le...</label><input required type="date" value={readingFormData.endDate} onChange={e => setReadingFormData({...readingFormData, endDate: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100" /></div>
              <div className="flex gap-4 pt-4"><Button type="button" variant="ghost" className="flex-1" onClick={() => setShowReadingForm(false)}>Fermer</Button><Button type="submit" className="flex-1">Valider</Button></div>
            </form>
          </div>
        </div>
      )}

      {showRoleForm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="font-serif text-2xl mb-8">Donner un rôle</h3>
            <form onSubmit={handleAssignRole} className="space-y-6">
              <select required value={roleData.userId} onChange={e => setRoleData({...roleData, userId: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 appearance-none">
                <option value="">Choisir un membre</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
              <select required value={roleData.roleName} onChange={e => setRoleData({...roleData, roleName: e.target.value})} className="w-full p-4 bg-stone-50 rounded-2xl outline-none border border-stone-100 appearance-none">
                <option value="Modérateur">Modérateur</option>
                <option value="Scribe">Scribe</option>
                <option value="Historien">Historien</option>
              </select>
              <div className="flex gap-4 pt-4"><Button type="button" variant="ghost" className="flex-1" onClick={() => setShowRoleForm(false)}>Fermer</Button><Button type="submit" className="flex-1">Confirmer</Button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
