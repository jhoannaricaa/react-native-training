import { useState } from 'react';

import { ScrollView, useColorScheme, View } from 'react-native';

import { AppButton } from '@/components/pressables/app-button';
import { LabSection, labStyles } from '@/components/pressables/lab-section';
import { PressLatencyProbe } from '@/components/pressables/press-latency-probe';
import { USES_RIPPLE } from '@/components/pressables/press-tokens';
import { TouchableAppButton } from '@/components/pressables/touchable-app-button';
import { usePressCounter } from '@/components/pressables/use-press-counter';
import { ThemedText } from '@/components/themed-text';
import { adaptiveColor } from '@/constants/adaptive-colors';

export function PressKit() {
  const scheme = useColorScheme() ?? 'light';
  const { counts, bump } = usePressCounter();
  const [loading, setLoading] = useState(false);

  const tally = (key: string) => counts[key] ?? 0;

  return (
    <ScrollView
      style={{ backgroundColor: adaptiveColor('screen', scheme) }}
      contentContainerStyle={labStyles.page}>
      <LabSection
        title="Variants"
        note={
          USES_RIPPLE
            ? 'Android: ripple, drawn in the foreground so the fill cannot hide it.'
            : 'iOS / web: opacity drops to 0.6 on press. No ripple prop is applied here.'
        }>
        <View style={labStyles.row}>
          <AppButton testID="btn-primary" label="Save" onPress={() => bump('primary')} />
          <AppButton
            testID="btn-secondary"
            label="Cancel"
            variant="secondary"
            onPress={() => bump('secondary')}
          />
          <AppButton
            testID="btn-danger"
            label="Delete"
            variant="danger"
            onPress={() => bump('danger')}
          />
        </View>
        <ThemedText testID="tally-variants" variant="meta" tone="muted">
          primary {tally('primary')} · secondary {tally('secondary')} · danger {tally('danger')}
        </ThemedText>
      </LabSection>

      <LabSection
        title="Blocked states"
        note="Both tallies must stay at 0 no matter how hard you tap. Disabled announces disabled; loading announces disabled *and* busy.">
        <View style={labStyles.row}>
          <AppButton
            testID="btn-disabled"
            label="Disabled"
            disabled
            onPress={() => bump('disabled')}
          />
          <AppButton testID="btn-loading" label="Loading" loading onPress={() => bump('loading')} />
        </View>
        <ThemedText testID="tally-blocked" variant="meta" tone="muted">
          disabled {tally('disabled')} · loading {tally('loading')}
        </ThemedText>

        <View style={labStyles.row}>
          <AppButton
            testID="btn-toggle-loading"
            label={loading ? 'Stop loading' : 'Start loading'}
            variant="secondary"
            onPress={() => setLoading((on) => !on)}
          />
          {/* Same label either way, so the width jump — or lack of one — is visible. */}
          <AppButton
            testID="btn-submit"
            label="Submit report"
            loading={loading}
            onPress={() => bump('submit')}
          />
        </View>
        <ThemedText testID="tally-submit" variant="meta" tone="muted">
          submit {tally('submit')}
        </ThemedText>
      </LabSection>

      <LabSection
        title="Press latency"
        note="Measured, not quoted: raw onTouchStart to onPressIn. The delay is on the visual only — onPress still fires on release either way.">
        <PressLatencyProbe
          testID="latency-instant"
          render={(onPressIn) => (
            <AppButton
              testID="btn-delay-0"
              label="pressDelay 0"
              onPressIn={onPressIn}
              onPress={() => bump('delay0')}
            />
          )}
        />
        <PressLatencyProbe
          testID="latency-delayed"
          render={(onPressIn) => (
            <AppButton
              testID="btn-delay-90"
              label="pressDelay 90"
              variant="secondary"
              pressDelay={90}
              onPressIn={onPressIn}
              onPress={() => bump('delay90')}
            />
          )}
        />
        <ThemedText variant="meta" tone="muted">
          This screen is a ScrollView, which is the only place the 90ms build earns its keep: a 0ms
          highlight flashes on every scroll that starts on a button.
        </ThemedText>
      </LabSection>

      <LabSection
        title="Stretch: the same button on TouchableOpacity"
        note="Identical accessibility, identical layout. No ripple on Android, and no pressed state to style beyond a whole-subtree fade.">
        <View style={labStyles.row}>
          <AppButton testID="btn-pressable-build" label="Pressable" onPress={() => bump('press')} />
          <TouchableAppButton
            testID="btn-touchable-build"
            label="Touchable"
            onPress={() => bump('touch')}
          />
        </View>
        <ThemedText testID="tally-builds" variant="meta" tone="muted">
          pressable {tally('press')} · touchable {tally('touch')}
        </ThemedText>
      </LabSection>
    </ScrollView>
  );
}
