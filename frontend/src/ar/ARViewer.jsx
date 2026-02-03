import { Canvas, useFrame } from "@react-three/fiber";
import { XR, useXRHitTest, isARSupported } from "@react-three/xr";
import { useRef, useState } from "react";
import { useGLTF, Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * ARModel
 * Loads and renders the 3D GLB model
 */
function ARModel({ url }) {
  const { scene } = useGLTF(url);

  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return <primitive object={scene} scale={0.3} />;
}

/**
 * Placement
 * Handles hit testing and object placement in AR
 */
function Placement({ modelUrl, dishName }) {
  const ref = useRef();
  const textRef = useRef();
  const [placed, setPlaced] = useState(false);

  // Continuous hit test
  useXRHitTest(
    (results, getWorldMatrix) => {
      if (!placed && results.length > 0) {
        const matrix = new THREE.Matrix4();
        getWorldMatrix(matrix, results[0]);
        ref.current.position.setFromMatrixPosition(matrix);
        ref.current.quaternion.setFromRotationMatrix(matrix);
      }
    },
    "viewer",      // cast rays from the viewer/camera
    "plane"        // hit-test against detected planes
  );

  // Make text face the camera
  useFrame(({ camera }) => {
    if (textRef.current) textRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={ref} onClick={() => setPlaced(true)}>
      <ARModel url={modelUrl} />
      {dishName && (
        <Text
          ref={textRef}
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {dishName}
        </Text>
      )}
    </group>
  );
}

/**
 * ARViewer
 * Full-screen AR / fallback 3D viewer
 */
export default function ARViewer({ modelUrl, dishName, onClose }) {
  const [isARReady, setIsARReady] = useState(false);

  // Check if device supports AR
  const arSupported = isARSupported();

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.85)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          background: "black",
          color: "white",
          border: "1px solid white",
          padding: "8px 12px",
          cursor: "pointer",
          borderRadius: "6px",
          zIndex: 1001,
        }}
      >
        ✕ Close
      </button>

      {/* Render AR if supported */}
      {arSupported ? (
        <Canvas shadows camera={{ position: [0, 1.5, 3], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight intensity={0.8} position={[5, 10, 5]} castShadow />
          <hemisphereLight intensity={0.6} skyColor="white" groundColor="gray" />

          <XR
            sessionInit={{ requiredFeatures: ["hit-test"] }}
            onSessionStart={() => setIsARReady(true)}
          >
            {isARReady && <Placement modelUrl={modelUrl} dishName={dishName} />}
          </XR>
        </Canvas>
      ) : (
        // Fallback: just render model in regular Canvas
        <Canvas shadows camera={{ position: [0, 1.5, 3], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight intensity={0.8} position={[5, 10, 5]} castShadow />
          <hemisphereLight intensity={0.6} skyColor="white" groundColor="gray" />

          <Placement modelUrl={modelUrl} dishName={dishName} />
        </Canvas>
      )}
    </div>
  );
}
