import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
};

function createIcon(render: () => ReactNode) {
  return function Icon({ size = 20, color = '#005B8D', strokeWidth = 2, fill = 'none' }: IconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={fill}
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

export type IconComponent = ReturnType<typeof createIcon>;

export const ArrowLeftIcon = createIcon(() => <Path d="M19 12H5M12 19l-7-7 7-7" />);

export const PlusCircleIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M8 12h8M12 8v8" />
  </>
));

export const UserPlusIcon = createIcon(() => (
  <>
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M19 8v6M22 11h-6" />
  </>
));

export const IdCardIcon = createIcon(() => (
  <>
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Circle cx="9" cy="11" r="2" />
    <Path d="M5.5 16c.6-1.5 2-2 3.5-2s2.9.5 3.5 2M15 10h4M15 14h3" />
  </>
));

export const PhoneIcon = createIcon(() => (
  <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
));

export const LayoutGridIcon = createIcon(() => (
  <>
    <Rect x="3" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="3" width="7" height="7" rx="1" />
    <Rect x="14" y="14" width="7" height="7" rx="1" />
    <Rect x="3" y="14" width="7" height="7" rx="1" />
  </>
));

export const HistoryIcon = createIcon(() => (
  <>
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <Path d="M3 3v5h5" />
    <Path d="M12 7v5l4 2" />
  </>
));

export const HelpCircleIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Path d="M12 17h.01" />
  </>
));

export const QrCodeIcon = createIcon(() => (
  <>
    <Rect x="3" y="3" width="5" height="5" rx="1" />
    <Rect x="16" y="3" width="5" height="5" rx="1" />
    <Rect x="3" y="16" width="5" height="5" rx="1" />
    <Path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1" />
  </>
));

export const CalendarIcon = createIcon(() => (
  <>
    <Rect x="3" y="4" width="18" height="18" rx="2" />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </>
));

export const CalendarClockIcon = createIcon(() => (
  <>
    <Path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
    <Path d="M16 2v4M8 2v4M3 10h5" />
    <Circle cx="16" cy="16" r="6" />
    <Path d="M16 14v2.2l1.6 1" />
  </>
));

export const MapPinIcon = createIcon(() => (
  <>
    <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <Circle cx="12" cy="10" r="3" />
  </>
));

export const ClockIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M12 6v6l4 2" />
  </>
));

export const CheckCircleIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="m9 12 2 2 4-4" />
  </>
));

export const XCircleIcon = createIcon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="m15 9-6 6M9 9l6 6" />
  </>
));

export const BriefcaseMedicalIcon = createIcon(() => (
  <>
    <Path d="M12 11v4M14 13h-4M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M18 6v14M6 6v14" />
    <Rect x="2" y="6" width="20" height="14" rx="2" />
  </>
));

export const BadgeCheckIcon = createIcon(() => (
  <>
    <Path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <Path d="m9 12 2 2 4-4" />
  </>
));

export const HeartPulseIcon = createIcon(() => (
  <>
    <Path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
    <Path d="M3.2 12h6.3l.5-1 2 4.5 2-7 1.5 3.5h5.3" />
  </>
));

export const StethoscopeIcon = createIcon(() => (
  <>
    <Path d="M11 2v2M5 2v2M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
    <Path d="M8 15a6 6 0 0 0 12 0v-3" />
    <Circle cx="20" cy="10" r="2" />
  </>
));

export const FolderClockIcon = createIcon(() => (
  <>
    <Path d="M16 14v2.2l1.6 1" />
    <Path d="M7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v.5" />
    <Circle cx="16" cy="16" r="6" />
  </>
));

export const CreditCardIcon = createIcon(() => (
  <>
    <Rect x="2" y="5" width="20" height="14" rx="2" />
    <Path d="M2 10h20M6 15h4" />
  </>
));

export const ReceiptIcon = createIcon(() => (
  <>
    <Path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
    <Path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11" />
  </>
));

