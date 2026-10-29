import type { ReactNode } from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { IconProps } from './icons';

function createColorIcon(render: () => ReactNode) {
  return function ColorIcon({ size = 36 }: IconProps) {
    return (
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        {render()}
      </Svg>
    );
  };
}

const HEART_PATH =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

export const StethoscopeColorIcon = createColorIcon(() => (
  <>
    <Path
      d="M14 8V22a10 10 0 0 0 20 0V8"
      stroke="#2F6FB0"
      strokeWidth={3.2}
      strokeLinecap="round"
    />
    <Circle cx={14} cy={8} r={2.4} fill="#2F6FB0" />
    <Circle cx={34} cy={8} r={2.4} fill="#2F6FB0" />
    <Path d="M24 32V37" stroke="#2F6FB0" strokeWidth={3.2} strokeLinecap="round" />
    <Circle cx={24} cy={41} r={3.6} stroke="#3D9BD8" strokeWidth={2.6} />
    <G transform="translate(19 11.9) scale(0.42)">
      <Path d={HEART_PATH} fill="#FF5B71" />
    </G>
  </>
));

export const FolderClockColorIcon = createColorIcon(() => (
  <>
    <Path
      d="M6 13.5A2.5 2.5 0 0 1 8.5 11H17l3 3h14a2.5 2.5 0 0 1 2.5 2.5V37H6Z"
      fill="#3A7FC1"
    />
    <Path
      d="M4 21.5Q4 19.5 6 19.5H39.5Q41.5 19.5 41.2 21.5L39 36.5Q38.7 38.5 36.7 38.5H7Q5 38.5 4.8 36.5Z"
      fill="#BBDCF9"
    />
    <Path
      d="M8.5 29H14M11.25 26.25V31.75"
      stroke="#2B5F9E"
      strokeWidth={2.4}
      strokeLinecap="round"
    />
    <Circle cx={32} cy={31} r={9} fill="#FFFFFF" stroke="#2A7BC4" strokeWidth={3} />
    <Path
      d="M32 26V31L35.5 33.2"
      stroke="#2A5F9E"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
));

export const CreditCardColorIcon = createColorIcon(() => (
  <>
    <Rect x={5} y={12} width={31} height={22} rx={3.5} fill="#2F6FB5" />
    <Rect x={5} y={17} width={31} height={5} fill="#1E4E85" />
    <Rect x={9} y={26} width={5.5} height={4} rx={1} fill="#F7C948" />
    <Rect x={17} y={27.2} width={8} height={1.7} rx={0.85} fill="#8DBBE8" />
    <Circle cx={35} cy={31} r={9} fill="#FFC53D" stroke="#F29A1F" strokeWidth={2} />
    <Path
      d="M35 26V36M30 31H40"
      stroke="#E8891B"
      strokeWidth={2.8}
      strokeLinecap="round"
    />
  </>
));

export const ReceiptColorIcon = createColorIcon(() => (
  <>
    <Path
      d="M12 8Q12 6 14 6H34Q36 6 36 8V38L33.5 36L31 38L28.5 36L26 38L23.5 36L21 38L18.5 36L16 38L14 36.5L12 38Z"
      fill="#FFFFFF"
      stroke="#6CA6DD"
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
    <Rect x={17} y={11} width={9} height={2.2} rx={1.1} fill="#2B7BC4" />
    <Rect x={17} y={16.5} width={14} height={1.4} rx={0.7} fill="#C6CFDA" />
    <Rect x={17} y={20.5} width={14} height={1.4} rx={0.7} fill="#C6CFDA" />
    <Rect x={17} y={24.5} width={8} height={1.4} rx={0.7} fill="#C6CFDA" />
    <Circle cx={33} cy={30} r={7} fill="#19B76F" stroke="#FFFFFF" strokeWidth={1.6} />
    <Path
      d="M30.7 30.5a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0-4.6 0M35.3 26.3V32.6M33.9 27.6H36.7"
      stroke="#FFFFFF"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </>
));

export const ClipboardPulseColorIcon = createColorIcon(() => (
  <>
    <Rect x={10} y={8} width={28} height={34} rx={4} fill="#1E7BC9" />
    <Rect x={13.5} y={12.5} width={21} height={26} rx={1.5} fill="#FFFFFF" />
    <Rect x={18} y={5.5} width={12} height={5.5} rx={2} fill="#7F9BB8" />
    <Circle cx={24} cy={8.25} r={1.2} fill="#FFFFFF" />
    <Path d="M24 15.5V20M21.75 17.75H26.25" stroke="#E5383B" strokeWidth={1.8} strokeLinecap="round" />
    <Path
      d="M16 28H20L22.5 23.5L25.5 32.5L28 26.5L29.5 28H32"
      stroke="#E5383B"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect x={17} y={34} width={14} height={1.8} rx={0.9} fill="#C3CEDB" />
  </>
));

