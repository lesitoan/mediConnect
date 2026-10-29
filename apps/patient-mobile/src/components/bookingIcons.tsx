import type { ComponentType, ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { SpecialtyIconKey } from '../services/specialtyService';

export type BookingIconProps = { size?: number; color?: string; strokeWidth?: number };

function createIcon(render: () => ReactNode) {
  return function Icon({ size = 20, color = '#005B8D', strokeWidth = 2 }: BookingIconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {render()}
      </Svg>
    );
  };
}

export const CheckIcon = createIcon(() => <Path d="M20 6 9 17l-5-5" />);
export const ArrowRightIcon = createIcon(() => <Path d="M5 12h14M12 5l7 7-7 7" />);
export const SwapIcon = createIcon(() => <Path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />);

export const SearchIcon = createIcon(() => (
  <>
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.3-4.3" />
  </>
));

export const SlidersIcon = createIcon(() => (
  <Path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
));

export const SparklesIcon = createIcon(() => (
  <>
    <Path d="M9.9 15.5A2 2 0 0 0 8.5 14.1l-6.1-1.6a.5.5 0 0 1 0-1l6.1-1.6A2 2 0 0 0 9.9 8.5l1.6-6.1a.5.5 0 0 1 1 0l1.6 6.1a2 2 0 0 0 1.4 1.4l6.1 1.6a.5.5 0 0 1 0 1l-6.1 1.6a2 2 0 0 0-1.4 1.4l-1.6 6.1a.5.5 0 0 1-1 0z" />
    <Path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </>
));

export const BotIcon = createIcon(() => (
  <>
    <Path d="M12 8V4H8" />
    <Rect x="4" y="8" width="16" height="12" rx="2" />
    <Path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
  </>
));

export const ShieldCheckIcon = createIcon(() => (
  <>
    <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <Path d="m9 12 2 2 4-4" />
  </>
));

export const ClockIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </>
));

export function BadgeCheckIcon({ size = 20, color = '#005B8D' }: BookingIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76z"
        fill={color}
      />
      <Path
        d="m9 12 2 2 4-4"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

const StethoscopeIcon = createIcon(() => (
  <>
    <Path d="M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1M8 15a6 6 0 0 0 12 0v-3" />
    <Circle cx="20" cy="10" r="2" />
  </>
));

const HeartPulseIcon = createIcon(() => (
  <>
    <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
    <Path d="M3.2 12h6.3l.5-1 2 4.5 2-7 1.5 3.5h5.3" />
  </>
));

const SmileIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
  </>
));

const SkinIcon = createIcon(() => (
  <Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
));

const SpineIcon = createIcon(() => (
  <>
    <Rect x="7" y="3" width="10" height="4" rx="2" />
    <Rect x="7" y="10" width="10" height="4" rx="2" />
    <Rect x="7" y="17" width="10" height="4" rx="2" />
  </>
));

const EarIcon = createIcon(() => (
  <>
    <Path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" />
    <Path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" />
  </>
));

const MaternityIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="5" r="2.5" />
    <Path d="M9 21v-5.5a3 3 0 0 1 6 0V21M9 13.5c0-1.5 1.3-2.5 3-2.5s3 1 3 2.5" />
  </>
));

const DigestiveIcon = createIcon(() => (
  <Path d="M8 3c0 5 0 5 4 7s6 3 6 7a4 4 0 0 1-8 1M8 3h4" />
));

export const SPECIALTY_ICONS: Record<SpecialtyIconKey, ComponentType<BookingIconProps>> = {
  STETHOSCOPE: StethoscopeIcon,
  HEART_PULSE: HeartPulseIcon,
  SMILE: SmileIcon,
  SKIN: SkinIcon,
  SPINE: SpineIcon,
  EAR: EarIcon,
  MATERNITY: MaternityIcon,
  DIGESTIVE: DigestiveIcon,
};

export const CalendarIcon = createIcon(() => (
  <>
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </>
));

