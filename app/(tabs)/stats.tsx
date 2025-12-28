import { useJournal } from '@/contexts/JournalContext';
import { BarChart3, Calendar, Droplets, Flame, Heart, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function StatsScreen() {
  const { entries, cryingDays } = useJournal();
  const [showCryingStreak, setShowCryingStreak] = useState(false);
  const [showPeakTime, setShowPeakTime] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalCries = cryingDays.reduce((sum, d) => sum + (d.count || 1), 0);
    const totalEntries = entries.length;

    const recentCries = cryingDays.filter(d => new Date(d.date) >= thirtyDaysAgo);
    const criesLast30Days = recentCries.reduce((sum, d) => sum + (d.count || 1), 0);

    const weekCries = cryingDays.filter(d => new Date(d.date) >= sevenDaysAgo);
    const criesLast7Days = weekCries.reduce((sum, d) => sum + (d.count || 1), 0);

    const cryingEntries = entries.filter(e => e.wasCrying);
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
    cryingDays.forEach(d => {
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

    if (cryingDays.length > 0) {
      const sortedDates = [...cryingDays]
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

    const avgPerWeek = totalCries > 0 && cryingDays.length > 0
      ? (totalCries / Math.max(1, Math.ceil((now.getTime() - new Date(cryingDays.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime())[0]?.date || now).getTime()) / (7 * 24 * 60 * 60 * 1000))))
      : 0;

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
    };
  }, [entries, cryingDays]);

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
            <View style={styles.heroContent}>
              <View style={styles.heroIconContainer}>
                <Droplets color="#fff" size={32} />
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroValue}>{stats.totalCries}</Text>
                <Text style={styles.heroLabel}>Total Tears Shed</Text>
              </View>
            </View>
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
              [showPeakTime ? '#F472B6' : '#A78BFA'],
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
});
