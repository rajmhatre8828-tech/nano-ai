import { useSetStorageAtom, useStorageAtom, useStorageAtomValue } from '@/hooks/use-storage-atom';
import { AIProviderEnum } from '@/lib/ai';
import { createStorageAtom, StorageKey } from '@/lib/local-storage';
import { withImmer } from '@/lib/utils';

export interface Model {
  name: string;
  canThink?: boolean;
}

export interface Settings {
  provider: AIProviderEnum;
  host: string;
  apiKey: string;
  hostList: { value: string; isLastUsed: boolean }[];
  apiKeyList: { value: string; isLastUsed: boolean }[];
  defaultModel?: Model;
  hapticFeedback: boolean;
}

export const settings = createStorageAtom(StorageKey.SETTINGS, {
  provider: AIProviderEnum.OLLAMA,
  host: '',
  apiKey: '',
  hostList: [],
  apiKeyList: [],
  hapticFeedback: true
} as Settings);

export const useSettings = () => {
  const [_settings, _setSettings] = useStorageAtom(settings);

  return [_settings, withImmer(_setSettings)] as const;
};

export const useSettingsValue = () => {
  return useStorageAtomValue(settings);
};

export const useSetSettings = () => {
  const _setSettings = useSetStorageAtom(settings);

  return withImmer(_setSettings);
};
