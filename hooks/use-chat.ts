import type { ModelMessage } from 'ai';
import { useCallback, useRef, useState } from 'react';

import { AIRegistry, chat } from '@/lib/ai';
import { type Message, useChatList } from '@/store/chats';
import { useSettingsValue } from '@/store/settings';

export function useChat() {
  const abortFnRef = useRef<() => void>(null);
  const settings = useSettingsValue();
  const [error, setError] = useState<Error>();
  const [{ current, data }, { set: setChats }] = useChatList();
  const { model, messages = [] } = data[current] || {};

  const chatWithAI = useCallback(
    (message: string) => {
      const { provider, host, apiKey } = settings;
      const { name: modelName } = model!;
      const registry = new AIRegistry(host, apiKey);

      return chat({
        model: registry.model(`${provider}:${modelName}`),
        messages: [...messages, { role: 'user', content: message }].map(({ role, content }) => ({ role, content })) as ModelMessage[],
        stream: true
      });
    },
    [messages, settings, model]
  );

  const updateMessage = useCallback(
    (updater: (msg: Message) => void) => {
      setChats(chats => {
        const msgs = chats.data[current].messages;
        const lastMsg = msgs[msgs.length - 1];
        updater(lastMsg);
      });
    },
    [current]
  );

  const sendMessage = async (input: string) => {
    const createAt = +new Date();
    const userMessage: Message = { role: 'user', content: input, createAt };
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      createAt,
      thinkingContent: '',
      isPending: true,
      isStreaming: false
    };

    setChats(chats => {
      chats.data[current].messages = [...chats.data[current].messages, userMessage, assistantMessage];
    });

    const [stream, abort] = chatWithAI(input);
    const startTime = +new Date();
    let startThinkingTime = +new Date();

    for await (const part of stream) {
      const { type } = part;

      switch (type) {
        case 'start': {
          abortFnRef.current = () => abort();

          break;
        }
        case 'reasoning-start': {
          startThinkingTime = +new Date();
          updateMessage(msg => {
            msg.isPending = false;
            msg.isThinking = true;
          });

          break;
        }
        case 'reasoning-delta': {
          const { text } = part;
          updateMessage(msg => {
            msg.thinkingContent = (msg.thinkingContent || '') + text;
          });

          break;
        }
        case 'reasoning-end': {
          updateMessage(msg => {
            msg.isThinking = false;
            msg.thinkingDuration = +new Date() - startThinkingTime;
          });

          break;
        }
        case 'text-start': {
          updateMessage(msg => {
            msg.isPending = false;
            msg.isStreaming = true;
          });

          break;
        }
        case 'text-delta': {
          const { text } = part;
          updateMessage(msg => {
            msg.content = (msg.content || '') + text;
          });

          break;
        }
        case 'text-end': {
          updateMessage(msg => {
            msg.isStreaming = false;
          });

          break;
        }
        case 'abort': {
          updateMessage(msg => {
            msg.isAborted = true;
          });

          break;
        }
        case 'error': {
          const { error } = part;
          updateMessage(msg => {
            msg.isAborted = true;
          });
          setError(new Error('Please check your API endpoint and try again', { cause: `${error}` }));

          break;
        }
        case 'finish': {
          const { finishReason, totalUsage } = part;
          updateMessage(msg => {
            msg.cost = {
              time: +new Date() - startTime,
              tokens: totalUsage.totalTokens || 0
            };
          });
          if (finishReason !== 'stop') {
            setError(new Error('Network error', { cause: `Stream terminated by ${finishReason}` }));
          }

          break;
        }
      }
    }
  };

  const stop = () => {
    updateMessage(msg => {
      msg.isPending = false;
      msg.isAborted = true;
    });
    abortFnRef.current?.();
  };

  return { messages, sendMessage, stop, error };
}
