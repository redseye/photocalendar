// Android home-screen widgets (react-native-android-widget).
// The library renders this JSX to a bitmap at the widget's reported size (dp).
import { Image, type ImageRequireSource } from 'react-native';
import {
  FlexWidget,
  ImageWidget,
  requestWidgetUpdate,
  TextWidget,
  type WidgetInfo,
  type WidgetTaskHandler,
} from 'react-native-android-widget';
import { colors } from './colors';
import { formatShort, fromKey, realTodayKey, WEEKDAYS } from './dates';
import { updateIosWidget } from './iosWidget';
import { photoFor } from './photo';
import { loadNote } from './storage';

// Must match the widget names in app.json (react-native-android-widget plugin).
const WIDGET_NAMES = ['Photo2x2', 'Photo4x4', 'Photo4x2'];
const WIDE_WIDGET = 'Photo4x2';
const LARGE_WIDGET = 'Photo4x4';

const PADDING = 8;
const LABEL_HEIGHT = 20;

interface WidgetData {
  dateKey: string;
  note: string;
}

interface Size {
  width: number;
  height: number;
}

async function loadWidgetData(): Promise<WidgetData> {
  const dateKey = realTodayKey();
  return { dateKey, note: await loadNote(dateKey) };
}

// Largest size that keeps the photo's own aspect ratio and fits in the box.
// ImageWidget scales the bitmap to exactly imageWidth x imageHeight, so this
// is what prevents distortion; it also keeps the bitmap no larger than shown.
function fitPhoto(photo: ImageRequireSource, box: Size): Size {
  const source = Image.resolveAssetSource(photo);
  const width = source?.width ?? 1;
  const height = source?.height ?? 1;
  const scale = Math.min(box.width / width, box.height / height);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

function Photo({ dateKey, box }: { dateKey: string; box: Size }) {
  const photo = photoFor(dateKey);
  if (photo == null) {
    return (
      <FlexWidget
        style={{
          width: box.width,
          height: box.height,
          backgroundColor: colors.placeholder,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget text="這天沒有圖片" style={{ fontSize: 12, color: colors.muted }} />
      </FlexWidget>
    );
  }
  const size = fitPhoto(photo, box);
  return (
    <ImageWidget
      image={photo}
      imageWidth={size.width}
      imageHeight={size.height}
      radius={8}
      style={{ width: size.width, height: size.height }}
    />
  );
}

// 2x2: photo with a small date label underneath.
function SquareWidget({ data, width, height }: { data: WidgetData } & Size) {
  const box = {
    width: width - PADDING * 2,
    height: height - PADDING * 2 - LABEL_HEIGHT,
  };
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        padding: PADDING,
        backgroundColor: colors.surface,
        borderRadius: 16,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Photo dateKey={data.dateKey} box={box} />
      <TextWidget
        text={formatShort(data.dateKey)}
        allowFontScaling={false}
        style={{ fontSize: 12, color: colors.text, marginTop: 4 }}
      />
    </FlexWidget>
  );
}

// 4x2: photo on the left, date and note excerpt on the right.
function WideWidget({ data, width, height }: { data: WidgetData } & Size) {
  const innerHeight = height - PADDING * 2;
  const box = {
    width: Math.min(innerHeight, Math.floor((width - PADDING * 2) * 0.45)),
    height: innerHeight,
  };
  const date = fromKey(data.dateKey);
  // Header (date + weekday) takes about 50dp; each note line about 18dp.
  const noteLines = Math.max(1, Math.floor((innerHeight - 50) / 18));
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        padding: PADDING,
        backgroundColor: colors.surface,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Photo dateKey={data.dateKey} box={box} />
      <FlexWidget
        style={{
          flex: 1,
          height: 'match_parent',
          marginLeft: 12,
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={`${date.getMonth() + 1}月${date.getDate()}日`}
          allowFontScaling={false}
          style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}
        />
        <TextWidget
          text={`${date.getFullYear()} 星期${WEEKDAYS[date.getDay()]}`}
          allowFontScaling={false}
          style={{ fontSize: 12, color: colors.muted }}
        />
        <TextWidget
          text={data.note.trim() === '' ? '（還沒有筆記）' : data.note.trim()}
          maxLines={noteLines}
          truncate="END"
          allowFontScaling={false}
          style={{ fontSize: 13, color: data.note.trim() === '' ? colors.muted : colors.text, marginTop: 6 }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

// 4x4 (resizable): photo on top, date and note excerpt underneath.
function LargeWidget({ data, width, height }: { data: WidgetData } & Size) {
  const innerWidth = width - PADDING * 2;
  const innerHeight = height - PADDING * 2;
  // The note area grows with the widget when the user resizes it.
  const noteArea = Math.max(64, Math.floor(innerHeight * 0.28));
  const box = { width: innerWidth, height: innerHeight - noteArea };
  const photo = photoFor(data.dateKey);
  // Line the text up with the photo's edges rather than the widget's.
  const textWidth = photo == null ? box.width : fitPhoto(photo, box).width;
  // Date line takes about 24dp; each note line about 18dp.
  const noteLines = Math.max(1, Math.floor((noteArea - 30) / 18));
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: 'match_parent',
        height: 'match_parent',
        padding: PADDING,
        backgroundColor: colors.surface,
        borderRadius: 16,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Photo dateKey={data.dateKey} box={box} />
      <FlexWidget
        style={{
          width: textWidth,
          height: noteArea,
          paddingTop: 6,
          flexDirection: 'column',
        }}
      >
        <TextWidget
          text={formatShort(data.dateKey)}
          allowFontScaling={false}
          style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}
        />
        <TextWidget
          text={data.note.trim() === '' ? '（還沒有筆記）' : data.note.trim()}
          maxLines={noteLines}
          truncate="END"
          allowFontScaling={false}
          style={{ fontSize: 13, color: data.note.trim() === '' ? colors.muted : colors.text, marginTop: 4 }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

function renderPhotoWidget(info: WidgetInfo, data: WidgetData) {
  const Layout =
    info.widgetName === WIDE_WIDGET
      ? WideWidget
      : info.widgetName === LARGE_WIDGET
        ? LargeWidget
        : SquareWidget;
  return <Layout data={data} width={info.width} height={info.height} />;
}

export const widgetTaskHandler: WidgetTaskHandler = async ({
  widgetInfo,
  widgetAction,
  renderWidget,
}) => {
  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE': // includes the periodic updatePeriodMillis update
    case 'WIDGET_RESIZED':
      renderWidget(renderPhotoWidget(widgetInfo, await loadWidgetData()));
      break;
    default:
      // WIDGET_DELETED needs no work; taps use OPEN_APP, handled natively.
      break;
  }
};

// Redraws every placed widget. Called from the app on note save
// and app foreground.
export async function updateAllWidgets(): Promise<void> {
  const data = await loadWidgetData();
  await Promise.all(
    WIDGET_NAMES.map((widgetName) =>
      requestWidgetUpdate({
        widgetName,
        renderWidget: (info) => renderPhotoWidget(info, data),
      })
    )
  );
  // Refills the iOS widget's timeline; a no-op on Android, where the above does the work.
  await updateIosWidget();
}
