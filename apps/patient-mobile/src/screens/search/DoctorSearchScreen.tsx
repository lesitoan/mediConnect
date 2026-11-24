import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  TouchableOpacity,
  View,
  type TextProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import ScreenContainer from '../../components/ScreenContainer';
import {
  ArrowLeftIcon,
  BotIcon,
  BriefcaseMedicalIcon,
  CalendarIcon,
  ChevronRightIcon,
  HeartPulseIcon,
  HelpCircleIcon,
  SearchIcon,
  SlidersIcon,
  StarIcon,
  StethoscopeIcon,
  XCircleIcon,
} from '../../components/icons';
import { COLORS, FONTS } from '../../constants/theme';
import {
  getDoctorPage,
  type SearchDoctor,
} from '../../services/doctorProfileService';
import { getClinicDateKey } from '../../services/scheduleService';
import { getSpecialtyPage } from '../../services/specialtyService';


function Text(props: TextProps) {
  return <RNText allowFontScaling={false} {...props} />;
}


const NAVY = '#025C8E';
const STAR = '#F59E0B';
const GREEN = '#19B87A';
const BUTTON_GRADIENT = ['#3F82B5', '#2B72A6'] as const;
const ACTIVE_CARD_GRADIENT = ['#2F7FB8', '#025C8E'] as const;


type TabId = 'specialty' | 'doctor';
type FilterId = 'all' | 'professor' | 'today';
type SortId = 'rating' | 'experience';
export type SearchSpecialty = {
  id: string;
  name: string;
  sub: string;
};


const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Tất cả bác sĩ' },
  { id: 'professor', label: 'Giáo sư / Tiến sĩ' },
  { id: 'today', label: 'Có lịch hôm nay' },
];


const SORT_LABELS: Record<SortId, string> = {
  rating: 'Đánh giá cao',
  experience: 'Kinh nghiệm',
};


function SmileIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={2} />
      <Path d="M8 14c1 1.5 2.3 2.2 4 2.2s3-.7 4-2.2" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={9} cy={9.8} r={1.1} fill={color} />
      <Circle cx={15} cy={9.8} r={1.1} fill={color} />
    </Svg>
  );
}


function SortIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4v16M7 4 3.5 7.5M7 4l3.5 3.5M17 20V4M17 20l-3.5-3.5M17 20l3.5-3.5"
        stroke={NAVY}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}


function CheckIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="m5 12.5 4.5 4.5L19 7.5" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}


function VerifiedDot() {
  return (
    <View style={styles.verifiedDot}>
      <CheckIcon />
    </View>
  );
}


function SpecialtyIcon({ id, color }: { id: string; color: string }) {
  const normalizedId = id.toLowerCase();
  if (normalizedId.includes('tim')) return <HeartPulseIcon size={22} color={color} />;
  if (normalizedId.includes('nội')) return <BriefcaseMedicalIcon size={22} color={color} />;
  if (normalizedId.includes('nhi')) return <SmileIcon color={color} />;
  return <SmileIcon color={color} />;
}


type SearchScreenProps = {
  onPressBack?: () => void;
  onPressHelp?: () => void;
  onPressFilter?: () => void;
  onPressAllSpecialties?: () => void;
  onPressViewDetail?: (doctor: SearchDoctor) => void;
  onPressBook?: (doctor: SearchDoctor) => void;
  onPressAskAI?: () => void;
};


