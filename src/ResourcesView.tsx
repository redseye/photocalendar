// Related resources (WBS 8): one card per link in resources.ts, opened in the
// system browser.
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MENU_BUTTON_SIZE, MenuButton } from './Menu';
import { RESOURCES, type Resource } from './resources';
import { useInsets } from './safeArea';
import { fontSize, palette, radius, serif, shadow, space } from './theme';
import { showToast } from './toast';

function openResource({ url }: Resource) {
  if (url === '') {
    showToast('連結尚未提供', 'short');
    return;
  }
  // Rejects when no app on the device can open the address.
  Linking.openURL(url).catch(() => showToast('無法開啟連結', 'long'));
}

export function ResourcesView({ onOpenMenu }: { onOpenMenu: () => void }) {
  const insets = useInsets();
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <MenuButton onPress={onOpenMenu} />
        <Text style={styles.title}>相關資源</Text>
        {/* Balances the menu button, so the title stays centred. */}
        <View style={styles.menuSpace} />
      </View>

      <ScrollView contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 16 }]}>
        {RESOURCES.map((resource) => (
          <Pressable
            key={resource.title}
            onPress={() => openResource(resource)}
            accessibilityRole="link"
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          >
            <View style={[styles.icon, { backgroundColor: resource.color }]}>
              <Text style={styles.iconText}>{resource.icon}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{resource.title}</Text>
              <Text style={styles.description}>{resource.description}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  menuSpace: {
    width: MENU_BUTTON_SIZE,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: serif,
    fontSize: fontSize.title,
    color: palette.heading,
  },
  list: {
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
  },
  card: {
    ...shadow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
  },
  pressed: {
    backgroundColor: palette.sunken,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  cardTitle: {
    fontFamily: serif,
    fontSize: fontSize.heading,
    color: palette.heading,
  },
  description: {
    marginTop: space.xs,
    fontSize: fontSize.caption,
    color: palette.muted,
  },
  chevron: {
    fontSize: fontSize.title,
    color: palette.muted,
  },
});
