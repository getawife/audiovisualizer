"use client";
import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;

  void main() {
    vUv = uv;
    float noise = sin(position.x * 5.0 + uTime) * cos(position.y * 5.0 + uTime) * sin(position.z * 5.0 + uTime);
    float powerBass = pow(uIntensity, 3.0); 
    float displacement = noise * (powerBass * 0.8);
    
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform bool uBloom;

  void main() {
    float boost = uBloom ? (1.0 + pow(uIntensity, 1.5) * 5.0) : 1.0;
    gl_FragColor = vec4(uColor * boost, 1.0);
  }
`;

function RiggedCamera({ bassRef, shakeEnabled }) {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const b = bassRef.current;

    camera.position.x = Math.sin(t * 0.5) * 2.5;
    camera.position.y = Math.cos(t * 0.3) * 1.5;

    if (shakeEnabled && b > 0.1) {
      camera.position.x += (Math.random() - 0.5) * b * 0.5;
      camera.position.y += (Math.random() - 0.5) * b * 0.5;
      camera.position.z += (Math.random() - 0.5) * b * 0.5;
    }

    camera.lookAt(0, 0, 0);
  });
  return null;
}

function WorldGrid({ gridEnabled, color }) {
  if (!gridEnabled) return null;

  return (
    <gridHelper
      args={[20, 40, color, "#eeeeee"]}
      position={[0, -3.5, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

function MorphSphere({
  analyserRef,
  dataArrayRef,
  bassRef,
  sphereColor,
  bloomActive,
}) {
  const meshRef = useRef(null);
  const smoothBass = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: new THREE.Color(sphereColor) },
      uBloom: { value: bloomActive },
    }),
    []
  );

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uColor.value.set(sphereColor);
      meshRef.current.material.uniforms.uBloom.value = bloomActive;
    }
  }, [sphereColor, bloomActive]);

  useFrame((state) => {
    if (meshRef.current && analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      const rawBass = dataArrayRef.current[2] / 255.0;
      smoothBass.current += (rawBass - smoothBass.current) * 0.15;
      bassRef.current = smoothBass.current;

      meshRef.current.material.uniforms.uTime.value =
        state.clock.getElapsedTime();
      meshRef.current.material.uniforms.uIntensity.value = smoothBass.current;

      const scale = 1.0 + smoothBass.current * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 100, 100]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        wireframe={true}
      />
    </mesh>
  );
}

function SceneContent({
  analyserRef,
  dataArrayRef,
  sphereColor,
  bloomActive,
  shakeEnabled,
  gridEnabled,
  bassRef,
}) {
  return (
    <>
      <RiggedCamera bassRef={bassRef} shakeEnabled={shakeEnabled} />
      <WorldGrid gridEnabled={gridEnabled} color={sphereColor} />
      <ContactShadows
        position={[0, -3.5, 0]}
        opacity={0.4}
        scale={10}
        blur={2.5}
        far={4}
        color={sphereColor}
      />
      <MorphSphere
        analyserRef={analyserRef}
        dataArrayRef={dataArrayRef}
        bassRef={bassRef}
        sphereColor={sphereColor}
        bloomActive={bloomActive}
      />
    </>
  );
}

export default function ThreeJS({
  analyserRef,
  dataArrayRef,
  sphereColor,
  bloomActive,
  shakeEnabled,
  gridEnabled,
  canvasRef,
}) {
  const bassRef = useRef(0);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#FFFFFF" }}>
      <Canvas
        dpr={[1, 2]}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: false,
        }}
        onCreated={(state) => {
          state.gl.setClearColor("#ffffff");
          canvasRef.current = state.gl.domElement;
        }}
        camera={{ position: [0, 0, 6], fov: 75 }}
      >
        <color attach="background" args={["#ffffff"]} />

        <RiggedCamera bassRef={bassRef} shakeEnabled={shakeEnabled} />
        <WorldGrid gridEnabled={gridEnabled} color={sphereColor} />

        <ContactShadows
          position={[0, -3.5, 0]}
          opacity={0.4}
          scale={10}
          blur={2.5}
          far={4}
          color={sphereColor}
        />

        <MorphSphere
          analyserRef={analyserRef}
          dataArrayRef={dataArrayRef}
          bassRef={bassRef}
          sphereColor={sphereColor}
          bloomActive={bloomActive}
        />
      </Canvas>
    </div>
  );
}
