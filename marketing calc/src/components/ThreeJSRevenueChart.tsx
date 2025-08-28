import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface RevenueBar {
  channel: string;
  revenue: number;
  color: string;
  position: [number, number, number];
}

interface AnimatedBarProps {
  revenue: number;
  maxRevenue: number;
  color: string;
  position: [number, number, number];
  channel: string;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
}

function AnimatedBar({ revenue, maxRevenue, color, position, channel, isHovered, onHover }: AnimatedBarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetHeight = (revenue / maxRevenue) * 3; // Max height of 3 units
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smooth height animation
    const currentHeight = meshRef.current.scale.y;
    const newHeight = THREE.MathUtils.lerp(currentHeight, targetHeight, delta * 4);
    meshRef.current.scale.y = newHeight;
    
    // Hover effect
    const targetScale = isHovered ? 1.1 : 1;
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, delta * 8);
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, delta * 8);
    
    // Gentle float animation
    const time = state.clock.getElapsedTime();
    meshRef.current.position.y = position[1] + Math.sin(time * 2 + position[0]) * 0.02;
  });

  return (
    <group position={position}>
      {/* Main bar */}
      <mesh
        ref={meshRef}
        position={[0, targetHeight / 2, 0]}
        onPointerEnter={() => onHover(true)}
        onPointerLeave={() => onHover(false)}
      >
        <boxGeometry args={[0.8, 1, 0.8]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.8}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Glow effect when hovered */}
      {isHovered && (
        <mesh position={[0, targetHeight / 2, 0]} scale={[1.2, 1, 1.2]}>
          <boxGeometry args={[0.8, targetHeight, 0.8]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}
      
      {/* Channel label */}
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.12}
        color="#333"
        anchorX="center"
        anchorY="middle"
        rotation={[0, 0, 0]}
      >
        {channel}
      </Text>
      
      {/* Revenue amount */}
      {isHovered && (
        <Text
          position={[0, targetHeight + 0.3, 0]}
          fontSize={0.1}
          color={color}
          anchorX="center"
          anchorY="middle"
          rotation={[0, 0, 0]}
        >
          ${Math.round(revenue / 1000)}k
        </Text>
      )}
    </group>
  );
}

function CameraController() {
  const { camera } = useThree();
  
  useFrame((state) => {
    // Gentle automatic rotation
    const time = state.clock.getElapsedTime();
    camera.position.x = Math.cos(time * 0.1) * 5;
    camera.position.z = Math.sin(time * 0.1) * 5;
    camera.lookAt(0, 1, 0);
  });
  
  return null;
}

interface ThreeJSRevenueChartProps {
  channels: {
    channel: string;
    revenue: number;
    color: string;
  }[];
  width?: number;
  height?: number;
  autoRotate?: boolean;
}

const ThreeJSRevenueChart: React.FC<ThreeJSRevenueChartProps> = ({ 
  channels, 
  width = 600, 
  height = 400,
  autoRotate = true 
}) => {
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);
  
  const maxRevenue = Math.max(...channels.map(c => c.revenue));
  
  const revenueBars: RevenueBar[] = channels.map((channel, index) => ({
    ...channel,
    position: [(index - (channels.length - 1) / 2) * 1.5, 0, 0] as [number, number, number]
  }));

  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas
        camera={{ position: [4, 3, 4], fov: 50 }}
        style={{ 
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '15px'
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={0.8} 
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 5, 5]} intensity={0.3} color="#4fc3f7" />
        
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color="#f0f0f0" transparent opacity={0.5} />
        </mesh>
        
        {/* Revenue bars */}
        {revenueBars.map((bar, index) => (
          <AnimatedBar
            key={bar.channel}
            revenue={bar.revenue}
            maxRevenue={maxRevenue}
            color={bar.color}
            position={bar.position}
            channel={bar.channel}
            isHovered={hoveredChannel === bar.channel}
            onHover={(hovered) => setHoveredChannel(hovered ? bar.channel : null)}
          />
        ))}
        
        {/* Title */}
        <Text
          position={[0, 4, 0]}
          fontSize={0.3}
          color="#333"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          Revenue by Channel
        </Text>
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={8}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
        />
        
        {/* Camera controller */}
        {autoRotate && <CameraController />}
      </Canvas>
      
      {/* Info overlay */}
      {hoveredChannel && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px',
          fontSize: '14px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <strong>{hoveredChannel}</strong><br />
          ${channels.find(c => c.channel === hoveredChannel)?.revenue.toLocaleString()}
        </div>
      )}
      
      {/* Controls info */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        backdropFilter: 'blur(10px)'
      }}>
        🖱️ Drag to rotate • 🔍 Scroll to zoom
      </div>
    </div>
  );
};

export default ThreeJSRevenueChart;