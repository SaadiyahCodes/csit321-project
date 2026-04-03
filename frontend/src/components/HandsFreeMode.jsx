import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const HandsFreeMode = ({ sessionId, onExit }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [language, setLanguage] = useState(null);
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState('initializing'); // initializing, language_select, active, checkout_complete

    const recognitionRef = useRef(null);
    const audioRef = useRef(new Audio());

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window) {
            recognitionRef.current = new webkitSpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onresult = handleSpeechResult;
            recognitionRef.current.onend = handleSpeechEnd;
            recognitionRef.current.onerror = handleSpeechError;
        }

        // Start with language selection
        setStatus('language_select');
        speakText("Hands-free mode activated. Please say your language: English, Arabic, Hindi, or Urdu.", 'en');

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Auto-start listening after bot finishes speaking
    useEffect(() => {
        if (!isSpeaking && status === 'active' && language) {
            startListening();
        }
    }, [isSpeaking, status, language]);

    const speakText = async (text, lang = language || 'en') => {
        setIsSpeaking(true);
        setResponse(text);

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/voice/tts`, {
                text: text,
                language: lang
            });

            if (res.data.audio) {
                audioRef.current.src = `data:audio/mp3;base64,${res.data.audio}`;
                audioRef.current.onended = () => {
                    setIsSpeaking(false);
                };
                await audioRef.current.play();
            } else {
                setIsSpeaking(false);
            }
        } catch (error) {
            console.error('TTS error:', error);
            setIsSpeaking(false);
        }
    };

    const startListening = () => {
        if (recognitionRef.current && !isListening) {
            setIsListening(true);
            setTranscript('');

            // Set language for recognition
            const langMap = {
                'en': 'en-US',
                'ar': 'ar-SA',
                'hi': 'hi-IN',
                'ur': 'ur-PK'
            };
            recognitionRef.current.lang = langMap[language] || 'en-US';

            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Recognition start error:', error);
                setIsListening(false);
            }
        }
    };

    const handleSpeechResult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        console.log('User said:', text);

        if (status === 'language_select') {
            handleLanguageSelection(text);
        } else if (status === 'active') {
            handleUserCommand(text);
        }
    };

    const handleSpeechEnd = () => {
        setIsListening(false);
    };

    const handleSpeechError = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
    };

    const handleLanguageSelection = (text) => {
        const textLower = text.toLowerCase();
        let selectedLang = 'en';

        if (textLower.includes('arabic') || textLower.includes('arabi')) {
            selectedLang = 'ar';
        } else if (textLower.includes('hindi')) {
            selectedLang = 'hi';
        } else if (textLower.includes('urdu')) {
            selectedLang = 'ur';
        }

        setLanguage(selectedLang);
        setStatus('active');

        const welcomeMessages = {
            'en': "Welcome! I'll help you order. Say 'menu' to hear our dishes, or tell me what you'd like.",
            'ar': "مرحبا! سأساعدك في الطلب. قل 'القائمة' لسماع الأطباق، أو أخبرني بما تريد.",
            'hi': "स्वागत है! मैं आपकी ऑर्डर में मदद करूंगा। 'मेन्यू' कहें या मुझे बताएं कि आप क्या चाहते हैं।",
            'ur': "خوش آمدید! میں آپ کی آرڈر میں مدد کروں گا۔ 'مینو' کہیں یا مجھے بتائیں کہ آپ کیا چاہتے ہیں۔"
        };

        speakText(welcomeMessages[selectedLang], selectedLang);
    };

    const handleUserCommand = async (text) => {
        const textLower = text.toLowerCase();

        try {
            // Check for special commands
            if (textLower.includes('menu') || textLower.includes('मेन्यू') || textLower.includes('قائمة')) {
                // Read full menu
                const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/voice/handsfree/menu`, {
                    session_id: sessionId,
                    language: language
                });

                if (res.data.audio) {
                    speakText(res.data.text, language);
                }

            } else if (textLower.includes('cart') || textLower.includes('कार्ट') || textLower.includes('سلة')) {
                // Read cart
                const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/voice/handsfree/cart`, {
                    session_id: sessionId,
                    language: language
                });

                if (res.data.audio) {
                    speakText(res.data.text, language);
                }

            } else if (textLower.includes('checkout') || textLower.includes('चेकआउट') || textLower.includes('الدفع')) {
                // Checkout
                const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/voice/handsfree/checkout`, {
                    session_id: sessionId,
                    language: language
                });

                if (res.data.audio) {
                    speakText(res.data.text, language);
                    setStatus('checkout_complete');
                }

            } else {
                // Regular chatbot conversation
                const chatRes = await axios.post(`${process.env.REACT_APP_API_URL}/api/voice/chat`, {
                    audio: null, // We already have text
                    session_id: sessionId,
                    language: language,
                    text: text,
                    allergies: []
                });

                if (chatRes.data.response) {
                    speakText(chatRes.data.response, language);

                    // Check if items were added
                    if (chatRes.data.items_added && chatRes.data.items_added.length > 0) {
                        console.log('Items added:', chatRes.data.items_added);
                    }
                }
            }

        } catch (error) {
            console.error('Command handling error:', error);
            speakText("Sorry, I didn't understand. Please try again.", language);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h2>🎤 Hands-Free Mode</h2>
                {status === 'checkout_complete' && (
                    <button onClick={onExit} style={styles.exitButton}>
                        Exit Hands-Free Mode
                    </button>
                )}
            </div>

            <div style={styles.statusIndicator}>
                {isListening && (
                    <div style={styles.listening}>
                        <div style={styles.pulse}></div>
                        <p>Listening...</p>
                    </div>
                )}

                {isSpeaking && (
                    <div style={styles.speaking}>
                        <div style={styles.soundWave}></div>
                        <p>Speaking...</p>
                    </div>
                )}
            </div>

            <div style={styles.transcript}>
                {transcript && (
                    <div style={styles.userMessage}>
                        <strong>You:</strong> {transcript}
                    </div>
                )}

                {response && (
                    <div style={styles.botMessage}>
                        <strong>Assistant:</strong> {response}
                    </div>
                )}
            </div>

            <div style={styles.instructions}>
                <p style={styles.instructionText}>
                    {status === 'language_select' && 'Say your language...'}
                    {status === 'active' && 'Say "menu" to hear dishes, or tell me what you want'}
                    {status === 'checkout_complete' && 'Order complete! Have a nice meal!'}
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        minHeight: '100vh'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px'
    },
    exitButton: {
        padding: '10px 20px',
        backgroundColor: '#ff4444',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    },
    statusIndicator: {
        minHeight: '100px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    listening: {
        textAlign: 'center'
    },
    speaking: {
        textAlign: 'center'
    },
    pulse: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#4CAF50',
        animation: 'pulse 1.5s infinite',
        margin: '0 auto 10px'
    },
    soundWave: {
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#2196F3',
        animation: 'wave 1s infinite',
        margin: '0 auto 10px'
    },
    transcript: {
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '10px',
        minHeight: '200px',
        marginTop: '20px'
    },
    userMessage: {
        padding: '10px',
        backgroundColor: '#e3f2fd',
        borderRadius: '5px',
        marginBottom: '10px'
    },
    botMessage: {
        padding: '10px',
        backgroundColor: '#f1f8e9',
        borderRadius: '5px'
    },
    instructions: {
        marginTop: '30px',
        textAlign: 'center'
    },
    instructionText: {
        fontSize: '18px',
        color: '#666'
    }
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.7; }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  @keyframes wave {
    0%, 100% { transform: scaleY(1); }
    50% { transform: scaleY(1.2); }
  }
`, styleSheet.cssRules.length);

export default HandsFreeMode;