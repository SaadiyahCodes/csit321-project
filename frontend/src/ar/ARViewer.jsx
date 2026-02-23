// frontend/src/ar/ARViewer.jsx
import { Canvas } from "@react-three/fiber";
import { XR, createXRStore, useXRHitTest, useXRInputSourceEvent } from "@react-three/xr";
import { useGLTF } from "@react-three/drei";
import { useRef, useState, Suspense, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Matrix4, Vector3, Quaternion, Box3 } from "three";

const store = createXRStore();
const matrix = new Matrix4();

// ─── Model ───────────────────────────────────────────────────────────────────
// Receives the raw WebXR world-space matrix array from a hit-test result.
// We decompose it into position + quaternion so that Three.js can apply the
// model's own local scale cleanly on top, without corrupting world-space axes.
function Model({ url, matrixArray }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef();
  const TARGET_SIZE = 0.30; // metres

  useEffect(() => {
    if (!groupRef.current || !matrixArray) return;

    // 1. Decompose the world matrix into pos + quat (ignore its scale component,
    //    which is always 1 from WebXR, but decomposing is safer than .fromArray).
    const worldMatrix = new Matrix4().fromArray(matrixArray);
    const pos = new Vector3();
    const quat = new Quaternion();
    const scl = new Vector3();
    worldMatrix.decompose(pos, quat, scl);

    // 2. Apply position and rotation via normal Three.js properties so that
    //    matrixAutoUpdate keeps working and child transforms stay correct.
    groupRef.current.position.copy(pos);
    groupRef.current.quaternion.copy(quat);

    // 3. Auto-scale the model to TARGET_SIZE in its largest dimension.
    //    Do this AFTER setting position/rotation so the bounding box is accurate.
    groupRef.current.scale.set(1, 1, 1); // reset before measuring
    const box = new Box3().setFromObject(groupRef.current);
    const size = new Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const autoScale = TARGET_SIZE / maxDim;
      groupRef.current.scale.setScalar(autoScale);
    }
  }, [scene, matrixArray]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// ─── HitTestPlacement ────────────────────────────────────────────────────────
function HitTestPlacement({ onPlace, placed, onStableChange }) {
  const reticleRef = useRef();
  const lastHitPos = useRef(new Vector3());
  const stablePos = useRef(new Vector3());
  const stableMatrix = useRef(new Matrix4());
  const stableTimer = useRef(null);
  const isStableRef = useRef(false);
  const [isStable, setIsStable] = useState(false);

  useXRHitTest((results, getWorldMatrix) => {
    if (!results.length || placed) return;
    getWorldMatrix(matrix, results[0]);
    lastHitPos.current.setFromMatrixPosition(matrix);

    if (reticleRef.current) {
      reticleRef.current.visible = true;
      reticleRef.current.position.setFromMatrixPosition(matrix);
      // Keep reticle flat (extracted rotation might tilt it — override pitch)
      reticleRef.current.rotation.x = -Math.PI / 2;
    }

    const dist = lastHitPos.current.distanceTo(stablePos.current);
    if (dist < 0.02) {
      if (!stableTimer.current) {
        stableTimer.current = setTimeout(() => {
          isStableRef.current = true;
          setIsStable(true);
          onStableChange?.(true);
          stableMatrix.current.copy(matrix);
        }, 300);
      }
    } else {
      stablePos.current.copy(lastHitPos.current);
      if (isStableRef.current) {
        isStableRef.current = false;
        setIsStable(false);
        onStableChange?.(false);
      }
      if (stableTimer.current) {
        clearTimeout(stableTimer.current);
        stableTimer.current = null;
      }
    }
  }, "viewer", "plane");

  // Use ref in the select handler so it always sees the latest stability state
  // without needing to re-register the event listener on every render.
  useXRInputSourceEvent(
    "all",
    "select",
    useCallback(() => {
      if (placed || !isStableRef.current) return;
      onPlace(stableMatrix.current.toArray());
    }, [placed, onPlace]),
    [placed, onPlace]
  );

  if (placed) return null;

  return (
    <mesh ref={reticleRef} visible={false} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.08, 0.1, 32]} />
      <meshBasicMaterial color={isStable ? "lime" : "yellow"} transparent opacity={0.8} />
    </mesh>
  );
}

// ─── ARViewer ────────────────────────────────────────────────────────────────
export default function ARViewer() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelUrl = searchParams.get("model");

  const [placed, setPlaced] = useState(false);
  const [modelMatrix, setModelMatrix] = useState(null);

  const placeModel = useCallback((matrixArray) => {
    setModelMatrix(matrixArray);
    setPlaced(true);
  }, []);

  const resetPlacement = useCallback(() => {
    setPlaced(false);
    setModelMatrix(null);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      {/* DOM Overlay — must exist in the DOM before the XR session starts */}
      <div
        id="ar-overlay"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          zIndex: 10,
          display: "flex",
          justifyContent: "space-between",
          padding: 20,
        }}
      >
        <button onClick={() => navigate(-1)} style={buttonStyle}>
          ← Back
        </button>
        {placed && (
          <button onClick={resetPlacement} style={buttonStyle}>
            Replace
          </button>
        )}
      </div>

      {!placed && (
        <div style={instructionStyle}>
          Point at a surface · tap when ring turns green
        </div>
      )}

      <Canvas
        onCreated={() => {
          store.enterAR();
        }}
      >
        <XR
          store={store}
          sessionInit={{
            requiredFeatures: ["hit-test"],
            // anchors keep the model locked even when ARCore loses plane tracking
            optionalFeatures: ["dom-overlay", "anchors"],
            domOverlay: { root: document.getElementById("ar-overlay") },
          }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[3, 5, 3]} intensity={1} />

          <HitTestPlacement onPlace={placeModel} placed={placed} />

          {/* FIX: pass matrixArray, not position/scale */}
          {placed && modelUrl && modelMatrix && (
            <Suspense fallback={null}>
              <Model url={modelUrl} matrixArray={modelMatrix} />
            </Suspense>
          )}
        </XR>
      </Canvas>
    </div>
  );
}

const buttonStyle = {
  padding: "10px 20px",
  background: "rgba(0,0,0,0.6)",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  cursor: "pointer",
};

const instructionStyle = {
  position: "absolute",
  bottom: 80,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 10,
  background: "rgba(0,0,0,0.6)",
  color: "white",
  padding: "12px 24px",
  borderRadius: 20,
  fontSize: 14,
};