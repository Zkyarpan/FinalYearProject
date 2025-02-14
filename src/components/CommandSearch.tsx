import * as React from 'react';
import { Command } from 'cmdk';
import {
  Search,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Settings,
  HelpCircle,
  PenSquare,
  X,
} from 'lucide-react';

const shortcuts = [
  {
    icon: Calendar,
    title: 'Appointments',
    shortcut: '/a',
    url: '/appointments',
  },
  {
    icon: Users,
    title: 'My Patients',
    shortcut: '/p',
    url: '/patients',
  },
  {
    icon: FileText,
    title: 'My Articles',
    shortcut: '/ar',
    url: '/articles',
  },
  {
    icon: MessageSquare,
    title: 'Messages',
    shortcut: '/m',
    url: '/messages',
  },
  {
    icon: PenSquare,
    title: 'My Blogs',
    shortcut: '/b',
    url: '/blogs',
  },
];

interface CommandMenuProps {
  router: {
    push: (url: string) => void;
  };
}

export function CommandMenu({ router }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Handle keyboard shortcuts and click outside
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }

      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('keydown', down);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    setSearch('');
    command();
  }, []);

  const filteredShortcuts = React.useMemo(() => {
    if (!search) return shortcuts;
    const searchLower = search.toLowerCase();
    return shortcuts.filter(
      item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.shortcut.toLowerCase().includes(searchLower)
    );
  }, [search]);

  return (
    <div className="relative w-full max-w-lg" ref={menuRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onClick={() => setOpen(true)}
          placeholder="Search mentality..."
          className="block w-full h-9 rounded-lg border  bg-gray-100 px-3 py-2 pl-9 text-sm text-gray-900  focus:border-gray-300 placeholder:text-gray-500 focus:outline-none dark:border-[#333333] dark:bg-input dark:text-gray-300 dark:focus:border-[#444444]"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 items-center gap-1 rounded border border-gray-200 bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:border-[#333333] dark:bg-[#1a1a1a] sm:flex">
          {open
            ? 'ESC'
            : `${navigator.platform.includes('Mac') ? '⌘' : 'CTRL'} K`}
        </kbd>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-[#333333] dark:bg-[#1a1a1a]">
          <Command className="overflow-hidden">
            <div className="flex items-center border-b border-gray-200 px-2 dark:border-[#333333]">
              <div className="flex w-full items-center space-x-1">
                <Search className="h-4 w-4 shrink-0 text-gray-500" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  className="flex h-9 w-full bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300"
                />
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  setSearch('');
                }}
                className="ml-2 flex h-6 w-6 items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-[#252525]"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2">
              {filteredShortcuts.length === 0 && search !== '' && (
                <p className="p-4 text-center text-sm text-gray-500">
                  No results found.
                </p>
              )}

              <Command.Group heading="Quick Links" className="pb-2">
                {filteredShortcuts.map(shortcut => (
                  <Command.Item
                    key={shortcut.url}
                    onSelect={() => {
                      runCommand(() => router.push(shortcut.url));
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-900 hover:bg-gray-100 aria-selected:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#252525] dark:aria-selected:bg-[#252525]"
                  >
                    <shortcut.icon className="h-4 w-4 text-gray-500 shrink-0" />
                    <span className="flex-1">{shortcut.title}</span>
                    <kbd className="text-xs text-gray-500">
                      {shortcut.shortcut}
                    </kbd>
                  </Command.Item>
                ))}
              </Command.Group>

              <Command.Group heading="Settings & Support" className="pb-2">
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/settings'))}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-900 hover:bg-gray-100 aria-selected:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#252525] dark:aria-selected:bg-[#252525]"
                >
                  <Settings className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="flex-1">Settings</span>
                  <kbd className="text-xs text-gray-500">/s</kbd>
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => router.push('/help'))}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-900 hover:bg-gray-100 aria-selected:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#252525] dark:aria-selected:bg-[#252525]"
                >
                  <HelpCircle className="h-4 w-4 text-gray-500 shrink-0" />
                  <span className="flex-1">Help Center</span>
                  <kbd className="text-xs text-gray-500">/h</kbd>
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
