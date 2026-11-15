import { Component, useEffect, useMemo, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

interface HeroScene3DProps {
  scrollProgress: number;
}

const _camTarget = new THREE.Vector3();

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

function createRoundedRectGeometry(width: number, height: number, radius: number, depth: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.02,
    bevelSegments: 3,
  });
  geo.center();
  return geo;
}

// Procedural architectural letterforms for "YEASIN" extruded in 3D
function buildYeasinLetterShapes(): THREE.Shape[] {
  const shapes: THREE.Shape[] = [];
  const t = 0.13; // stroke thickness
  const h = 0.62; // cap height
  const w = 0.42; // letter width
  const gap = 0.11;

  // Y
  {
    const x = 0;
    const s = new THREE.Shape();
    s.moveTo(x, h);
    s.lineTo(x + t, h);
    s.lineTo(x + w / 2, h * 0.56);
    s.lineTo(x + w - t, h);
    s.lineTo(x + w, h);
    s.lineTo(x + w / 2 + t * 0.5, h * 0.42);
    s.lineTo(x + w / 2 + t * 0.5, 0);
    s.lineTo(x + w / 2 - t * 0.5, 0);
    s.lineTo(x + w / 2 - t * 0.5, h * 0.42);
    s.closePath();
    shapes.push(s);
  }

  // E
  {
    const x = (w + gap) * 1;
    const s = new THREE.Shape();
    s.moveTo(x, 0);
    s.lineTo(x + w, 0);
    s.lineTo(x + w, t);
    s.lineTo(x + t, t);
    s.lineTo(x + t, h * 0.5 - t * 0.45);
    s.lineTo(x + w * 0.85, h * 0.5 - t * 0.45);
    s.lineTo(x + w * 0.85, h * 0.5 + t * 0.45);
    s.lineTo(x + t, h * 0.5 + t * 0.45);
    s.lineTo(x + t, h - t);
    s.lineTo(x + w, h - t);
    s.lineTo(x + w, h);
    s.lineTo(x, h);
    s.closePath();
    shapes.push(s);
  }

  // A
  {
    const x = (w + gap) * 2;
    const s = new THREE.Shape();
    s.moveTo(x, 0);
    s.lineTo(x + t, 0);
    s.lineTo(x + t * 1.35, h * 0.28);
    s.lineTo(x + w - t * 1.35, h * 0.28);
    s.lineTo(x + w - t, 0);
    s.lineTo(x + w, 0);
    s.lineTo(x + w / 2 + t * 0.55, h);
    s.lineTo(x + w / 2 - t * 0.55, h);
    s.closePath();

    const hole = new THREE.Path();
    hole.moveTo(x + w * 0.34, h * 0.4);
    hole.lineTo(x + w * 0.66, h * 0.4);
    hole.lineTo(x + w / 2, h * 0.78);
    hole.closePath();
    s.holes.push(hole);
    shapes.push(s);
  }

  // S
  {
    const x = (w + gap) * 3;
    const s = new THREE.Shape();
    s.moveTo(x, 0);
    s.lineTo(x + w, 0);
    s.lineTo(x + w, h * 0.56);
    s.lineTo(x + t, h * 0.56);
    s.lineTo(x + t, h - t);
    s.lineTo(x + w, h - t);
    s.lineTo(x + w, h);
    s.lineTo(x, h);
    s.lineTo(x, h * 0.44);
    s.lineTo(x + w - t, h * 0.44);
    s.lineTo(x + w - t, t);
    s.lineTo(x, t);
    s.closePath();
    shapes.push(s);
  }

  // I
  {
    const x = (w + gap) * 4 + 0.04;
    const iw = t * 1.1;
    const s = new THREE.Shape();
    s.moveTo(x, 0);
    s.lineTo(x + iw, 0);
    s.lineTo(x + iw, h);
    s.lineTo(x, h);
    s.closePath();
    shapes.push(s);
  }

  // N
  {
    const x = (w + gap) * 4 + 0.26;
    const s = new THREE.Shape();
    s.moveTo(x, 0);
    s.lineTo(x + t, 0);
    s.lineTo(x + t, h * 0.68);
    s.lineTo(x + w - t, 0);
    s.lineTo(x + w, 0);
    s.lineTo(x + w, h);
    s.lineTo(x + w - t, h);
    s.lineTo(x + w - t, h * 0.32);
    s.lineTo(x + t, h);
    s.lineTo(x, h);
    s.closePath();
    shapes.push(s);
  }

  return shapes;
}

function createPhoneFeedTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#F9F9F7';
    ctx.fillRect(0, 0, 512, 1024);

    ctx.fillStyle = '#111210';
    ctx.fillRect(48, 36, 96, 10);
    ctx.fillStyle = '#C59B43';
    ctx.fillRect(410, 34, 54, 14);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(36, 84, 440, 390);
    ctx.strokeStyle = '#E2E2DC';
    ctx.lineWidth = 3;
    ctx.strokeRect(36, 84, 440, 390);

    ctx.fillStyle = '#111210';
    ctx.beginPath();
    ctx.arc(76, 128, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(114, 116, 140, 12);
    ctx.fillStyle = '#8A8A82';
    ctx.fillRect(114, 136, 90, 9);

    ctx.fillStyle = '#ECECE7';
    ctx.fillRect(58, 172, 396, 204);
    const heights = [62, 94, 78, 130, 112, 152];
    heights.forEach((h, i) => {
      ctx.fillStyle = i === 5 ? '#C59B43' : '#1E201D';
      ctx.fillRect(88 + i * 56, 354 - h, 36, h);
    });

    ctx.fillStyle = '#111210';
    ctx.fillRect(58, 398, 340, 12);
    ctx.fillStyle = '#6E6E67';
    ctx.fillRect(58, 422, 240, 10);

    ctx.fillStyle = '#111210';
    ctx.fillRect(36, 504, 440, 210);
    ctx.fillStyle = '#DFC07C';
    ctx.fillRect(62, 534, 88, 12);
    ctx.fillStyle = '#F9F9F7';
    ctx.fillRect(62, 570, 220, 24);
    ctx.fillStyle = '#8A8A82';
    ctx.fillRect(62, 616, 320, 10);
    ctx.fillRect(62, 638, 260, 10);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(36, 744, 440, 230);
    ctx.strokeStyle = '#E2E2DC';
    ctx.strokeRect(36, 744, 440, 230);
    ctx.fillStyle = '#111210';
    ctx.fillRect(62, 780, 180, 14);
    ctx.fillStyle = '#C59B43';
    ctx.fillRect(62, 816, 388, 8);
    ctx.fillStyle = '#C8C8C0';
    ctx.fillRect(62, 848, 340, 10);
    ctx.fillRect(62, 872, 290, 10);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createGlassCardTexture(variant: number, maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 340);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillRect(0, 0, 512, 340);

    ctx.strokeStyle = 'rgba(197, 155, 67, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 332);

    ctx.fillStyle = '#C59B43';
    ctx.fillRect(32, 32, 64, 10);

    ctx.fillStyle = '#111210';
    ctx.fillRect(32, 64, 240, 18);

    ctx.fillStyle = '#6E6E67';
    ctx.fillRect(32, 98, 390, 10);
    ctx.fillRect(32, 118, 310, 10);

    if (variant === 0) {
      ctx.strokeStyle = '#111210';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(32, 268);
      ctx.lineTo(120, 238);
      ctx.lineTo(210, 246);
      ctx.lineTo(310, 186);
      ctx.lineTo(400, 198);
      ctx.lineTo(474, 148);
      ctx.stroke();

      ctx.fillStyle = '#C59B43';
      ctx.beginPath();
      ctx.arc(474, 148, 9, 0, Math.PI * 2);
      ctx.fill();
    } else if (variant === 1) {
      const bars = [48, 72, 64, 96, 118, 134];
      bars.forEach((h, i) => {
        ctx.fillStyle = i >= 4 ? '#C59B43' : '#262824';
        ctx.fillRect(36 + i * 74, 290 - h, 44, h);
      });
    } else {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const alpha = Math.max(0.15, 0.9 - (r * 0.2 + c * 0.12));
          ctx.fillStyle =
            r === 0 && c === 0 ? '#C59B43' : `rgba(17, 18, 16, ${alpha.toFixed(2)})`;
          ctx.fillRect(32 + c * 88, 162 + r * 44, 76, 32);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createDustParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(235, 206, 138, 0.95)');
    grad.addColorStop(0.5, 'rgba(197, 155, 67, 0.45)');
    grad.addColorStop(1, 'rgba(197, 155, 67, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function PostprocessingComposer() {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    composer.setSize(size.width, size.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Subtle bloom on polished gold specular highlights
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.2,
      0.35,
      0.9,
    );
    composer.addPass(bloomPass);

    // Subtle depth-of-field
    const bokehPass = new BokehPass(scene, camera, {
      focus: 6.2,
      aperture: 0.00014,
      maxblur: 0.0028,
    });
    composer.addPass(bokehPass);

    // Subtle fine film grain
    const filmPass = new FilmPass(0.08, false);
    composer.addPass(filmPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    composerRef.current = composer;

    return () => {
      composer.dispose();
      composerRef.current = null;
    };
  }, [gl, scene, camera, size.width, size.height]);

  useFrame(() => {
    composerRef.current?.render();
  }, 1);

  return null;
}

