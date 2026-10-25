import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  X,
  Minus,
  RotateCcw,
  Send,
  ArrowRight,
  MapPin,
  Compass,
  FileSearch,
  Scale,
  FileText,
  Database,
  ChevronRight,
  Layers,
  HelpCircle,
  MessageSquare
} from 'lucide-react';
import { SECTION_METADATA, generateAiAssistantResponse } from '../utils/aiAssistantEngine';

export default function FloatingChatbot({
  activeSection = 'overview',
  showLanding = false,
  selectedLocation,
  locations = [],
  currentAssessment,
  currentCostEstimate,
  onNavigate,
  onSelectLocation,
  onOpenThemeStudio
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentSecKey = showLanding ? 'landing' : activeSection;
  const currentSectionMeta = SECTION_METADATA[currentSecKey] || SECTION_METADATA.overview;

  // Track conversation messages across route changes
  const [messages, setMessages] = useState(() => [
    {
      id: 'msg-init-1',
      sender: 'assistant',
      text: SECTION_METADATA.landing.greeting(selectedLocation),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: 'Explore 167 Locations', type: 'navigate', payload: 'overview' },
        { label: 'Open Site Intelligence', type: 'navigate', payload: 'profile' },
        { label: 'Explore GIS Map', type: 'navigate', payload: 'map' }
      ],
      suggestedFollowUps: SECTION_METADATA.landing.suggestions
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const prevSectionRef = useRef(currentSecKey);
  const prevLocRef = useRef(selectedLocation?.id);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'nearest'
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(true);
    }
  }, [messages, isTyping]);

  // Context-aware announcement when the user navigates to a new section or site
  useEffect(() => {
    const secChanged = prevSectionRef.current !== currentSecKey;
    const locChanged = prevLocRef.current !== selectedLocation?.id;

    if (secChanged || locChanged) {
      prevSectionRef.current = currentSecKey;
      prevLocRef.current = selectedLocation?.id;

      // When the user changes section, add a subtle contextual greeting message
      const greetingText = currentSectionMeta.greeting(selectedLocation);
      const contextualMsg = {
        id: `msg-ctx-${Date.now()}`,
        sender: 'assistant',
        isContextSwitch: true,
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          currentSecKey !== 'profile' && { label: `Inspect ${selectedLocation?.name || 'Site'}`, type: 'navigate', payload: 'profile' },
          currentSecKey !== 'assessment' && { label: 'Start Site Assessment', type: 'navigate', payload: 'assessment' },
          currentSecKey !== 'reports' && { label: 'Go to Reports', type: 'navigate', payload: 'reports' }
        ].filter(Boolean),
        suggestedFollowUps: currentSectionMeta.suggestions
      };

      setMessages((prev) => [...prev, contextualMsg]);

      if (!isOpen) {
        setUnreadCount((c) => Math.min(c + 1, 9));
      }
    }
  }, [currentSecKey, selectedLocation, currentSectionMeta, isOpen]);

  // Handle keyboard shortcut: Escape to close chatbot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Dispatch interactive action from assistant
  const handleActionClick = (action) => {
    if (!action) return;
    if (action.type === 'navigate') {
      if (onNavigate) onNavigate(action.payload);
    } else if (action.type === 'select_location') {
      if (onSelectLocation) onSelectLocation(action.payload);
      if (onNavigate) onNavigate('profile');
    } else if (action.type === 'open_theme') {
      if (onOpenThemeStudio) onOpenThemeStudio();
    }
  };

  // Send message handler
  const handleSendMessage = (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    setHasInteracted(true);
    setInputValue('');

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Contextual AI deliberation simulation
    setTimeout(() => {
      const response = generateAiAssistantResponse(query, {
        activeSection,
        showLanding,
        selectedLocation,
        locations,
        currentAssessment,
        currentCostEstimate
      });

      const assistantMsg = {
        id: `msg-asst-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions || [],
        suggestedFollowUps: response.suggestedFollowUps || []
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 450);
  };

  // Reset / Clear Conversation
  const handleResetConversation = () => {
    const initialGreeting = currentSectionMeta.greeting(selectedLocation);
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'assistant',
        text: `Conversation restarted.\n\n${initialGreeting}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [
          { label: 'Site Intelligence', type: 'navigate', payload: 'profile' },
          { label: 'Site Assessment', type: 'navigate', payload: 'assessment' },
          { label: 'Reports Deck', type: 'navigate', payload: 'reports' }
        ],
        suggestedFollowUps: currentSectionMeta.suggestions
      }
    ]);
  };

  // Helper to render markdown-like text cleanly
  const renderFormattedText = (raw) => {
    if (!raw) return null;
    const lines = raw.split('\n');

    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return (
          <div key={idx} className="chat-msg-heading">
            {line.replace('### ', '')}
          </div>
        );
      }
      // Bullet list item
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const itemContent = line.slice(2);
        return (
          <div key={idx} className="chat-msg-bullet">
            <span className="chat-bullet-dot">•</span>
            <span>{renderInlineFormatting(itemContent)}</span>
          </div>
        );
      }
      // Numbered list item
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="chat-msg-numbered">
            {renderInlineFormatting(line)}
          </div>
        );
      }
      // Empty line / paragraph break
      if (!line.trim()) {
        return <div key={idx} style={{ height: '0.45rem' }} />;
      }
      // Standard line
      return (
        <p key={idx} className="chat-msg-paragraph">
          {renderInlineFormatting(line)}
        </p>
      );
    });
  };

  // Helper for inline **bold** and `code` formatting
  const renderInlineFormatting = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="chat-inline-code">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return (
    <div className="floating-chatbot-root" aria-live="polite">
      {/* 1. EXPANDED CHAT PANEL */}
      {isOpen && (
        <section
          className="floating-chat-panel"
          role="dialog"
          aria-label="TerraShield AI Assistant"
          aria-modal="false"
        >
          {/* Header */}
          <header className="chat-panel-header">
            <div className="chat-header-brand">
              <div className="chat-avatar-emblem">
                <Sparkles size={16} />
                <span className="chat-online-dot" aria-label="Online status indicator" />
              </div>
              <div className="chat-header-info">
                <div className="chat-header-title">TerraShield AI</div>
                <div className="chat-header-subtitle">
                  <span className="chat-context-pill">
                    {currentSectionMeta.name.replace(/^\d+\.\s*/, '')}
                  </span>
                  {selectedLocation && (
                    <span className="chat-location-pill">
                      <MapPin size={10} />
                      {selectedLocation.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-icon-btn"
                onClick={handleResetConversation}
                title="Restart conversation"
                aria-label="Restart conversation"
              >
                <RotateCcw size={14} />
              </button>
              <button
                type="button"
                className="chat-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Minimize assistant (Esc)"
                aria-label="Minimize assistant"
              >
                <Minus size={15} />
              </button>
            </div>
          </header>

          {/* Context Alert Strip */}
          <div className="chat-context-strip">
            <span className="chat-strip-icon">📍</span>
            <span className="chat-strip-text">
              Active Context: <strong>{selectedLocation ? `${selectedLocation.name} (${selectedLocation.geographic_context?.elevation_m_msl ?? '11'}m MSL)` : 'Chennai'}</strong> · {currentSectionMeta.tagline}
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="chat-messages-container" tabIndex={0} aria-label="Message history">
            {messages.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`chat-message-row ${isAssistant ? 'asst-row' : 'user-row'} ${msg.isContextSwitch ? 'context-switch-msg' : ''}`}
                >
                  {isAssistant && (
                    <div className="chat-msg-avatar">
                      <Bot size={14} />
                    </div>
                  )}

                  <div className="chat-message-bubble">
                    <div className="chat-bubble-content">
                      {renderFormattedText(msg.text)}
                    </div>

                    {/* Clickable Assistant Actions */}
                    {isAssistant && msg.actions && msg.actions.length > 0 && (
                      <div className="chat-actions-container">
                        {msg.actions.map((act, aIdx) => (
                          <button
                            key={aIdx}
                            type="button"
                            className="chat-action-btn"
                            onClick={() => handleActionClick(act)}
                          >
                            <span>{act.label}</span>
                            <ArrowRight size={12} />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="chat-msg-timestamp">{msg.timestamp}</div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="chat-message-row asst-row">
                <div className="chat-msg-avatar">
                  <Bot size={14} />
                </div>
                <div className="chat-message-bubble chat-typing-bubble">
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-dot" />
                  <span className="chat-typing-text">TerraShield AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic Suggested Questions Bar */}
          {messages.length > 0 && (
            <div className="chat-suggestions-bar">
              <div className="chat-suggestions-label">Suggested next steps:</div>
              <div className="chat-suggestions-scroll">
                {(messages[messages.length - 1]?.suggestedFollowUps || currentSectionMeta.suggestions).map(
                  (suggestion, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      className="chat-suggestion-chip"
                      onClick={() => handleSendMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="chat-text-input"
              placeholder={currentSectionMeta.promptPlaceholder || 'Ask anything about Chennai land intelligence...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              aria-label="Ask TerraShield AI a question"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
              title="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </section>
      )}

      {/* 2. FLOATING TRIGGER BUTTON (Fixed to Bottom-Right) */}
      <button
        type="button"
        className={`floating-chat-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setUnreadCount(0);
        }}
        aria-label={isOpen ? 'Close TerraShield AI Assistant' : 'Open TerraShield AI Assistant'}
        aria-expanded={isOpen}
        title="Ask TerraShield AI Assistant"
      >
        <div className="chat-trigger-icon-wrap">
          {isOpen ? <X size={20} /> : <Bot size={22} />}
        </div>

        {/* Unread / New Context Badge */}
        {!isOpen && unreadCount > 0 && (
          <span className="chat-unread-badge" aria-label={`${unreadCount} new suggestions`}>
            {unreadCount}
          </span>
        )}

        {/* Gentle Pulse Glow Ring */}
        <span className="chat-pulse-ring" aria-hidden="true" />

        {/* Hover Tooltip when closed */}
        {!isOpen && (
          <span className="floating-chat-tooltip" role="tooltip">
            <strong>TerraShield AI Assistant</strong>
            <span style={{ fontSize: '0.72rem', opacity: 0.85, display: 'block' }}>
              Click for instant {currentSectionMeta.name.replace(/^\d+\.\s*/, '')} guidance
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
