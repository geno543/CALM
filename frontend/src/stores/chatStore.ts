import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface ChatStore {
  messages:         ChatMessage[];
  streamingContent: string;
  isStreaming:      boolean;
  historyLoaded:    boolean;

  addMessage:       (msg: ChatMessage)    => void;
  startStreaming:   ()                    => void;
  appendToken:      (token: string)       => void;
  finalizeStream:   (content: string)     => void;
  clearStreaming:   ()                    => void;
  setMessages:      (msgs: ChatMessage[]) => void;
  clearHistory:     ()                    => void;
  setHistoryLoaded: (v: boolean)          => void;
}

let _nextId = 1;
const genId = () => `msg_${_nextId++}_${Date.now()}`;

export const useChatStore = create<ChatStore>((set) => ({
  messages:         [],
  streamingContent: '',
  isStreaming:      false,
  historyLoaded:    false,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  // Call immediately on send to show the loading dots while backend is thinking
  startStreaming: () =>
    set({ isStreaming: true, streamingContent: '' }),

  appendToken: (token) =>
    set((s) => ({
      streamingContent: s.streamingContent + token,
      isStreaming:      true,
    })),

  finalizeStream: (content) => {
    const msg: ChatMessage = {
      id:        genId(),
      role:      'assistant',
      content,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      messages:         [...s.messages, msg],
      streamingContent: '',
      isStreaming:      false,
    }));
  },

  clearStreaming: () =>
    set({ streamingContent: '', isStreaming: false }),

  setMessages: (msgs) => set({ messages: msgs }),

  clearHistory: () =>
    set({ messages: [], streamingContent: '', isStreaming: false, historyLoaded: false }),

  setHistoryLoaded: (v) => set({ historyLoaded: v }),
}));

export { genId };
