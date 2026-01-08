import { useJournal } from '@/contexts/JournalContext';
import { CryIntensity, CRY_INTENSITY_LABELS, CRY_INTENSITY_EMOJIS, JournalEntry } from '@/types/journal';
import { Calendar as CalendarIcon, X, Pencil, Clock } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Helper function to get YYYY-MM-DD in local timezone (avoids UTC offset issues)
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { entries, getEntriesForDate, updateEntry, isLoading } = useJournal();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [selectedDayEntries, setSelectedDayEntries] = useState<{ date: string; entries: any[] } | null>(null);

  // Edit state
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editWasCrying, setEditWasCrying] = useState(false);
  const [editIntensity, setEditIntensity] = useState<CryIntensity>(2);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditTimePicker, setShowEditTimePicker] = useState(false);

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

  const handleEditEntry = (entry: JournalEntry) => {
    // Close the day entries modal first to avoid iOS nested modal rendering issues
    setSelectedDayEntries(null);
    // Use setTimeout to ensure the first modal is fully closed before opening the edit modal
    setTimeout(() => {
      setEditingEntry(entry);
      setEditContent(entry.content);
      setEditDate(new Date(entry.createdAt));
      setEditWasCrying(entry.wasCrying);
      setEditIntensity(entry.intensity || 2);
    }, 100);
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    updateEntry(editingEntry.id, editContent, editWasCrying, editDate, editWasCrying ? editIntensity : undefined);
    setEditingEntry(null);
    // Refresh the day entries
    if (selectedDayEntries) {
      const refreshed = getEntriesForDate(selectedDayEntries.date);
      setSelectedDayEntries({ ...selectedDayEntries, entries: refreshed });
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const generateDateOptions = () => {
    const options: Date[] = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(editDate.getHours(), editDate.getMinutes(), 0, 0);
      options.push(date);
    }
    return options.reverse();
  };

  const generateTimeOptions = () => {
    const options: { hour: number; minute: number; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        const hour12 = h % 12 || 12;
        const ampm = h < 12 ? 'AM' : 'PM';
        const label = `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
        options.push({ hour: h, minute: m, label });
      }
    }
    return options;
  };

  const setDateKeepingTime = (newDate: Date) => {
    const updated = new Date(newDate);
    updated.setHours(editDate.getHours(), editDate.getMinutes(), 0, 0);
    setEditDate(updated);
  };

  const setTimeKeepingDate = (hour: number, minute: number) => {
    const updated = new Date(editDate);
    updated.setHours(hour, minute, 0, 0);
    setEditDate(updated);
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
                  <Pressable key={entry.id} style={styles.modalEntryCard} onPress={() => handleEditEntry(entry)}>
                    <View style={styles.modalEntryHeader}>
                      <Text style={styles.modalEntryEmoji}>
                        {entry.wasCrying ? (entry.intensity ? CRY_INTENSITY_EMOJIS[entry.intensity as CryIntensity] : '😢') : '😊'}
                      </Text>
                      <Text style={styles.modalEntryTime}>
                        {new Date(entry.createdAt).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Pressable onPress={() => handleEditEntry(entry)} style={styles.editButton}>
                        <Pencil color="#8B5CF6" size={16} />
                      </Pressable>
                    </View>
                    {entry.wasCrying && entry.intensity && (
                      <View style={styles.intensityBadge}>
                        <Text style={styles.intensityBadgeText}>{CRY_INTENSITY_LABELS[entry.intensity as CryIntensity]}</Text>
                      </View>
                    )}
                    <Text style={styles.modalEntryContent}>{entry.content}</Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Edit Entry Modal */}
      <Modal
        visible={editingEntry !== null}
        transparent
        animationType="slide"
        onRequestClose={handleCancelEdit}
      >
        <Pressable style={styles.editModalOverlay} onPress={handleCancelEdit}>
          <Pressable style={styles.editModalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit Entry</Text>
              <Pressable onPress={handleCancelEdit} style={styles.closeButton}>
                <X color="#64748B" size={20} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Date/Time Row */}
              <View style={styles.editDateTimeRow}>
                <Pressable
                  onPress={() => setShowEditDatePicker(true)}
                  style={styles.editDateTimeButton}
                >
                  <CalendarIcon color="#64748B" size={16} />
                  <Text style={styles.editDateTimeText}>
                    {editDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowEditTimePicker(true)}
                  style={styles.editDateTimeButton}
                >
                  <Clock color="#64748B" size={16} />
                  <Text style={styles.editDateTimeText}>
                    {editDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </Pressable>
              </View>

              {/* Crying Toggle */}
              <View style={styles.editCryingRow}>
                <Text style={styles.editLabel}>Status:</Text>
                <Pressable
                  onPress={() => setEditWasCrying(!editWasCrying)}
                  style={[styles.editCryingToggle, editWasCrying && styles.editCryingToggleActive]}
                >
                  <Text style={styles.editCryingToggleText}>
                    {editWasCrying ? '😢 Was crying' : '😊 Not crying'}
                  </Text>
                </Pressable>
              </View>

              {/* Intensity Selector (only when crying) */}
              {editWasCrying && (
                <View style={styles.editIntensityRow}>
                  {([1, 2, 3, 4] as CryIntensity[]).map((level) => (
                    <Pressable
                      key={level}
                      onPress={() => setEditIntensity(level)}
                      style={[styles.editIntensityButton, editIntensity === level && styles.editIntensityButtonActive]}
                    >
                      <Text style={styles.editIntensityEmoji}>{CRY_INTENSITY_EMOJIS[level]}</Text>
                      <Text style={[styles.editIntensityLabel, editIntensity === level && styles.editIntensityLabelActive]} numberOfLines={1}>
                        {CRY_INTENSITY_LABELS[level]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Content Input */}
              <TextInput
                style={styles.editInput}
                placeholder="What happened?"
                placeholderTextColor="#94A3B8"
                value={editContent}
                onChangeText={setEditContent}
                multiline
                maxLength={500}
              />

              {/* Action Buttons */}
              <View style={styles.editActionRow}>
                <Pressable onPress={handleCancelEdit} style={styles.editCancelButton}>
                  <Text style={styles.editCancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSaveEdit} style={styles.editSaveButton}>
                  <Text style={styles.editSaveButtonText}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showEditDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditDatePicker(false)}
      >
        <Pressable style={styles.pickerModalOverlay} onPress={() => setShowEditDatePicker(false)}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Date</Text>
            <ScrollView style={styles.pickerOptionsList} showsVerticalScrollIndicator={false}>
              {generateDateOptions().map((date, index) => {
                const isSelected = date.toDateString() === editDate.toDateString();
                const dateIsToday = date.toDateString() === new Date().toDateString();
                return (
                  <Pressable
                    key={index}
                    style={[styles.pickerOptionItem, isSelected && styles.pickerOptionItemSelected]}
                    onPress={() => {
                      setDateKeepingTime(date);
                      setShowEditDatePicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                      {dateIsToday ? 'Today' : date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showEditTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditTimePicker(false)}
      >
        <Pressable style={styles.pickerModalOverlay} onPress={() => setShowEditTimePicker(false)}>
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Time</Text>
            <ScrollView style={styles.pickerOptionsList} showsVerticalScrollIndicator={false}>
              {generateTimeOptions().map((time, index) => {
                const isSelected =
                  editDate.getHours() === time.hour &&
                  Math.floor(editDate.getMinutes() / 15) * 15 === time.minute;
                return (
                  <Pressable
                    key={index}
                    style={[styles.pickerOptionItem, isSelected && styles.pickerOptionItemSelected]}
                    onPress={() => {
                      setTimeKeepingDate(time.hour, time.minute);
                      setShowEditTimePicker(false);
                    }}
                  >
                    <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextSelected]}>
                      {time.label}
                    </Text>
                  </Pressable>
                );
              })}
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
  editButton: {
    marginLeft: 'auto',
    padding: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
  },
  intensityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  intensityBadgeText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500' as const,
  },
  // Edit Modal Styles
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E293B',
  },
  editDateTimeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  editDateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editDateTimeText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500' as const,
  },
  editCryingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  editCryingToggle: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  editCryingToggleActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  editCryingToggleText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#475569',
  },
  editIntensityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  editIntensityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editIntensityButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  editIntensityEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  editIntensityLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  editIntensityLabelActive: {
    color: '#DC2626',
    fontWeight: '600' as const,
  },
  editInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  editCancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#64748B',
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
  },
  editSaveButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  // Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    maxHeight: 400,
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOptionsList: {
    maxHeight: 300,
  },
  pickerOptionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  pickerOptionItemSelected: {
    backgroundColor: '#EDE9FE',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
  },
  pickerOptionTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
});
