/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH, GameStatus } from '../../types';
import { audio } from '../System/Audio';

const CAT_BODY_GEO = new THREE.CylinderGeometry(0.24, 0.24, 0.75, 10);
const CAT_HEAD_GEO = new THREE.BoxGeometry(0.38, 0.32, 0.35);
const CAT_EAR_GEO = new THREE.ConeGeometry(0.12, 0.22, 3);
const CAT_TAIL_GEO = new THREE.CylinderGeometry(0.06, 0.04, 0.65, 6);
const CAT_LEG_GEO = new THREE.BoxGeometry(0.09, 0.32, 0.09);
const CAT_FOOT_GLOW_GEO = new THREE.BoxGeometry(0.13, 0.09, 0.13);
const CAT_STRIPE_GEO = new THREE.BoxGeometry(0.52, 0.03, 0.12);
const SHADOW_GEO = new THREE.CircleGeometry(0.55, 32);

export const Player: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  
  const flRef = useRef<THREE.Group>(null);
  const frRef = useRef<THREE.Group>(null);
  const blRef = useRef<THREE.Group>(null);
  const brRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  const { status, laneCount, takeDamage, hasDoubleJump, isImmortalityActive } = useStore();
  const [lane, setLane] = React.useState(0);
  const targetX = useRef(0);
  
  const isJumping = useRef(false);
  const velocityY = useRef(0);
  const jumpsPerformed = useRef(0); 
  const spinRotation = useRef(0);
  const isInvincible = useRef(false);
  const lastDamageTime = useRef(0);

  const { mainMaterial, neonRedMaterial, neonCyanMaterial, shadowMaterial } = useMemo(() => {
      const isLIT = isImmortalityActive;
      return {
          mainMaterial: new THREE.MeshStandardMaterial({ 
            color: isLIT ? '#ffd700' : '#151515', 
            roughness: 0.1, 
            metalness: 0.9,
            emissive: isLIT ? '#ffcc00' : '#0a0a0a',
            emissiveIntensity: 0.8
          }),
          neonRedMaterial: new THREE.MeshBasicMaterial({ color: '#ff0033' }),
          neonCyanMaterial: new THREE.MeshBasicMaterial({ color: '#00ffff' }),
          shadowMaterial: new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.4, transparent: true })
      };
  }, [isImmortalityActive]);

  const triggerJump = () => {
    const maxJumps = hasDoubleJump ? 2 : 1;
    if (!isJumping.current) {
        audio.playJump(false);
        isJumping.current = true;
        jumpsPerformed.current = 1;
        velocityY.current = 18;
    } else if (jumpsPerformed.current < maxJumps) {
        audio.playJump(true);
        jumpsPerformed.current += 1;
        velocityY.current = 16; 
        spinRotation.current = 0;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      const maxLane = Math.floor(laneCount / 2);
      if (e.key === 'ArrowLeft' || e.key === 'a') setLane(l => Math.max(l - 1, -maxLane));
      else if (e.key === 'ArrowRight' || e.key === 'd') setLane(l => Math.min(l + 1, maxLane));
      else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') triggerJump();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, laneCount, hasDoubleJump]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (status !== GameStatus.PLAYING) return;

    targetX.current = lane * LANE_WIDTH;
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX.current, delta * 20);

    if (isJumping.current) {
        groupRef.current.position.y += velocityY.current * delta;
        velocityY.current -= 50 * delta;
        if (groupRef.current.position.y <= 0) {
            groupRef.current.position.y = 0;
            isJumping.current = false;
            jumpsPerformed.current = 0;
            velocityY.current = 0;
            if (bodyRef.current) bodyRef.current.rotation.x = 0;
        }
        if (jumpsPerformed.current === 2 && bodyRef.current) {
             spinRotation.current -= delta * 15;
             bodyRef.current.rotation.x = spinRotation.current;
        }
    }

    const time = state.clock.elapsedTime * 18;
    if (!isJumping.current) {
        if (flRef.current) flRef.current.rotation.x = Math.sin(time) * 0.7;
        if (frRef.current) frRef.current.rotation.x = Math.sin(time + Math.PI) * 0.7;
        if (blRef.current) blRef.current.rotation.x = Math.sin(time + Math.PI) * 0.7;
        if (brRef.current) brRef.current.rotation.x = Math.sin(time) * 0.7;
        if (tailRef.current) tailRef.current.rotation.z = Math.sin(time * 0.5) * 0.5;
        if (bodyRef.current) bodyRef.current.position.y = 0.55 + Math.abs(Math.sin(time)) * 0.1;
    }

    if (shadowRef.current) {
        const height = groupRef.current.position.y;
        shadowRef.current.scale.setScalar(Math.max(0.1, 0.85 - (height / 5)));
    }

    if (isInvincible.current) {
        if (Date.now() - lastDamageTime.current > 1500) isInvincible.current = false;
        groupRef.current.visible = Math.floor(Date.now() / 60) % 2 === 0;
    } else groupRef.current.visible = true;
  });

  useEffect(() => {
     const checkHit = () => {
        if (isInvincible.current || isImmortalityActive) return;
        audio.playDamage();
        takeDamage();
        isInvincible.current = true;
        lastDamageTime.current = Date.now();
     };
     window.addEventListener('player-hit', checkHit);
     return () => window.removeEventListener('player-hit', checkHit);
  }, [takeDamage, isImmortalityActive]);

  const Leg = ({ position, refProp }: { position: [number, number, number], refProp: React.RefObject<THREE.Group | null> }) => (
    <group ref={refProp} position={position}>
        <mesh geometry={CAT_LEG_GEO} material={mainMaterial} />
        <mesh position={[0, -0.17, 0]} geometry={CAT_FOOT_GLOW_GEO} material={neonRedMaterial} />
    </group>
  );

  return (
    <group ref={groupRef} name="ActualPlayer">
      <group ref={bodyRef} position={[0, 0.5, 0]}>
        {/* Torso - rotated to face forward (-Z) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} geometry={CAT_BODY_GEO} material={mainMaterial} />
        
        {/* Extra Cyan Glow Stripes for high visibility */}
        <mesh position={[0, 0.1, 0]} geometry={CAT_STRIPE_GEO} material={neonCyanMaterial} />
        <mesh position={[0, 0, 0]} geometry={CAT_STRIPE_GEO} material={neonCyanMaterial} />
        <mesh position={[0, -0.1, 0]} geometry={CAT_STRIPE_GEO} material={neonCyanMaterial} />
        
        {/* Spine Glow */}
        <mesh position={[0, 0.22, 0]} scale={[0.1, 1, 0.1]} geometry={CAT_BODY_GEO} material={neonCyanMaterial} />

        {/* Head - Facing -Z */}
        <group position={[0, 0.2, -0.45]}>
            <mesh geometry={CAT_HEAD_GEO} material={mainMaterial} />
            <mesh position={[-0.14, 0.26, 0]} geometry={CAT_EAR_GEO} material={mainMaterial} />
            <mesh position={[0.14, 0.26, 0]} geometry={CAT_EAR_GEO} material={mainMaterial} />
            {/* Super Glow Eyes */}
            <mesh position={[-0.1, 0.05, -0.18]} scale={[0.07, 0.07, 0.07]}>
                <sphereGeometry />
                <meshBasicMaterial color="#00ffff" />
            </mesh>
            <mesh position={[0.1, 0.05, -0.18]} scale={[0.07, 0.07, 0.07]}>
                <sphereGeometry />
                <meshBasicMaterial color="#00ffff" />
            </mesh>
        </group>

        {/* Legs */}
        <Leg refProp={flRef} position={[-0.16, -0.25, -0.28]} />
        <Leg refProp={frRef} position={[0.16, -0.25, -0.28]} />
        <Leg refProp={blRef} position={[-0.16, -0.25, 0.28]} />
        <Leg refProp={brRef} position={[0.16, -0.25, 0.28]} />

        {/* Tail */}
        <group ref={tailRef} position={[0, 0.1, 0.38]} rotation={[-0.4, 0, 0]}>
            <mesh position={[0, 0.3, 0]} geometry={CAT_TAIL_GEO} material={mainMaterial} />
            <mesh position={[0, 0.6, 0]} scale={[1.5, 0.3, 1.5]} geometry={CAT_FOOT_GLOW_GEO} material={neonCyanMaterial} />
        </group>
      </group>
      <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={SHADOW_GEO} material={shadowMaterial} />
    </group>
  );
};