function StudioEnvironmentAndEffects({
  enablePostprocessing,
}: {
  enablePostprocessing: boolean;
}) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new RoomEnvironment();
    const renderTarget = pmrem.fromScene(envScene, 0.04);
    scene.environment = renderTarget.texture;

    return () => {
      scene.environment = null;
      renderTarget.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return enablePostprocessing ? <PostprocessingComposer /> : null;
}

interface SceneContentsProps {
  scrollProgress: number;
  isMobile: boolean;
  reducedMotion: boolean;
  isSoftwareGl: boolean;
}

function SceneContents({
  scrollProgress,
  isMobile,
  reducedMotion,
  isSoftwareGl,
}: SceneContentsProps) {
  const { gl, camera, pointer } = useThree();
  const rootGroupRef = useRef<THREE.Group>(null);
  const phoneGroupRef = useRef<THREE.Group>(null);
  const nameGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const cardRefs = useRef<Array<THREE.Group | null>>([]);
  const barRefs = useRef<Array<THREE.Group | null>>([]);

  const maxAnisotropy = useMemo(
    () => Math.min(gl.capabilities.getMaxAnisotropy?.() || 4, 8),
    [gl],
  );

  const phoneBodyGeo = useMemo(() => createRoundedRectGeometry(1.48, 2.94, 0.18, 0.12), []);
  const cardGeo = useMemo(() => createRoundedRectGeometry(1.86, 1.2, 0.08, 0.04), []);

  // Extruded 3D "YEASIN" geometry
  const nameGeo = useMemo(() => {
    const shapes = buildYeasinLetterShapes();
    const geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.028,
      bevelSize: 0.02,
      bevelSegments: 3,
    });
    geo.computeBoundingBox();
    geo.center();
    return geo;
  }, []);

  const phoneScreenTex = useMemo(() => createPhoneFeedTexture(maxAnisotropy), [maxAnisotropy]);
  const cardTextures = useMemo(
    () => [
      createGlassCardTexture(0, maxAnisotropy),
      createGlassCardTexture(1, maxAnisotropy),
      createGlassCardTexture(2, maxAnisotropy),
    ],
    [maxAnisotropy],
  );
  const dustTex = useMemo(() => createDustParticleTexture(), []);

  // Sparse gold dust particle field
  const particleGeo = useMemo(() => {
    const count = reducedMotion ? 0 : isMobile ? 28 : 72;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.sin(i * 12.9898) * 0.5 + (Math.random() - 0.5)) * 7.5;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4.8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4.5 - 0.5;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [isMobile, reducedMotion]);

  useEffect(() => {
    return () => {
      phoneBodyGeo.dispose();
      cardGeo.dispose();
      nameGeo.dispose();
      phoneScreenTex.dispose();
      cardTextures.forEach((t) => t.dispose());
      dustTex.dispose();
      particleGeo.dispose();
    };
  }, [phoneBodyGeo, cardGeo, nameGeo, phoneScreenTex, cardTextures, dustTex, particleGeo]);

  const cardConfigs = useMemo(() => {
    const base = [
      {
        pos: [-1.85, 0.85, 0.6] as [number, number, number],
        rot: [0.06, 0.28, -0.05] as [number, number, number],
        phase: 0,
        depthFactor: 1.2,
      },
      {
        pos: [1.85, 0.45, -0.25] as [number, number, number],
        rot: [-0.04, -0.32, 0.06] as [number, number, number],
        phase: 2.1,
        depthFactor: 0.75,
      },
      {
        pos: [-1.62, -1.02, 0.35] as [number, number, number],
        rot: [0.08, 0.2, 0.04] as [number, number, number],
        phase: 4.2,
        depthFactor: 1.0,
      },
    ];
    return isMobile ? base.slice(0, 2) : base;
  }, [isMobile]);

  const barHeights = useMemo(() => [0.55, 0.92, 0.74, 1.28, 1.65], []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const s = Math.min(Math.max(scrollProgress, 0), 1);

    // Scroll-driven camera path + pointer depth parallax
    const camX = (reducedMotion ? 0 : pointer.x * 0.32) + Math.sin(s * Math.PI * 0.7) * 0.9;
    const camY = 0.22 + s * 0.55 + (reducedMotion ? 0 : pointer.y * 0.16);
    const camZ = 6.35 - s * 1.15;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, camX, 4, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, camY, 4, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, camZ, 4, dt);
    _camTarget.set(0, s * 0.15, 0);
    camera.lookAt(_camTarget);

    if (rootGroupRef.current) {
      const targetRotY = reducedMotion ? -0.14 : pointer.x * 0.24 + s * 0.5;
      const targetRotX = reducedMotion ? 0.05 : -pointer.y * 0.14 + s * 0.08;
      rootGroupRef.current.rotation.y = THREE.MathUtils.damp(
        rootGroupRef.current.rotation.y,
        targetRotY,
        4.5,
        dt,
      );
      rootGroupRef.current.rotation.x = THREE.MathUtils.damp(
        rootGroupRef.current.rotation.x,
        targetRotX,
        4.5,
        dt,
      );
    }

    // Polished champagne-gold 3D "YEASIN" badge
    if (nameGroupRef.current) {
      nameGroupRef.current.rotation.y = THREE.MathUtils.damp(
        nameGroupRef.current.rotation.y,
        reducedMotion ? 0.08 : pointer.x * 0.18 - s * 0.35,
        4,
        dt,
      );
      nameGroupRef.current.position.y = reducedMotion
        ? 1.62
        : 1.62 + Math.sin(t * 0.7) * 0.04;
    }

    if (phoneGroupRef.current) {
      const idleSpin = reducedMotion ? -0.2 : Math.sin(t * 0.45) * 0.2 + s * 0.75;
      phoneGroupRef.current.rotation.y = THREE.MathUtils.damp(
        phoneGroupRef.current.rotation.y,
        idleSpin,
        5,
        dt,
      );
      phoneGroupRef.current.position.y = reducedMotion
        ? -0.08
        : Math.sin(t * 0.9) * 0.07 - 0.08;
    }

    cardRefs.current.forEach((group, idx) => {
      if (!group) return;
      const cfg = cardConfigs[idx];
      if (!cfg) return;
      const hoverY = reducedMotion ? 0 : Math.sin(t * 0.8 + cfg.phase) * 0.08;
      const morphSpread = s * 0.35 * (idx === 1 ? 1 : -1);
      group.position.x = THREE.MathUtils.damp(
        group.position.x,
        cfg.pos[0] + morphSpread + (reducedMotion ? 0 : pointer.x * 0.18 * cfg.depthFactor),
        4,
        dt,
      );
      group.position.y = THREE.MathUtils.damp(group.position.y, cfg.pos[1] + hoverY, 4, dt);
      group.rotation.y = THREE.MathUtils.damp(
        group.rotation.y,
        cfg.rot[1] + s * 0.25 + (reducedMotion ? 0 : pointer.x * 0.16),
        4,
        dt,
      );
    });

    const growthFactor = 0.45 + s * 1.0;
    barRefs.current.forEach((barGroup, idx) => {
      if (!barGroup) return;
      const targetScale = barHeights[idx] * growthFactor;
      barGroup.scale.y = THREE.MathUtils.damp(barGroup.scale.y, targetScale, 5.5, dt);
    });

    if (particlesRef.current && !reducedMotion) {
      particlesRef.current.rotation.y += dt * 0.03;
    }
  });

  const enablePost = !isSoftwareGl && !isMobile && !reducedMotion;

  return (
    <>
      <StudioEnvironmentAndEffects enablePostprocessing={enablePost} />
      <hemisphereLight args={['#faf6ec', '#2b2d2a', 0.9]} />
      <directionalLight
        position={[4.5, 6, 5]}
        intensity={1.6}
        color="#fff8eb"
        castShadow={!isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-4, 2, -3]} intensity={0.7} color="#e2e8f0" />

      {/* Sparse Champagne-Gold Dust Particle Field */}
      {!reducedMotion && (
        <points ref={particlesRef} geometry={particleGeo}>
          <pointsMaterial
            map={dustTex}
            size={0.14}
            transparent
            opacity={0.75}
            depthWrite={false}
            sizeAttenuation
          />
        </points>
      )}

      <group ref={rootGroupRef} position={[0, -0.1, 0]} scale={isMobile ? 0.74 : 0.9}>
        {/* Extruded 3D Name "YEASIN" in Polished Champagne-Gold Metal */}
        <group ref={nameGroupRef} position={[0, 1.62, 0.25]}>
          <mesh geometry={nameGeo} castShadow>
            <meshPhysicalMaterial
              color="#E5C88B"
              metalness={0.94}
              roughness={0.15}
              clearcoat={0.65}
              clearcoatRoughness={0.12}
              anisotropy={0.75}
              emissive="#6B511B"
              emissiveIntensity={0.08}
            />
          </mesh>
        </group>

        {/* Composite Rotating Smartphone Assembly */}
        <group ref={phoneGroupRef} position={[0, -0.08, 0]}>
          <mesh geometry={phoneBodyGeo} castShadow receiveShadow>
            <meshStandardMaterial color="#181917" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.01]}>
            <boxGeometry args={[1.52, 2.88, 0.08]} />
            <meshStandardMaterial color="#C59B43" metalness={0.9} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0, 0.092]}>
            <planeGeometry args={[1.34, 2.74]} />
            <meshStandardMaterial
              map={phoneScreenTex}
              roughness={0.18}
              metalness={0.05}
              polygonOffset
              polygonOffsetFactor={-1}
            />
          </mesh>
          <mesh position={[-0.4, 1.02, -0.1]}>
            <boxGeometry args={[0.4, 0.4, 0.05]} />
            <meshStandardMaterial color="#10110f" metalness={0.9} roughness={0.18} />
          </mesh>
        </group>

        {/* Floating Glass Post Cards */}
        {cardConfigs.map((cfg, idx) => (
          <group
            key={idx}
            ref={(el) => {
              cardRefs.current[idx] = el;
            }}
            position={cfg.pos}
            rotation={cfg.rot}
          >
            <mesh geometry={cardGeo} castShadow>
              <meshPhysicalMaterial
                color="#ffffff"
                metalness={0.05}
                roughness={0.12}
                clearcoat={1}
                clearcoatRoughness={0.08}
                transmission={isSoftwareGl ? 0 : 0.55}
                thickness={0.2}
                ior={1.48}
                transparent
                opacity={isSoftwareGl ? 0.45 : 0.88}
              />
            </mesh>
            <mesh position={[0, 0, 0.048]}>
              <planeGeometry args={[1.72, 1.08]} />
              <meshStandardMaterial
                map={cardTextures[idx]}
                transparent
                roughness={0.25}
                metalness={0.02}
                polygonOffset
                polygonOffsetFactor={-1}
              />
            </mesh>
          </group>
        ))}

        {/* Grounded 3D Analytics Bars */}
        <group position={[1.48, -1.45, 0.55]} rotation={[0, -0.35, 0]}>
          <mesh position={[0, -0.06, 0]} receiveShadow>
            <boxGeometry args={[2.1, 0.12, 0.68]} />
            <meshStandardMaterial color="#232421" metalness={0.45} roughness={0.58} />
          </mesh>
          {barHeights.map((_, idx) => {
            const x = -0.76 + idx * 0.38;
            const isPeak = idx === barHeights.length - 1;
            return (
              <group
                key={idx}
                ref={(el) => {
                  barRefs.current[idx] = el;
                }}
                position={[x, 0, 0]}
                scale={[1, 0.45, 1]}
              >
                <mesh position={[0, 0.5, 0]} castShadow>
                  <boxGeometry args={[0.24, 1, 0.24]} />
                  <meshStandardMaterial
                    color={isPeak ? '#D4B062' : '#C8C8C0'}
                    metalness={isPeak ? 0.88 : 0.72}
                    roughness={isPeak ? 0.18 : 0.3}
                  />
                </mesh>
                <mesh position={[0, 1.02, 0]}>
                  <boxGeometry args={[0.26, 0.04, 0.26]} />
                  <meshStandardMaterial color="#111210" metalness={0.9} roughness={0.2} />
                </mesh>
              </group>
            );
          })}
        </group>

        <mesh position={[0, -1.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.6, 36]} />
          <meshBasicMaterial color="#111210" transparent opacity={0.07} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(_err: Error, _info: ErrorInfo) {
    // Fallback rendered cleanly
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function HeroScene3D({ scrollProgress }: HeroScene3DProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768);
      setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fallbackView = (
    <div className="w-full h-full flex items-center justify-center bg-[#F2F2EE] border border-[#E4E4DF] rounded-2xl p-8">
      <div className="max-w-xs space-y-3 text-left">
        <p className="font-mono text-xs text-[#9E7A2B] tabular-nums">YEASIN · SOCIAL · AI</p>
        <p className="font-display text-lg font-semibold text-[#111210]">
          Measured organic reach paired with attribution telemetry.
        </p>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-[390px] sm:h-[450px] lg:h-full min-h-[430px] rounded-2xl border border-[#E4E4DF] bg-[#F2F2EE] overflow-hidden">
      <CanvasErrorBoundary fallback={fallbackView}>
        <Canvas
          shadows={!isSoftwareGl}
          dpr={isSoftwareGl ? 1 : isMobile ? 1 : [1, 1.75]}
          camera={{ position: [0, 0.22, 6.35], fov: 38 }}
          gl={{
            antialias: !isSoftwareGl,
            powerPreference: 'high-performance',
            alpha: true,
          }}
        >
          <SceneContents
            scrollProgress={scrollProgress}
            isMobile={isMobile}
            reducedMotion={reducedMotion}
            isSoftwareGl={isSoftwareGl}
          />
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
