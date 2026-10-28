import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { AppState, BackHandler, Keyboard, StyleSheet, View } from 'react-native';
import { DayView } from './src/DayView';
import { fromKey, realTodayKey } from './src/dates';
import { MenuPanel, type Page } from './src/Menu';
import { MonthView, type Month } from './src/MonthView';
import { ResourcesView } from './src/ResourcesView';
import { SafeAreaProvider, useInsets } from './src/safeArea';
import { loadSimulatedToday, saveSimulatedToday } from './src/storage';
import { palette } from './src/theme';
import { ToastHost } from './src/toast';
import { updateAllWidgets } from './src/widget';
import { YearView } from './src/YearView';

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
  const [view, setView] = useState<Page>('day');
  const [selected, setSelected] = useState(realToday);
  const [month, setMonth] = useState<Month>(() => monthOf(realToday));
  const [year, setYear] = useState(() => monthOf(realToday).year);
  const [menuOpen, setMenuOpen] = useState(false);
  // The pages the year overview and resources page were opened from, plus the
  // year overview when a month is picked there, latest last, for the back key.
  const [history, setHistory] = useState<Page[]>([]);

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

  // Year overview and resources remember where they were opened from; going
  // to the day or month page starts over.
  const show = (next: Page) => {
    if (next === 'year' || next === 'resources') {
      const i = history.indexOf(next);
      setHistory(i >= 0 ? history.slice(0, i) : [...history, view]);
    } else {
      setHistory([]);
    }
    setView(next);
  };

  const goBack = () => {
    setView(history[history.length - 1] ?? 'day');
    setHistory(history.slice(0, -1));
  };

  const openMenu = () => {
    // The text box loses focus, which saves it.
    Keyboard.dismiss();
    setMenuOpen(true);
  };

  const selectFromMenu = (page: Page) => {
    setMenuOpen(false);
    if (page === 'day') {
      setSelected(today);
    } else if (page === view) {
      return;
    } else if (page === 'month') {
      setMonth(monthOf(selected));
    } else if (page === 'year') {
      setYear(view === 'month' ? month.year : fromKey(selected).getFullYear());
    }
    show(page);
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (menuOpen) {
        setMenuOpen(false);
        return true;
      }
      if (view === 'day') {
        openMonth();
        return true;
      }
      if (view === 'year' || view === 'resources' || history.length > 0) {
        goBack();
        return true;
      }
      // The month page leaves the app, as before, unless it came from the
      // year overview.
      return false;
    });
    return () => sub.remove();
    // openMonth only reads `selected`, goBack only `history`.
  }, [menuOpen, view, selected, history]);

  const changeSimulatedToday = async (dateKey: string | null) => {
    await saveSimulatedToday(dateKey);
    setSimulatedToday(dateKey);
    await updateAllWidgets();
  };

  let page: ReactNode;
  switch (view) {
    case 'day':
      page = (
        <DayView
          dateKey={selected}
          today={today}
          simulatedToday={simulatedToday}
          onChangeDate={setSelected}
          onOpenMonth={openMonth}
          onOpenMenu={openMenu}
          onSetSimulatedToday={(key) => void changeSimulatedToday(key)}
        />
      );
      break;
    case 'month':
      page = (
        <MonthView
          month={month}
          today={today}
          onChangeMonth={setMonth}
          onSelectDate={(key) => {
            setSelected(key);
            setView('day');
          }}
          onOpenMenu={openMenu}
        />
      );
      break;
    case 'year':
      page = (
        <YearView
          year={year}
          today={today}
          onChangeYear={setYear}
          onSelectMonth={(m) => {
            setMonth(m);
            setHistory([...history, 'year']);
            setView('month');
          }}
          onOpenMenu={openMenu}
        />
      );
      break;
    case 'resources':
      page = <ResourcesView onOpenMenu={openMenu} />;
      break;
  }

  return (
    <SafeAreaProvider>
      <Screen>
        {ready && page}
        {ready && menuOpen && (
          <MenuPanel current={view} onSelect={selectFromMenu} onClose={() => setMenuOpen(false)} />
        )}
        <StatusBar style="dark" />
      </Screen>
      <ToastHost />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
});
