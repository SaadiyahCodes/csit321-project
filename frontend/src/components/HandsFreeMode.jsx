import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, MicOff, Volume2 } from 'lucide-react';
import api from '../api';
import { useCustomerAuth } from '../context/CustomerAuthContext';

const HandsFreeMode = ({ sessionId, onExit }) => {
    const { customer, profile } = useCustomerAuth();
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [language, setLanguage] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState('language_select');
    const [isLoading, setIsLoading] = useState(true);

    const recognitionRef = useRef(null);
    const audioRef = useRef(new Audio());
    const audioContextRef = useRef(null);
    const isStartingRef = useRef(false); // ← CRITICAL: Prevents double-start
    const statusRef = useRef('language_select');
    const languageRef = useRef(null);
    const isProcessingRef = useRef(false); // To prevent overlapping commands
    const lastCommandRef = useRef("");
    const pendingAllergenItemRef = useRef(null);

    //HAPTIC FEEDBACK
    const vibrate = (pattern) => {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    };

    //AUDIO FEEDBACK
    const playSound = (type) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const audioContext = audioContextRef.current;
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Different sounds for different events
             if (type === 'listening_started') {
                // Rising tone - "I'm ready to listen"
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15);
                gainNode.gain.value = 0.3;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.15);
            } 
            else if (type === 'speech_captured') {
                // Short high beep - "Got it!"
                oscillator.frequency.value = 1000;
                gainNode.gain.value = 0.35;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.08);
            } 
            else if (type === 'processing') {
                // Double beep - "Thinking..."
                oscillator.frequency.value = 600;
                gainNode.gain.value = 0.25;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                
                setTimeout(() => {
                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioContext.destination);
                    osc2.frequency.value = 600;
                    gain2.gain.value = 0.25;
                    osc2.start();
                    osc2.stop(audioContext.currentTime + 0.1);
                }, 120);
            }
            else if (type === 'speaking') {
                // Falling tone - "I'm about to speak"
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.2);
                gainNode.gain.value = 0.25;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.2);
            }
            else if (type === 'error') {
                // Triple descending beeps - "Error!"
                oscillator.frequency.value = 500;
                gainNode.gain.value = 0.35;
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.1);
                
                setTimeout(() => {
                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioContext.destination);
                    osc2.frequency.value = 400;
                    gain2.gain.value = 0.35;
                    osc2.start();
                    osc2.stop(audioContext.currentTime + 0.1);
                }, 150);
                
                setTimeout(() => {
                    const osc3 = audioContext.createOscillator();
                    const gain3 = audioContext.createGain();
                    osc3.connect(gain3);
                    gain3.connect(audioContext.destination);
                    osc3.frequency.value = 300;
                    gain3.gain.value = 0.35;
                    osc3.start();
                    osc3.stop(audioContext.currentTime + 0.1);
                }, 300);
            }
        } catch (error) {
            console.log("Audio context not available:", error);
        }
    };

    const provideFeedback = (type, message = '') => {
        switch(type) {
            case 'listening_started':
                playSound('capture');
                vibrate(50);
                break;
            case 'speech_captured':
                playSound('capture');
                vibrate(100);
                break;
            case 'processing':
                playSound('processing');
                vibrate(50);
                break;
            case 'speaking':
                vibrate(200); // Longer vibration when bot starts speaking
                break;
            case 'error':
                playSound('error');
                vibrate([100, 50, 100]);
                break;
        }
    };

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            recognitionRef.current = new webkitSpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = handleSpeechResult;
            recognitionRef.current.onend = handleSpeechEnd;
            recognitionRef.current.onerror = handleSpeechError;
        }

        speakText("Please say your language: English, Arabic, Hindi, Urdu, Spanish, or French.", 'en');

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    // Modify onExit to stop audio:
    const handleExit = () => {
        // Stop any playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.src = '';
            audioRef.current.onended = null;
        }
        
        // Stop speech recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                recognitionRef.current.abort();
                recognitionRef.current.onresult = null;
                recognitionRef.current.onend = null;
                recognitionRef.current.onerror = null;
            } catch (e) {
                console.log("Recognition already stopped");
            }
        }

        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        if (navigator.vibrate) {
            navigator.vibrate(0);
        }

        setIsListening(false);
        setIsSpeaking(false);
        setIsLoading(false);
        setTranscript('');
        setResponse('');

        isStartingRef.current = false;
        isProcessingRef.current = false;
        
        // Call parent's onExit
        onExit();
    };

    const speakText = async (text, lang = language || 'en') => {
        setIsSpeaking(true);
        setResponse(text);
        provideFeedback('speaking');

        try {
            const res = await api.post('/api/voice/tts', null, {
                params: { text, language: lang }
            });

            if (res.data.success && res.data.audio) {
                setIsLoading(false);
                // Stop any previous audio
                audioRef.current.pause();
                audioRef.current.currentTime = 0;

                audioRef.current.src = `data:audio/mp3;base64,${res.data.audio}`;
                audioRef.current.onended = () => {
                    console.log("Audio finished");
                    setIsSpeaking(false);
                    console.log("Status at audio end:", statusRef.current);
                    if (
                        statusRef.current === 'language_select' ||
                        statusRef.current === 'active'
                    ) {
                        setTimeout(() => {
                            startListening();
                        }, 700);
                    }
                };
                await audioRef.current.play();
            }
        } catch (error) {
            console.error('TTS error:', error);
            setIsLoading(false);
            setIsSpeaking(false);
        }
    };

    const startListening = () => {
        if (!recognitionRef.current) return;

        if (isListening || isStartingRef.current) {
            console.log("Skipping start - already listening/starting");
            return;
        }
        try {
            isStartingRef.current = true;

            recognitionRef.current.abort(); // important reset safety

            setTimeout(() => {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                    setTranscript('');
                    provideFeedback('listening_started');
                    console.log("🎤 Started listening");

                    setTimeout(() => {
                        if (recognitionRef.current && isListening) {
                            console.log("⏰ Manual timeout - stopping recognition");
                            recognitionRef.current.stop();
                        }
                    }, 10000); // 10 seconds max listening time
                } catch (err) {
                    console.error("Start failed:", err);
                    provideFeedback('error');
                    isStartingRef.current = false;
                }
            }, 400); // IMPORTANT: 400ms delay stabilizes WebSpeech API

        } catch (error) {
            console.error('Start error:', error);
            isStartingRef.current = false;
            setIsListening(false);
        }
    };

    const handleSpeechResult = (event) => {
        if (!statusRef.current) return;
        const lastResult = event.results[event.results.length - 1];
        const text = lastResult[0].transcript.trim();
        setTranscript(text);

        if (lastResult.isFinal) {
            console.log('Final heard:', text);
            provideFeedback('speech_captured');
            if (statusRef.current === 'language_select') {
                handleLanguageSelection(text);
            } else if (statusRef.current === 'active') {
                handleUserCommand(text);
            }
        }
    };

    const handleSpeechEnd = () => {
        console.log('Recognition ended');
        setIsListening(false);
        isStartingRef.current = false;
        console.log(
            "SpeechEnd check:",
            "status:", statusRef.current,
            "isSpeaking:", isSpeaking,
            "isLoading:", isLoading
        );
        if (statusRef.current === 'checkout_complete') {
            console.log("Stopping mic after checkout");
            return;
        }
        {/*// ACTIVE mode
        if (statusRef.current === 'active') {
            if (isSpeaking || isLoading) {
                console.log("Waiting before restart...");
                setTimeout(handleSpeechEnd, 800);
                return;
            }
            console.log("Restarting mic (active mode)");
            setTimeout(() => startListening(), 1000);
        }
        // LANGUAGE selection mode
        else if (statusRef.current === 'language_select' && !isSpeaking) {
            console.log("Restarting mic (language select)");
            setTimeout(() => startListening(), 700);
        }*/}
    };

    const handleSpeechError = (event) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        isStartingRef.current = false;
        if (event.error === 'no-speech') {
            console.log("Retrying listening...");
            setTimeout(() => {
                startListening();
            }, 1000);
        }
    };

    const handleLanguageSelection = (text) => {
        const lower = text.toLowerCase();
        let lang = 'en';

        if (lower.includes('arabic') || lower.includes('عربي')) lang = 'ar';
        else if (lower.includes('hindi') || lower.includes('हिंदी')) lang = 'hi';
        else if (lower.includes('urdu') || lower.includes('اردو')) lang = 'ur';
        else if (lower.includes('spanish') || lower.includes('español')) lang = 'es';
        else if (lower.includes('french') || lower.includes('français')) lang = 'fr';

        setLanguage(lang);
        languageRef.current = lang; // <- immediately store in ref
        statusRef.current = 'active'; // <- also update status ref immediately
        setStatus('active');

        // Update recognition language
        const langMap = {
            'en': 'en-US', 'ar': 'ar-SA', 'hi': 'hi-IN',
            'ur': 'ur-PK', 'es': 'es-ES', 'fr': 'fr-FR'
        };
        recognitionRef.current.lang = langMap[lang];

        const welcome = {
            'en': "Welcome! Say menu to hear dishes, or tell me what you want.",
            'ar': "مرحبا! قل القائمة أو أخبرني.",
            'hi': "स्वागत है! मेन्यू कहें या बताएं।",
            'ur': "خوش آمدید! مینو کہیں۔",
            'es': "¡Bienvenido! Di menú o dime qué quieres.",
            'fr': "Bienvenue! Dites menu ou dites-moi."
        };

        speakText(welcome[lang], lang);
    };

    const handleUserCommand = async (text) => {
        const lang = languageRef.current;
        const lower_ = text.toLowerCase();

        // 🟢 HANDLE ALLERGEN CONFIRMATION STATE
        if (statusRef.current === "allergen_check") {

            if (
                lower_.includes("no") ||
                lower_.includes("don't") ||
                lower_.includes("no allergy")
            ) {
                const item = pendingAllergenItemRef.current;
                if (item) {
                    speakText(
                        "Great. Adding the item to your cart.",
                        lang
                    );
                    // call backend to add item now
                    await api.post('/api/voice/handsfree/add', {
                        session_id: sessionId,
                        item_id: item.id,
                        language: lang
                    });
                    speakText(
                        "Item added to your cart. Would you like to checkout or continue ordering?",
                        lang
                    );
                    pendingAllergenItemRef.current = null;
                    statusRef.current = "active";
                    return;
                }
            }

            if (
                lower_.includes("yes") ||
                lower_.includes("i have") ||
                lower_.includes("allergic")
            ) {
                speakText(
                    "Thank you for letting me know. I will not add this item. Would you like a safer alternative?",
                    lang
                );
                pendingAllergenItemRef.current = null;
                statusRef.current = "active";
                return;
            }
        }

        console.log("languageRef:", languageRef.current);
        console.log("language state:", language);
        console.log('Handling command in language:', lang);
        console.log('Command received:', text);

        if (lastCommandRef.current === text) return;
        lastCommandRef.current = text;

        if (isProcessingRef.current) {
            console.log("Already processing — ignoring duplicate");
            return;
        }

        isProcessingRef.current = true;

        if (!lang) return;
        setIsLoading(true);
        provideFeedback('processing');

        try {
            if (lower_.includes('menu') || lower_.includes('मेन्यू') || lower_.includes('قائمة')) {
                const res = await api.post('/api/voice/handsfree/menu', {
                    session_id: sessionId,
                    language: lang
                });

                if (res.data?.text) {
                    speakText(res.data.text, lang);
                } else {
                    throw new Error("Invalid menu response");
                }
            }

            else if (lower_.includes('cart') || lower_.includes('कार्ट') || lower_.includes('سلة')) {
                const res = await api.post('/api/voice/handsfree/cart', {
                    session_id: sessionId,
                    language: lang
                });

                if (res.data?.text) {
                    speakText(res.data.text, lang);
                } else {
                    throw new Error("Invalid cart response");
                }
            }

            else if (lower_.includes('checkout') || lower_.includes('الدفع')) {
                const res = await api.post('/api/voice/handsfree/checkout', {
                    session_id: sessionId,
                    language: lang
                });

                if (res.data?.text) {
                    speakText(res.data.text, lang);
                    statusRef.current = 'checkout_complete';
                    setStatus('checkout_complete');
                } else {
                    throw new Error("Invalid checkout response");
                }
            }

            else {
                const res = await api.post('/api/voice/chat', {
                    session_id: sessionId,
                    language: lang,
                    text: text,
                    allergies: []
                });

                // CHECK FOR REJECTED ITEMS
                if (res.data.intent?.items_rejected?.length > 0) {
                    const rejectedItems = res.data.intent.items_rejected.map(i => i.name).join(", ");
                    speakText(
                        `${res.data.bot_text} Note: I didn't recommend ${rejectedItems} due to your dietary restrictions.`,
                        lang
                    );
                    return;
                }

                // CHECK FOR ALLERGENS
                if (res.data.allergens && res.data.allergens.length > 0) {
                    pendingAllergenItemRef.current = res.data.item;
                    statusRef.current = "allergen_check";
                    speakText(
                        `This item contains ${res.data.allergens.join(", ")}. Do you have any allergies?`,
                        lang
                    );
                    return;
                }
                
                if (res.data?.bot_text) {
                    speakText(res.data.bot_text, lang);
                }
            }

        } catch (error) {
            console.error("Command error:", error);
            console.error("Error details:", error.response?.data);
            provideFeedback('error');
            speakText("Sorry, an error occurred.", lang || 'en');
        } finally {
            setIsLoading(false);
            isProcessingRef.current = false;
        }
    };

    // Get current status message
    const getStatusMessage = () => {
        if (status === 'language_select') return 'Say your language...';
        if (status === 'checkout_complete') return 'Order complete!';
        if (isProcessing) return 'Processing...';
        if (isSpeaking) return 'Speaking...';
        if (isListening) return 'Listening...';
        return 'Say menu to hear dishes, or tell me what you want';
    };
 
    const isProcessing = isLoading && !isSpeaking && !isListening;

    return (
        <>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(1.05); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes ripple {
                    0% { transform: scale(1); opacity: 0.6; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
 
            {/* Greyed Background Overlay */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    zIndex: 9998,
                    backdropFilter: 'blur(4px)',
                }}
            />
 
            {/* Main Container */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    overflow: 'hidden',
                }}
            >
                {/* Header - Top */}
                <div
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        right: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    {/* Exit button - LEFT SIDE */}
                    <button
                        onClick={handleExit}
                        style={{
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
                        }}
                    >
                        <X size={20} />
                    </button>

                    {/* Title badge - RIGHT SIDE */}
                    <div
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        Hands-Free Mode
                    </div>
                </div>

 
                {/* Central Microphone Icon */}
                <div
                    style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '40px',
                    }}
                >
                    {/* Ripple effect when listening */}
                    {isListening && (
                        <>
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '200px',
                                    height: '200px',
                                    borderRadius: '50%',
                                    backgroundColor: '#4CAF50',
                                    animation: 'ripple 1.5s ease-out infinite',
                                }}
                            />
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '200px',
                                    height: '200px',
                                    borderRadius: '50%',
                                    backgroundColor: '#4CAF50',
                                    animation: 'ripple 1.5s ease-out infinite 0.5s',
                                }}
                            />
                        </>
                    )}
 
                    {/* Main microphone circle */}
                    <div
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            backgroundColor: isListening
                                ? '#4CAF50'
                                : isSpeaking
                                ? '#2196F3'
                                : isProcessing
                                ? '#f97316'
                                : '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isListening || isSpeaking || isProcessing
                                ? '0 8px 32px rgba(249,115,22,0.5)'
                                : '0 4px 16px rgba(0,0,0,0.3)',
                            animation: (isListening || isSpeaking) ? 'pulse 1.5s ease-in-out infinite' : 'none',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            zIndex: 10,
                        }}
                    >
                        {isProcessing ? (
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '4px solid rgba(255,255,255,0.3)',
                                    borderTop: '4px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite',
                                }}
                            />
                        ) : isSpeaking ? (
                            <Volume2 size={48} color="white" />
                        ) : isListening ? (
                            <Mic size={48} color="white" />
                        ) : (
                            <MicOff size={48} color="white" />
                        )}
                    </div>
                </div>
 
                {/* Status Text */}
                <div
                    style={{
                        textAlign: 'center',
                        marginBottom: '60px',
                    }}
                >
                    <p
                        style={{
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 8px 0',
                        }}
                    >
                        {getStatusMessage()}
                    </p>
                    {language && (
                        <p
                            style={{
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '14px',
                                margin: 0,
                            }}
                        >
                            Language: {language.toUpperCase()}
                        </p>
                    )}

                    {/* ✅ NEW - Show allergen profile if exists */}
                    {customer && (profile?.allergens?.length > 0 || profile?.dietary_preferences?.length > 0) && (
                        <div
                            style={{
                                marginTop: '12px',
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>
                                🛡️ Profile Active: {[
                                    ...(profile.allergens || []),
                                    ...(profile.dietary_preferences || [])
                                ].join(', ')}
                            </p>
                        </div>
                    )}
                </div>
 
                {/* YouTube-style Subtitles at Bottom */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '90%',
                        maxWidth: '800px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        alignItems: 'center',
                    }}
                >
                    {/* User transcript */}
                    {transcript && (
                        <div
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                maxWidth: '80%',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                animation: 'slideUp 0.3s ease-out',
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    color: '#111827',
                                    fontWeight: '500',
                                    textAlign: 'center',
                                }}
                            >
                                <span style={{ color: '#f97316', fontWeight: '700' }}>You:</span> {transcript}
                            </p>
                        </div>
                    )}
 
                    {/* Bot response */}
                    {response && (
                        <div
                            style={{
                                backgroundColor: 'rgba(249,115,22,0.95)',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                maxWidth: '80%',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                animation: 'slideUp 0.3s ease-out',
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: '16px',
                                    color: 'white',
                                    fontWeight: '500',
                                    textAlign: 'center',
                                }}
                            >
                                <span style={{ fontWeight: '700' }}>Gusto:</span> {response}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

};

export default HandsFreeMode;