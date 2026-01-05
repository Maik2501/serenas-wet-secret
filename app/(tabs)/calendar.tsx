import { useJournal } from '@/contexts/JournalContext';
import { Calendar as CalendarIcon, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Helper to get local date string in YYYY-MM-DD format (avoids timezone issues with toISOString)
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { entries, getEntriesForDate, isLoading } = useJournal();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDayEntries, setSelectedDayEntries] = useState<{ date: string; entries: any[] } | null>(null);

  const cryCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.wasCrying) {
        const dateStr = getLocalDateString(new Date(entry.createdAt));
        counts[dateStr] = (counts[dateStr] || 0) + 1;
      }
    });
    return counts;
  }, [entries]);

  const calendar = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks: ({ day: number; date: string; hasCried: boolean; cryCount: number } | null)[][] = [];
    let currentWeek: ({ day: number; date: string; hasCried: boolean; cryCount: number } | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getLocalDateString(new Date(year, month, day));
      const cryCount = cryCountsByDate[dateStr] || 0;
      const hasCried = cryCount > 0;

      currentWeek.push({ day, date: dateStr, hasCried, cryCount });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [selectedMonth, cryCountsByDate]);

  const changeMonth = (delta: number) => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const handleDayPress = (dateStr: string) => {
    const entries = getEntriesForDate(dateStr);
    setSelectedDayEntries({ date: dateStr, entries });
  };

  const { totalCries, daysWithCrying } = useMemo(() => {
    let total = 0;
    const daysSet = new Set<string>();

    entries.forEach(entry => {
      if (entry.wasCrying) {
        const entryDate = new Date(entry.createdAt);
        if (entryDate.getMonth() === selectedMonth.getMonth() &&
          entryDate.getFullYear() === selectedMonth.getFullYear()) {
          total++;
          daysSet.add(getLocalDateString(entryDate));
        }
      }
    });

    return { totalCries: total, daysWithCrying: daysSet.size };
  }, [entries, selectedMonth]);

  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
  const noCryDays = daysInMonth - daysWithCrying;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <CalendarIcon color="#8B5CF6" size={28} />
        <Text style={styles.headerTitle}>Crying Calendar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>😢</Text>
            <Text style={styles.statNumber}>{totalCries}</Text>
            <Text style={styles.statLabel}>Total cries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💧</Text>
            <Text style={styles.statNumber}>{daysWithCrying}</Text>
            <Text style={styles.statLabel}>Days cried</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>😌</Text>
            <Text style={styles.statNumber}>{noCryDays}</Text>
            <Text style={styles.statLabel}>Days strong</Text>
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Pressable onPress={() => changeMonth(-1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>←</Text>
            </Pressable>
            <Text style={styles.monthTitle}>
              {selectedMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
              })}
            </Text>
            <Pressable onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Text style={styles.monthButtonText}>→</Text>
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
              <Text key={idx} style={styles.weekdayText}>
                {day}
              </Text>
            ))}
          </View>

          {calendar.map((week, weekIdx) => (
            <View key={weekIdx} style={styles.weekRow}>
              {week.map((day, dayIdx) => (
                <Pressable
                  key={dayIdx}
                  style={styles.dayCell}
                  onPress={() => day && handleDayPress(day.date)}
                  disabled={!day}
                >
                  {day ? (
                    <View
                      style={[
                        styles.dayCircle,
                        day.hasCried && styles.dayCircleCried,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          day.hasCried && styles.dayTextCried,
                        ]}
                      >
                        {day.day}
                      </Text>
                      {day.cryCount > 0 && (
                        <View style={styles.cryBadge}>
                          <Text style={styles.cryBadgeText}>{day.cryCount}</Text>
                        </View>
                      )}
                    </View>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotCried]} />
              <Text style={styles.legendText}>Had a good cry 💧</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotNormal]} />
              <Text style={styles.legendText}>No tears</Text>
            </View>
          </View>
          <Text style={styles.legendHint}>Tap a day to see entries</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoEmoji}>💡</Text>
          <Text style={styles.infoText}>
            You&apos;ll get a reminder if you haven&apos;t cried in 24+ hours.
            It&apos;s okay to let it out! 🫂
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={selectedDayEntries !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDayEntries(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedDayEntries(null)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDayEntries && new Date(selectedDayEntries.date + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Pressable
                onPress={() => setSelectedDayEntries(null)}
                style={styles.closeButton}
              >
                <X color="#64748B" size={20} />
              </Pressable>
            </View>

            <ScrollView style={styles.entriesList} showsVerticalScrollIndicator={false}>
              {selectedDayEntries?.entries.length === 0 ? (
                <View style={styles.noEntriesContainer}>
                  <Text style={styles.noEntriesEmoji}>📝</Text>
                  <Text style={styles.noEntriesText}>No entries for this day</Text>
                </View>
              ) : (
                selectedDayEntries?.entries.map((entry) => (
                  <View key={entry.id} style={styles.modalEntryCard}>
                    <View style={styles.modalEntryHeader}>
                      <Text style={styles.modalEntryEmoji}>
                        {entry.wasCrying ? '😢' : '😊'}
                      </Text>
                      <Text style={styles.modalEntryTime}>
                        {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <Text style={styles.modalEntryContent}>{entry.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 20,
    color: '#475569',
    fontWeight: '600' as const,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#94A3B8',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    padding: 2,
  },
  dayCircle: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayCircleCried: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#475569',
  },
  dayTextCried: {
    color: '#1E40AF',
    fontWeight: '700' as const,
  },
  cryBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cryBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 12,
  },
  legendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
    marginBottom: 12,
  },
  legendRow: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  legendDotCried: {
    backgroundColor: '#DBEAFE',
    borderColor: '#93C5FD',
  },
  legendDotNormal: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  legendText: {
    fontSize: 14,
    color: '#475569',
  },
  legendHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 12,
    fontStyle: 'italic',
  },
  infoCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoEmoji: {
    fontSize: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  entriesList: {
    maxHeight: 400,
  },
  noEntriesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noEntriesEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noEntriesText: {
    fontSize: 15,
    color: '#64748B',
  },
  modalEntryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalEntryEmoji: {
    fontSize: 20,
  },
  modalEntryTime: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500' as const,
  },
  modalEntryContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});
