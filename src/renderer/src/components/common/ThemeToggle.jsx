import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '../../utils';

export function ThemeToggle({ className }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative h-8 w-16",
        "rounded-full",
        "bg-slate-100/90",
        "p-1",
        "transition-colors duration-200",
        "border border-slate-200/10",
        className
      )}
    >
      {/* Background Icons */}
      <div className="absolute inset-0 flex justify-between items-center px-2">
        <Sun size={14} className={cn(
          "transition-colors duration-200",
          isDark ? "text-slate-900" : "text-amber-300"
        )} />
        <Moon size={14} className={cn(
          "transition-colors duration-200",
          isDark ? "text-slate-100" : "text-slate-900"
        )} />
      </div>

      {/* Sliding Selector */}
      <div
        className={cn(
          "absolute top-1 h-6 w-6",
          "flex items-center justify-center",
          "rounded-full",
          "bg-slate-800",
          "shadow-sm",
          "transition-all duration-200 ease-out",
          isDark ? "translate-x-8" : "translate-x-0"
        )}
      >
        {/* Active Icon */}
        {isDark ? (
          <Moon size={14} className="text-slate-200" />
        ) : (
          <Sun size={14} className="text-amber-300" />
        )}
      </div>
    </button>
  );
} 