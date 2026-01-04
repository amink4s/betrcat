/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH } from '../../types';

export const Environment: React.FC = () => {
  const speed = useStore(state => state.speed);
  const gridRef = useRef<THREE.Mesh>(null);
  const offset = useRef(0);

  useFrame((state, delta) => {
    if (gridRef.current) {
        offset.current += (speed > 0 ? speed : 5) * delta;
        (gridRef.current.material as THREE.MeshBasicMaterial).map!.offset.y = -offset.current / 20;
    }
  });

  const gridTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#ff0033'; ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 50);
    return t;
  }, []);

  return (
    <>
      <color attach="background" args={['#020005']} />
      <fog attach="fog" args={['#020005', 20, 100]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 10, -10]} intensity={2} color="#00ffff" />
      
      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]}>
          <planeGeometry args={[100, 200]} />
          <meshBasicMaterial map={gridTex} transparent opacity={0.2} />
      </mesh>

      <group position={[0, 0, 0]}>
          {[-1, 1].map(side => (
              <mesh key={side} position={[side * (LANE_WIDTH * 2), 0, -50]} rotation={[-Math.PI/2, 0, 0]}>
                  <planeGeometry args={[0.1, 200]} />
                  <meshBasicMaterial color="#00ffff" transparent opacity={0.5} />
              </mesh>
          ))}
      </group>
    </>
  );
};
