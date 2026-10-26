// iOS home-screen widget (expo-widgets). WidgetKit only shows what the app hands
// it, so each refresh fills a timeline with the coming days: one entry per local
// midnight, each with that day's photo, date and note.
import { Asset } from 'expo-asset';
import { Directory, File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { widgetsDirectory, type WidgetTimelineEntry } from 'expo-widgets';
import type { ImageRequireSource } from 'react-native';
import { addDays, formatShort, fromKey, toKey, WEEKDAYS } from './dates';
import PhotoWidget, { type PhotoWidgetProps } from './iosWidgetLayout.ios';
import { photoFor } from './photo';
import { loadNote, loadSimulatedToday } from './storage';

// How many days the timeline covers; the app refills it every time it runs.
const TIMELINE_DAYS = 14;

// The widget's copies of the photos: longest edge in pixels and JPEG quality.
// Full-size photos are over WidgetKit's image size limit and the widget stays blank.
const PHOTO_MAX_EDGE = 600;
const PHOTO_QUALITY = 0.85;

// Whether the timeline shows this date, i.e. whether its note is on the widget.
export function iosWidgetShowsDate(dateKey: string, effectiveToday: string): boolean {
  return dateKey >= effectiveToday && dateKey < addDays(effectiveToday, TIMELINE_DAYS);
}

// The widget can't read the app's own files, so photos are scaled down into the
// shared widgets directory. The name carries the content hash and the scaling,
// so a photo replaced in dayphoto/, or new scaling values, give a fresh copy.
async function sharePhoto(photo: ImageRequireSource, dir: Directory): Promise<File> {
  const asset = await Asset.fromModule(photo).downloadAsync();
  const scaling = `${PHOTO_MAX_EDGE}q${Math.round(PHOTO_QUALITY * 100)}`;
  const shared = new File(dir, `${asset.name}-${asset.hash}-${scaling}.jpg`);
  if (!shared.exists) {
    // Decoded to fit within the bounds, keeping its aspect ratio; a smaller photo keeps its size.
    const image = await ImageManipulator.manipulate(asset.localUri ?? asset.uri, {
      maxWidth: PHOTO_MAX_EDGE,
      maxHeight: PHOTO_MAX_EDGE,
    }).renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: PHOTO_QUALITY });
    await new File(saved.uri).move(shared);
  }
  return shared;
}

async function refresh(): Promise<void> {
  // The clock is read once, so a refresh running over midnight stays consistent.
  const now = new Date();
  const realToday = toKey(now);
  const today = (await loadSimulatedToday()) ?? realToday;
  const dir = new Directory(widgetsDirectory);
  const shared = new Set<string>();
  const entries: WidgetTimelineEntry<PhotoWidgetProps>[] = [];
  for (let i = 0; i < TIMELINE_DAYS; i++) {
    // Day i follows the app's "today", so the simulated date carries over.
    const dateKey = addDays(today, i);
    const photo = photoFor(dateKey);
    const file = photo == null ? null : await sharePhoto(photo, dir);
    if (file != null) shared.add(file.name);
    const date = fromKey(dateKey);
    entries.push({
      // The first entry shows right away, each later one from its local midnight on.
      date: i === 0 ? now : fromKey(addDays(realToday, i)),
      props: {
        imageUri: file?.uri ?? '',
        shortLabel: formatShort(dateKey),
        dayLabel: `${date.getMonth() + 1}月${date.getDate()}日`,
        yearLabel: `${date.getFullYear()} 星期${WEEKDAYS[date.getDay()]}`,
        note: (await loadNote(dateKey)).trim(),
      },
    });
  }
  PhotoWidget.updateTimeline(entries);
  // Only now drop the photos of days that have left the timeline.
  for (const item of dir.list()) {
    if (item instanceof File && !shared.has(item.name)) item.delete();
  }
}

// One refresh at a time, so two runs never copy or delete the same file at once.
let queue: Promise<void> = Promise.resolve();

// Refills the widget timeline. Called along with the Android redraw
// (updateAllWidgets) and after saving a note for a date the timeline shows.
export function updateIosWidget(): Promise<void> {
  // Null when the app has no App Group entitlement; then there is nowhere to put the photos.
  if (!widgetsDirectory) {
    console.warn('[iosWidget] widgetsDirectory is unavailable (App Group not set up)');
    return Promise.resolve();
  }
  // A failed refresh leaves the previous timeline as it was.
  queue = queue.then(refresh).catch((e) => console.warn('[iosWidget]', e));
  return queue;
}
