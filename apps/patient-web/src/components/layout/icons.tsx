import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {children}
        </svg>
    );
}

export const PhoneCall = (p: IconProps) => (
    <Icon {...p}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icon>
);

export const Ambulance = (p: IconProps) => (
    <Icon {...p}>
        <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
        <path d="M15 18H9" />
        <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
        <circle cx="17" cy="18" r="2" />
        <circle cx="7" cy="18" r="2" />
    </Icon>
);

export const Lock = (p: IconProps) => (
    <Icon {...p}>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </Icon>
);

export const IdCard = (p: IconProps) => (
    <Icon {...p}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <circle cx="8" cy="11" r="2" />
        <path d="M14 10h4" />
        <path d="M14 14h4" />
        <path d="M5 16c.5-1.5 1.7-2 3-2s2.5.5 3 2" />
    </Icon>
);

export const Globe = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Icon>
);

export const ChevronDown = (p: IconProps) => (
    <Icon {...p}>
        <path d="m6 9 6 6 6-6" />
    </Icon>
);

export const Menu = (p: IconProps) => (
    <Icon {...p}>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
    </Icon>
);

export const Search = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </Icon>
);

export const X = (p: IconProps) => (
    <Icon {...p}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </Icon>
);

export const ShieldCheck = (p: IconProps) => (
    <Icon {...p}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
        <path d="m9 12 2 2 4-4" />
    </Icon>
);

export const CalendarCheck = (p: IconProps) => (
    <Icon {...p}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="m9 16 2 2 4-4" />
    </Icon>
);

export const CalendarPlus = (p: IconProps) => (
    <Icon {...p}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
        <path d="M12 14v4" />
        <path d="M10 16h4" />
    </Icon>
);

export const ArrowRight = (p: IconProps) => (
    <Icon {...p}>
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </Icon>
);

export const ChevronLeft = (p: IconProps) => (
    <Icon {...p}>
        <path d="m15 18-6-6 6-6" />
    </Icon>
);

export const ChevronRight = (p: IconProps) => (
    <Icon {...p}>
        <path d="m9 18 6-6-6-6" />
    </Icon>
);

export const Clock = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
    </Icon>
);

export const MapPin = (p: IconProps) => (
    <Icon {...p}>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </Icon>
);
export const HeartPulse = (p: IconProps) => (
    <Icon {...p}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
    </Icon>
);

export const Stethoscope = (p: IconProps) => (
    <Icon {...p}>
        <path d="M11 2v2" />
        <path d="M5 2v2" />
        <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
        <path d="M8 15a6 6 0 0 0 12 0v-3" />
        <circle cx="20" cy="10" r="2" />
    </Icon>
);

export const Lotus = (p: IconProps) => (
    <Icon {...p}>
        <path d="M12 3c3 3 3 9 0 14-3-5-3-11 0-14z" />
        <path d="M12 20C6 20 3 17 2 12c4 0 8 2 10 8z" />
        <path d="M12 20c6 0 9-3 10-8-4 0-8 2-10 8z" />
    </Icon>
);

export const Syringe = (p: IconProps) => (
    <Icon {...p}>
        <path d="m18 2 4 4" />
        <path d="m17 7 3-3" />
        <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" />
        <path d="m9 11 4 4" />
        <path d="m5 19-3 3" />
        <path d="m14 4 6 6" />
    </Icon>
);

export const PersonStanding = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="5" r="1" />
        <path d="m9 20 3-6 3 6" />
        <path d="m6 8 6 2 6-2" />
        <path d="M12 10v4" />
    </Icon>
);

export const HandPlus = (p: IconProps) => (
    <Icon {...p}>
        <path d="M12 2v6" />
        <path d="M9 5h6" />
        <path d="M2 15h4l3 2h5a2 2 0 0 0 0-4h-3l5.5-1.5L22 13l-7 6H6l-4-2z" />
    </Icon>
);

export const FlaskConical = (p: IconProps) => (
    <Icon {...p}>
        <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
        <path d="M8.5 2h7" />
        <path d="M7 16h10" />
    </Icon>
);

export const ArrowLeft = (p: IconProps) => (
    <Icon {...p}>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
    </Icon>
);

