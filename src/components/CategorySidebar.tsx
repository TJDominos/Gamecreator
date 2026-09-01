import React from 'react';
import { Gamepad2, LayoutDashboard, Dices, Music, Puzzle, Swords, Building2, Trophy, Map, Lightbulb, Type, LayoutGrid } from 'lucide-react';
import { MOCK_BOUNTIES } from '../developer-portal/bounties/bountyData';

export const CATEGORIES = [
  { name: 'Arcade', icon: Gamepad2 },
  { name: 'Card & Board', icon: LayoutDashboard },
  { name: 'Casino', icon: Dices },
  { name: 'Music', icon: Music },
  { name: 'Puzzle', icon: Puzzle },
  { name: 'Role-Playing', icon: Swords },
  { name: 'Simulation', icon: Building2 },
  { name: 'Sports', icon: Trophy },
  { name: 'Strategy', icon: Map },
  { name: 'Trivia', icon: Lightbulb },
  { name: 'Word', icon: Type }
];

interface CategorySidebarProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export function CategorySidebar({ activeCategory, onSelectCategory }: CategorySidebarProps) {
  
  const getOpenCount = (catName: string) => {
    return MOCK_BOUNTIES.filter(b => b.category === catName && b.state === 'OPEN').length;
  };
  const allOpenCount = MOCK_BOUNTIES.filter(b => b.state === 'OPEN').length;

  return (
    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
      <h3 className="hidden lg:block text-[14px] leading-[21px] font-bold text-[#62626c] mb-3 uppercase tracking-[0.05em]">Categories</h3>
      
      <ul className="flex lg:flex-col gap-2 w-full m-0 p-0 list-none">
        <li className="shrink-0 lg:shrink-none">
          <button 
            onClick={() => onSelectCategory('All')} 
            className={`flex items-center gap-2 lg:w-full text-left px-4 lg:px-3 lg:-ml-3 py-2 rounded-full lg:rounded-lg text-sm transition-all duration-200 ${
              activeCategory === 'All' 
                ? 'bg-[var(--portal-purple)] text-white font-semibold shadow-md lg:border-l-4 lg:border-[var(--portal-purple)] lg:bg-[#f3e8ff] lg:text-[var(--portal-purple)] lg:shadow-none lg:rounded-r-lg lg:rounded-l-none' 
                : 'bg-slate-100 lg:bg-transparent text-[var(--portal-muted)] lg:text-[var(--portal-ink)] font-medium hover:bg-slate-200 lg:hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={16} className="hidden lg:block shrink-0" /> 
            <span className="flex-1 whitespace-nowrap">All Categories</span>
            <span className={`hidden lg:inline-block text-xs ${activeCategory === 'All' ? 'text-[var(--portal-purple)] opacity-80' : 'text-[var(--portal-muted)]'}`}>
              ({allOpenCount})
            </span>
          </button>
        </li>
        {CATEGORIES.map(cat => {
          const count = getOpenCount(cat.name);
          const Icon = cat.icon;
          const isActive = activeCategory === cat.name;
          return (
            <li key={cat.name} className="shrink-0 lg:shrink-none">
              <button 
                onClick={() => onSelectCategory(cat.name)} 
                className={`flex items-center gap-2 lg:w-full text-left px-4 lg:px-3 lg:-ml-3 py-2 rounded-full lg:rounded-lg text-sm transition-all duration-200 ${
                  isActive 
                    ? 'bg-[var(--portal-purple)] text-white font-semibold shadow-md lg:border-l-4 lg:border-[var(--portal-purple)] lg:bg-[#f3e8ff] lg:text-[var(--portal-purple)] lg:shadow-none lg:rounded-r-lg lg:rounded-l-none' 
                    : 'bg-slate-100 lg:bg-transparent text-[var(--portal-muted)] lg:text-[var(--portal-ink)] font-medium hover:bg-slate-200 lg:hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className="hidden lg:block shrink-0" /> 
                <span className="flex-1 whitespace-nowrap">{cat.name}</span>
                <span className={`hidden lg:inline-block text-xs ${isActive ? 'text-[var(--portal-purple)] opacity-80' : 'text-[var(--portal-muted)]'}`}>
                  ({count})
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  );
}
