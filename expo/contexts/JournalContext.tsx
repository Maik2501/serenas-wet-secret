import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import type { CryingDay, CryIntensity, JournalEntry } from '../types/journal';

// Helper function to get YYYY-MM-DD in local timezone (avoids UTC offset issues)
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const STORAGE_KEY_ENTRIES = 'journal_entries';
const STORAGE_KEY_CRYING = 'crying_days';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const [JournalContext, useJournal] = createContextHook(() => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [cryingDays, setCryingDays] = useState<CryingDay[]>([]);

  const entriesQuery = useQuery({
    queryKey: ['journal_entries'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_ENTRIES);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const cryingQuery = useQuery({
    queryKey: ['crying_days'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_CRYING);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const syncEntriesMutation = useMutation({
    mutationFn: async (newEntries: JournalEntry[]) => {
      await AsyncStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(newEntries));
      return newEntries;
    },
  });

  const syncCryingMutation = useMutation({
    mutationFn: async (newCrying: CryingDay[]) => {
      await AsyncStorage.setItem(STORAGE_KEY_CRYING, JSON.stringify(newCrying));
      return newCrying;
    },
  });

  useEffect(() => {
    if (entriesQuery.data) {
      setEntries(entriesQuery.data);
    }
  }, [entriesQuery.data]);

  useEffect(() => {
    if (cryingQuery.data) {
      setCryingDays(cryingQuery.data);
    }
  }, [cryingQuery.data]);

  useEffect(() => {
    setupNotifications();
    checkAndScheduleReminder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cryingDays]);

  const setupNotifications = async () => {
    if (Platform.OS !== 'web') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Permissions not granted - notifications won't work but app continues
    }
  };

  const checkAndScheduleReminder = async () => {
    if (Platform.OS === 'web') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (cryingDays.length === 0) {
      await scheduleReminder();
      return;
    }

    const lastCry = cryingDays.sort((a, b) => b.timestamp - a.timestamp)[0];
    const timeSinceLastCry = Date.now() - lastCry.timestamp;
    const hoursRemaining = 24 - timeSinceLastCry / (1000 * 60 * 60);

    if (hoursRemaining > 0) {
      await scheduleReminder(hoursRemaining * 60 * 60);
    } else {
      await scheduleReminder(0);
    }
  };

  const scheduleReminder = async (delaySeconds = 24 * 60 * 60) => {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time for tears? 😢",
          body: "It's been 24 hours since your last cry. Everything okay?",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.floor(delaySeconds)),
        },
      });
    } catch {
      // Silent fail - notification scheduling is not critical
    }
  };

  const addEntry = (content: string, wasCrying: boolean, customDate?: Date, intensity?: CryIntensity) => {
    const entryDate = customDate || new Date();
    const newEntry: JournalEntry = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      content,
      createdAt: entryDate.getTime(),
      wasCrying,
      intensity: wasCrying ? intensity : undefined,
    };

    const updated = [newEntry, ...entries].sort((a, b) => b.createdAt - a.createdAt);
    setEntries(updated);
    syncEntriesMutation.mutate(updated);

    if (wasCrying) {
      const dateStr = getLocalDateString(entryDate);
      const existingDay = cryingDays.find(d => d.date === dateStr);

      if (!existingDay) {
        const newCryingDay: CryingDay = {
          date: dateStr,
          timestamp: entryDate.getTime(),
          count: 1,
        };
        const updatedCrying = [newCryingDay, ...cryingDays];
        setCryingDays(updatedCrying);
        syncCryingMutation.mutate(updatedCrying);
      } else {
        const updatedCrying = cryingDays.map(d =>
          d.date === dateStr ? { ...d, timestamp: entryDate.getTime(), count: (d.count || 1) + 1 } : d
        );
        setCryingDays(updatedCrying);
        syncCryingMutation.mutate(updatedCrying);
      }
    }
  };

  const updateEntry = (id: string, content: string, wasCrying: boolean, customDate: Date, intensity?: CryIntensity) => {
    const oldEntry = entries.find(e => e.id === id);
    const updated = entries.map(e =>
      e.id === id ? { ...e, content, wasCrying, createdAt: customDate.getTime(), intensity: wasCrying ? intensity : undefined } : e
    ).sort((a, b) => b.createdAt - a.createdAt);
    setEntries(updated);
    syncEntriesMutation.mutate(updated);

    if (oldEntry) {
      const oldDateStr = getLocalDateString(new Date(oldEntry.createdAt));
      const newDateStr = getLocalDateString(customDate);

      let updatedCrying = [...cryingDays];

      if (oldEntry.wasCrying && oldDateStr !== newDateStr) {
        updatedCrying = updatedCrying.map(d => {
          if (d.date === oldDateStr) {
            return { ...d, count: Math.max(0, (d.count || 1) - 1) };
          }
          return d;
        }).filter(d => d.count > 0);
      }

      if (wasCrying) {
        const existingDay = updatedCrying.find(d => d.date === newDateStr);
        if (!existingDay) {
          updatedCrying.push({ date: newDateStr, timestamp: customDate.getTime(), count: 1 });
        } else if (!oldEntry.wasCrying || oldDateStr !== newDateStr) {
          updatedCrying = updatedCrying.map(d =>
            d.date === newDateStr ? { ...d, count: (d.count || 1) + 1 } : d
          );
        }
      } else if (oldEntry.wasCrying && oldDateStr === newDateStr) {
        updatedCrying = updatedCrying.map(d => {
          if (d.date === oldDateStr) {
            return { ...d, count: Math.max(0, (d.count || 1) - 1) };
          }
          return d;
        }).filter(d => d.count > 0);
      }

      setCryingDays(updatedCrying);
      syncCryingMutation.mutate(updatedCrying);
    }
  };

  const getEntriesForDate = (dateStr: string) => {
    return entries.filter(e => {
      const entryDate = getLocalDateString(new Date(e.createdAt));
      return entryDate === dateStr;
    });
  };

  const deleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    syncEntriesMutation.mutate(updated);
  };

  const getLastCryTime = () => {
    if (cryingDays.length === 0) return null;
    const lastCry = cryingDays.sort((a, b) => b.timestamp - a.timestamp)[0];
    return lastCry.timestamp;
  };

  const getHoursSinceLastCry = () => {
    const lastCry = getLastCryTime();
    if (!lastCry) return null;
    return Math.floor((Date.now() - lastCry) / (1000 * 60 * 60));
  };

  return {
    entries,
    cryingDays,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesForDate,
    getLastCryTime,
    getHoursSinceLastCry,
    isLoading: entriesQuery.isLoading || cryingQuery.isLoading,
  };
});
