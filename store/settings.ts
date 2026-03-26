import { AIProviderEnum } from '@/lib/ai';
import { createStorageAtom, StorageKey } from '@/lib/local-storage';

export interface Model {
  name: string;
  canThink?: boolean;
  isCustom?: boolean;
}

export interface Settings {
  provider: AIProviderEnum;
  host: string;
  apiKey: string;
  hostList: { value: string; isLastUsed: boolean }[];
  apiKeyList: { value: string; isLastUsed: boolean }[];
  defaultModel?: Model;
  hapticFeedback: boolean;
  tokensUsage: number;
}

export const settings = createStorageAtom(StorageKey.SETTINGS, {
  provider: AIProviderEnum.OLLAMA,
  host: '',
  apiKey: '',
  hostList: [],
  apiKeyList: [],
  hapticFeedback: true,
  tokensUsage: 0
} as Settings);
