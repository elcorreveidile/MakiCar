export default function MakiCarLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 92 92" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="92" height="92" rx="20" fill="#0A0E1A" stroke="#232C3F"/>
        <path d="M20 66 L20 30 L46 56 L72 30 L72 66" stroke="#FFB627" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="20" cy="30" r="6.5" fill="#0A0E1A" stroke="#FFB627" strokeWidth="4"/>
        <circle cx="72" cy="30" r="6.5" fill="#0A0E1A" stroke="#FFB627" strokeWidth="4"/>
        <circle cx="46" cy="56" r="5" fill="#2BB6A4"/>
      </svg>
      <span className="font-sora font-extrabold text-[19px] tracking-tight">
        Maki<span className="text-ambar">Car</span>
      </span>
    </div>
  );
}
