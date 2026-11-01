// Bank identifiers from https://vietqr.app/banks.json (2026-11-01).
const BANK_ALIASES = [
  ['ICB', '970415', 'VietinBank'],
  ['VCB', '970436', 'Vietcombank'],
  ['MB', '970422', 'MBBank'],
  ['ACB', '970416'],
  ['VPB', '970432', 'VPBank'],
  ['TPB', '970423', 'TPBank'],
  ['MSB', '970426'],
  ['NAB', '970428', 'NamABank'],
  ['LPB', '970449', 'LienVietPostBank', 'LPBank'],
  ['VCCB', '970454', 'VietCapitalBank', 'BVBank'],
  ['BIDV', '970418'],
  ['STB', '970403', 'Sacombank'],
  ['VIB', '970441'],
  ['HDB', '970437', 'HDBank'],
  ['SEAB', '970440', 'SeABank'],
  ['GPB', '970408', 'GPBank'],
  ['PVCB', '970412', 'PVcomBank'],
  ['NCB', '970419'],
  ['SHBVN', '970424', 'ShinhanBank'],
  ['SCB', '970429'],
  ['PGB', '970430', 'PGBank'],
  ['VBA', '970405', 'Agribank'],
  ['TCB', '970407', 'Techcombank'],
  ['SGICB', '970400', 'SaigonBank'],
  ['DOB', '970406', 'DongABank', 'Vikki'],
  ['BAB', '970409', 'BacABank'],
  ['ABB', '970425', 'ABBANK'],
  ['VAB', '970427', 'VietABank'],
  ['EIB', '970431', 'Eximbank'],
  ['VIETBANK', '970433'],
  ['IVB', '970434', 'IndovinaBank'],
  ['BVB', '970438', 'BaoVietBank'],
  ['PBVN', '970439', 'PublicBank'],
  ['SHB', '970443'],
  ['CBB', '970444', 'CBBank'],
  ['OCB', '970448'],
  ['KLB', '970452', 'KienLongBank'],
  ['CIMB', '422589'],
  ['HSBC', '458761'],
  ['HLBVN', '970442', 'HongLeong'],
  ['WVN', '970457', 'Woori'],
];
const normalize = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
export function normalizeBank(value: string): string | undefined {
  const key = normalize(value);
  return BANK_ALIASES.find((aliases) =>
    aliases.some((alias) => normalize(alias) === key),
  )?.[0];
}
