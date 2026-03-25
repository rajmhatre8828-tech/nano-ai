import type { TriggerRef } from '@rn-primitives/select';
import { MoonStar, Sun } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRef } from 'react';
import { View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';

import { SettingSection } from '../setting-section';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import { Select, SelectContent, SelectItem, SelectTrigger } from '../ui/select';
import { Switch } from '../ui/switch';
import { Text } from '../ui/text';

export function System() {
  const ref = useRef<TriggerRef>(null);
  const { colorScheme, setColorScheme } = useColorScheme();
  const [settings, setSettings] = useSettings();
  const { hapticFeedback, tokensUsage = 0 } = settings;

  return (
    <SettingSection title="System">
      <View className="flex flex-row items-center">
        <Text className="flex-1 font-medium">Appearance</Text>
        <Select
          value={{ label: '', value: colorScheme || 'light' }}
          onValueChange={opt => {
            setColorScheme(opt?.value as 'light' | 'dark' | 'system');
          }}>
          <SelectTrigger ref={ref} className="w-[40px] border-0 bg-transparent p-0 shadow-none dark:bg-transparent" showIcon={false}>
            <Button
              size="icon"
              variant="ghost"
              className="ml-1"
              onPress={() => {
                ref.current?.open();
              }}>
              <Icon as={colorScheme === 'light' ? Sun : MoonStar} />
            </Button>
          </SelectTrigger>
          <SelectContent insets={{ right: 16 }} className="w-[100px]" side="bottom">
            <SelectItem label="Light" value="light" />
            <SelectItem label="Dark" value="dark" />
            <SelectItem label="System" value="system" showCheck={false} />
          </SelectContent>
        </Select>
      </View>
      <View className="flex flex-row items-center">
        <Text className="flex-1 font-medium">Haptic Feedback</Text>
        <Switch
          checked={hapticFeedback}
          onCheckedChange={value => {
            setSettings(settings => {
              settings.hapticFeedback = value;
            });
          }}
        />
      </View>
      <View className="mt-1 flex flex-row items-center">
        <Text className="flex-1 font-medium">Tokens Usage</Text>
        <Text className="text-muted-foreground">{tokensUsage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</Text>
      </View>
    </SettingSection>
  );
}
