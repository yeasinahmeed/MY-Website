import { Component, useEffect, useMemo, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface ProjectMockup3DProps {
  imageUrl: string;
  title: string;
  mode: 'laptop' | 'phone';
}

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function MockupEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const rt = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = rt.texture;
    return () => {
      scene.environment = null;
      rt.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function DeviceMesh({
  imageUrl,
  mode,
  reducedMotion,
}: {
  imageUrl: string;
  mode: 'laptop' | 'phone';
  reducedMotion: boolean;
}) {
  const { gl, pointer } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [screenTexture, setScreenTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (tex) => {
        if (!active) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(gl.capabilities.getMaxAnisotropy?.() || 4, 8);
        setScreenTexture(tex);
      },
      undefined,
      () => {
        // Ignore load errors gracefully
      },
    );
    return () => {
      active = false;
    };
  }, [imageUrl, gl]);

  useEffect(() => {
    return () => {
      screenTexture?.dispose();
    };
  }, [screenTexture]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!groupRef.current) return;
    const targetY = reducedMotion
      ? -0.2
      : pointer.x * 0.35 + Math.sin(state.clock.elapsedTime * 0.4) * 0.14;
    const targetX = reducedMotion ? 0.12 : -pointer.y * 0.16 + 0.12;
    groupRef.current.rotation.y = THREE.MathUtils.damp(
      groupRef.current.rotation.y,
      targetY,
      4.5,
      dt,
    );
    groupRef.current.rotation.x = THREE.MathUtils.damp(
      groupRef.current.rotation.x,
      targetX,
      4.5,
      dt,
    );
  });

  const screenMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: screenTexture || null,
        color: screenTexture ? '#ffffff' : '#ECECE7',
        roughness: 0.22,
        metalness: 0.05,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    [screenTexture],
  );

  useEffect(() => {
    return () => screenMat.dispose();
  }, [screenMat]);

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
      {mode === 'laptop' ? (
        <group>
          {/* Aluminum Base Deck */}
          <mesh position={[0, -0.78, 0.55]} rotation={[0.06, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.4, 0.09, 2.2]} />
            <meshStandardMaterial color="#D4D4CE" metalness={0.88} roughness={0.22} />
          </mesh>
          {/* Keyboard recess */}
          <mesh position={[0, -0.725, 0.38]} rotation={[0.06, 0, 0]}>
            <boxGeometry args={[2.7, 0.02, 1.0]} />
            <meshStandardMaterial color="#181917" metalness={0.2} roughness={0.7} />
          </mesh>
          {/* Gold hinge accent */}
          <mesh position={[0, -0.72, -0.52]}>
            <boxGeometry args={[2.6, 0.07, 0.12]} />
            <meshStandardMaterial color="#C59B43" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Display Lid */}
          <group position={[0, 0.26, -0.55]} rotation={[-0.14, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[3.4, 2.18, 0.08]} />
              <meshStandardMaterial color="#181917" metalness={0.82} roughness={0.26} />
            </mesh>
            <mesh position={[0, 0, 0.045]} material={screenMat}>
              <planeGeometry args={[3.16, 1.98]} />
            </mesh>
          </group>
        </group>
      ) : (
        <group position={[0, 0.1, 0]}>
          {/* Phone chassis */}
          <mesh castShadow>
            <boxGeometry args={[1.64, 3.24, 0.14]} />
            <meshStandardMaterial color="#181917" metalness={0.88} roughness={0.22} />
          </mesh>
          {/* Champagne-gold bezel */}
          <mesh position={[0, 0, -0.005]}>
            <boxGeometry args={[1.68, 3.28, 0.08]} />
            <meshStandardMaterial color="#C59B43" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Project image mapped onto 3D phone screen */}
          <mesh position={[0, 0, 0.075]} material={screenMat}>
            <planeGeometry args={[1.48, 3.04]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

class MockupErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(_err: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function ProjectMockup3D({ imageUrl, title, mode }: ProjectMockup3DProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const fallback = (
    <img
      src={imageUrl}
      alt={title}
      referrerPolicy="no-referrer"
      className="w-full h-full object-cover"
    />
  );

  return (
    <div className="w-full h-full bg-[#ECECE7]">
      <MockupErrorBoundary fallback={fallback}>
        <Canvas
          dpr={isSoftwareGl ? 1 : [1, 1.75]}
          camera={{ position: [0, 0.3, 5.1], fov: 38 }}
          gl={{ antialias: !isSoftwareGl, powerPreference: 'high-performance', alpha: true }}
        >
          <MockupEnvironment />
          <hemisphereLight args={['#faf6ec', '#2b2d2a', 0.9]} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} color="#fff9f0" />
          <DeviceMesh imageUrl={imageUrl} mode={mode} reducedMotion={reducedMotion} />
        </Canvas>
      </MockupErrorBoundary>
    </div>
  );
}