export const FlaskSearchColorIcon = createColorIcon(() => (
  <>
    <Path
      d="M16 8V18L8 33Q6.5 36 9.5 36H26Q29 36 27.5 33L20 18V8"
      fill="#E4F2FE"
      stroke="#1E78C8"
      strokeWidth={2.6}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
    <Path d="M13.5 8H22.5" stroke="#1E78C8" strokeWidth={2.6} strokeLinecap="round" />
    <Path
      d="M11.5 29H24.5L26.5 33.5Q27.2 35.2 25.5 35.2H10.5Q8.8 35.2 9.5 33.5Z"
      fill="#7DB8EE"
    />
    <Circle cx={17} cy={31.5} r={1.2} fill="#FFFFFF" />
    <Circle cx={30} cy={19} r={8.5} fill="#FFFFFF" fillOpacity={0.95} stroke="#2D5BE0" strokeWidth={3} />
    <Path d="M36.5 25.5L42 31" stroke="#2D5BE0" strokeWidth={3.4} strokeLinecap="round" />
    <Path
      d="M26.5 19L29.3 21.8L34.3 16.3"
      stroke="#19B76F"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </>
));

export const HeadsetColorIcon = createColorIcon(() => (
  <>
    <Path d="M10 25A14 14 0 0 1 38 25" stroke="#1E7BC9" strokeWidth={3.2} strokeLinecap="round" />
    <Rect x={7.5} y={22} width={5} height={10} rx={2.5} fill="#1E7BC9" />
    <Rect x={35.5} y={22} width={5} height={10} rx={2.5} fill="#1E7BC9" />
    <Circle cx={24} cy={27} r={11.5} fill="#FFE9D6" stroke="#F28C28" strokeWidth={2.4} />
    <Circle cx={20.5} cy={26} r={1.1} fill="#8A4B2A" />
    <Circle cx={27.5} cy={26} r={1.1} fill="#8A4B2A" />
    <Circle cx={18.2} cy={29.5} r={1.6} fill="#FFB3A7" />
    <Circle cx={29.8} cy={29.5} r={1.6} fill="#FFB3A7" />
    <Path d="M20.5 30.5Q24 33.5 27.5 30.5" stroke="#D2603A" strokeWidth={1.6} strokeLinecap="round" />
    <Path d="M37 31Q36.5 37.5 29 37.6" stroke="#1E7BC9" strokeWidth={2} strokeLinecap="round" />
    <Circle cx={28} cy={37.6} r={1.8} fill="#1E7BC9" />
    <G transform="translate(8.2 11.1) scale(0.4)">
      <Path d={HEART_PATH} fill="#F5534F" />
    </G>
  </>
));

export const BotColorIcon = createColorIcon(() => (
  <>
    <Path d="M24 6.5V10.5" stroke="#3D7DB5" strokeWidth={2.6} strokeLinecap="round" />
    <Circle cx={24} cy={5} r={2.6} fill="#4DB1F5" />
    <Circle cx={8.5} cy={11.5} r={1.1} fill="#4DB1F5" />
    <Path
      d="M40.5 8.5L41.6 11.4L44.5 12.5L41.6 13.6L40.5 16.5L39.4 13.6L36.5 12.5L39.4 11.4Z"
      fill="#4DB1F5"
    />
    <Rect x={5} y={19.5} width={5} height={10} rx={2.5} fill="#7FB5E6" stroke="#3D7DB5" strokeWidth={1.8} />
    <Rect x={38} y={19.5} width={5} height={10} rx={2.5} fill="#7FB5E6" stroke="#3D7DB5" strokeWidth={1.8} />
    <Rect x={9.5} y={10.5} width={29} height={24} rx={9} fill="#E8F3FD" stroke="#3D7DB5" strokeWidth={2.8} />
    <Rect x={14} y={15.5} width={20} height={12} rx={5} fill="#CFE4F8" />
    <Circle cx={20} cy={21.5} r={2} fill="#3D7DB5" />
    <Circle cx={28} cy={21.5} r={2} fill="#3D7DB5" />
    <Path d="M21 30Q24 32.8 27 30" stroke="#3D7DB5" strokeWidth={1.9} strokeLinecap="round" />
    <Path d="M24 34.5V43" stroke="#3D7DB5" strokeWidth={2.6} strokeLinecap="round" />
  </>
));