/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { Text3D, Center } from '@react-three/drei';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../../store';
import { GameObject, ObjectType, LANE_WIDTH, SPAWN_DISTANCE, REMOVE_DISTANCE, GameStatus, TARGET_WORD, CASINO_COLORS, LOGO_IMAGE_URL } from '../../types';
import { audio } from '../System/Audio';

const OBSTACLE_HEIGHT = 1.7;
const OBSTACLE_GEO = new THREE.BoxGeometry(1.2, OBSTACLE_HEIGHT, 0.5);
const LOGO_GEO = new THREE.CircleGeometry(0.7, 32);
const LOGO_FRAME_GEO = new THREE.TorusGeometry(0.75, 0.06, 16, 32);
const FONT_URL = "https://cdn.jsdelivr.net/npm/three/examples/fonts/helvetiker_bold.typeface.json";

export const LevelManager: React.FC = () => {
  const { status, speed, collectGem, collectLetter, collectedLetters, laneCount } = useStore();
  const objectsRef = useRef<GameObject[]>([]);
  const [, setRenderTrigger] = useState(0);
  const distanceTraveled = useRef(0);
  const nextLetterDistance = useRef(100);

  useEffect(() => {
    if (status === GameStatus.MENU || status === GameStatus.GAME_OVER || status === GameStatus.VICTORY) {
        objectsRef.current = [];
        distanceTraveled.current = 0;
        nextLetterDistance.current = 100;
        setRenderTrigger(t => t + 1);
    }
  }, [status]);

  useFrame((state, delta) => {
    if (status !== GameStatus.PLAYING) return;
    const dist = speed * delta;
    distanceTraveled.current += dist;

    const playerObject = state.scene.getObjectByName('ActualPlayer');
    if (!playerObject) return;

    const playerPos = new THREE.Vector3();
    playerObject.getWorldPosition(playerPos);

    let hasChanges = false;
    const kept = [];
    
    // Fixed player Z for collision
    const playerZ = 0;

    for (const obj of objectsRef.current) {
        obj.prevZ = obj.position[2];
        obj.position[2] += dist;
        let keep = obj.position[2] < REMOVE_DISTANCE;

        if (obj.active) {
            // Check if object crossed player plane or is currently overlapping
            const crossed = (obj.prevZ <= playerZ && obj.position[2] >= playerZ);
            // More generous depth for items, tight for obstacles
            const depthWindow = obj.type === ObjectType.OBSTACLE ? 1.2 : 2.5;
            const inZone = Math.abs(obj.position[2] - playerZ) < (depthWindow / 2);

            if (crossed || inZone) {
                // Strict lane matching
                const hitWindowX = obj.type === ObjectType.OBSTACLE ? 0.6 : 1.4;
                const distanceX = Math.abs(obj.position[0] - playerPos.x);

                if (distanceX < hitWindowX) {
                    if (obj.type === ObjectType.OBSTACLE) {
                        // High speed jumps need a slightly lower check
                        if (playerPos.y < OBSTACLE_HEIGHT - 0.25) {
                            window.dispatchEvent(new Event('player-hit'));
                            obj.active = false;
                            hasChanges = true;
                        }
                    } else {
                        // Collection
                        if (obj.type === ObjectType.LETTER && obj.targetIndex !== undefined) {
                            collectLetter(obj.targetIndex);
                            audio.playLetterCollect();
                        } else if (obj.type === ObjectType.LOGO) {
                            collectGem(500);
                            audio.playGemCollect();
                        }
                        obj.active = false;
                        hasChanges = true;
                    }
                }
            }
        }
        
        if (keep) kept.push(obj);
        else hasChanges = true;
    }

    let furthestZ = kept.length > 0 ? Math.min(...kept.map(o => o.position[2])) : -10;
    if (furthestZ > -SPAWN_DISTANCE) {
        const lane = Math.floor(Math.random() * laneCount) - Math.floor(laneCount / 2);
        const spawnZ = furthestZ - (16 + speed * 0.12);
        
        if (distanceTraveled.current >= nextLetterDistance.current) {
            const available = TARGET_WORD.map((_, i) => i).filter(i => !collectedLetters.includes(i));
            if (available.length > 0) {
                const idx = available[Math.floor(Math.random() * available.length)];
                kept.push({
                    id: uuidv4(),
                    type: ObjectType.LETTER,
                    position: [lane * LANE_WIDTH, 1.2, spawnZ],
                    prevZ: spawnZ,
                    active: true,
                    value: TARGET_WORD[idx],
                    color: CASINO_COLORS[idx],
                    targetIndex: idx
                });
                nextLetterDistance.current += 380;
            }
        } else {
            const roll = Math.random();
            if (roll < 0.45) {
                kept.push({ id: uuidv4(), type: ObjectType.OBSTACLE, position: [lane * LANE_WIDTH, OBSTACLE_HEIGHT/2, spawnZ], prevZ: spawnZ, active: true });
            } else {
                kept.push({ id: uuidv4(), type: ObjectType.LOGO, position: [lane * LANE_WIDTH, 1.4, spawnZ], prevZ: spawnZ, active: true, imageUrl: LOGO_IMAGE_URL });
            }
        }
        hasChanges = true;
    }

    if (hasChanges) {
        objectsRef.current = kept;
        setRenderTrigger(t => t + 1);
    }
  });

  return (
    <group>
      {objectsRef.current.map(obj => obj.active && <Entity key={obj.id} data={obj} />)}
    </group>
  );
};

const Entity: React.FC<{ data: GameObject }> = ({ data }) => {
    const tex = data.imageUrl ? useLoader(THREE.TextureLoader, data.imageUrl) : null;
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.set(data.position[0], data.position[1] + Math.sin(state.clock.elapsedTime * 6) * 0.1, data.position[2]);
            if (data.type !== ObjectType.OBSTACLE) {
              meshRef.current.rotation.y += 0.08;
            }
        }
    });

    return (
        <group ref={meshRef}>
            {data.type === ObjectType.OBSTACLE && (
                <group>
                    <mesh geometry={OBSTACLE_GEO}>
                        <meshStandardMaterial color="#100000" metalness={0.9} roughness={0.1} emissive="#ff0033" emissiveIntensity={0.2} />
                    </mesh>
                    <mesh position={[0, OBSTACLE_HEIGHT/2, 0]}>
                         <boxGeometry args={[1.25, 0.05, 0.55]} />
                         <meshBasicMaterial color="#ff0033" />
                    </mesh>
                </group>
            )}
            {data.type === ObjectType.LETTER && (
                <Center>
                    <Text3D font={FONT_URL} size={1.2} height={0.3}>
                        {data.value}
                        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={4} />
                    </Text3D>
                </Center>
            )}
            {data.type === ObjectType.LOGO && tex && (
                <group>
                    <mesh geometry={LOGO_GEO}>
                        <meshBasicMaterial map={tex} transparent side={THREE.DoubleSide} />
                    </mesh>
                    <mesh geometry={LOGO_FRAME_GEO}>
                        <meshBasicMaterial color="#00ffff" />
                    </mesh>
                </group>
            )}
        </group>
    );
};
