/** The patient's profile picture. Drawn rather than photographic because
 *  there's no photo to load yet — but it reads as a portrait, not a mascot. */
export default function ProfileAvatar({ className = "h-28 w-28" }: { className?: string }) {
  return (
    <span className={`relative block shrink-0 ${className}`}>
      <svg viewBox="0 0 120 120" role="img" aria-label="Foto profil pasien" className="h-full w-full">
        <defs>
          <clipPath id="pa-clip">
            <circle cx="60" cy="60" r="60" />
          </clipPath>
        </defs>

        <g clipPath="url(#pa-clip)">
          <rect width="120" height="120" fill="#efe4d3" />
          {/* Shoulders */}
          <ellipse cx="60" cy="126" rx="46" ry="38" fill="#8fa87f" />
          <ellipse cx="60" cy="130" rx="34" ry="30" fill="#a4bb93" />
          {/* Neck */}
          <rect x="50" y="74" width="20" height="20" rx="9" fill="#e8c4a4" />
          {/* Hair behind */}
          <ellipse cx="60" cy="56" rx="34" ry="35" fill="#4a3b30" />
          {/* Face */}
          <ellipse cx="60" cy="58" rx="26" ry="29" fill="#f3d3b4" />
          {/* Fringe */}
          <path d="M34 52a26 29 0 0 1 52 0c-8-6-16-12-26-12s-18 6-26 12Z" fill="#4a3b30" />
          <path d="M60 29c16 0 28 11 28 25 0-6-4-11-9-13 2 4 1 8-2 9-2-6-8-11-17-11s-15 5-17 11c-3-1-4-5-2-9-5 2-9 7-9 13 0-14 12-25 28-25Z" fill="#3d3028" />
          {/* Eyes and smile */}
          <ellipse cx="50" cy="58" rx="2.6" ry="3.2" fill="#3d3028" />
          <ellipse cx="70" cy="58" rx="2.6" ry="3.2" fill="#3d3028" />
          <path d="M52 69q8 6 16 0" stroke="#3d3028" strokeWidth="2.4" strokeLinecap="round" fill="none" />
          {/* Cheeks */}
          <ellipse cx="42" cy="65" rx="5" ry="3.4" fill="#e3a08a" opacity="0.5" />
          <ellipse cx="78" cy="65" rx="5" ry="3.4" fill="#e3a08a" opacity="0.5" />
        </g>
      </svg>
    </span>
  );
}
