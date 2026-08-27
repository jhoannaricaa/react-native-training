// Plain module: no React, no components. Nothing here can be a refresh boundary,
// which is exactly why it must not reach into a screen file for its constants.
import { THEME } from '@/constants/lab-theme';

console.log('[util] module evaluated');

export function describeCount(count: number) {
  return `${count} taps - accent ${THEME.accent}`;
}
