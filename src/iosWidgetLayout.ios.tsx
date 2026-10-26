// iOS home-screen widget layout (expo-widgets), the counterpart of the Android
// widgets in widget.tsx. The 'widget' function is turned into a string at build
// time and runs inside the widget extension on its own: it can only use
// @expo/ui/swift-ui and its props, not even the other constants in this file.
// Keep this file free of other imports: app.json's initialLayout bundles it at
// build time with every package stubbed out.
import { HStack, Image, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import {
  aspectRatio,
  background,
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  resizable,
  shapes,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

// Strings only: the timeline is kept in UserDefaults, which can't hold null.
export interface PhotoWidgetProps {
  imageUri: string; // file:// URI in widgetsDirectory, '' when the day has no photo
  shortLabel: string; // e.g. 11/5（四）
  dayLabel: string; // e.g. 11月5日
  yearLabel: string; // e.g. 2026 星期四
  note: string; // trimmed, '' when there is none
}

const PhotoWidgetLayout = (props: PhotoWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  // Same as src/colors.ts.
  const surface = '#FFFDF8';
  const textColor = '#3D352E';
  const muted = '#8A7F73';
  const placeholder = '#EDE7DD';
  const isMedium = environment.widgetFamily === 'systemMedium';

  const root = [
    padding({ all: 8 }),
    frame({ maxWidth: Infinity, maxHeight: Infinity }),
    background(surface),
    containerBackground(surface, 'widget'),
  ];

  const placeholderBox = [
    frame({ maxWidth: Infinity, maxHeight: Infinity }),
    background(placeholder, shapes.roundedRectangle({ cornerRadius: 8 })),
  ];
  // Beside the text (medium) the box is square, as on the Android 4x2 widget.
  if (isMedium) placeholderBox.push(aspectRatio({ ratio: 1, contentMode: 'fit' }));

  // Scaled to fit the space it gets, keeping the photo's own aspect ratio.
  const photo =
    props.imageUri !== '' ? (
      <Image
        uiImage={props.imageUri}
        modifiers={[resizable(), aspectRatio({ contentMode: 'fit' }), clipShape('roundedRectangle', 8)]}
      />
    ) : (
      <ZStack modifiers={placeholderBox}>
        <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>這天沒有圖片</Text>
      </ZStack>
    );

  // Under the photo (large) the note keeps its lines even when shorter, so the
  // photo doesn't change size from day to day.
  const note = (lines: number, gap: number) => (
    <Text
      modifiers={[
        font({ size: 13 }),
        foregroundStyle(props.note === '' ? muted : textColor),
        lineLimit(lines, { reservesSpace: !isMedium }),
        padding({ top: gap }),
      ]}
    >
      {props.note === '' ? '（還沒有筆記）' : props.note}
    </Text>
  );

  // Medium (4x2): photo on the left, date and note excerpt on the right.
  if (isMedium) {
    return (
      <HStack spacing={12} modifiers={root}>
        {photo}
        <VStack
          alignment="leading"
          spacing={0}
          modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'leading' })]}
        >
          <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundStyle(textColor)]}>
            {props.dayLabel}
          </Text>
          <Text modifiers={[font({ size: 12 }), foregroundStyle(muted)]}>{props.yearLabel}</Text>
          {note(5, 6)}
        </VStack>
      </HStack>
    );
  }

  // Large (4x4): photo on top, date and note excerpt underneath.
  if (environment.widgetFamily === 'systemLarge') {
    return (
      <VStack spacing={0} modifiers={root}>
        {photo}
        <VStack
          alignment="leading"
          spacing={0}
          modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ top: 6 })]}
        >
          <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(textColor)]}>
            {props.shortLabel}
          </Text>
          {note(3, 4)}
        </VStack>
      </VStack>
    );
  }

  // Small (2x2): photo with a small date label underneath.
  return (
    <VStack spacing={4} modifiers={root}>
      {photo}
      <Text modifiers={[font({ size: 12 }), foregroundStyle(textColor)]}>{props.shortLabel}</Text>
    </VStack>
  );
};

// The name must match the widget in app.json (expo-widgets plugin).
export default createWidget<PhotoWidgetProps>('PhotoWidget', PhotoWidgetLayout, {
  imageUri: '',
  shortLabel: '',
  dayLabel: '',
  yearLabel: '',
  note: '',
});
