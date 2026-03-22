import { useStorageAtom } from '@/hooks/use-storage-atom';
import { createStorageAtom, StorageKey } from '@/lib/local-storage';
import { withImmer } from '@/lib/utils';

import { type Model, useSettingsValue } from './settings';

export interface MessageStatus {
  isPending: boolean;
  isThinking: boolean;
  isStreaming: boolean;
  isAborted: boolean;
}

export interface Message extends Partial<MessageStatus> {
  role: string;
  content: string;
  createAt: number;
  updateAt?: number;
  thinkingContent?: string;
  thinkingDuration?: number;
  cost?: {
    time: number;
    tokens: number;
  };
}

export interface Session {
  messages: Message[];
  model?: Model;
  think?: boolean;
}

export const sessions = createStorageAtom(StorageKey.CHATS_HISTORY, { current: 0, data: [{ messages: [] }] as Session[] });

export function useSessions() {
  const [_sessions, _setSessions] = useStorageAtom(sessions);
  const { defaultModel } = useSettingsValue();
  const set = withImmer(_setSessions);

  const create = () => {
    set(sessions => {
      if (sessions.data.length === 0 || sessions.data.at(-1)?.messages.length) {
        sessions.data.push({ messages: [], model: defaultModel });
      }

      if (sessions.current !== sessions.data.length - 1) {
        sessions.current = sessions.data.length - 1;
        sessions.data[sessions.current].model = defaultModel;
      }
    });
  };

  const remove = (index: number) => {
    set(sessions => {
      sessions.data.splice(index, 1);

      if (sessions.data.length === 0 || sessions.data.at(-1)?.messages.length) {
        sessions.data.push({ messages: [], model: defaultModel });
      }

      if (sessions.current !== sessions.data.length - 1) {
        sessions.current = sessions.data.length - 1;
        sessions.data[sessions.current].model = defaultModel;
      }
    });
  };

  const switchTo = (index: number) => {
    set(sessions => {
      sessions.current = index;
    });
  };

  const toggleThink = () => {
    set(sessions => {
      const { current, data } = sessions;
      data[current].think = !data[current].think;
    });
  };

  const clear = () => {
    set(sessions => {
      sessions.current = 0;
      sessions.data = [{ messages: [] }];
    });
  };

  return [
    _sessions,
    {
      set,
      create,
      remove,
      switchTo,
      toggleThink,
      clear
    }
  ] as const;
}