export const Star = (p: IconProps) => (
    <Icon {...p} fill="currentColor" strokeWidth={1}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </Icon>
);

export const Award = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </Icon>
);

export const Vr = (p: IconProps) => (
    <Icon {...p}>
        <path d="M2 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-4l-2-3h-4l-2 3H4a2 2 0 0 1-2-2z" />
        <circle cx="7.5" cy="11.5" r="1" />
        <circle cx="16.5" cy="11.5" r="1" />
    </Icon>
);

export const Compass = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="10" />
        <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
    </Icon>
);

export const Calendar = (p: IconProps) => (
    <Icon {...p}>
        <path d="M8 2v4" />
        <path d="M16 2v4" />
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18" />
    </Icon>
);

export const User = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
    </Icon>
);

export const Bell = (p: IconProps) => (
    <Icon {...p}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Icon>
);

export const Apple = (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
        <path d="M16.37 12.64c-.03-2.6 2.12-3.85 2.22-3.91-1.21-1.77-3.09-2.01-3.76-2.04-1.6-.16-3.12.94-3.93.94-.81 0-2.06-.92-3.39-.89-1.74.03-3.35 1.01-4.25 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.24 2.6 1.3-.05 1.79-.84 3.36-.84 1.57 0 2.01.84 3.38.82 1.4-.03 2.28-1.27 3.13-2.52.99-1.45 1.4-2.85 1.42-2.92-.03-.01-2.72-1.04-2.75-4.15zM13.8 4.97c.71-.86 1.19-2.06 1.06-3.25-1.02.04-2.26.68-2.99 1.54-.66.76-1.23 1.98-1.08 3.15 1.14.09 2.3-.58 3.01-1.44z" />
    </svg>
);

export const PlayStore = (p: IconProps) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
        <path d="M4.5 2.6a1.5 1.5 0 0 0-.5 1.2v16.4c0 .5.2.9.5 1.2l9.2-9.4L4.5 2.6zM15.1 13.3l-9.3 9.5c.3.1.7.1 1.1-.1l11.3-6.5-3.1-2.9zM18.3 9.3 6.9 2.8c-.4-.2-.8-.2-1.1-.1l9.3 9.5 3.2-2.9zM19.3 10 16.2 12l3.1 2 2.2-1.3c.8-.5.8-1.6 0-2l-2.2-1.3z" />
    </svg>
);

export const Mail = (p: IconProps) => (
    <Icon {...p}>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </Icon>
);

export const Eye = (p: IconProps) => (
    <Icon {...p}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
    </Icon>
);

export const BarChart = (p: IconProps) => (
    <Icon {...p}>
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
    </Icon>
);

export const Bot = (p: IconProps) => (
    <Icon {...p}>
        <rect x="3" y="8" width="18" height="12" rx="2" />
        <path d="M12 8V4" />
        <circle cx="12" cy="3" r="1" />
        <circle cx="8.5" cy="13.5" r="1" />
        <circle cx="15.5" cy="13.5" r="1" />
        <path d="M9 17h6" />
    </Icon>
);

export const Siren = (p: IconProps) => (
    <Icon {...p}>
        <path d="M7 18v-6a5 5 0 0 1 10 0v6" />
        <path d="M5 21a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1H5z" />
        <path d="M21 12h1" />
        <path d="M18.5 4.5 18 5" />
        <path d="M2 12h1" />
        <path d="M12 2v1" />
        <path d="m4.929 4.929.707.707" />
    </Icon>
);

export const ArrowUp = (p: IconProps) => (
    <Icon {...p}>
        <path d="m5 12 7-7 7 7" />
        <path d="M12 19V5" />
    </Icon>
);

export const BadgeCheck = (p: IconProps) => (
    <Icon {...p}>
        <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
        <path d="m9 12 2 2 4-4" />
    </Icon>
);

export const Shield = (p: IconProps) => (
    <Icon {...p}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </Icon>
);

export const Sun = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
    </Icon>
);

export const Sunset = (p: IconProps) => (
    <Icon {...p}>
        <path d="M12 10V2" />
        <path d="m4.93 10.93 1.41 1.41" />
        <path d="M2 18h2" />
        <path d="M20 18h2" />
        <path d="m19.07 10.93-1.41 1.41" />
        <path d="M22 22H2" />
        <path d="m16 6-4 4-4-4" />
        <path d="M16 18a4 4 0 0 0-8 0" />
    </Icon>
);