export default function DoctorSearchScreen({
  onPressBack,
  onPressHelp,
  onPressFilter,
  onPressAllSpecialties,
  onPressViewDetail,
  onPressBook,
  onPressAskAI,
}: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<TabId>('doctor');
  const [specialtyId, setSpecialtyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterId>('all');
  const [sort, setSort] = useState<SortId>('rating');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [doctors, setDoctors] = useState<SearchDoctor[]>([]);
  const [doctorPage, setDoctorPage] = useState(1);
  const [doctorTotal, setDoctorTotal] = useState(0);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingMoreDoctors, setIsLoadingMoreDoctors] = useState(false);
  const [doctorError, setDoctorError] = useState<string | null>(null);
  const [doctorMoreError, setDoctorMoreError] = useState<string | null>(null);
  const [doctorRetry, setDoctorRetry] = useState(0);
  const [specialties, setSpecialties] = useState<SearchSpecialty[]>([]);
  const [specialtyPage, setSpecialtyPage] = useState(1);
  const [specialtyTotal, setSpecialtyTotal] = useState(0);
  const [specialtyTotalPages, setSpecialtyTotalPages] = useState(1);
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(true);
  const [isLoadingMoreSpecialties, setIsLoadingMoreSpecialties] = useState(false);
  const [specialtyError, setSpecialtyError] = useState<string | null>(null);
  const [specialtyMoreError, setSpecialtyMoreError] = useState<string | null>(null);
  const [specialtyRetry, setSpecialtyRetry] = useState(0);
  const doctorRequestVersion = useRef(0);
  const specialtyRequestVersion = useRef(0);

  useEffect(() => {
    const requestVersion = ++doctorRequestVersion.current;
    const controller = new AbortController();
    setIsLoadingMoreDoctors(false);
    setDoctorMoreError(null);
    const timeout = setTimeout(() => {
      setIsLoadingDoctors(true);
      setDoctorError(null);
      setDoctorPage(1);
      const clinicDate = getClinicDateKey(new Date());
      getDoctorPage(
        {
          search: query,
          specialtyId: specialtyId ?? undefined,
          hasAcademicTitle: filter === 'professor',
          availabilityDate: filter === 'today' ? clinicDate : undefined,
          sortBy: sort === 'rating' ? 'RATING' : 'EXPERIENCE',
          page: 1,
          limit: 5,
        },
        controller.signal,
      )
        .then((response) => {
          if (requestVersion !== doctorRequestVersion.current) return;
          setDoctors(response.items);
          setDoctorTotal(response.totalItems);
          setDoctorPage(response.currentPage);
        })
        .catch(() => {
          if (requestVersion === doctorRequestVersion.current && !controller.signal.aborted) {
            setDoctorError('Không thể tải danh sách bác sĩ. Vui lòng thử lại.');
          }
        })
        .finally(() => {
          if (requestVersion === doctorRequestVersion.current) {
            setIsLoadingDoctors(false);
            setIsRefreshing(false);
          }
        });
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, specialtyId, filter, sort, doctorRetry]);

  useEffect(() => {
    const requestVersion = ++specialtyRequestVersion.current;
    const controller = new AbortController();
    setIsLoadingMoreSpecialties(false);
    setSpecialtyMoreError(null);
    const timeout = setTimeout(() => {
      setIsLoadingSpecialties(true);
      setSpecialtyError(null);
      setSpecialtyPage(1);
      getSpecialtyPage(
        { search: query, page: 1, limit: 10 },
        controller.signal,
      )
        .then((response) => {
          if (requestVersion !== specialtyRequestVersion.current) return;
          setSpecialties(
            response.items.map((item) => ({
              id: item.id,
              name: item.name,
              sub: item.description ?? `Phòng ${item.roomCode}`,
            })),
          );
          setSpecialtyTotal(response.totalItems);
          setSpecialtyTotalPages(response.totalPages);
          setSpecialtyPage(response.currentPage);
        })
        .catch(() => {
          if (requestVersion === specialtyRequestVersion.current && !controller.signal.aborted) {
            setSpecialtyError('Không thể tải danh sách chuyên khoa. Vui lòng thử lại.');
          }
        })
        .finally(() => {
          if (requestVersion === specialtyRequestVersion.current) {
            setIsLoadingSpecialties(false);
          }
        });
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, specialtyRetry]);

  const hasMoreDoctors = doctors.length < doctorTotal;
  const hasMoreSpecialties = specialtyPage < specialtyTotalPages;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setDoctorRetry((value) => value + 1);
    setSpecialtyRetry((value) => value + 1);
  };

  const loadMoreDoctors = async () => {
    const requestVersion = doctorRequestVersion.current;
    setIsLoadingMoreDoctors(true);
    setDoctorMoreError(null);
    try {
      const clinicDate = getClinicDateKey(new Date());
      const response = await getDoctorPage({
        search: query,
        specialtyId: specialtyId ?? undefined,
        hasAcademicTitle: filter === 'professor',
        availabilityDate: filter === 'today' ? clinicDate : undefined,
        sortBy: sort === 'rating' ? 'RATING' : 'EXPERIENCE',
        page: doctorPage + 1,
        limit: 5,
      });
      if (requestVersion !== doctorRequestVersion.current) return;
      setDoctors((current) => [...current, ...response.items]);
      setDoctorPage(response.currentPage);
      setDoctorTotal(response.totalItems);
    } catch {
      if (requestVersion === doctorRequestVersion.current) {
        setDoctorMoreError('Không thể tải thêm bác sĩ. Vui lòng thử lại.');
      }
    } finally {
      if (requestVersion === doctorRequestVersion.current) {
        setIsLoadingMoreDoctors(false);
      }
    }
  };

  const loadMoreSpecialties = async () => {
    const requestVersion = specialtyRequestVersion.current;
    setIsLoadingMoreSpecialties(true);
    setSpecialtyMoreError(null);
    try {
      const response = await getSpecialtyPage({
        search: query,
        page: specialtyPage + 1,
        limit: 10,
      });
      if (requestVersion !== specialtyRequestVersion.current) return;
      setSpecialties((current) => [
        ...current,
        ...response.items.map((item) => ({
          id: item.id,
          name: item.name,
          sub: item.description ?? `Phòng ${item.roomCode}`,
        })),
      ]);
      setSpecialtyPage(response.currentPage);
      setSpecialtyTotal(response.totalItems);
      setSpecialtyTotalPages(response.totalPages);
    } catch {
      if (requestVersion === specialtyRequestVersion.current) {
        setSpecialtyMoreError('Không thể tải thêm chuyên khoa. Vui lòng thử lại.');
      }
    } finally {
      if (requestVersion === specialtyRequestVersion.current) {
        setIsLoadingMoreSpecialties(false);
      }
    }
  };


  const handleSelectSpecialty = (id: string) => {
    setSpecialtyId((prev) => (prev === id ? null : id));
  };

  const specialtyName = (id: string) =>
    specialties.find((specialty) => specialty.id === id)?.name ?? 'Chưa cập nhật';


  const renderSpecialtyCard = (item: SearchSpecialty) => {
    const active = item.id === specialtyId;
    const content: ReactNode = (
      <>
        <View style={[styles.specialtyIconBox, active && styles.specialtyIconBoxActive]}>
          <SpecialtyIcon id={item.name} color={active ? '#FFFFFF' : NAVY} />
        </View>
        <View>
          <Text style={[styles.specialtyName, active && styles.specialtyNameActive]}>{item.name}</Text>
          <Text style={[styles.specialtySub, active && styles.specialtySubActive]}>{item.sub}</Text>
        </View>
      </>
    );
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.85}
        onPress={() => handleSelectSpecialty(item.id)}
      >
        {active ? (
          <LinearGradient
            colors={ACTIVE_CARD_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.specialtyCard}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={[styles.specialtyCard, styles.specialtyCardIdle]}>{content}</View>
        )}
      </TouchableOpacity>
    );
  };


  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPressBack} hitSlop={10} style={styles.headerSide}>
          <ArrowLeftIcon size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tra cứu Chuyên khoa & Bác sĩ</Text>
        <TouchableOpacity
          onPress={onPressHelp}
          hitSlop={10}
          style={[styles.headerSide, styles.headerSideRight]}
        >
          <HelpCircleIcon size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>


      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <SearchIcon size={20} color={NAVY} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm bác sĩ, chuyên khoa..."
              placeholderTextColor="#A9B8C8"
              value={query}
              onChangeText={setQuery}
              allowFontScaling={false}
              returnKeyType="search"
            />
            {query.length > 0 ? (
              <TouchableOpacity hitSlop={10} onPress={() => setQuery('')}>
                <XCircleIcon size={20} color="#B8C7D8" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            activeOpacity={0.8}
            onPress={
              onPressFilter ??
              (() =>
                setFilter((current) =>
                  current === 'all'
                    ? 'professor'
                    : current === 'professor'
                      ? 'today'
                      : 'all',
                ))
            }
          >
            <SlidersIcon size={22} color={NAVY} />
            <View style={styles.filterDot} />
          </TouchableOpacity>
        </View>


        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentItem, tab === 'specialty' && styles.segmentItemActive]}
            activeOpacity={0.85}
            onPress={() => setTab('specialty')}
          >
            <BriefcaseMedicalIcon size={16} color={tab === 'specialty' ? NAVY : '#4A5563'} />
            <Text style={[styles.segmentText, tab === 'specialty' && styles.segmentTextActive]}>
              Chuyên khoa ({specialtyTotal})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentItem, tab === 'doctor' && styles.segmentItemActive]}
            activeOpacity={0.85}
            onPress={() => setTab('doctor')}
          >
            <StethoscopeIcon size={16} color={tab === 'doctor' ? NAVY : '#4A5563'} />
            <Text style={[styles.segmentText, tab === 'doctor' && styles.segmentTextActive]}>
              Bác sĩ ({doctorTotal})
            </Text>
          </TouchableOpacity>
        </View>


        {tab === 'specialty' ? (
          <View style={styles.specialtyList}>
            {isLoadingSpecialties ? (
              <ActivityIndicator color={COLORS.PRIMARY} />
            ) : specialtyError ? (
              <TouchableOpacity onPress={() => setSpecialtyRetry((value) => value + 1)}>
                <Text style={styles.emptyText}>{specialtyError}</Text>
              </TouchableOpacity>
            ) : specialties.length === 0 ? (
              <Text style={styles.emptyText}>Không tìm thấy chuyên khoa phù hợp</Text>
            ) : (
              <>
                {specialties.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    style={styles.specialtyRow}
                    onPress={() => {
                      setSpecialtyId(item.id);
                      setTab('doctor');
                    }}
                  >
                    <View style={styles.specialtyIconBox}>
                      <SpecialtyIcon id={item.name} color={NAVY} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.specialtyName}>{item.name}</Text>
                      <Text style={styles.specialtySub}>{item.sub}</Text>
                    </View>
                    <ChevronRightIcon size={18} color={NAVY} />
                  </TouchableOpacity>
                ))}
                {specialtyMoreError ? (
                  <TouchableOpacity onPress={loadMoreSpecialties}>
                    <Text style={styles.emptyText}>{specialtyMoreError}</Text>
                  </TouchableOpacity>
                ) : null}
                {hasMoreSpecialties ? (
                  <TouchableOpacity
                    style={styles.pageButton}
                    disabled={isLoadingMoreSpecialties}
                    onPress={loadMoreSpecialties}
                  >
                    {isLoadingMoreSpecialties ? (
                      <ActivityIndicator color={COLORS.PRIMARY} />
                    ) : (
                      <Text style={styles.pageButtonText}>Xem thêm chuyên khoa</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionBar} />
                <Text style={styles.sectionTitle}>Chuyên khoa trọng điểm</Text>
              </View>
              <TouchableOpacity
                style={styles.sectionLinkRow}
                hitSlop={8}
                onPress={onPressAllSpecialties ?? (() => setTab('specialty'))}
              >
                <Text style={styles.sectionLink}>Tất cả {specialtyTotal} khoa</Text>
                <ChevronRightIcon size={14} color={NAVY} />
              </TouchableOpacity>
            </View>


            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialtyScroll}
            >
              {specialties.slice(0, 3).map(renderSpecialtyCard)}
            </ScrollView>


            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {FILTERS.map((item) => {
                const active = item.id === filter;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.85}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setFilter(item.id)}
                  >
                    {active ? <CheckIcon /> : item.id === 'today' ? <View style={styles.liveDot} /> : null}
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>


            <TouchableOpacity
              style={styles.sortRow}
              hitSlop={8}
              onPress={() => setSort((prev) => (prev === 'rating' ? 'experience' : 'rating'))}
            >
              <SortIcon />
              <Text style={styles.sortText}>Sắp xếp</Text>
              <Text style={styles.sortValue}>• {SORT_LABELS[sort]}</Text>
            </TouchableOpacity>


            <View style={styles.doctorList}>
              {isLoadingDoctors ? (
                <ActivityIndicator color={COLORS.PRIMARY} />
              ) : doctorError ? (
                <TouchableOpacity onPress={() => setDoctorRetry((value) => value + 1)}>
                  <Text style={styles.emptyText}>{doctorError}</Text>
                </TouchableOpacity>
              ) : doctors.length === 0 ? (
                <Text style={styles.emptyText}>Không tìm thấy bác sĩ phù hợp</Text>
              ) : (
                doctors.map((doc) => {
                  return (
                    <View key={doc.id} style={styles.doctorCard}>
                      <LinearGradient
                        colors={['#7CC4F5', '#025C8E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.cardTopLine}
                      />
                      <View style={styles.doctorBody}>
                        <TouchableOpacity
                          style={styles.doctorTop}
                          activeOpacity={0.9}
                          onPress={() => onPressViewDetail?.(doc)}
                        >
                          <View style={styles.photoWrap}>
                            <View style={styles.photo}>
                              {doc.avatarUri ? (
                                <Image source={{ uri: doc.avatarUri }} style={styles.photoImg} />
                              ) : (
                                <StethoscopeIcon size={34} color={COLORS.PRIMARY} />
                              )}
                            </View>
                            <VerifiedDot />
                          </View>


                          <View style={styles.doctorInfo}>
                            <View style={styles.badgeRow}>
                              <View style={[styles.availBadge, styles.availBadgeTomorrow]}>
                                <View style={[styles.availDot, { backgroundColor: NAVY }]} />
                                <Text style={[styles.availText, { color: NAVY }]}>
                                  XEM LỊCH KHÁM
                                </Text>
                              </View>
                              <View style={styles.ratingRow}>
                                <StarIcon size={13} color={STAR} fill={STAR} strokeWidth={1.5} />
                                <Text style={styles.ratingValue}>
                                  {doc.rating === null ? '—' : doc.rating.toFixed(1)}
                                </Text>
                                <Text style={styles.ratingCount}>
                                  ({doc.reviews})
                                </Text>
                              </View>
                            </View>


                            <Text style={styles.doctorName}>{doc.name}</Text>


                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Học vị:</Text>
                              <Text style={styles.infoValue}>{doc.degree ?? 'Chưa cập nhật'}</Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Kinh nghiệm:</Text>
                              <Text style={[styles.infoValue, styles.infoAccent]}>
                                {doc.experienceYears === null
                                  ? 'Chưa cập nhật'
                                  : `Hơn ${doc.experienceYears} năm`}
                              </Text>
                            </View>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>Chuyên khoa:</Text>
                              <Text style={[styles.infoValue, styles.infoAccent]}>
                                {specialtyName(doc.specialtyId)}
                              </Text>
                            </View>
                          </View>
                        </TouchableOpacity>


                        <View style={styles.divider} />


                        <View style={styles.actionRow}>
                          <TouchableOpacity
                            style={styles.detailButton}
                            activeOpacity={0.8}
                            onPress={() => onPressViewDetail?.(doc)}
                          >
                            <Text style={styles.detailButtonText}>XEM CHI TIẾT</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.flex}
                            activeOpacity={0.85}
                            onPress={() => onPressBook?.(doc)}
                          >
                            <LinearGradient
                              colors={BUTTON_GRADIENT}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0.4 }}
                              style={styles.bookButton}
                            >
                              <Text style={styles.bookButtonText}>ĐẶT LỊCH KHÁM</Text>
                              <CalendarIcon size={17} color="#FFFFFF" />
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
              {doctorMoreError ? (
                <TouchableOpacity onPress={loadMoreDoctors}>
                  <Text style={styles.emptyText}>{doctorMoreError}</Text>
                </TouchableOpacity>
              ) : null}
              {hasMoreDoctors && !isLoadingDoctors && !doctorError ? (
                <TouchableOpacity
                  style={styles.pageButton}
                  disabled={isLoadingMoreDoctors}
                  onPress={loadMoreDoctors}
                >
                  {isLoadingMoreDoctors ? (
                    <ActivityIndicator color={COLORS.PRIMARY} />
                  ) : (
                    <Text style={styles.pageButtonText}>Xem thêm bác sĩ</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}


        <TouchableOpacity style={styles.aiBanner} activeOpacity={0.85} onPress={onPressAskAI}>
          <View style={styles.aiIcon}>
            <BotIcon size={26} color="#15497A" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.aiTitle}>Chưa biết chọn bác sĩ hoặc chuyên khoa nào?</Text>
            <Text style={styles.aiLink}>Chat AI tư vấn ngay →</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { backgroundColor: COLORS.BACKGROUND },


  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F8',
  },
  headerSide: { width: 32 },
  headerSideRight: { alignItems: 'flex-end' },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.BOLD,
    fontSize: 18,
    lineHeight: 24,
    color: '#164E78',
  },


  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },


  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D3E1F3',
    backgroundColor: COLORS.SURFACE,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 15,
    color: '#0F2236',
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D3E1F3',
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: NAVY,
    borderWidth: 1.5,
    borderColor: COLORS.SURFACE,
  },


  segment: {
    flexDirection: 'row',
    marginTop: 14,
    padding: 4,
    borderRadius: 16,
    backgroundColor: '#E8EFF9',
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: 12,
  },
  segmentItemActive: { backgroundColor: COLORS.SURFACE },
  segmentText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 14, color: '#4A5563' },
  segmentTextActive: { fontFamily: FONTS.BOLD, color: NAVY },


  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionBar: { width: 5, height: 18, borderRadius: 3, backgroundColor: NAVY },
  sectionTitle: { fontFamily: FONTS.BOLD, fontSize: 17, color: '#0F2236' },
  sectionLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionLink: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: NAVY },


  specialtyScroll: { gap: 12, paddingTop: 12, paddingRight: 16 },
  specialtyCard: {
    width: 150,
    height: 100,
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
  },
  specialtyCardIdle: {
    borderWidth: 1,
    borderColor: '#E0EAF5',
    backgroundColor: COLORS.SURFACE,
  },
  specialtyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#E0EEFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  specialtyIconBoxActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  specialtyName: { fontFamily: FONTS.BOLD, fontSize: 15, color: '#164E78' },
  specialtyNameActive: { color: '#FFFFFF' },
  specialtySub: { fontFamily: FONTS.REGULAR, fontSize: 12, color: '#5E6F82' },
  specialtySubActive: { color: '#D6E8F9' },
  specialtyList: { marginTop: 16, gap: 10 },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0EAF5',
    backgroundColor: COLORS.SURFACE,
  },


  filterScroll: { gap: 10, paddingTop: 16, paddingRight: 16 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#C5E1FA',
    backgroundColor: COLORS.SURFACE,
  },
  filterChipActive: { borderColor: NAVY, backgroundColor: NAVY },
  filterChipText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13.5, color: NAVY },
  filterChipTextActive: { color: '#FFFFFF' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },


  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  sortText: { fontFamily: FONTS.SEMI_BOLD, fontSize: 13.5, color: NAVY },
  sortValue: { fontFamily: FONTS.REGULAR, fontSize: 12.5, color: '#5E6F82' },


  doctorList: { marginTop: 12, gap: 14 },
  pageButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C5E1FA',
    backgroundColor: COLORS.SURFACE,
  },
  pageButtonText: { fontFamily: FONTS.BOLD, fontSize: 13, color: NAVY },
  doctorCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E6F4',
    backgroundColor: COLORS.SURFACE,
    overflow: 'hidden',
  },
  cardTopLine: { height: 4 },
  doctorBody: { padding: 14, gap: 12 },
  doctorTop: { flexDirection: 'row', gap: 12 },
  photoWrap: { width: 86, height: 108 },
  photo: {
    width: 86,
    height: 108,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D3E1F3',
    backgroundColor: '#E6F0FA',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: '100%', height: '100%' },
  verifiedDot: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: GREEN,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorInfo: { flex: 1, gap: 3 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#BDE8D5',
    backgroundColor: '#E3F6EE',
  },
  availBadgeTomorrow: { borderColor: '#C5E1FA', backgroundColor: '#E6F0FA' },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontFamily: FONTS.BOLD, fontSize: 10.5, letterSpacing: 0.3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingValue: { fontFamily: FONTS.BOLD, fontSize: 13, color: '#B45309' },
  ratingCount: { fontFamily: FONTS.REGULAR, fontSize: 11.5, color: '#6B7A8C' },
  doctorName: { fontFamily: FONTS.BOLD, fontSize: 17, lineHeight: 24, color: NAVY },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  infoLabel: { fontFamily: FONTS.REGULAR, fontSize: 13, color: '#4A5563' },
  infoValue: { flexShrink: 1, fontFamily: FONTS.SEMI_BOLD, fontSize: 13, color: '#17202C', textAlign: 'right' },
  infoAccent: { fontFamily: FONTS.BOLD, color: NAVY },
  divider: { height: 1, backgroundColor: '#E6EEF8' },
  actionRow: { flexDirection: 'row', gap: 12 },
  detailButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: NAVY,
    backgroundColor: COLORS.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: { fontFamily: FONTS.BOLD, fontSize: 13.5, letterSpacing: 0.3, color: NAVY },
  bookButton: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
  },
  bookButtonText: { fontFamily: FONTS.BOLD, fontSize: 13.5, letterSpacing: 0.3, color: '#FFFFFF' },


  emptyText: {
    textAlign: 'center',
    paddingVertical: 28,
    fontFamily: FONTS.SEMI_BOLD,
    fontSize: 14,
    color: '#6B7A8C',
  },


  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C5E1FA',
    backgroundColor: '#E6F2FC',
  },
  aiIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D3E6F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTitle: { fontFamily: FONTS.BOLD, fontSize: 14.5, lineHeight: 21, color: '#164E78' },
  aiLink: { marginTop: 2, fontFamily: FONTS.SEMI_BOLD, fontSize: 13.5, color: NAVY },
});
