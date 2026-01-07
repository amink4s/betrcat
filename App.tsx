/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import sdk from '@farcaster/miniapp-sdk';
import { Environment } from './components/World/Environment';
import { Player } from './components/World/Player';
import { LevelManager } from './components/World/LevelManager';
import { Effects } from './components/World/Effects';
import { HUD } from './components/UI/HUD';
import { useStore } from './store';

// Dynamic Camera Controller
const CameraController = () => {
  const { camera, size } = useThree();
  const { laneCount } = useStore();
  
  useFrame((state, delta) => {
    // Determine if screen is narrow (mobile portrait)
    const aspect = size.width / size.height;
    const isMobile = aspect < 1.2; // Threshold for "mobile-like" narrowness or square-ish displays

    // Calculate expansion factors
    // Mobile requires backing up significantly more because vertical FOV is fixed in Three.js,
    // meaning horizontal view shrinks as aspect ratio drops.
    // We use more aggressive multipliers for mobile to keep outer lanes in frame.
    const heightFactor = isMobile ? 2.0 : 0.5;
    const distFactor = isMobile ? 4.5 : 1.0;

    // Base (3 lanes): y=5.5, z=8
    // Calculate target based on how many extra lanes we have relative to the start
    const extraLanes = Math.max(0, laneCount - 3);

    const targetY = 5.5 + (extraLanes * heightFactor);
    const targetZ = 8.0 + (extraLanes * distFactor);

    const targetPos = new THREE.Vector3(0, targetY, targetZ);
    
    // Smoothly interpolate camera position
    camera.position.lerp(targetPos, delta * 2.0);
    
    // Look further down the track to see the end of lanes
    // Adjust look target slightly based on height to maintain angle
    camera.lookAt(0, 0, -30); 
  });
  
  return null;
};

function Scene() {
  return (
    <>
        <Environment />
        <group>
            {/* Attach a userData to identify player group for LevelManager collision logic */}
            <group userData={{ isPlayer: true }} name="PlayerGroup">
                 <Player />
            </group>
            <LevelManager />
        </group>
        <Effects />
    </>
  );
}

function App() {
  const [isReady, setIsReady] = useState(false);
  const { setUser, setLoading, fetchLeaderboard } = useStore();

  useEffect(() => {
    const initializeFarcaster = async () => {
      try {
        setLoading(true);
        console.log('[QuickAuth] Starting Farcaster initialization...');
        
        // Initialize Farcaster SDK - this must be called first
        console.log('[QuickAuth] Calling sdk.actions.ready()...');
        await sdk.actions.ready();
        console.log('[QuickAuth] SDK ready called');
        
        // Get context to check if user is authenticated
        console.log('[QuickAuth] Getting SDK context...');
        const context = await sdk.context;
        console.log('[QuickAuth] Context received:', {
          hasUser: !!context.user,
          user: context.user ? {
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName
          } : null
        });
        
        // Use QuickAuth to get token (for debugging and future use)
        console.log('[QuickAuth] Attempting to get QuickAuth token...');
        let token: string | null = null;
        try {
          const tokenResult = await sdk.quickAuth.getToken();
          token = tokenResult.token;
          console.log('[QuickAuth] Token obtained successfully:', token ? 'Token present (length: ' + token.length + ')' : 'No token');
          // TODO: Consider using token for backend authentication in the future
        } catch (tokenError) {
          console.error('[QuickAuth] Failed to get token:', tokenError);
        }
        
        // Check if user is authenticated via context
        if (context.user) {
          console.log('[QuickAuth] User authenticated:', {
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            hasPfp: !!context.user.pfpUrl
          });
          
          // Authenticate user with backend
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
          console.log('[QuickAuth] Sending auth request to backend:', `${API_BASE_URL}/api/auth`);
          
          const response = await fetch(`${API_BASE_URL}/api/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fid: context.user.fid,
              username: context.user.username || `user_${context.user.fid}`,
              displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
              pfpUrl: context.user.pfpUrl
            })
          });

          console.log('[QuickAuth] Backend response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('[QuickAuth] Backend auth successful, user stats:', data.stats);
            
            setUser(
              {
                fid: context.user.fid,
                username: context.user.username || `user_${context.user.fid}`,
                displayName: context.user.displayName || context.user.username || `User ${context.user.fid}`,
                pfpUrl: context.user.pfpUrl
              },
              data.stats
            );
            
            // Fetch leaderboard
            console.log('[QuickAuth] Fetching leaderboard...');
            await fetchLeaderboard();
            console.log('[QuickAuth] Leaderboard fetched successfully');
          } else {
            const errorText = await response.text();
            console.error('[QuickAuth] Backend auth failed:', errorText);
          }
        } else {
          console.warn('[QuickAuth] No user found in context - user may not be authenticated in Farcaster');
        }
        
        setIsReady(true);
        console.log('[QuickAuth] Initialization complete');
      } catch (error) {
        console.error('[QuickAuth] Error initializing Farcaster:', error);
        if (error instanceof Error) {
          console.error('[QuickAuth] Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
        // Still show the app even if auth fails
        setIsReady(true);
      } finally {
        setLoading(false);
      }
    };

    initializeFarcaster();
  }, [setUser, setLoading, fetchLeaderboard]);

  if (!isReady) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <HUD />
      <Canvas
        shadows
        dpr={[1, 1.5]} 
        gl={{ antialias: false, stencil: false, depth: true, powerPreference: "high-performance" }}
        // Initial camera, matches the controller base
        camera={{ position: [0, 5.5, 8], fov: 60 }}
      >
        <CameraController />
        <Suspense fallback={null}>
            <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default App;
