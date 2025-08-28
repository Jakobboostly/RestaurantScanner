import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ChannelData {
  channel: string;
  revenue: number;
  percentage: number;
  color: string;
  position: [number, number, number];
}

interface ParticleSystemProps {
  channels: ChannelData[];
  totalRevenue: number;
}

// Individual particle component for revenue streams
function RevenueParticle({ 
  startPos, 
  endPos, 
  color, 
  size = 0.05,
  speed = 0.02 
}: {
  startPos: [number, number, number];
  endPos: [number, number, number];
  color: string;
  size?: number;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    setProgress((prev) => (prev + speed * delta * 60) % 1);
    
    // Interpolate position along curve
    const start = new THREE.Vector3(...startPos);
    const end = new THREE.Vector3(...endPos);
    const mid = new THREE.Vector3(0, 0, 0); // Flow through center
    
    // Create quadratic bezier curve
    const t = progress;
    const pos = new THREE.Vector3()
      .addScaledVector(start, (1 - t) * (1 - t))
      .addScaledVector(mid, 2 * (1 - t) * t)
      .addScaledVector(end, t * t);
    
    meshRef.current.position.copy(pos);
    
    // Fade in/out effect
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    material.opacity = Math.sin(t * Math.PI);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Particle system for all revenue streams
function ParticleSystem({ channels, totalRevenue }: ParticleSystemProps) {
  const particles = useMemo(() => {
    const result: JSX.Element[] = [];
    
    channels.forEach((channel, channelIndex) => {
      const particleCount = Math.max(1, Math.floor((channel.revenue / totalRevenue) * 20));
      
      for (let i = 0; i < particleCount; i++) {
        const key = `${channelIndex}-${i}`;
        const delay = (i / particleCount) * 2; // Stagger particles
        
        result.push(
          <RevenueParticle
            key={key}
            startPos={channel.position}
            endPos={[0, 0, 0]} // Flow to center
            color={channel.color}
            speed={0.01 + (channel.revenue / totalRevenue) * 0.02}
            size={0.03 + (channel.revenue / totalRevenue) * 0.05}
          />
        );
      }
    });
    
    return result;
  }, [channels, totalRevenue]);

  return <>{particles}</>;
}

// Individual channel continent/region on the globe
function ChannelRegion({ 
  channel, 
  totalRevenue, 
  onHover, 
  onSelect,
  isSelected = false
}: {
  channel: ChannelData;
  totalRevenue: number;
  onHover: (channel: ChannelData | null) => void;
  onSelect: (channel: ChannelData) => void;
  isSelected?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const height = useMemo(() => {
    return 0.2 + (channel.revenue / totalRevenue) * 0.8; // Height based on revenue
  }, [channel.revenue, totalRevenue]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Gentle floating animation
    const time = state.clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(time * 2 + channel.position[0]) * 0.05;
    
    // Glowing effect when hovered/selected
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (hovered || isSelected) {
      material.emissive = new THREE.Color(channel.color).multiplyScalar(0.3);
    } else {
      material.emissive = new THREE.Color(0x000000);
    }
  });

  return (
    <group ref={groupRef} position={channel.position}>
      {/* Main region pillar */}
      <mesh
        ref={meshRef}
        onPointerEnter={() => {
          setHovered(true);
          onHover(channel);
        }}
        onPointerLeave={() => {
          setHovered(false);
          onHover(null);
        }}
        onClick={() => onSelect(channel)}
      >
        <cylinderGeometry args={[0.1, 0.15, height, 8]} />
        <meshStandardMaterial 
          color={channel.color} 
          transparent 
          opacity={0.8}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
      
      {/* Revenue amount text */}
      <Text
        position={[0, height / 2 + 0.2, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ${Math.round(channel.revenue / 1000)}k
      </Text>
      
      {/* Channel name */}
      <Text
        position={[0, height / 2 + 0.1, 0]}
        fontSize={0.05}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        {channel.channel}
      </Text>
    </group>
  );
}

// Main globe with atmosphere
function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.002; // Slow rotation
  });

  return (
    <group>
      {/* Main globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color="#1a237e"
          transparent
          opacity={0.3}
          roughness={0.8}
        />
      </mesh>
      
      {/* Atmosphere glow */}
      <mesh scale={1.02}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color="#4fc3f7"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// Camera controller for cinematic movement
function CameraController({ autoRotate = true }: { autoRotate?: boolean }) {
  const { camera } = useThree();
  
  useFrame((state) => {
    if (autoRotate) {
      const time = state.clock.getElapsedTime();
      camera.position.x = Math.cos(time * 0.1) * 3;
      camera.position.z = Math.sin(time * 0.1) * 3;
      camera.lookAt(0, 0, 0);
    }
  });
  
  return null;
}

// Main component
interface RevenueGlobeProps {
  channels: {
    channel: string;
    revenue: number;
    percentage: number;
    color: string;
  }[];
  autoRotate?: boolean;
  onChannelSelect?: (channel: any) => void;
  width?: number;
  height?: number;
}

const RevenueGlobe: React.FC<RevenueGlobeProps> = ({ 
  channels, 
  autoRotate = true,
  onChannelSelect,
  width = 600,
  height = 500
}) => {
  const [hoveredChannel, setHoveredChannel] = useState<ChannelData | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelData | null>(null);

  // Transform flat data into 3D positioned data
  const channelData = useMemo((): ChannelData[] => {
    return channels.map((channel, index) => {
      // Distribute channels around the globe
      const angle = (index / channels.length) * Math.PI * 2;
      const radius = 1.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.random() - 0.5) * 0.5; // Slight vertical variation
      
      return {
        ...channel,
        position: [x, y, z] as [number, number, number]
      };
    });
  }, [channels]);

  const totalRevenue = useMemo(() => {
    return channels.reduce((sum, channel) => sum + channel.revenue, 0);
  }, [channels]);

  const handleChannelSelect = (channel: ChannelData) => {
    setSelectedChannel(channel);
    if (onChannelSelect) {
      onChannelSelect(channel);
    }
  };

  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas
        camera={{ position: [3, 1, 3], fov: 50 }}
        style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)' }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4fc3f7" />
        
        {/* Globe */}
        <Globe />
        
        {/* Channel regions */}
        {channelData.map((channel, index) => (
          <ChannelRegion
            key={channel.channel}
            channel={channel}
            totalRevenue={totalRevenue}
            onHover={setHoveredChannel}
            onSelect={handleChannelSelect}
            isSelected={selectedChannel?.channel === channel.channel}
          />
        ))}
        
        {/* Particle system for revenue flows */}
        <ParticleSystem channels={channelData} totalRevenue={totalRevenue} />
        
        {/* Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
        />
        
        {/* Camera controller */}
        {autoRotate && <CameraController autoRotate={autoRotate} />}
      </Canvas>
      
      {/* HUD overlay */}
      {hoveredChannel && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxWidth: '300px'
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: hoveredChannel.color }}>
            {hoveredChannel.channel}
          </h3>
          <p style={{ margin: '0', fontSize: '14px' }}>
            Revenue: ${hoveredChannel.revenue.toLocaleString()}<br />
            Share: {hoveredChannel.percentage.toFixed(1)}%
          </p>
        </div>
      )}
      
      {/* Total revenue display */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '12px', opacity: 0.8 }}>Total Monthly Revenue</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
          ${totalRevenue.toLocaleString()}
        </div>
      </div>
      
      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.6)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          backdropFilter: 'blur(10px)'
        }}
      >
        🖱️ Click &amp; drag to rotate • 🖱️ Click regions for details • 🔍 Scroll to zoom
      </div>
    </div>
  );
};

export default RevenueGlobe;