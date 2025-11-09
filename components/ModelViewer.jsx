'use client';

import React, { useRef, useState, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, useProgress, useGLTF } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className='flex flex-col items-center space-y-4'>
        <div className='relative'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600'></div>
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-sm font-semibold text-gray-600'>{Math.round(progress)}%</span>
          </div>
        </div>
        <p className='text-sm text-gray-600'>3D Model yükleniyor...</p>
      </div>
    </Html>
  );
};

const GLTFModel = ({ url, position, scale, onModelLoaded }) => {
  const groupRef = useRef();
  const mixerRef = useRef(null);
  const sceneRef = useRef(null);
  
  // useGLTF hook'unu her zaman çağır (React hook kuralları)
  // URL'ye göre cache'lenir, bu yüzden her unique URL için farklı model yüklenir
  const gltf = useGLTF(url);

  useFrame((state, delta) => {
    // Animasyon mixer'ı güncelle
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  // Model yüklendiğinde bounding box hesapla ve camera'yı ayarla
  useEffect(() => {
    if (gltf && gltf.scene && sceneRef.current) {
      const { Box3, Vector3 } = require('three');
      
      // Bounding box hesapla
      const box = new Box3().setFromObject(sceneRef.current);
      const center = box.getCenter(new Vector3());
      const size = box.getSize(new Vector3());
      
      // Model'i tam merkeze taşı (X, Y, Z eksenlerinde)
      sceneRef.current.position.set(-center.x, -center.y, -center.z);
      
      // En büyük boyutu bul
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // Scale faktörü hesapla (model çok küçük veya büyükse)
      if (maxDim > 0 && maxDim !== Infinity && !isNaN(maxDim)) {
        const targetSize = 3.5; // Hedef boyut (daha büyük görünüm için)
        const scaleFactor = targetSize / maxDim;
        if (scaleFactor > 0 && scaleFactor !== Infinity && !isNaN(scaleFactor)) {
          sceneRef.current.scale.multiplyScalar(scaleFactor);
          // Scale sonrası center'ı yeniden hesapla ve tekrar merkezle
          const newBox = new Box3().setFromObject(sceneRef.current);
          const newCenter = newBox.getCenter(new Vector3());
          sceneRef.current.position.sub(newCenter);
        }
      }
      
      if (onModelLoaded) {
        onModelLoaded({ center, size, maxDim: maxDim > 0 ? maxDim : 2 });
      }
    }
  }, [gltf, onModelLoaded]);

  // Model yüklenmişse ve animasyonlar varsa mixer oluştur (otomatik oynat)
  useEffect(() => {
    if (gltf && gltf.animations && gltf.animations.length > 0 && sceneRef.current) {
      const { AnimationMixer } = require('three');
      mixerRef.current = new AnimationMixer(sceneRef.current);
      gltf.animations.forEach((clip) => {
        mixerRef.current.clipAction(clip).play();
      });
    }
    
    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllActions();
        mixerRef.current = null;
      }
    };
  }, [gltf]);

  if (gltf && gltf.scene) {
    const clonedScene = gltf.scene.clone();
    sceneRef.current = clonedScene;
    
    return (
      <group ref={groupRef} position={position} scale={scale}>
        <primitive 
          object={clonedScene} 
          dispose={null}
        />
      </group>
    );
  }

  return null;
};

const PlaceholderModel = ({ position, scale }) => {
  const groupRef = useRef();

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color='#3b82f6' />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color='#ef4444' />
      </mesh>
      <mesh position={[0, -1.5, 0]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color='#10b981' />
      </mesh>
    </group>
  );
};

const Model = ({
  url,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  onModelLoaded,
}) => {
  const isGLTF = url && (url.includes('.gltf') || url.includes('.glb'));
  
  if (isGLTF) {
    return (
      <GLTFModel 
        url={url} 
        position={position} 
        scale={scale} 
        onModelLoaded={onModelLoaded}
      />
    );
  }
  
  return (
    <PlaceholderModel 
      position={position} 
      scale={scale}
    />
  );
};

const ModelViewer = ({ modelUrl, className = '', autoRotate = true, showControls = false }) => {
  const [isAutoRotate, setIsAutoRotate] = useState(autoRotate);
  const [cameraPosition, setCameraPosition] = useState([2, 2, 2]);
  const controlsRef = useRef(null);

  const handleModelLoaded = ({ center, size, maxDim }) => {
    // Model yüklendiğinde camera'yı otomatik ayarla - çok yakın ve optimize görünüm
    const targetDistance = Math.max(maxDim * 0.7, 1.2); // Model boyutunun 0.7 katı veya minimum 1.2
    const cameraDist = Math.min(targetDistance, 2.5); // Maksimum 2.5 birim uzaklık (çok yakın)
    setCameraPosition([cameraDist * 0.6, cameraDist * 0.6, cameraDist * 0.6]);
    
    // Auto rotate'u aktif et
    setIsAutoRotate(true);
    
    // Controls'u resetle ve kapalı tut
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };


  return (
    <div className={`relative ${className}`}>
      <motion.div
        layout
        className='relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800'
      >
        <Canvas camera={{ position: cameraPosition, fov: 50, near: 0.01, far: 1000 }} shadows>
          <Suspense fallback={<Loader />}>
            <ambientLight intensity={0.6} />
            <directionalLight
              position={[10, 10, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <Environment preset='studio' />
            {modelUrl && (
              <Suspense fallback={<Loader />}>
                <Model
                  url={modelUrl}
                  position={[0, 0, 0]}
                  scale={[1, 1, 1]}
                  onModelLoaded={handleModelLoaded}
                />
              </Suspense>
            )}
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={false}
              enableRotate={false}
              autoRotate={isAutoRotate}
              autoRotateSpeed={1.5}
              maxDistance={8}
              minDistance={0.3}
              maxPolarAngle={Math.PI}
              minPolarAngle={0}
              dampingFactor={0.05}
              enableDamping={true}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>


        <AnimatePresence>
          {!modelUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='absolute inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm'
            >
              <div className='text-center'>
                <div className='mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600'></div>
                <p className='text-white'>3D Model yükleniyor...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ModelViewer;
