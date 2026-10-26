// The one photo lookup shared by the day page, the month grid and the widgets.
import type { ImageRequireSource } from 'react-native';
import { photos } from './photos.generated';

// From this date on, a day without its own photo shows FALLBACK_PHOTO instead.
// Fixed on purpose, so the rule doesn't move as days pass.
const FALLBACK_START = '20261024';
const FALLBACK_PHOTO = '20261101';

// The day's own photo, else the fallback (dates from FALLBACK_START on), else none.
// Keys are 'YYYYMMDD', so string comparison is date order.
export function photoFor(dateKey: string): ImageRequireSource | undefined {
  if (photos[dateKey] != null) return photos[dateKey];
  return dateKey >= FALLBACK_START ? photos[FALLBACK_PHOTO] : undefined;
}
