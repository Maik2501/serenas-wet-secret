import { useJournal } from '@/contexts/JournalContext';
import { CryIntensity, CRY_INTENSITY_LABELS, CRY_INTENSITY_EMOJIS } from '@/types/journal';
import * as Haptics from 'expo-haptics';
import { BookOpen, Calendar, Clock, Mic, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { entries, addEntry, deleteEntry, getHoursSinceLastCry, isLoading } = useJournal();
  const [entryText, setEntryText] = useState<string>('');
  const [wasCrying, setWasCrying] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [intensity, setIntensity] = useState<CryIntensity>(2);

  const handleVoiceInput = useCallback(() => {
    if (Platform.OS === 'web') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        Alert.alert('Not supported', 'Speech recognition is not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Voice recognition started');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setEntryText(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        Alert.alert('Error', 'Failed to recognize speech');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      Alert.alert('Not available', 'Speech-to-text requires iPhone\'s native functionality. Please use the dictation button on your keyboard.');
    }
  }, []);

  const handleAddEntry = useCallback(() => {
    if (!entryText.trim()) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    addEntry(entryText.trim(), wasCrying, selectedDate, wasCrying ? intensity : undefined);
    setEntryText('');
    setWasCrying(false);
    setIntensity(2);
    setSelectedDate(new Date());
  }, [entryText, wasCrying, selectedDate, addEntry, intensity]);

  const handleDelete = useCallback((id: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this entry?')) {
        deleteEntry(id);
      }
    } else {
      Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              deleteEntry(id);
            },
          },
        ]
      );
    }
  }, [deleteEntry]);

  const generateDateOptions = () => {
    const options: Date[] = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
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
    updated.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    setSelectedDate(updated);
  };

  const setTimeKeepingDate = (hour: number, minute: number) => {
    const updated = new Date(selectedDate);
    updated.setHours(hour, minute, 0, 0);
    setSelectedDate(updated);
  };

  const hoursSinceLastCry = getHoursSinceLastCry();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <BookOpen color="#8B5CF6" size={28} />
        <Text style={styles.headerTitle}>Journal</Text>
      </View>

      <View style={styles.fixedContent}>
        {hoursSinceLastCry !== null && (
          <View style={styles.statsCard}>
            <Text style={styles.statsEmoji}>😌</Text>
            <Text style={styles.statsText}>
              {hoursSinceLastCry}h since last cry
            </Text>
            {hoursSinceLastCry >= 24 && (
              <Text style={styles.statsSubtext}>What a streak! 🎉</Text>
            )}
          </View>
        )}

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>How are you feeling?</Text>
              <Pressable
                onPress={() => setWasCrying(!wasCrying)}
                style={[styles.cryingToggle, wasCrying && styles.cryingToggleActive]}
              >
                <Text style={styles.cryingToggleText}>
                  {wasCrying ? '😢 Was crying' : '😊 Not crying'}
                </Text>
              </Pressable>
            </View>

            {wasCrying && (
              <View style={styles.intensityRow}>
                {([1, 2, 3, 4] as CryIntensity[]).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => setIntensity(level)}
                    style={[styles.intensityButton, intensity === level && styles.intensityButtonActive]}
                  >
                    <Text style={styles.intensityEmoji}>{CRY_INTENSITY_EMOJIS[level]}</Text>
                    <Text style={[styles.intensityLabel, intensity === level && styles.intensityLabelActive]} numberOfLines={1}>
                      {CRY_INTENSITY_LABELS[level]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.dateTimeRow}>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={styles.dateTimeButton}
              >
                <Calendar color="#64748B" size={16} />
                <Text style={styles.dateTimeText}>
                  {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowTimePicker(true)}
                style={styles.dateTimeButton}
              >
                <Clock color="#64748B" size={16} />
                <Text style={styles.dateTimeText}>
                  {selectedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedDate(new Date())}
                style={styles.nowButton}
              >
                <Text style={styles.nowButtonText}>Now</Text>
              </Pressable>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Type or speak your thoughts..."
                placeholderTextColor="#94A3B8"
                value={entryText}
                onChangeText={setEntryText}
                multiline
                maxLength={500}
                blurOnSubmit={true}
                returnKeyType="done"
              />
            </View>

            <View style={styles.actionRow}>
              {Platform.OS === 'web' && (
                <Pressable
                  onPress={handleVoiceInput}
                  style={[styles.micButton, isListening && styles.micButtonActive]}
                  disabled={isListening}
                >
                  <Mic color={isListening ? '#EF4444' : '#8B5CF6'} size={20} />
                  <Text style={[styles.micButtonText, isListening && styles.micButtonTextActive]}>
                    {isListening ? 'Listening...' : 'Speak'}
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={handleAddEntry}
                style={[styles.addButton, !entryText.trim() && styles.addButtonDisabled]}
                disabled={!entryText.trim()}
              >
                <Text style={styles.addButtonText}>Add Entry</Text>
              </Pressable>
            </View>
          </View>
        </TouchableWithoutFeedback>

        <Text style={styles.sectionTitle}>Recent Entries</Text>
      </View>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📝</Text>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>Start journaling your emotions</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
              <View style={styles.entryHeaderLeft}>
                <Text style={styles.entryEmoji}>{item.wasCrying ? (item.intensity ? CRY_INTENSITY_EMOJIS[item.intensity] : '😢') : '😊'}</Text>
                <View>
                  <Text style={styles.entryDate}>
                    {new Date(item.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.entryTime}>
                    {new Date(item.createdAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleDelete(item.id)}
                style={styles.deleteButton}
              >
                <Trash2 color="#EF4444" size={18} />
              </Pressable>
            </View>
            {item.wasCrying && item.intensity && (
              <View style={styles.entryIntensityBadge}>
                <Text style={styles.entryIntensityText}>{CRY_INTENSITY_LABELS[item.intensity]}</Text>
              </View>
            )}
            <Text style={styles.entryContent}>{item.content}</Text>
          </View>
        )}
      />

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {generateDateOptions().map((date, index) => {
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const dateIsToday = date.toDateString() === new Date().toDateString();
                return (
                  <Pressable
                    key={index}
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => {
                      setDateKeepingTime(date);
                      setShowDatePicker(false);
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
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

      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimePicker(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {generateTimeOptions().map((time, index) => {
                const isSelected = 
                  selectedDate.getHours() === time.hour && 
                  Math.floor(selectedDate.getMinutes() / 15) * 15 === time.minute;
                return (
                  <Pressable
                    key={index}
                    style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                    onPress={() => {
                      setTimeKeepingDate(time.hour, time.minute);
                      setShowTimePicker(false);
                    }}
                  >
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
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
  fixedContent: {
    paddingHorizontal: 20,
  },
  statsCard: {
    backgroundColor: '#F1F5F9',
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statsEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#475569',
  },
  statsSubtext: {
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 4,
    fontWeight: '500' as const,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  cryingToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cryingToggleActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  cryingToggleText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#475569',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateTimeText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500' as const,
  },
  nowButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    marginLeft: 'auto' as const,
  },
  nowButtonText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
  inputRow: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  micButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  micButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8B5CF6',
  },
  micButtonTextActive: {
    color: '#EF4444',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#64748B',
    marginTop: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#475569',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryEmoji: {
    fontSize: 24,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E293B',
  },
  entryTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  entryContent: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  intensityButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  intensityButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  intensityEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  intensityLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  intensityLabelActive: {
    color: '#DC2626',
    fontWeight: '600' as const,
  },
  entryIntensityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  entryIntensityText: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500' as const,
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
    maxWidth: 340,
    maxHeight: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionItemSelected: {
    backgroundColor: '#EDE9FE',
  },
  optionText: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600' as const,
  },
});
