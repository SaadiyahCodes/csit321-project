import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

const HandsFreeMode = ({ sessionId, onExit }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [language, setLanguage] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState('language_select');
    const [isLoading, setIsLoading] = useState(true);

    const recognitionRef = useRef(null);
    const audioRef = useRef(new Audio());
    const isStartingRef = useRef(false); // ← CRITICAL: Prevents double-start
    const statusRef = useRef('language_select');
    const languageRef = useRef(null);
    const isProcessingRef = useRef(false); // To prevent overlapping commands
    const lastCommandRef = useRef("");
    const pendingAllergenItemRef = useRef(null);

    useEffect(() => {
        statusRef.current = status;
    }, [status]);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            recognitionRef.current = new webkitSpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
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

    const speakText = async (text, lang = language || 'en') => {
        setIsSpeaking(true);
        setResponse(text);

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

            recognitionRef.current.abort(); // 🔥 important reset safety

            setTimeout(() => {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                    setTranscript('');
                    console.log("🎤 Started listening");
                } catch (err) {
                    console.error("Start failed:", err);
                    isStartingRef.current = false;
                }
            }, 400); // 🔥 IMPORTANT: 400ms delay stabilizes WebSpeech API

        } catch (error) {
            console.error('Start error:', error);
            isStartingRef.current = false;
            setIsListening(false);
        }
    };

    const handleSpeechResult = (event) => {
        if (!statusRef.current) return;
        const text = event.results[0][0].transcript.trim();
        setTranscript(text);
        console.log('Heard:', text);

        console.log('STATUS CHECK:', statusRef.current);

        if (statusRef.current === 'language_select') {
            handleLanguageSelection(text);
        } else if (statusRef.current === 'active') {
            handleUserCommand(text);
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
        // ACTIVE mode
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
        }
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

        try {
            if (lower_.includes('menu') || lower_.includes('मेन्यू') || lower_.includes('قائمة')) {

                speakText("Here are some popular items.")

                const res = await api.post('/api/voice/handsfree/menu', {
                    session_id: sessionId,
                    language: lang
                });

                setTimeout(() => {
                    speakText(res.data.text, lang);
                }, 500);
            }

            else if (lower_.includes('cart') || lower_.includes('कार्ट') || lower_.includes('سلة')) {

                const res = await api.post('/api/voice/handsfree/cart', {
                    session_id: sessionId,
                    language: lang
                });

                speakText(res.data.text, lang);
            }

            else if (lower_.includes('checkout') || lower_.includes('الدفع')) {

                const res = await api.post('/api/voice/handsfree/checkout', {
                    session_id: sessionId,
                    language: lang
                });

                speakText(res.data.text, lang);
                statusRef.current = 'checkout_complete';
                setStatus('checkout_complete');
            }

            else {

                const res = await api.post('/api/voice/chat', {
                    session_id: sessionId,
                    language: lang,
                    text: text,
                    allergies: []
                });

                // CHECK FOR ALLERGENS FROM BACKEND
                if (res.data.allergens && res.data.allergens.length > 0) {
                    pendingAllergenItemRef.current = res.data.item;
                    statusRef.current = "allergen_check";
                    speakText(
                        `This item contains ${res.data.allergens.join(", ")}. Do you have any allergies?`,
                        lang
                    );
                    return;
                }
                speakText(res.data.bot_text, lang);
            }

        } catch (error) {
            console.error("Validation Error:", error.response?.data);
            console.error('Command error:', error);
            speakText("Sorry, error occurred.", lang);
        } finally {
            setIsLoading(false);
            isProcessingRef.current = false;
        }
    };

    return (
        <div style={{ ...styles.container, position: 'relative' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(249,115,22,0.1)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000, borderRadius: '10px'
                }}>
                    <div style={{
                        width: '50px', height: '50px', border: '4px solid rgba(249,115,22,0.3)',
                        borderTop: '4px solid #f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                    }} />
                    <p style={{ marginTop: '16px', fontSize: '14px', color: '#f97316', fontWeight: '600' }}>
                        {status === 'language_select' ? 'Starting...' : 'Processing...'}
                    </p>
                </div>
            )}

            <div style={styles.header}>
                <h2>🎤 Hands-Free Mode</h2>
                {status === 'checkout_complete' && (
                    <button onClick={onExit} style={styles.exitButton}>Exit</button>
                )}
            </div>

            <div style={styles.statusIndicator}>
                {isListening && <div style={styles.listening}>🎤 Listening...</div>}
                {isSpeaking && <div style={styles.speaking}>🔊 Speaking...</div>}
            </div>

            <div style={styles.transcript}>
                {transcript && <div style={styles.userMessage}><strong>You:</strong> {transcript}</div>}
                {response && <div style={styles.botMessage}><strong>Bot:</strong> {response}</div>}
            </div>

            <div style={styles.instructions}>
                <p>{status === 'language_select' ? 'Say your language...' :
                    status === 'active' ? 'Say "menu", "cart", or tell me what you want' :
                        'Order complete!'}</p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px', maxWidth: '600px', margin: '0 auto', backgroundColor: '#f5f5f5',
        borderRadius: '10px', minHeight: '100vh'
    },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: '30px' },
    exitButton: {
        padding: '10px 20px', backgroundColor: '#ff4444', color: 'white', border: 'none',
        borderRadius: '5px', cursor: 'pointer'
    },
    statusIndicator: { minHeight: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    listening: { fontSize: '20px', color: '#4CAF50', fontWeight: 'bold' },
    speaking: { fontSize: '20px', color: '#2196F3', fontWeight: 'bold' },
    transcript: { backgroundColor: 'white', padding: '20px', borderRadius: '10px', minHeight: '200px' },
    userMessage: { padding: '10px', backgroundColor: '#e3f2fd', borderRadius: '5px', marginBottom: '10px' },
    botMessage: { padding: '10px', backgroundColor: '#f1f8e9', borderRadius: '5px' },
    instructions: { marginTop: '30px', textAlign: 'center' }
};

export default HandsFreeMode;