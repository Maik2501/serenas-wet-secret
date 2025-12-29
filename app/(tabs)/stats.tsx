import { useJournal } from '@/contexts/JournalContext';
import { BarChart3, Calendar, Droplets, Flame, Heart, TrendingDown, TrendingUp, Zap, ChevronDown, X, Check } from 'lucide-react-native';
import { CRY_INTENSITY_LABELS, CRY_INTENSITY_EMOJIS, CryIntensity } from '@/types/journal';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type TimeframeOption = 'week' | 'month' | 'year' | 'all' | 'custom';

const TIMEFRAME_LABELS: Record<TimeframeOption, string> = {
  week: 'This Week',
  month: 'This Month',
  year: 'This Year',
  all: 'All Time',
  custom: 'Custom',
};

export default function StatsScreen() {
  const { entries, cryingDays } = useJournal();
  const [showCryingStreak, setShowCryingStreak] = useState(false);
  const [showPeakTime, setShowPeakTime] = useState(false);
  const [showIntensityAvg, setShowIntensityAvg] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<CryIntensity>(4);
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all');
  const [showTimeframePicker, setShowTimeframePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date>(customStartDate);
  const [tempEndDate, setTempEndDate] = useState<Date>(customEndDate);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    switch (timeframe) {
      case 'week': {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: now };
      }
      case 'month': {
        const start = new Date(now);
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: now };
      }
      case 'year': {
        const start = new Date(now);
        start.setFullYear(start.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        return { startDate: start, endDate: now };
      }
      case 'custom': {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return { startDate: start, endDate: end };
      }
      default:
        return { startDate: null, endDate: null };
    }
  }, [timeframe, customStartDate, customEndDate]);

  const filteredCryingDays = useMemo(() => {
    if (!startDate || !endDate) return cryingDays;
    return cryingDays.filter(d => {
      const date = new Date(d.date);
      return date >= startDate && date <= endDate;
    });
  }, [cryingDays, startDate, endDate]);

  const filteredEntries = useMemo(() => {
    if (!startDate || !endDate) return entries;
    return entries.filter(e => {
      const date = new Date(e.createdAt);
      return date >= startDate && date <= endDate;
    });
  }, [entries, startDate, endDate]);

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalCries = filteredCryingDays.reduce((sum, d) => sum + (d.count || 1), 0);
    const totalEntries = filteredEntries.length;

    const recentCries = filteredCryingDays.filter(d => new Date(d.date) >= thirtyDaysAgo);
    const criesLast30Days = recentCries.reduce((sum, d) => sum + (d.count || 1), 0);

    const weekCries = filteredCryingDays.filter(d => new Date(d.date) >= sevenDaysAgo);
    const criesLast7Days = weekCries.reduce((sum, d) => sum + (d.count || 1), 0);

    const cryingEntries = filteredEntries.filter(e => e.wasCrying);
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    cryingEntries.forEach(e => {
      const day = new Date(e.createdAt).getDay();
      weekdayCounts[day]++;
    });

    const maxWeekdayCount = Math.max(...weekdayCounts, 1);
    const mostEmotionalDay = WEEKDAYS[weekdayCounts.indexOf(Math.max(...weekdayCounts))];

    const hourCounts = new Array(24).fill(0);
    cryingEntries.forEach(e => {
      const hour = new Date(e.createdAt).getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
    const formatPeakTime = (hour: number) => {
      if (hour === 0) return '12 AM';
      if (hour === 12) return '12 PM';
      return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    };
    const peakTimeLabel = formatPeakTime(peakHour);

    const monthCounts: { [key: string]: number } = {};
    filteredCryingDays.forEach(d => {
      const date = new Date(d.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthCounts[key] = (monthCounts[key] || 0) + (d.count || 1);
    });

    const last6Months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      last6Months.push({
        month: MONTHS[date.getMonth()],
        count: monthCounts[key] || 0,
      });
    }

    const maxMonthCount = Math.max(...last6Months.map(m => m.count), 1);

    let longestDryStreak = 0;
    let currentDryStreak = 0;
    let longestCryStreak = 0;
    let currentCryStreak = 0;

    if (filteredCryingDays.length > 0) {
      const sortedDates = [...filteredCryingDays]
        .map(d => new Date(d.date).getTime())
        .sort((a, b) => a - b);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let prevDate: number | null = null;
      let consecutiveCryDays = 1;
      
      for (const dateTime of sortedDates) {
        if (prevDate === null) {
          prevDate = dateTime;
          continue;
        }
        const gap = Math.floor((dateTime - prevDate) / (24 * 60 * 60 * 1000));
        if (gap > 1) {
          longestDryStreak = Math.max(longestDryStreak, gap - 1);
          longestCryStreak = Math.max(longestCryStreak, consecutiveCryDays);
          consecutiveCryDays = 1;
        } else if (gap === 1) {
          consecutiveCryDays++;
        }
        prevDate = dateTime;
      }
      longestCryStreak = Math.max(longestCryStreak, consecutiveCryDays);

      const lastCryDate = sortedDates[sortedDates.length - 1];
      const daysSinceLast = Math.floor((today.getTime() - lastCryDate) / (24 * 60 * 60 * 1000));
      currentDryStreak = daysSinceLast;
      longestDryStreak = Math.max(longestDryStreak, currentDryStreak);

      // Calculate current crying streak (if today or recent days are crying days)
      const todayTime = today.getTime();
      let checkDate = todayTime;
      currentCryStreak = 0;
      for (let i = sortedDates.length - 1; i >= 0; i--) {
        const diff = Math.floor((checkDate - sortedDates[i]) / (24 * 60 * 60 * 1000));
        if (diff === 0 || diff === 1) {
          currentCryStreak++;
          checkDate = sortedDates[i];
        } else {
          break;
        }
      }
    }

    const avgPerWeek = totalCries > 0 && filteredCryingDays.length > 0
      ? (totalCries / Math.max(1, Math.ceil((now.getTime() - new Date(filteredCryingDays.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date || now).getTime()) / (7 * 24 * 60 * 60 * 1000))))
      : 0;

    // Intensity stats
    const intensityCounts: Record<CryIntensity, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const entriesWithIntensity = cryingEntries.filter(e => e.intensity);
    entriesWithIntensity.forEach(e => {
      if (e.intensity) intensityCounts[e.intensity]++;
    });

    const totalIntensityEntries = entriesWithIntensity.length;
    const avgIntensity = totalIntensityEntries > 0
      ? entriesWithIntensity.reduce((sum, e) => sum + (e.intensity || 0), 0) / totalIntensityEntries
      : 0;

    const mostCommonIntensity = (Object.entries(intensityCounts) as [string, number][])
      .sort((a, b) => b[1] - a[1])[0];
    const dominantIntensity = parseInt(mostCommonIntensity[0]) as CryIntensity;
    const maxIntensityCount = Math.max(...Object.values(intensityCounts), 1);

    return {
      totalCries,
      totalEntries,
      criesLast30Days,
      criesLast7Days,
      weekdayCounts,
      maxWeekdayCount,
      mostEmotionalDay,
      last6Months,
      maxMonthCount,
      longestDryStreak,
      currentDryStreak,
      longestCryStreak,
      currentCryStreak,
      avgPerWeek: avgPerWeek.toFixed(1),
      peakTimeLabel,
      peakHour,
      intensityCounts,
      avgIntensity,
      dominantIntensity,
      maxIntensityCount,
      totalIntensityEntries,
    };
  }, [filteredEntries, filteredCryingDays]);

  const formatDateShort = (date: Date) => {
    return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  };

  const getTimeframeLabel = () => {
    if (timeframe === 'custom') {
      return `${formatDateShort(customStartDate)} - ${formatDateShort(customEndDate)}`;
    }
    return TIMEFRAME_LABELS[timeframe];
  };

  const handleTimeframeSelect = (option: TimeframeOption) => {
    if (option === 'custom') {
      setTempStartDate(customStartDate);
      setTempEndDate(customEndDate);
    }
    setTimeframe(option);
    if (option !== 'custom') {
      setShowTimeframePicker(false);
    }
  };

  const applyCustomDates = () => {
    setCustomStartDate(tempStartDate);
    setCustomEndDate(tempEndDate);
    setShowTimeframePicker(false);
  };

  const renderStatCard = (
    icon: React.ReactNode,
    title: string,
    value: string | number,
    subtitle: string,
    gradient: string[],
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: gradient[0] }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.statCardIcon}>{icon}</View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardTitle}>{title}</Text>
      <Text style={styles.statCardSubtitle}>{subtitle}</Text>
      {onPress && <Text style={styles.tapHint}>tap to switch</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Your Journey</Text>
            <Text style={styles.headerSubtitle}>Emotional wellness insights</Text>
          </View>

          <View style={styles.heroCard}>
            <TouchableOpacity 
              style={styles.heroContent}
              onPress={() => setShowTimeframePicker(true)}
              activeOpacity={0.8}
            >
              <View style={styles.heroIconContainer}>
                <Droplets color="#fff" size={32} />
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroValue}>{stats.totalCries}</Text>
                <View style={styles.heroLabelRow}>
                  <Text style={styles.heroLabel}>Total Tears Shed</Text>
                </View>
              </View>
              <View style={styles.timeframeBadge}>
                <Text style={styles.timeframeBadgeText}>{getTimeframeLabel()}</Text>
                <ChevronDown color="#8B5CF6" size={14} />
              </View>
            </TouchableOpacity>
            <View style={styles.heroDivider} />
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats.criesLast7Days}</Text>
                <Text style={styles.heroStatLabel}>This Week</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats.criesLast30Days}</Text>
                <Text style={styles.heroStatLabel}>This Month</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{stats.avgPerWeek}</Text>
                <Text style={styles.heroStatLabel}>Avg/Week</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardsRow}>
            {renderStatCard(
              <Flame color="#fff" size={24} />,
              showCryingStreak ? 'Crying Streak' : 'Dry Streak',
              showCryingStreak ? stats.currentCryStreak : stats.currentDryStreak,
              showCryingStreak ? 'days crying' : 'days dry',
              [showCryingStreak ? '#8B5CF6' : '#FF6B6B'],
              () => setShowCryingStreak(!showCryingStreak)
            )}
            {renderStatCard(
              <TrendingUp color="#fff" size={24} />,
              showCryingStreak ? 'Longest Crying' : 'Longest Dry',
              showCryingStreak ? stats.longestCryStreak : stats.longestDryStreak,
              showCryingStreak ? 'consecutive days' : 'days without',
              [showCryingStreak ? '#A78BFA' : '#4ECDC4'],
              () => setShowCryingStreak(!showCryingStreak)
            )}
          </View>

          <View style={styles.cardsRow}>
            {renderStatCard(
              <Heart color="#fff" size={24} />,
              showPeakTime ? 'Peak Time' : 'Peak Day',
              showPeakTime ? stats.peakTimeLabel : stats.mostEmotionalDay,
              showPeakTime ? 'most emotional hour' : 'most emotional day',
              [showPeakTime ? '#F472B6' : '#6366F1'],
              () => setShowPeakTime(!showPeakTime)
            )}
            {renderStatCard(
              <Calendar color="#fff" size={24} />,
              'Journal Entries',
              stats.totalEntries,
              'total written',
              ['#60A5FA']
            )}
          </View>

          <View style={styles.cardsRow}>
            {renderStatCard(
              <Zap color="#fff" size={24} />,
              showIntensityAvg ? 'Avg Intensity' : 'Top Intensity',
              showIntensityAvg 
                ? stats.avgIntensity.toFixed(1)
                : stats.totalIntensityEntries > 0 ? CRY_INTENSITY_EMOJIS[stats.dominantIntensity] : '—',
              showIntensityAvg 
                ? 'on scale of 4'
                : stats.totalIntensityEntries > 0 ? CRY_INTENSITY_LABELS[stats.dominantIntensity] : 'no data yet',
              [showIntensityAvg ? '#EC4899' : '#F97316'],
              () => setShowIntensityAvg(!showIntensityAvg)
            )}
            {renderStatCard(
              <Droplets color="#fff" size={24} />,
              CRY_INTENSITY_LABELS[selectedIntensity],
              stats.intensityCounts[selectedIntensity],
              `${CRY_INTENSITY_EMOJIS[selectedIntensity]} cry sessions`,
              [selectedIntensity === 4 ? '#EF4444' : selectedIntensity === 3 ? '#F97316' : selectedIntensity === 2 ? '#FBBF24' : '#22C55E'],
              () => setSelectedIntensity(prev => prev === 1 ? 4 : (prev - 1) as CryIntensity)
            )}
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <BarChart3 color="#64748B" size={20} />
              <Text style={styles.chartTitle}>Weekly Pattern</Text>
            </View>
            <Text style={styles.chartSubtitle}>When you tend to cry the most</Text>
            <View style={styles.weekdayChart}>
              {WEEKDAYS.map((day, index) => {
                const height = stats.maxWeekdayCount > 0 
                  ? (stats.weekdayCounts[index] / stats.maxWeekdayCount) * 100 
                  : 0;
                const isMax = stats.weekdayCounts[index] === Math.max(...stats.weekdayCounts) && stats.weekdayCounts[index] > 0;
                
                return (
                  <View key={day} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: `${Math.max(height, 4)}%`,
                            backgroundColor: isMax ? '#8B5CF6' : '#E0E7FF',
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.barLabel, isMax && styles.barLabelActive]}>{day}</Text>
                    <Text style={[styles.barCount, isMax && styles.barCountActive]}>
                      {stats.weekdayCounts[index]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <TrendingDown color="#64748B" size={20} />
              <Text style={styles.chartTitle}>Monthly Trend</Text>
            </View>
            <Text style={styles.chartSubtitle}>Your emotional journey over time</Text>
            <View style={styles.monthChart}>
              {stats.last6Months.map((month, index) => {
                const height = stats.maxMonthCount > 0 
                  ? (month.count / stats.maxMonthCount) * 100 
                  : 0;
                const colors = ['#FCD34D', '#FBBF24', '#F59E0B', '#D97706', '#B45309', '#92400E'];
                
                return (
                  <View key={month.month + index} style={styles.monthBarContainer}>
                    <Text style={styles.monthCount}>{month.count}</Text>
                    <View style={styles.monthBarWrapper}>
                      <View 
                        style={[
                          styles.monthBar, 
                          { 
                            height: `${Math.max(height, 4)}%`,
                            backgroundColor: colors[index],
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.monthLabel}>{month.month}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Zap color="#64748B" size={20} />
              <Text style={styles.chartTitle}>Intensity Breakdown</Text>
            </View>
            <Text style={styles.chartSubtitle}>Distribution of your emotional intensity</Text>
            <View style={styles.intensityChart}>
              {([1, 2, 3, 4] as CryIntensity[]).map((intensity) => {
                const count = stats.intensityCounts[intensity];
                const percentage = stats.totalIntensityEntries > 0 
                  ? (count / stats.totalIntensityEntries) * 100 
                  : 0;
                const isMax = count === stats.maxIntensityCount && count > 0;
                const colors = ['#86EFAC', '#FCD34D', '#FB923C', '#F87171'];
                
                return (
                  <View key={intensity} style={styles.intensityRow}>
                    <View style={styles.intensityLabelContainer}>
                      <Text style={styles.intensityEmoji}>{CRY_INTENSITY_EMOJIS[intensity]}</Text>
                      <Text style={[styles.intensityLabel, isMax && styles.intensityLabelActive]}>
                        {CRY_INTENSITY_LABELS[intensity]}
                      </Text>
                    </View>
                    <View style={styles.intensityBarContainer}>
                      <View style={styles.intensityBarBg}>
                        <View 
                          style={[
                            styles.intensityBar, 
                            { 
                              width: `${Math.max(percentage, 2)}%`,
                              backgroundColor: colors[intensity - 1],
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.intensityCount, isMax && styles.intensityCountActive]}>
                        {count}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightEmoji}>💧</Text>
            <Text style={styles.insightText}>
              {stats.totalCries === 0 
                ? "Start tracking your emotional moments to see patterns emerge."
                : stats.currentDryStreak > 7
                  ? `You've been dry for ${stats.currentDryStreak} days. Remember, it's okay to let it out sometimes.`
                  : stats.criesLast7Days > 5
                    ? "You've been very in touch with your emotions lately. That takes courage."
                    : `${stats.mostEmotionalDay}s seem to bring out your feelings. Be gentle with yourself.`
              }
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <Modal
          visible={showTimeframePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowTimeframePicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTimeframePicker(false)}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Timeframe</Text>
                <TouchableOpacity onPress={() => setShowTimeframePicker(false)}>
                  <X color="#64748B" size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.timeframeOptions}>
                {(['week', 'month', 'year', 'all', 'custom'] as TimeframeOption[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.timeframeOption,
                      timeframe === option && styles.timeframeOptionActive,
                    ]}
                    onPress={() => handleTimeframeSelect(option)}
                  >
                    <Text style={[
                      styles.timeframeOptionText,
                      timeframe === option && styles.timeframeOptionTextActive,
                    ]}>
                      {TIMEFRAME_LABELS[option]}
                    </Text>
                    {timeframe === option && (
                      <Check color="#8B5CF6" size={20} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {timeframe === 'custom' && (
                <View style={styles.customDateSection}>
                  <View style={styles.datePickerRow}>
                    <Text style={styles.dateLabel}>From</Text>
                    <TouchableOpacity 
                      style={styles.dateButton}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {tempStartDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.datePickerRow}>
                    <Text style={styles.dateLabel}>To</Text>
                    <TouchableOpacity 
                      style={styles.dateButton}
                      onPress={() => setShowEndPicker(true)}
                    >
                      <Text style={styles.dateButtonText}>
                        {tempEndDate.toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {(showStartPicker || Platform.OS === 'web') && (
                    <View style={styles.pickerContainer}>
                      <Text style={styles.pickerLabel}>Start Date</Text>
                      <DateTimePicker
                        value={tempStartDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                          setShowStartPicker(Platform.OS === 'ios');
                          if (date) setTempStartDate(date);
                        }}
                        maximumDate={tempEndDate}
                      />
                    </View>
                  )}

                  {(showEndPicker || Platform.OS === 'web') && (
                    <View style={styles.pickerContainer}>
                      <Text style={styles.pickerLabel}>End Date</Text>
                      <DateTimePicker
                        value={tempEndDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, date) => {
                          setShowEndPicker(Platform.OS === 'ios');
                          if (date) setTempEndDate(date);
                        }}
                        minimumDate={tempStartDate}
                        maximumDate={new Date()}
                      />
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={applyCustomDates}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 8,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
  },
  heroCard: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    marginLeft: 16,
  },
  heroValue: {
    fontSize: 42,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: -1,
  },
  heroLabel: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500' as const,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeframeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    marginLeft: 'auto',
  },
  timeframeBadgeText: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '600' as const,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#fff',
  },
  heroStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    minHeight: 140,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCardValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#fff',
  },
  statCardTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  statCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tapHint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 8,
    fontStyle: 'italic' as const,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    marginBottom: 20,
  },
  weekdayChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    height: 80,
    width: 28,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '500' as const,
  },
  barLabelActive: {
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
  barCount: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600' as const,
    marginTop: 2,
  },
  barCountActive: {
    color: '#8B5CF6',
  },
  monthChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
  },
  monthBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthCount: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  monthBarWrapper: {
    height: 100,
    width: 36,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  monthBar: {
    width: '100%',
    borderRadius: 10,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500' as const,
  },
  insightCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  insightEmoji: {
    fontSize: 32,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    color: '#4338CA',
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  bottomSpacer: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  timeframeOptions: {
    gap: 8,
  },
  timeframeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  timeframeOptionActive: {
    backgroundColor: '#EDE9FE',
  },
  timeframeOptionText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  timeframeOptionTextActive: {
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
  customDateSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  dateButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500' as const,
  },
  pickerContainer: {
    marginTop: 12,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  applyButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600' as const,
  },
  intensityChart: {
    gap: 12,
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intensityLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 140,
  },
  intensityEmoji: {
    fontSize: 20,
  },
  intensityLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  intensityLabelActive: {
    color: '#1E293B',
    fontWeight: '600' as const,
  },
  intensityBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  intensityBarBg: {
    flex: 1,
    height: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  intensityBar: {
    height: '100%',
    borderRadius: 12,
    minWidth: 4,
  },
  intensityCount: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600' as const,
    width: 28,
    textAlign: 'right' as const,
  },
  intensityCountActive: {
    color: '#1E293B',
  },
});