export const Info = (p: IconProps) => (
    <Icon {...p}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
    </Icon>
);

export const Check = (p: IconProps) => (
    <Icon {...p}>
        <path d="M20 6 9 17l-5-5" />
    </Icon>
);

export const Lightbulb = (p: IconProps) => (
    <Icon {...p}>
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
    </Icon>
);

export const EyeOff = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <path d="m2 2 20 20" />
  </Icon>
);

export const Home = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </Icon>
);

export const FileText = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M8 13h8" />
    <path d="M8 17h8" />
  </Icon>
);

export const Headset = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
    <path d="M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2z" />
    <path d="M3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z" />
  </Icon>
);

export const Pencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </Icon>
);

export const QrCode = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3z" />
    <path d="M21 14v3" />
    <path d="M14 21h3" />
    <path d="M21 21h.01" />
  </Icon>
);

export const Camera = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
    <circle cx="12" cy="13" r="3" />
  </Icon>
);

export const HelpCircle = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </Icon>
);

export const Plus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </Icon>
);

export const Asterisk = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 4v16" />
    <path d="m5.07 8 13.86 8" />
    <path d="m5.07 16 13.86-8" />
  </Icon>
);

export const LogOut = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

export const Brain = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M12 5v13" />
  </Icon>
);

export const Activity = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M6 12h3l2-4 3 7 2-3h2" />
    <path d="M8 21h8" />
  </Icon>
);

export const Smile = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
  </Icon>
);

export const Send = (p: IconProps) => (
  <Icon {...p}>
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </Icon>
);

export const Paperclip = (p: IconProps) => (
  <Icon {...p}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </Icon>
);

export const Mic = (p: IconProps) => (
  <Icon {...p}>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <path d="M12 19v3" />
  </Icon>
);

export const Minus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const RefreshCw = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </Icon>
);

export const CalendarX = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M3 10h18" />
    <path d="m14.5 13.5-5 5" />
    <path d="m9.5 13.5 5 5" />
  </Icon>
);

export const Download = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="m7 10 5 5 5-5" />
    <path d="M12 15V3" />
  </Icon>
);

export const History = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </Icon>
);

export const ClipboardList = (p: IconProps) => (
  <Icon {...p}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6" />
    <path d="M9 16h6" />
  </Icon>
);

export const Ticket = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 9a3 3 0 0 1 0 6v3a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-3a3 3 0 0 1 0-6V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z" />
    <path d="M13 5v14" strokeDasharray="2 3" />
  </Icon>
);

export const Pill = (p: IconProps) => (
  <Icon {...p}>
    <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </Icon>
);

export const ImageIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
  </Icon>
);

export const ShoppingBag = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </Icon>
);

export const CreditCard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </Icon>
);

export const Receipt = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
    <path d="M12 17.5v-11" />
  </Icon>
);

export const Wallet = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </Icon>
);

export const Zap = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9z" />
  </Icon>
);

export const Building = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </Icon>
);

export const AlertTriangle = (p: IconProps) => (
  <Icon {...p}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Icon>
);

export const Users = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

export const Link2 = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <path d="M8 12h8" />
  </Icon>
);

export const Smartphone = (p: IconProps) => (
  <Icon {...p}>
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <path d="M12 18h.01" />
  </Icon>
);

export const Funnel = (p: IconProps) => (
  <Icon {...p}>
    <path d="M22 3H2l8 9.46V19l4 2v-8.54z" />
  </Icon>
);

export const Ear = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" />
    <path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />
  </Icon>
);

export const Tooth = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 3c-2.5 0-4 2-4 4.5 0 3 1.5 4.5 2 7.5.4 2.5.8 6 2.5 6 1.5 0 1.5-4 2-5s1.5-1 2 0 .5 5 2 5c1.7 0 2.1-3.5 2.5-6 .5-3 2-4.5 2-7.5C21 5 19.500 3 17 3c-2 0-2.500 1-5 1S9 3 7 3Z" />
  </Icon>
);

export const Sparkles = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z" />
  </Icon>
);