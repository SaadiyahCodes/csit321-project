import HandsFreeMode from '../components/HandsFreeMode';

// In your component:
const [handsFreeMode, setHandsFreeMode] = useState(false);

// Add button:
<button
    onClick={() => setHandsFreeMode(true)}
    style={{
        padding: '15px 30px',
        fontSize: '20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        cursor: 'pointer',
        margin: '20px'
    }}
>
    🎤 Start Hands-Free Ordering
</button>

// Render component:
{
    handsFreeMode && (
        <HandsFreeMode
            sessionId={sessionId}
            onExit={() => setHandsFreeMode(false)}
        />
    )
}