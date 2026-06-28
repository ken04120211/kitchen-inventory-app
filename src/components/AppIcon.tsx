interface Props {
  className?: string;
}

export default function AppIcon({ className = "w-7 h-7" }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* フォーク: 3本のタイン */}
      <line x1="8"  y1="4" x2="8"  y2="13" stroke="currentColor" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="12" y1="4" x2="12" y2="13" stroke="currentColor" strokeWidth="2"   strokeLinecap="round"/>
      <line x1="16" y1="4" x2="16" y2="13" stroke="currentColor" strokeWidth="2"   strokeLinecap="round"/>
      {/* フォーク: タインから柄への収束カーブ */}
      <path d="M8 13 Q8 17 12 17"  stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M16 13 Q16 17 12 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* フォーク: 柄 */}
      <line x1="12" y1="17" x2="12" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>

      {/* スパークル: 4点星（プランナー・レコメンドを表現） */}
      <path
        d="M25 4 L26.3 6.3 L29 8 L26.3 9.7 L25 12 L23.7 9.7 L21 8 L23.7 6.3 Z"
        fill="currentColor"
      />
    </svg>
  );
}
