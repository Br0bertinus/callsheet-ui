// A tiny CSS calendar that shows today's actual day number.
// Replaces the static 📅 emoji which always displays July 17 on Apple platforms.

type CalendarIconProps = {
  // Tailwind size for the overall box, e.g. 'w-10 h-10' or 'w-6 h-6'
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_CLASSES = {
  sm: { outer: 'w-6 h-6 rounded',       header: 'h-1.5',   day: 'text-[10px]' },
  md: { outer: 'w-9 h-9 rounded-lg',    header: 'h-2',     day: 'text-sm'     },
  lg: { outer: 'w-14 h-14 rounded-xl',  header: 'h-3.5',   day: 'text-2xl'    },
};

export function CalendarIcon({ size = 'md' }: CalendarIconProps) {
  const day = new Date().getDate();
  const s = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex flex-col overflow-hidden border border-gray-200 shadow-sm bg-white ${s.outer} shrink-0`}
      aria-hidden="true"
    >
      {/* Calendar header strip */}
      <span className={`block w-full bg-indigo-500 ${s.header}`} />
      {/* Day number */}
      <span className={`flex flex-1 items-center justify-center font-bold text-gray-800 leading-none ${s.day}`}>
        {day}
      </span>
    </span>
  );
}