export const CalendarClockIcon = createIcon(() => (
  <>
    <Path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5M16 2v4M8 2v4M3 10h5" />
    <Circle cx="16" cy="16" r="6" />
    <Path d="M16 14v2l1 1" />
  </>
));

export const UsersIcon = createIcon(() => (
  <>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </>
));

export const MedicalSquareIcon = createIcon(() => (
  <>
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Path d="M12 8v8M8 12h8" />
  </>
));

export function StarIcon({ size = 14, color = '#F5A524' }: BookingIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill={color}
      />
    </Svg>
  );
}

export const CheckCircleIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </>
));

export const SunIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="4" />
    <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>
));

export const SunsetIcon = createIcon(() => (
  <Path d="M12 10V2M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M16 18a4 4 0 0 0-8 0M16 5l-4 4-4-4" />
));

export const InfoIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 16v-4M12 8h.01" />
  </>
));

export const CreditCardIcon = createIcon(() => (
  <>
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Path d="M2 10h20" />
  </>
));

export const BuildingIcon = createIcon(() => (
  <>
    <Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4" />
  </>
));

export const BanknoteIcon = createIcon(() => (
  <>
    <Rect x="2" y="6" width="20" height="12" rx="2" />
    <Circle cx="12" cy="12" r="2" />
    <Path d="M6 12h.01M18 12h.01" />
  </>
));

export const ClipboardListIcon = createIcon(() => (
  <>
    <Rect x="8" y="2" width="8" height="4" rx="1" />
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01" />
  </>
));

export const UserCheckIcon = createIcon(() => (
  <>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="m16 11 2 2 4-4" />
  </>
));

export const ArrowLeftIcon = createIcon(() => (
  <>
    <Path d="M19 12H5M12 19l-7-7 7-7" />
  </>
));

export const ChevronRightIcon = createIcon(() => (
  <Path d="m9 18 6-6-6-6" />
));

export const ChevronDownIcon = createIcon(() => (
  <Path d="m6 9 6 6 6-6" />
));

export const AlertTriangleIcon = createIcon(() => (
  <>
    <Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <Path d="M12 9v4M12 17h.01" />
  </>
));

export const BookUserIcon = createIcon(() => (
  <>
    <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <Circle cx="12" cy="8" r="2" />
    <Path d="M9 13a3 3 0 0 1 6 0" />
  </>
));

export const ClinicCardIcon = createIcon(() => (
  <>
    <Rect x="3" y="5" width="18" height="14" rx="2" />
    <Path d="M12 9v6M9 12h6" />
  </>
));

export const DownloadIcon = createIcon(() => (
  <>
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </>
));

export const EyeIcon = createIcon(() => (
  <>
    <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <Circle cx="12" cy="12" r="3" />
  </>
));

export const FileTextIcon = createIcon(() => (
  <>
    <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <Path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" />
  </>
));

export const FlaskIcon = createIcon(() => (
  <>
    <Path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
    <Path d="M8.5 2h7M7 16h10" />
  </>
));

export const HelpCircleIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
  </>
));

export const PillIcon = createIcon(() => (
  <>
    <Path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
    <Path d="m8.5 8.5 7 7" />
  </>
));

export const QrCodeIcon = createIcon(() => (
  <>
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="14" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
  </>
));

export const ScanIcon = createIcon(() => (
  <>
    <Path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
    <Path d="M7 12h10" />
  </>
));

export const ShareIcon = createIcon(() => (
  <>
    <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
  </>
));

export const SyringeIcon = createIcon(() => (
  <>
    <Path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6" />
  </>
));

export const DownloadCircleIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 8v8M8 12l4 4 4-4" />
  </>
));

export function ShieldFilledIcon({ size = 20, color = '#005B8D' }: BookingIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
        fill={color}
      />
      <Path
        d="m9 12 2 2 4-4"
        stroke="#FFFFFF"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function InfoFilledIcon({ size = 20, color = '#E8A317' }: BookingIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill={color} />
      <Path
        d="M12 16v-4M12 8h.01"
        stroke="#FFFFFF"
        strokeWidth={2.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}