export const ClipboardPulseIcon = createIcon(() => (
  <>
    <Rect x="8" y="2" width="8" height="4" rx="1" />
    <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <Path d="M8 14h2l1.5-3 2 6 1.5-3H17" />
  </>
));

export const FlaskIcon = createIcon(() => (
  <>
    <Path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
    <Path d="M8.5 2h7M7 16h10" />
  </>
));

const LOOKUP_HEAD_COLOR = '#C4D4E6';
const LOOKUP_BODY_COLOR = '#4C8BC8';
const LOOKUP_LENS_COLOR = '#EAF4FF';
const LOOKUP_RIM_COLOR = '#2D74A8';
const LOOKUP_HANDLE_COLOR = '#1F4E7A';
const LOOKUP_PIN_COLOR = '#E5484D';

export function LookupColorIcon({ size = 36 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Circle cx="19" cy="15" r="7" fill={LOOKUP_HEAD_COLOR} />
      <Path d="M4 41c0-8.5 6.5-14 15-14s15 5.5 15 14z" fill={LOOKUP_BODY_COLOR} />
      <Path d="M14.5 28.5 19 35l4.5-6.5z" fill="#FFFFFF" />
      <Circle cx="24.5" cy="36" r="1.8" fill={LOOKUP_PIN_COLOR} />
      <Path d="M40 37.5 45 43" stroke={LOOKUP_HANDLE_COLOR} strokeWidth={3.6} strokeLinecap="round" />
      <Circle cx="33" cy="31" r="9" fill={LOOKUP_LENS_COLOR} stroke={LOOKUP_RIM_COLOR} strokeWidth={3} />
      <Path d="M33 27v8M29 31h8" stroke={LOOKUP_RIM_COLOR} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

export const BotIcon = createIcon(() => (
  <>
    <Path d="M12 8V4H8" />
    <Rect x="4" y="8" width="16" height="12" rx="2" />
    <Path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
  </>
));

export const HeartHandshakeIcon = createIcon(() => (
  <>
    <Path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <Path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08c.82.82 2.13.85 3 .07l2.07-1.9a2.82 2.82 0 0 1 3.79 0l2.96 2.66" />
  </>
));

export const SparklesIcon = createIcon(() => (
  <>
    <Path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <Path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </>
));

export const BadgePercentIcon = createIcon(() => (
  <>
    <Path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <Path d="m15 9-6 6M9 9h.01M15 15h.01" />
  </>
));

export const BookHeartIcon = createIcon(() => (
  <>
    <Path d="M16 8.2A2.22 2.22 0 0 0 13.8 6c-.8 0-1.4.3-1.8.9-.4-.6-1-.9-1.8-.9A2.22 2.22 0 0 0 8 8.2c0 .6.3 1.2.7 1.6A226.652 226.652 0 0 0 12 13a404 404 0 0 0 3.3-3.1 2.413 2.413 0 0 0 .7-1.7" />
    <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
  </>
));

export const NewspaperIcon = createIcon(() => (
  <>
    <Path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
    <Path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
  </>
));

export const PhoneCallIcon = createIcon(() => (
  <>
    <Path d="M13 2a9 9 0 0 1 9 9M13 6a5 5 0 0 1 5 5" />
    <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </>
));

export const StarIcon = createIcon(() => (
  <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
));

export const SlidersIcon = createIcon(() => (
  <Path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
));

export const SearchIcon = createIcon(() => (
  <>
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.3-4.3" />
  </>
));

export const ChevronRightIcon = createIcon(() => <Path d="m9 18 6-6-6-6" />);

export const ShieldCheckIcon = createIcon(() => (
  <>
    <Path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <Path d="m9 12 2 2 4-4" />
  </>
));

export const HomeIcon = createIcon(() => (
  <>
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Path d="M9 22V12h6v10" />
  </>
));

export const BellIcon = createIcon(() => (
  <>
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>
));

export const LayersIcon = createIcon(() => (
  <>
    <Path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <Path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
    <Path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
  </>
));

export const UserIcon = createIcon(() => (
  <>
    <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </>
));