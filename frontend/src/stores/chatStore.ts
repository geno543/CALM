import { create } from 'zustand';
import type { ChatMessage } from '../types';

export interface LevelUpToast {
  id:    string;
  level: number;
  label: string;
}

interface ChatStore {
  messages:         ChatMessage[];
  streamingContent: string;
  isStreaming:      boolean;
  isReasoning:      boolean;
  historyLoaded:    boolean;
  levelUpToasts:    LevelUpToast[];
  desmosOpen:       boolean;
  desmosExprs:      string[];

  addMessage:          (msg: ChatMessage)                    => void;
  startStreaming:      ()                                    => void;
  appendToken:         (token: string)                       => void;
  finalizeStream:      (content: string)                     => void;
  clearStreaming:      ()                                    => void;
  setMessages:         (msgs: ChatMessage[])                 => void;
  clearHistory:        ()                                    => void;
  setHistoryLoaded:    (v: boolean)                          => void;
  setReasoning:        (v: boolean)                          => void;
  addLevelUpToast:     (level: number, label: string)        => void;
  dismissLevelUpToast: (id: string)                          => void;
  openDesmos:          (exprs?: string[])                    => void;
  closeDesmos:         ()                                    => void;
}

let _nextId = 1;
const genId = () => `msg_${_nextId++}_${Date.now()}`;

export const useChatStore = create<ChatStore>((set) => ({
  messages:         [],
  streamingContent: '',
  isStreaming:      false,
  isReasoning:      false,
  historyLoaded:    false,
  levelUpToasts:    [],
  desmosOpen:       false,
  desmosExprs:      [],

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  // Call immediately on send to show the loading dots while backend is thinking
  startStreaming: () =>
    set({ isStreaming: true, isReasoning: true, streamingContent: '' }),

  appendToken: (token) =>
    set((s) => ({
      streamingContent: s.streamingContent + token,
      isStreaming:      true,
      isReasoning:      false,    // first token arrived — reasoning phase is done
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
      isReasoning:      false,
    }));
  },

  clearStreaming: () =>
    set({ streamingContent: '', isStreaming: false, isReasoning: false }),

  setMessages: (msgs) => set({ messages: msgs }),

  clearHistory: () =>
    set({ messages: [], streamingContent: '', isStreaming: false, isReasoning: false, historyLoaded: false }),

  setHistoryLoaded: (v) => set({ historyLoaded: v }),

  setReasoning: (v) => set({ isReasoning: v }),

  addLevelUpToast: (level, label) =>
    set((s) => ({
      levelUpToasts: [
        ...s.levelUpToasts,
        { id: `lvl_${Date.now()}`, level, label },
      ],
    })),

  dismissLevelUpToast: (id) =>
    set((s) => ({ levelUpToasts: s.levelUpToasts.filter((t) => t.id !== id) })),

  openDesmos: (exprs = []) =>
    set({ desmosOpen: true, desmosExprs: exprs }),

  closeDesmos: () =>
    set({ desmosOpen: false }),
}));

export { genId };
