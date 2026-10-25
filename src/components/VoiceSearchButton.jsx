import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Square,
  X,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Volume2
} from 'lucide-react';

export default function VoiceSearchButton({
  locations = [],
  onNavigate,
  onSelectLocation,
  onSetGlobalSearch,
  onSetSearchFocused,
  onOpenThemeStudio
}) {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState(null);

  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const panelRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;
    setIsSupported(Boolean(SpeechRecognition));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // Natural language query processor & execution engine
  const executeQuery = useCallback((spokenText) => {
    if (!spokenText || !spokenText.trim()) return;

    const raw = spokenText.trim();
    const lower = raw.toLowerCase();

    // 1. Navigation / Section Commands
    if (lower.includes('site intelligence') || lower.includes('site profile')) {
      setSuccessFeedback('Opening Site Intelligence...');
      setTimeout(() => {
        onNavigate('profile');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('saved assessments') || lower.includes('my saved') || lower.includes('saved assessment')) {
      setSuccessFeedback('Opening Saved Assessments...');
      setTimeout(() => {
        onNavigate('saved');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('site assessment') || lower.includes('assess site') || lower.includes('assessment')) {
      setSuccessFeedback('Opening Site Assessment...');
      setTimeout(() => {
        onNavigate('assessment');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('compare sites') || lower.includes('compare site') || lower.includes('comparison')) {
      setSuccessFeedback('Opening Site Comparisons...');
      setTimeout(() => {
        onNavigate('compare');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('construction planner') || lower.includes('planner') || lower.includes('schedule')) {
      setSuccessFeedback('Opening Construction Planner...');
      setTimeout(() => {
        onNavigate('planner');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('cost estimator') || lower.includes('estimator') || lower.includes('budget') || lower.includes('cost')) {
      setSuccessFeedback('Opening Cost Estimator...');
      setTimeout(() => {
        onNavigate('estimator');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('report') || lower.includes('reports') || lower.includes('dossier')) {
      setSuccessFeedback('Opening Dossier Reports...');
      setTimeout(() => {
        onNavigate('reports');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('data source') || lower.includes('sources') || lower.includes('methodology')) {
      setSuccessFeedback('Opening Data Sources & Methodology...');
      setTimeout(() => {
        onNavigate('sources');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('news tv') || lower.includes('land news') || lower.includes('news') || lower.includes('broadcast') || lower.includes('legal updates')) {
      setSuccessFeedback('Opening Land News & Legal Updates TV...');
      setTimeout(() => {
        onNavigate('tv');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('theme studio') || lower.includes('change theme') || lower.includes('appearance') || lower.includes('themes')) {
      setSuccessFeedback('Opening Theme Studio...');
      setTimeout(() => {
        if (onOpenThemeStudio) onOpenThemeStudio();
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('open map') || lower.includes('explore map') || lower.includes('show map') || lower.includes('gis')) {
      setSuccessFeedback('Opening Explore Map...');
      setTimeout(() => {
        onNavigate('map');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('overview') || lower.includes('dashboard') || lower.includes('home page')) {
      setSuccessFeedback('Opening Overview...');
      setTimeout(() => {
        onNavigate('overview');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    if (lower.includes('landmarks near this location') || lower.includes('landmarks near') || lower.includes('search for landmarks')) {
      setSuccessFeedback('Locating landmarks in Site Intelligence...');
      setTimeout(() => {
        onNavigate('profile');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 700);
      return;
    }

    // 2. Location Search: Clean Natural Speech Prefixes
    let cleaned = lower
      .replace(/^(search for|search|find land near|find land in|find land|find|look up|locate|show me land in|show me land near|show me|take me to|navigate to)\s+/i, '')
      .replace(/[.?!]$/, '')
      .trim();

    if (!cleaned) cleaned = raw;

    // Populate the existing search input immediately
    onSetGlobalSearch(cleaned);
    onSetSearchFocused(true);

    // Look for exact or partial matches in the 167 verified locations
    const exactMatch = locations.find(
      (loc) => loc.name.toLowerCase() === cleaned || loc.id.toLowerCase() === cleaned
    );

    const partialMatch =
      !exactMatch &&
      locations.find(
        (loc) =>
          loc.name.toLowerCase().includes(cleaned) ||
          cleaned.includes(loc.name.toLowerCase()) ||
          loc.geographic_context.planning_corridor.toLowerCase().includes(cleaned)
      );

    if (exactMatch) {
      setSuccessFeedback(`Found exact location: ${exactMatch.name}`);
      setTimeout(() => {
        onSelectLocation(exactMatch);
        onNavigate('profile');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 800);
    } else if (partialMatch && cleaned.length >= 3) {
      setSuccessFeedback(`Found nearest site: ${partialMatch.name}`);
      setTimeout(() => {
        onSelectLocation(partialMatch);
        onNavigate('profile');
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 800);
    } else {
      setSuccessFeedback(`Showing search suggestions for "${cleaned}"`);
      setTimeout(() => {
        setShowPanel(false);
        setSuccessFeedback(null);
      }, 900);
    }
  }, [locations, onNavigate, onSelectLocation, onSetGlobalSearch, onSetSearchFocused, onOpenThemeStudio]);

  // Stop listening helper
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  // Cancel voice search
  const handleCancel = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setIsListening(false);
    setShowPanel(false);
    setTranscript('');
    setInterimText('');
    setErrorMessage(null);
    setSuccessFeedback(null);
  }, []);

  // Start voice recognition
  const startListening = () => {
    setShowPanel(true);
    setTranscript('');
    setInterimText('');
    setErrorMessage(null);
    setSuccessFeedback(null);

    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      setIsListening(false);
      setErrorMessage(
        'Voice search uses the browser Web Speech API (supported in Google Chrome, Microsoft Edge, and Safari). Please use standard keyboard search or switch to a supported browser.'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN'; // Optimized for Indian geographical nomenclature (Chennai)

      setIsListening(true);

      // Safety silence timeout: automatically stop after 9 seconds if no speech detected
      silenceTimerRef.current = setTimeout(() => {
        stopListening();
      }, 9000);

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (final) {
          const resultText = final.trim();
          setTranscript(resultText);
          setInterimText('');
          stopListening();
          executeQuery(resultText);
        }
      };

      recognition.onspeechend = () => {
        stopListening();
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setShowPanel(true);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErrorMessage(
            'Microphone access was denied. Please allow microphone permissions in your browser address bar to use voice search.'
          );
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech was detected. Tap the microphone button to try speaking again.');
        } else if (event.error === 'audio-capture') {
          setErrorMessage('No microphone device was detected on your system. Please verify microphone hardware.');
        } else if (event.error === 'network') {
          setErrorMessage('Network connection error occurred while contacting browser speech service.');
        } else {
          setErrorMessage(`Speech recognition error: ${event.error || 'Unknown error'}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('SpeechRecognition start error:', err);
      setIsListening(false);
      setErrorMessage('Could not initialize microphone. Please check browser permissions.');
      setShowPanel(true);
    }
  };

  // Toggle listening
  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      if (transcript || interimText) {
        executeQuery(transcript || interimText);
      }
    } else {
      startListening();
    }
  };

  // Keyboard shortcut: Escape cancels panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showPanel) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPanel, handleCancel]);

  return (
    <div className="voice-search-container">
      {/* 1. MICROPHONE BUTTON BESIDE SEARCH INPUT */}
      <button
        type="button"
        className={`voice-search-mic-btn ${isListening ? 'is-listening' : ''}`}
        onClick={handleMicClick}
        aria-label={isListening ? 'Stop voice listening' : 'Search with your voice'}
        title="Search with your voice."
        tabIndex={0}
      >
        {isListening ? <Mic size={16} /> : <Mic size={15} />}

        {/* Tooltip on hover */}
        {!isListening && !showPanel && (
          <span className="voice-tooltip" role="tooltip">
            Search with your voice.
          </span>
        )}
      </button>

      {/* 2. VOICE SEARCH LISTENING & LIVE TRANSCRIPTION PANEL */}
      {showPanel && (
        <div ref={panelRef} className="voice-listening-panel" role="dialog" aria-label="Voice Search Assistant">
          {/* Header row: Status Indicator */}
          <div className="voice-listening-header">
            <div className="voice-status-indicator">
              {isListening ? (
                <>
                  <span className="voice-pulse-dot" />
                  <span>Listening...</span>
                </>
              ) : errorMessage ? (
                <span style={{ color: 'var(--accent-terracotta)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <AlertCircle size={14} />
                  <span>Voice Recognition Notice</span>
                </span>
              ) : successFeedback ? (
                <span style={{ color: 'var(--accent-sage-bright)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <Check size={14} />
                  <span>Command Recognized</span>
                </span>
              ) : (
                <span>Speech Completed</span>
              )}
            </div>

            <button
              type="button"
              className="btn-ghost"
              style={{ padding: '0.25rem', borderRadius: 'var(--radius-sm)' }}
              onClick={handleCancel}
              aria-label="Close voice search"
            >
              <X size={15} />
            </button>
          </div>

          {/* Sound-wave Equalizer Animation */}
          {isListening && (
            <div className="voice-waveform" aria-hidden="true">
              <div className="voice-wave-bar" />
              <div className="voice-wave-bar" />
              <div className="voice-wave-bar" />
              <div className="voice-wave-bar" />
              <div className="voice-wave-bar" />
              <div className="voice-wave-bar" />
            </div>
          )}

          {/* Live Transcription Box */}
          <div className="voice-transcript-box">
            {successFeedback ? (
              <span style={{ color: 'var(--accent-sage-bright)', fontWeight: 600, fontSize: '0.94rem' }}>
                {successFeedback}
              </span>
            ) : errorMessage ? (
              <span style={{ color: '#f49b8c', fontSize: '0.86rem', lineHeight: 1.45 }}>
                {errorMessage}
              </span>
            ) : transcript || interimText ? (
              <span className="voice-transcript-text">
                &ldquo;{transcript || interimText}&rdquo;
              </span>
            ) : (
              <span className="voice-transcript-placeholder">
                Speak now... Try a location or navigation command.
              </span>
            )}
          </div>

          {/* Quick Voice Hints Pill Row */}
          {!errorMessage && (
            <div className="voice-hints-row">
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Try saying:</span>
              <button
                type="button"
                className="voice-hint-pill"
                onClick={() => {
                  setTranscript('Search Adyar');
                  executeQuery('Search Adyar');
                }}
              >
                &ldquo;Search Adyar&rdquo;
              </button>
              <button
                type="button"
                className="voice-hint-pill"
                onClick={() => {
                  setTranscript('Find land near Tambaram');
                  executeQuery('Find land near Tambaram');
                }}
              >
                &ldquo;Find land near Tambaram&rdquo;
              </button>
              <button
                type="button"
                className="voice-hint-pill"
                onClick={() => {
                  setTranscript('Open Site Intelligence');
                  executeQuery('Open Site Intelligence');
                }}
              >
                &ldquo;Open Site Intelligence&rdquo;
              </button>
              <button
                type="button"
                className="voice-hint-pill"
                onClick={() => {
                  setTranscript('Show my saved assessments');
                  executeQuery('Show my saved assessments');
                }}
              >
                &ldquo;Show my saved assessments&rdquo;
              </button>
              <button
                type="button"
                className="voice-hint-pill"
                onClick={() => {
                  setTranscript('Search for landmarks near this location');
                  executeQuery('Search for landmarks near this location');
                }}
              >
                &ldquo;Search landmarks&rdquo;
              </button>
            </div>
          )}

          {/* Action Controls Row */}
          <div className="voice-controls-row">
            {isListening ? (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  onClick={handleCancel}
                >
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.4rem 0.95rem' }}
                  onClick={() => {
                    stopListening();
                    if (transcript || interimText) {
                      executeQuery(transcript || interimText);
                    }
                  }}
                >
                  <Square size={13} style={{ fill: 'currentColor' }} />
                  <span>Stop &amp; Search</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  onClick={handleCancel}
                >
                  <span>Dismiss</span>
                </button>
                {errorMessage && isSupported && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.95rem' }}
                    onClick={startListening}
                  >
                    <Mic size={14} />
                    <span>Try Again</span>
                  </button>
                )}
                {transcript && !successFeedback && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.95rem' }}
                    onClick={() => executeQuery(transcript)}
                  >
                    <Search size={13} />
                    <span>Search &ldquo;{transcript}&rdquo;</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
