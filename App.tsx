import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, BackHandler, StyleSheet, View } from 'react-native';
import { colors } from './src/colors';
import { DayView } from './src/DayView';
import { fromKey, realTodayKey } from './src/dates';
import { MonthView, type Month } from './src/MonthView';
import { SafeAreaProvider, useInsets } from './src/safeArea';
import { loadSimulatedToday, saveSimulatedToday } from './src/storage';
import { ToastHost } from './src/toast';
import { updateAllWidgets } from './src/widget';

function monthOf(dateKey: string): Month {
  const d = fromKey(dateKey);
  return { year: d.getFullYear(), month: d.getMonth() };
}

// Keeps the content clear of the status bar (and the notch on iOS).
function Screen({ children }: { children: ReactNode }) {
  const insets = useInsets();
  return <View style={[styles.container, { paddingTop: insets.top }]}>{children}</View>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [realToday, setRealToday] = useState(realTodayKey);
  const [simulatedToday, setSimulatedToday] = useState<string | null>(null);
  const [view, setView] = useState<'day' | 'month'>('day');
  const [selected, setSelected] = useState(realToday);
  const [month, setMonth] = useState<Month>(() => monthOf(realToday));

  // The simulated date (test feature) replaces the real date everywhere.
  const today = simulatedToday ?? realToday;

  useEffect(() => {
    void loadSimulatedToday().then((sim) => {
      setSimulatedToday(sim);
      if (sim != null) setSelected(sim);
      setReady(true);
    });
    void updateAllWidgets();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setRealToday(realTodayKey());
        void updateAllWidgets();
      }
    });
    return () => sub.remove();
  }, []);

  const openMonth = () => {
    setMonth(monthOf(selected));
    setView('month');
  };

  useEffect(() => {
    if (view !== 'day') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      openMonth();
      return true;
    });
    return () => sub.remove();
    // openMonth only reads `selected`.
  }, [view, selected]);

  const changeSimulatedToday = async (dateKey: string | null) => {
    await saveSimulatedToday(dateKey);
    setSimulatedToday(dateKey);
    await updateAllWidgets();
  };

  return (
    <SafeAreaProvider>
      <Screen>
        {ready &&
          (view === 'day' ? (
            <DayView
              dateKey={selected}
              today={today}
              simulatedToday={simulatedToday}
              onChangeDate={setSelected}
              onOpenMonth={openMonth}
              onSetSimulatedToday={(key) => void changeSimulatedToday(key)}
            />
          ) : (
            <MonthView
              month={month}
              today={today}
              onChangeMonth={setMonth}
              onSelectDate={(key) => {
                setSelected(key);
                setView('day');
              }}
            />
          ))}
        <StatusBar style="dark" />
      </Screen>
      <ToastHost />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
