import { useCallback, useEffect, useRef } from 'react';
import { useChatStore, genId }    from '../stores/chatStore';
import { useStudentStore }        from '../stores/studentStore';
import { supabase }               from '../lib/supabase';
import type { ChatMessage, StreamMeta } from '../types';

// Call the backend directly to avoid the Vite proxy buffering SSE responses
const BACKEND = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

export function useStream() {
  const { addMessage, startStreaming, appendToken, finalizeStream, clearStreaming } = useChatStore();
  const { update: updateStudent } = useStudentStore();
  const learningMode = useStudentStore(s => s.state.learning_mode);
  const abortRef = useRef<AbortController | null>(null);

  // Abort any in-flight SSE request when the hook unmounts
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const send = useCallback(async (text: string) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    // Abort any previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    // Optimistically add user message
    const userMsg: ChatMessage = {
      id:        genId(),
      role:      'user',
      content:   text,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMsg);

    // Show loading dots immediately — backend may take 10–30s to compute before streaming
    startStreaming();

    // Open SSE connection via fetch (manual ReadableStream)
    let buffer = '';

    try {
      const res = await fetch(`${BACKEND}/chat/stream`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept':        'text/event-stream',
        },
        body:   JSON.stringify({ message: text, learning_mode: learningMode }),
        signal,
      });

      if (!res.ok || !res.body) {
        clearStreaming();
        const errMsg: ChatMessage = {
          id:        genId(),
          role:      'system',
          content:   `Error: ${res.status} — ${res.statusText}`,
          timestamp: new Date().toISOString(),
        };
        addMessage(errMsg);
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete SSE lines — split on \r?\n to handle both CRLF and LF
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        let event = '';
        let data  = '';

        for (const rawLine of lines) {
          const line = rawLine.trimEnd(); // strip trailing \r if any
          if (line.startsWith('event:')) {
            event = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            data = line.slice(5).replace(/^ /, ''); // strip one SSE separator space only
          } else if (line === '') {
            // Dispatch event
            if (event === 'token' && data) {
              try { appendToken(JSON.parse(data)); } catch { appendToken(data); }
            } else if (event === 'meta' && data) {
              try {
                const meta = JSON.parse(data) as StreamMeta;
                updateStudent({
                  bkt:             meta.student_state.bkt,
                  chapter_mastery: meta.student_state.chapter_mastery,
                  level:           meta.student_state.level,
                  level_label:     meta.student_state.level_label,
                  current_chapter: meta.student_state.current_chapter,
                  streak_days:     meta.student_state.streak_days,
                  total_hints:     meta.student_state.total_hints,
                });
                const ev = meta.eval;
                if (ev?.evaluated && ev.mastery_before != null && ev.mastery_after != null) {
                  const delta = Math.round((ev.mastery_after - ev.mastery_before) * 100);
                  if (delta !== 0) {
                    addMessage({
                      id:        genId(),
                      role:      'system',
                      content:   `${ev.is_correct ? '📈' : '📉'} ${ev.is_correct ? '+' : ''}${delta}% mastery${delta > 0 ? ' — keep going!' : ' — try again'}`,
                      timestamp: new Date().toISOString(),
                    });
                  }
                }
              } catch { /* ignore parse errors */ }
            } else if (event === 'done') {
              // Done — finalize message
              const finalContent = useChatStore.getState().streamingContent;
              finalizeStream(finalContent);
            }
            event = '';
            data  = '';
          }
        }
      }

      // Safety net: if stream closed without a done event (backend crashed/timed out)
      // always reset streaming state so the UI doesn't hang on loading dots
      if (useChatStore.getState().isStreaming) {
        const remaining = useChatStore.getState().streamingContent;
        if (remaining) {
          finalizeStream(remaining);
        } else {
          clearStreaming();
          addMessage({
            id:        genId(),
            role:      'system',
            content:   'No response received. The server may be busy — please try again.',
            timestamp: new Date().toISOString(),
          });
        }
      }

    } catch (err: unknown) {
      // Ignore AbortError — user navigated away or sent a new message
      if (err instanceof Error && err.name === 'AbortError') return;
      clearStreaming();
      const msg: ChatMessage = {
        id:        genId(),
        role:      'system',
        content:   `Connection error: ${err instanceof Error ? err.message : 'unknown'}`,
        timestamp: new Date().toISOString(),
      };
      addMessage(msg);
    }
  }, [addMessage, startStreaming, appendToken, finalizeStream, clearStreaming, updateStudent, learningMode]);

  return { send };
}
