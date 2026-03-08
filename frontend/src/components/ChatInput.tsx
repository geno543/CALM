import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLang }   from '../contexts/LanguageContext';
import { useChatStore } from '../stores/chatStore';

// Extend Window for browser-specific SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition:        { new(): SpeechRecognitionInstance } | undefined;
    webkitSpeechRecognition:  { new(): SpeechRecognitionInstance } | undefined;
  }
  interface SpeechRecognitionInstance {
    lang:             string;
    interimResults:   boolean;
    maxAlternatives:  number;
    start():          void;
    stop():           void;
    onresult:         ((event: SpeechRecognitionEvent) => void) | null;
    onerror:          (() => void) | null;
    onend:            (() => void) | null;
  }
  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }
}

interface Props {
  onSend:          (text: string) => void;
  externalDraft?:  string;
  onDraftConsumed?: () => void;
}

export default function ChatInput({ onSend, externalDraft, onDraftConsumed }: Props) {
  const [value, setValue]         = useState('');
  const [isRecording, setRecording] = useState(false);
  const { isStreaming }           = useChatStore();
  const { toggle, isAr }          = useLang();
  const textareaRef               = useRef<HTMLTextAreaElement>(null);
  const recognitionRef            = useRef<SpeechRecognitionInstance | null>(null);

  // Auto-resize
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
  }, [value]);

  // Consume external draft (from chapter nav click)
  useEffect(() => {
    if (externalDraft) {
      setValue(externalDraft);
      textareaRef.current?.focus();
      onDraftConsumed?.();
    }
  }, [externalDraft, onDraftConsumed]);

  const submit = () => {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setValue('');
  };

  // Voice recognition
  const toggleVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    const rec: SpeechRecognitionInstance = new SpeechRec();
    rec.lang        = isAr ? 'ar-SA' : 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setValue((prev) => prev ? prev + ' ' + transcript : transcript);
      textareaRef.current?.focus();
    };
    rec.onerror  = () => setRecording(false);
    rec.onend    = () => setRecording(false);

    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div
      className="flex flex-col gap-2 p-3"
      style={{
        background:   'var(--color-surface)',
        border:       '1px solid var(--color-border)',
        borderTop:    '2px solid var(--color-border)',
        transition:   'border-top-color 0.15s',
      }}
      onFocusCapture={e => (e.currentTarget.style.borderTopColor = 'var(--color-accent)') as unknown as void}
      onBlurCapture={e  => (e.currentTarget.style.borderTopColor = 'var(--color-border)') as unknown as void}
    >
      {/* prompt prefix + textarea row */}
      <div className="flex items-start gap-2">
        <span
          className="text-xs font-black tracking-wider shrink-0 mt-1 select-none"
          style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
        >
          &gt;_
        </span>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isStreaming}
          dir={isAr ? 'rtl' : 'ltr'}
          placeholder={isAr ? 'اسأل عن أي موضوع في الحساب...' : 'Ask anything about calculus...'}
          rows={1}
          className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none"
          style={{
            color:      'var(--color-text)',
            fontFamily: isAr ? 'var(--font-arabic)' : 'var(--font-sans)',
            caretColor: 'var(--color-accent)',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggle}
            className="flex items-center px-2.5 py-1 text-[10px] font-black tracking-widest uppercase cursor-pointer transition-colors"
            style={{
              background: 'transparent',
              border:     '1px solid var(--color-border)',
              color:      'var(--color-muted)',
              fontFamily: 'var(--font-mono)',
            }}
            title="Toggle language"
          >
            {isAr ? 'AR' : 'EN'}
          </button>

          {/* Mic button */}
          {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
            <button
              onClick={toggleVoice}
              title={isRecording ? (isAr ? 'إيقاف التسجيل' : 'Stop recording') : (isAr ? 'إدخال صوتي' : 'Voice input')}
              className="relative flex items-center justify-center w-7 h-7 transition-all cursor-pointer"
              style={{
                background: isRecording ? '#2B1A1A' : 'transparent',
                border:     `1px solid ${isRecording ? 'var(--color-danger)' : 'var(--color-border)'}`,
                color:      isRecording ? 'var(--color-danger)' : 'var(--color-muted)',
              }}
            >
              {isRecording && (
                <motion.div
                  className="absolute inset-0"
                  style={{ border: '1px solid var(--color-danger)', opacity: 0.45 }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}

          <span className="text-[10px] font-bold" style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
            {isAr ? 'Enter → إرسال' : 'Enter → send'}
          </span>
        </div>

        {/* Send button */}
        <AnimatePresence>
          <motion.button
            onClick={submit}
            disabled={isStreaming || !value.trim()}
            whileHover={{ scale: isStreaming ? 1 : 1.04 }}
            whileTap={{ scale: isStreaming ? 1 : 0.97 }}
            className="w-9 h-9 flex items-center justify-center transition-all cursor-pointer"
            style={{
              background: (!value.trim() || isStreaming) ? 'transparent' : 'var(--color-primary)',
              border:     `1px solid ${(!value.trim() || isStreaming) ? 'var(--color-border)' : 'var(--color-primary)'}`,
              color:      (!value.trim() || isStreaming) ? 'var(--color-subtle)' : 'var(--color-ink)',
            }}
          >
            {isStreaming ? (
              <motion.div
                className="w-3 h-3"
                style={{ background: 'var(--color-muted)' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                <path d="M.5 1.163A1 1 0 0 1 1.97.28l12.868 6.837a1 1 0 0 1 0 1.766L1.969 15.72A1 1 0 0 1 .5 14.836V10.33a1 1 0 0 1 .816-.983L8.5 8 1.316 6.653A1 1 0 0 1 .5 5.67V1.163z"/>
              </svg>
            )}
          </motion.button>
        </AnimatePresence>
      </div>
    </div>
  );
}
