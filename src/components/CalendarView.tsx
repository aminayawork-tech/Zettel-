'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

interface EntryLite {
  id: string;
  sourceTitle: string;
  mainIdea: string;
  type: string;
  sourceType: string;
  createdAt: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarView({ entries }: { entries: EntryLite[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(null);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, EntryLite[]>();
    for (const e of entries) {
      const key = dateKey(new Date(e.createdAt));
      const list = map.get(key) || [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [entries]);

  const cells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const items: { date: Date | null }[] = [];
    for (let i = 0; i < firstWeekday; i++) items.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) items.push({ date: new Date(year, month, d) });
    while (items.length % 7 !== 0) items.push({ date: null });
    return items;
  }, [viewDate]);

  const todayKey = dateKey(today);
  const selectedEntries = selected ? entriesByDay.get(selected) || [] : [];
  const monthTotal = cells.reduce((sum, c) => sum + (c.date ? entriesByDay.get(dateKey(c.date))?.length || 0 : 0), 0);

  return (
    <div className="space-y-4">
      <div className="card p-3 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            className="btn-ghost px-2"
            aria-label="Previous month"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
          >
            ←
          </button>
          <div className="text-center">
            <p className="font-serif text-lg font-semibold">
              {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>
            <p className="text-xs text-ink/40">{monthTotal} {monthTotal === 1 ? 'entry' : 'entries'}</p>
          </div>
          <button
            className="btn-ghost px-2"
            aria-label="Next month"
            onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-ink/40 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.date) return <div key={i} />;
            const key = dateKey(cell.date);
            const dayEntries = entriesByDay.get(key) || [];
            const isToday = key === todayKey;
            const isSelected = key === selected;
            return (
              <button
                key={i}
                onClick={() => setSelected(isSelected ? null : key)}
                className={`aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-xs sm:text-sm transition-colors
                  ${isSelected ? 'bg-ink text-paper' : dayEntries.length > 0 ? 'bg-accent/10 hover:bg-accent/20' : 'hover:bg-ink/5'}
                  ${isToday && !isSelected ? 'ring-1 ring-accent' : ''}`}
              >
                <span>{cell.date.getDate()}</span>
                {dayEntries.length > 0 && (
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-paper' : 'bg-accent'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="card p-4 sm:p-5">
          <p className="label mb-3">
            {new Date(selected + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          {selectedEntries.length === 0 ? (
            <p className="text-sm text-ink/50">No entries this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedEntries.map((e) => (
                <Link key={e.id} href={`/entry/${e.id}`} className="block border border-ink/10 rounded-md px-3 py-2 hover:border-accent/50">
                  <div className="flex items-center gap-2 text-xs text-ink/40">
                    <span>{e.type === 'principle' ? 'Principle' : e.sourceType}</span>
                  </div>
                  <p className="font-medium text-sm">{e.sourceTitle}</p>
                  <p className="text-xs text-ink/60 line-clamp-1">{e.mainIdea}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
