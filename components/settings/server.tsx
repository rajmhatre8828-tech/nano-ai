import { fetch } from 'expo/fetch';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { Image, type ImageURISource, Pressable, View } from 'react-native';

import { useSettings } from '@/hooks/use-settings';
import { useToast } from '@/hooks/use-toast';
import { AIProviderEnum, AIRegistry, chat } from '@/lib/ai';

import { SelectInput } from '../select-input';
import { SettingSection } from '../setting-section';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { Text } from '../ui/text';

const providerIcon: Record<AIProviderEnum, { light: ImageURISource; dark: ImageURISource }> = {
  [AIProviderEnum.OLLAMA]: {
    light: require('@/assets/providers/ollama.png'),
    dark: require('@/assets/providers/ollama-dark.png')
  },
  [AIProviderEnum.OPENAI]: {
    light: require('@/assets/providers/openai.png'),
    dark: require('@/assets/providers/openai-dark.png')
  },
  [AIProviderEnum.ANTHROPIC]: {
    light: require('@/assets/providers/anthropic.png'),
    dark: require('@/assets/providers/anthropic-dark.png')
  },
  [AIProviderEnum.GOOGLE]: {
    light: require('@/assets/providers/gemini.png'),
    dark: require('@/assets/providers/gemini-dark.png')
  },
  [AIProviderEnum.CUSTOM]: {
    light: require('@/assets/providers/openai.png'),
    dark: require('@/assets/providers/openai-dark.png')
  }
};

export function Server() {
  const { colorScheme } = useColorScheme();
  const toast = useToast();
  const [settings, setSettings] = useSettings();
  const { provider = AIProviderEnum.OLLAMA, host, apiKey, hostList = [], apiKeyList = [] } = settings;
  const [connectStatus, setTestingStatus] = useState<'pending' | 'successful' | 'failed'>();

  const dispatch = <K extends 'provider' | 'host' | 'apiKey'>(key: K) => {
    return (v: (typeof settings)[K]) => {
      setSettings(prev => ({ ...prev, [key]: v }));
    };
  };

  const handleTestConnection = async () => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };

    try {
      setTestingStatus('pending');
      switch (provider) {
        case AIProviderEnum.ANTHROPIC:
        case AIProviderEnum.OPENAI:
        case AIProviderEnum.GOOGLE: {
          const registry = new AIRegistry(host, apiKey);
          await chat({ model: registry.model(`${provider}:gpt-3.5-turbo`), messages: [{ role: 'user', content: 'Hi' }] });

          break;
        }
        case AIProviderEnum.OLLAMA: {
          const result = await fetch(`${host}/api/tags`, { method: 'GET', headers });

          if (!result.ok) throw Error(`${result.status} ${result.statusText}`);
          break;
        }
        case AIProviderEnum.CUSTOM: {
          const result = await fetch(`${host}/models`, { method: 'GET', headers });

          if (!result.ok) throw Error(`${result.status} ${result.statusText}`);
          break;
        }
      }

      setSettings(settings => {
        if (!settings.hostList) settings.hostList = [];
        const hostIndex = hostList.findIndex(({ value }) => value === host);
        if (hostIndex > -1) {
          settings.hostList.forEach((item, index) => {
            item.isLastUsed = index === hostIndex;
          });
        } else {
          settings.hostList.forEach(item => {
            item.isLastUsed = false;
          });
          settings.hostList.push({ value: host, isLastUsed: true });
        }

        if (!settings.apiKeyList) settings.apiKeyList = [];
        const apiKeyIndex = apiKeyList.findIndex(({ value }) => value === apiKey);
        if (apiKeyIndex > -1) {
          settings.apiKeyList.forEach((item, index) => {
            item.isLastUsed = index === apiKeyIndex;
          });
        } else {
          settings.apiKeyList.forEach(item => {
            item.isLastUsed = false;
          });
          settings.apiKeyList.push({ value: apiKey, isLastUsed: true });
        }
      });
      setTestingStatus('successful');
      toast.success('Connect successfully!', { position: 'bottom' });
    } catch (error) {
      setTestingStatus('failed');
      toast.error('Connect failed!', { position: 'bottom', description: `${error}` });
    }
  };

  return (
    <SettingSection title="Server">
      <View className="flex flex-row items-center">
        <Text className="flex-1 font-medium">Provider</Text>
        <SelectInput
          value={provider}
          onPressItem={(_, value) => dispatch('provider')(value as AIProviderEnum)}
          options={[
            { label: 'Ollama', value: 'ollama' },
            { label: 'OpenAI', value: 'openai' },
            { label: 'Anthropic', value: 'anthropic' },
            { label: 'Google', value: 'google' },
            { label: 'OpenAI Compatible', value: 'custom' }
          ]}
          contentProps={{
            insets: { left: 16, right: 16 },
            sideOffset: 12
          }}
          renderItem={({ label, value }) => {
            return (
              <View className="flex h-8 w-full flex-row items-center justify-between">
                <Text>{label}</Text>
                <Image source={providerIcon[value as AIProviderEnum][colorScheme ?? 'light']} resizeMode="contain" className="mr-1 size-6" />
              </View>
            );
          }}>
          <Pressable>
            <Image source={providerIcon[provider][colorScheme ?? 'light']} resizeMode="contain" className="size-7" />
          </Pressable>
        </SelectInput>
      </View>
      <View className="flex flex-row items-center justify-between">
        <Text className="shrink-0 font-medium">Host</Text>
        <View className="min-w-0 flex-1">
          <SelectInput
            value={host}
            placeholder="e.g. https://api.openai.com/v1"
            className="border-0 bg-transparent pr-1 text-right dark:bg-transparent"
            onChangeText={dispatch('host')}
            options={hostList.map(item => ({ ...item, label: item.value }))}
            contentProps={{
              insets: { left: 16, right: 16 }
            }}
            renderItem={({ label, isLastUsed }) => {
              return (
                <View className="flex flex-1 flex-row items-center justify-between gap-x-2 py-1">
                  <Text>{label}</Text>
                  {isLastUsed ? <Text className="text-sm text-muted-foreground">last used</Text> : null}
                </View>
              );
            }}
          />
        </View>
      </View>
      <View className="flex flex-row items-center justify-between">
        <Text className="shrink-0 font-medium">API Key</Text>
        <View className="min-w-0 flex-1">
          <SelectInput
            value={apiKey}
            placeholder="e.g. sk-..."
            className="border-0 bg-transparent pr-1 text-right dark:bg-transparent"
            onChangeText={dispatch('apiKey')}
            options={apiKeyList.map(item => ({ ...item, label: item.value }))}
            contentProps={{
              insets: { left: 16, right: 16 }
            }}
            renderItem={({ label, isLastUsed }) => {
              return (
                <View className="flex flex-1 flex-row items-center justify-between gap-x-2 py-1">
                  <Text className="flex-1" numberOfLines={1}>
                    {label}
                  </Text>
                  {isLastUsed ? <Text className="text-sm text-muted-foreground">last used</Text> : null}
                </View>
              );
            }}
          />
        </View>
      </View>
      <Button disabled={connectStatus === 'pending'} onPress={handleTestConnection}>
        <Text>{connectStatus === 'pending' ? 'Connecting' : 'Test Connection'}</Text>
        {connectStatus === 'pending' ? <Spinner className="text-background" /> : null}
      </Button>
    </SettingSection>
  );
}
