// frontend/src/ar/ARViewer.jsx
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Create the XR store outside the component
const store = createXRStore();

export default function ARViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelUrl = searchParams.get("model");

  useEffect(() => {
    // Automatically enter AR when component mounts
    const enterAR = async () => {
      try {
        await store.enterAR();
      } catch (error) {
        console.error("Failed to enter AR:", error);
        alert("AR is not supported on this device or browser");
        // Optionally navigate back if AR fails
        // navigate(-1);
      }
    };

    // Small delay to ensure Canvas is ready
    const timer = setTimeout(enterAR, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 1000,
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        ← Back
      </button>

      <Canvas>
        <XR store={store}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[1, 2, 3]} intensity={2} />
          
          {/* Test box - replace with your model later */}
          <mesh position={[0, 0, -1]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial color="red" />
          </mesh>

          {/* TODO: Load actual 3D model using modelUrl */}
          {/* You'll use useGLTF from @react-three/drei here */}
        </XR>
      </Canvas>
    </div>
  );
}