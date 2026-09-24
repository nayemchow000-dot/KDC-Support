import React, { useState } from 'react';
import { useSupport } from '../../context/SupportContext';
import {
  UserPlus,
  Send,
  ThumbsUp,
  PhoneCall,
  ArrowUpCircle,
  Building2,
  Users,
  Sunrise,
  BookOpen,
  AlignJustify,
  Link2,
  Flag,
  TrendingUp,
  Heart,
  Megaphone,
  Star,
  Search,
  Filter,
  Phone,
  Plus,
  CheckCircle,
  Calendar,
  LogOut,
  Maximize2,
  Minimize2,
  Clock,
  ChevronRight,
  Sparkles,
  Award,
  X,
} from 'lucide-react';

interface DawahCategory {
  id: number;
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
}

interface BrotherRecord {
  id: string;
  name: string;
  phone: string;
  stageId: number;
  stageName: string;
  growthScore: number;
  lastContact: string;
  isCritical: boolean;
  notes?: string;
}

export const UserDashboard: React.FC = () => {
  const { logout, userAuthInfo, isPhoneFrame, setIsPhoneFrame } = useSupport();

  // 16 Categories exactly matching the screenshot
  const [categories, setCategories] = useState<DawahCategory[]>([
    { id: 1, title: 'নতুন পরিচিতি', count: 55, icon: UserPlus, tag: 'new' },
    { id: 2, title: 'দাওয়াাহ দেওয়া হয়েছে', count: 0, icon: Send, tag: 'contacted' },
    { id: 3, title: 'ইতিবাচক সাড়া', count: 0, icon: ThumbsUp, tag: 'positive' },
    { id: 4, title: 'নিয়মিত যোগাযোগ', count: 1, icon: PhoneCall, tag: 'regular' },
    { id: 5, title: 'সালাতের উন্নতি', count: 0, icon: ArrowUpCircle, tag: 'salah' },
    { id: 6, title: 'মসজিদের সাথে সংযোগ', count: 0, icon: Building2, tag: 'mosque' },
    { id: 7, title: 'জামাতে অংশগ্রহণ', count: 0, icon: Users, tag: 'jamaat' },
    { id: 8, title: 'ফজরের সাথে সংযোগ', count: 0, icon: Sunrise, tag: 'fajr' },
    { id: 9, title: 'কুরআন ও দ্বীনি শিক্ষা', count: 0, icon: BookOpen, tag: 'quran' },
    { id: 10, title: 'ইলমি মুজাহারা / পাঠচক্র', count: 0, icon: AlignJustify, tag: 'study' },
    { id: 11, title: 'দাওয়াাহ সার্কেলের সাথে সংযোগ', count: 2, icon: Link2, tag: 'circle' },
    { id: 12, title: 'ফজর ক্যাম্পেইনে অংশগ্রহণ', count: 0, icon: Flag, tag: 'campaign' },
    { id: 13, title: 'ব্যক্তিগত আমলের উন্নতি', count: 1, icon: TrendingUp, tag: 'amal' },
    { id: 14, title: 'চরিত্র ও পারিবারিক উন্নতি', count: 0, icon: Heart, tag: 'character' },
    { id: 15, title: 'দাওয়াাহ কাজে অংশগ্রহণ', count: 1, icon: Megaphone, tag: 'active_work' },
    { id: 16, title: 'সক্রিয় দাওয়াহ কর্মী', count: 1, icon: Star, tag: 'kormi' },
  ]);

  // Priority Matrix Brothers Data
  const [brothers, setBrothers] = useState<BrotherRecord[]>([
    {
      id: 'br-1',
      name: 'আব্দুল্লাহ আল-মামুন',
      phone: '+880 1711-234567',
      stageId: 11,
      stageName: 'দাওয়াাহ সার্কেলের সাথে সংযোগ',
      growthScore: 85,
      lastContact: 'গতকাল ৩:৩০ PM',
      isCritical: true,
      notes: 'সাপ্তাহিক তাফসীর হালাকায় নিয়মিত অংশ নিচ্ছেন।',
    },
    {
      id: 'br-2',
      name: 'তানভীর আহমেদ',
      phone: '+880 1822-345678',
      stageId: 4,
      stageName: 'নিয়মিত যোগাযোগ',
      growthScore: 72,
      lastContact: '২ দিন আগে',
      isCritical: true,
      notes: 'ফজর সালাতের তাগিদ দেওয়া হয়েছে, আন্তরিক সাড়া দিয়েছেন।',
    },
    {
      id: 'br-3',
      name: 'রফিকুল ইসলাম',
      phone: '+880 1933-456789',
      stageId: 13,
      stageName: 'ব্যক্তিগত আমলের উন্নতি',
      growthScore: 68,
      lastContact: '৩ দিন আগে',
      isCritical: false,
      notes: 'দৈনিক কুরআন তিলাওয়াত শুরু করেছেন।',
    },
    {
      id: 'br-4',
      name: 'মাহমুদুল হাসান',
      phone: '+880 1644-567890',
      stageId: 15,
      stageName: 'দাওয়াাহ কাজে অংশগ্রহণ',
      growthScore: 90,
      lastContact: 'আজ সকালে',
      isCritical: false,
      notes: 'নতুন পরিচিতি সংগ্রহে সক্রিয়ভাবে সাথে থাকছেন।',
    },
    {
      id: 'br-5',
      name: 'নাজমুল হুদা',
      phone: '+880 1555-678901',
      stageId: 16,
      stageName: 'সক্রিয় দাওয়াহ কর্মী',
      growthScore: 94,
      lastContact: 'আজ দুপুর',
      isCritical: false,
      notes: 'স্থানীয় মসজিদ দাওয়াহ টিমের সমন্বয় করছেন।',
    },
    {
      id: 'br-6',
      name: 'ফরহান কবির',
      phone: '+880 1766-789012',
      stageId: 11,
      stageName: 'দাওয়াাহ সার্কেলের সাথে সংযোগ',
      growthScore: 82,
      lastContact: 'গতকাল',
      isCritical: true,
      notes: 'যুব পাঠচক্রের সাথে যুক্ত হতে আগ্রহী।',
    },
  ]);

  // Filters & State
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [callingBrother, setCallingBrother] = useState<BrotherRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBrotherName, setNewBrotherName] = useState('');
  const [newBrotherPhone, setNewBrotherPhone] = useState('');
  const [newBrotherStage, setNewBrotherStage] = useState(1);
  const [newBrotherScore, setNewBrotherScore] = useState(65);

  // Filtered brothers
  const filteredBrothers = brothers.filter((b) => {
    if (selectedCategory !== null && b.stageId !== selectedCategory) {
      return false;
    }
    if (criticalOnly && !b.isCritical) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        b.stageName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddBrother = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrotherName.trim()) return;

    const targetCategory = categories.find((c) => c.id === newBrotherStage);
    const newRecord: BrotherRecord = {
      id: 'br-' + Date.now(),
      name: newBrotherName.trim(),
      phone: newBrotherPhone.trim() || '+880 1700-000000',
      stageId: newBrotherStage,
      stageName: targetCategory?.title || 'নতুন পরিচিতি',
      growthScore: newBrotherScore,
      lastContact: 'আজকে',
      isCritical: true,
      notes: 'নতুনভাবে যুক্ত করা হয়েছে।',
    };

    setBrothers([newRecord, ...brothers]);
    setCategories((prev) =>
      prev.map((c) => (c.id === newBrotherStage ? { ...c, count: c.count + 1 } : c))
    );

    setNewBrotherName('');
    setNewBrotherPhone('');
    setIsAddModalOpen(false);
  };

  const handleStageSelect = (catId: number) => {
    if (selectedCategory === catId) {
      setSelectedCategory(null); // toggle off
    } else {
      setSelectedCategory(catId);
    }
  };

  const loggedUser = userAuthInfo?.phone || userAuthInfo?.email || '+880 1712-345678';

  return (
    <div className="min-h-full bg-[#0a0d10] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Bar with Profile & Expand Controls */}
      <div className="bg-[#0e1318]/90 border-b border-[#1b232c] px-4 py-2.5 flex items-center justify-between text-xs sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-slate-400 hidden sm:inline">লগইন আইডি:</span>
          <span className="font-mono text-emerald-400 font-medium">{loggedUser}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPhoneFrame(!isPhoneFrame)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#161e27] hover:bg-[#1e2834] text-slate-300 border border-[#232f3c] transition-colors"
            title={isPhoneFrame ? 'পূর্ণ পর্দা করুন' : 'মোবাইল ফ্রেম করুন'}
          >
            {isPhoneFrame ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">পূর্ণ পর্দা</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">মোবাইল ফ্রেম</span>
              </>
            )}
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/60 transition-colors"
            title="লগআউট"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto w-full flex-1 flex flex-col">
        {/* Header Section from Screenshot */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-slate-100 font-normal tracking-wide">
            My Dawah Priority
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-sans">
            Assalamu Alaikum. Here is your focus for today.
          </p>
        </div>

        {/* 16 Dawah Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => handleStageSelect(cat.id)}
                className={`group relative rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-[#12221b] border-emerald-500 ring-1 ring-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                    : 'bg-[#11161b] hover:bg-[#151c22] border-[#1d2630] hover:border-emerald-600/50'
                }`}
              >
                {/* Circular Icon Container */}
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-3 border transition-transform duration-200 group-hover:scale-105 ${
                    isSelected
                      ? 'bg-emerald-900/40 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'bg-[#0e211b] border-emerald-800/60 text-emerald-400 group-hover:border-emerald-600 group-hover:text-emerald-300'
                  }`}
                >
                  <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
                </div>

                {/* Bengali Title */}
                <h3 className="font-semibold text-xs sm:text-sm text-slate-100 mb-1.5 leading-snug tracking-tight">
                  {cat.title}
                </h3>

                {/* Member Count */}
                <div className="flex items-center justify-center gap-1 text-xs">
                  <span className="text-emerald-400 font-bold font-mono text-sm sm:text-base">
                    {cat.count}
                  </span>
                  <span className="text-slate-400 text-[11px] sm:text-xs">জন সদস্য</span>
                </div>

                {/* Selected Indicator Badge */}
                {isSelected && (
                  <span className="absolute top-2 right-2.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold">
                    ফিল্টার্ড
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Section: Priority Matrix (Left) & Growth Highlights (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column (2 Cols wide on desktop): My Dawah Priority Matrix */}
          <div className="lg:col-span-2 bg-[#10151a] border border-[#1d2630] rounded-2xl p-4 sm:p-5 flex flex-col shadow-lg">
            {/* Matrix Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1c242e]">
              <div className="flex items-center gap-2.5">
                <h2 className="font-mono text-xs sm:text-sm uppercase font-bold tracking-wider text-slate-200">
                  MY DAWAH PRIORITY MATRIX
                </h2>
                {selectedCategory !== null && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-[10px] bg-[#1a232c] text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-900/60 flex items-center gap-1 hover:bg-[#202c38]"
                  >
                    <span>ফিল্টার মুছুন</span>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCriticalOnly(!criticalOnly)}
                  className={`text-[11px] sm:text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                    criticalOnly
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-[#161e26] hover:bg-[#1c2630] text-slate-300 border-[#25323e]'
                  }`}
                >
                  {criticalOnly ? '✓ Showing Critical First' : 'Showing Critical First'}
                </button>
              </div>
            </div>

            {/* Search & Quick Filter */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ভাইদের নাম, ফোন নম্বর বা ধাপ দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-4 py-2 bg-[#0d1116] border border-[#1c252f] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Brothers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1b232c] text-[11px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 px-3">BROTHER NAME</th>
                    <th className="py-2.5 px-3">STAGE</th>
                    <th className="py-2.5 px-3">GROWTH SCORE</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171f28]">
                  {filteredBrothers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 text-xs">
                        কোনো সদস্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredBrothers.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-[#141b22] transition-colors group"
                      >
                        {/* Name & Phone */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                            {b.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{b.phone}</span>
                            <span>•</span>
                            <span className="text-slate-400">{b.lastContact}</span>
                          </div>
                        </td>

                        {/* Stage */}
                        <td className="py-3 px-3">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-[#14231d] border border-emerald-900/60 text-emerald-300 text-[11px] font-medium leading-tight">
                            {b.stageName}
                          </span>
                        </td>

                        {/* Growth Score with Progress Bar */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[#161f28] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                                style={{ width: `${b.growthScore}%` }}
                              ></div>
                            </div>
                            <span className="font-mono text-emerald-400 font-semibold text-xs">
                              {b.growthScore}%
                            </span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setCallingBrother(b)}
                              className="px-2.5 py-1 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors"
                              title="যোগাযোগ করুন"
                            >
                              <Phone className="w-3 h-3" />
                              <span>যোগাযোগ</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary in Matrix */}
            <div className="mt-4 pt-3 border-t border-[#1b232c] flex items-center justify-between text-[11px] text-slate-400">
              <span>মোট ভাই প্রদর্শিত: {filteredBrothers.length} জন</span>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন সদস্য যুক্ত করুন</span>
              </button>
            </div>
          </div>

          {/* Right Column: Growth Highlights */}
          <div className="bg-[#10151a] border border-[#1d2630] rounded-2xl p-4 sm:p-5 flex flex-col shadow-lg space-y-5">
            <div>
              <h2 className="font-mono text-xs sm:text-sm uppercase font-bold tracking-wider text-slate-200 mb-1">
                GROWTH HIGHLIGHTS
              </h2>
              <p className="text-[11px] text-slate-400">
                আজকের দাওয়াহ অগ্রগতি ও পরিসংখ্যান
              </p>
            </div>

            {/* Community Average Widget */}
            <div className="bg-[#141a20] border border-[#1e2732] rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Community Average</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-emerald-400">74%</span>
                  <span className="text-[10px] text-emerald-500 font-semibold font-mono">
                    +8.2% বৃদ্ধি
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  গত মাসের তুলনায় উল্লেখযোগ্য অগ্রগতি
                </span>
              </div>

              <div className="w-12 h-12 rounded-full bg-[#0e241c] border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            {/* Key Focus Highlights */}
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#141a20] border border-[#1e2732] flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">নতুন পরিচিতি ফলোআপ</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ৫৫ জন নতুন পরিচিতি তালিকায় রয়েছে, প্রথম দাওয়াহ শুরু করার প্রস্তুতি নিন।
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#141a20] border border-[#1e2732] flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-800 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">সার্কেল বৈঠক</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    দাওয়াাহ সার্কেলে ২ জন সক্রিয় ভাই আছেন, আগামী বৈঠকের বিষয়বস্তু প্রস্তুত রয়েছে।
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#141a20] border border-[#1e2732] flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">সক্রিয় কর্মী লক্ষ্যমাত্রা</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    চলতি মাসে আরও ২ জন ভাইকে কর্মী হিসেবে গড়ে তোলার পরিকল্পনা।
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন সদস্য / ভাই যোগ করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Call / Contact Details */}
      {callingBrother && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#11171d] border border-[#222e3b] rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-[#0d261e] border-2 border-emerald-500 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <Phone className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-base font-bold text-slate-100 mb-0.5">
              {callingBrother.name}
            </h3>
            <p className="text-xs font-mono text-emerald-400 mb-3">{callingBrother.phone}</p>

            <div className="bg-[#151e26] border border-[#1f2b38] rounded-xl p-3 text-left mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">বর্তমান ধাপ:</span>
                <span className="text-emerald-300 font-medium">{callingBrother.stageName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">গ্রোথ স্কোর:</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {callingBrother.growthScore}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">সর্বশেষ যোগাযোগ:</span>
                <span className="text-slate-300">{callingBrother.lastContact}</span>
              </div>
              {callingBrother.notes && (
                <div className="pt-1 border-t border-[#233140] text-slate-400 text-[11px]">
                  নোট: {callingBrother.notes}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${callingBrother.phone}`}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>কল করুন</span>
              </a>
              <button
                onClick={() => setCallingBrother(null)}
                className="py-2.5 px-3 bg-[#1d2732] hover:bg-[#253240] text-slate-300 font-medium rounded-xl text-xs transition-colors"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Brother */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11171d] border border-[#222e3b] rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1f2b38]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">নতুন সদস্য যোগ করুন</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBrother} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ভাইয়ের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={newBrotherName}
                  onChange={(e) => setNewBrotherName(e.target.value)}
                  placeholder="যেমন: আব্দুল্লাহ আল-মামুন"
                  className="w-full px-3.5 py-2.5 bg-[#0d1217] border border-[#1d2732] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  ফোন নম্বর
                </label>
                <input
                  type="text"
                  value={newBrotherPhone}
                  onChange={(e) => setNewBrotherPhone(e.target.value)}
                  placeholder="+880 1712-345678"
                  className="w-full px-3.5 py-2.5 bg-[#0d1217] border border-[#1d2732] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  দাওয়াহ পর্যায় / ক্যাটাগরি *
                </label>
                <select
                  value={newBrotherStage}
                  onChange={(e) => setNewBrotherStage(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-[#0d1217] border border-[#1d2732] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    প্রাথমিক গ্রোথ স্কোর
                  </label>
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    {newBrotherScore}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={newBrotherScore}
                  onChange={(e) => setNewBrotherScore(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="w-2/3 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-colors"
                >
                  সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/3 py-2.5 px-4 rounded-xl bg-[#1d2732] hover:bg-[#253240] text-slate-300 text-xs transition-colors"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
