// The iOS home-screen widget lives in iosWidget.ios.ts. Android draws its own
// widgets (widget.tsx), so on other platforms there is nothing to do here.

export function iosWidgetShowsDate(_dateKey: string, _effectiveToday: string): boolean {
  return false;
}

export async function updateIosWidget(): Promise<void> {}
