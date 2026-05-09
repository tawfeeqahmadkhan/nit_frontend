import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, Line } from '@react-three/drei'
import { useRef, useState, useMemo } from 'react'
import * as THREE from 'three'

const CATEGORY_COLORS = {
  Manufacturing: '#3B82F6',
  Logistics:     '#F97316',
  Agriculture:   '#22C55E',
  Technology:    '#8B5CF6',
  Retail:        '#EC4899',
  Food:          '#EAB308',
  Healthcare:    '#14B8A6',
  Finance:       '#64748B',
}

function categoryColor(cat = '') {
  const key = Object.keys(CATEGORY_COLORS).find(k =>
    cat.toLowerCase().includes(k.toLowerCase())
  )
  return CATEGORY_COLORS[key] || '#94A3B8'
}

function fibonacciSphere(n, radius = 6) {
  const pts = []
  const phi = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / Math.max(n - 1, 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = phi * i
    pts.push(new THREE.Vector3(radius * r * Math.cos(theta), radius * y, radius * r * Math.sin(theta)))
  }
  return pts
}

function BusinessNode({ position, node, isSelected, onClick }) {
  const meshRef = useRef()
  const [hovered, setHovered] = useState(false)
  const color = categoryColor(node.category)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3
      const target = hovered || isSelected ? 1.25 : 1
      meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.1)
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onClick(node) }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>
      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.025, 8, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.2 : 0.3}
          transparent
          opacity={hovered || isSelected ? 0.8 : 0.2}
        />
      </mesh>
      {/* Label */}
      {(hovered || isSelected) && (
        <Html distanceFactor={8} center>
          <div className="bg-card-dark text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none border border-white/10">
            <p className="font-semibold">{node.name}</p>
            <p className="text-white/50 text-[10px]">{node.category}</p>
          </div>
        </Html>
      )}
    </group>
  )
}

function MatchEdge({ start, end, score, type }) {
  const points = useMemo(() => [start, end], [start, end])
  const opacity = type === 'external' ? 0.25 : Math.max(0.3, score)
  const color = type === 'external' ? '#94A3B8' : score >= 0.8 ? '#22C55E' : '#DC2626'

  return (
    <Line
      points={points}
      color={color}
      lineWidth={type === 'external' ? 0.5 : score >= 0.8 ? 1.5 : 1}
      transparent
      opacity={opacity}
      dashed={type === 'external'}
      dashSize={0.2}
      gapSize={0.1}
    />
  )
}

function Scene({ nodes, edges, onSelect }) {
  const positions = useMemo(() => fibonacciSphere(nodes.length), [nodes.length])
  const posMap = useMemo(() => {
    const m = {}
    nodes.forEach((n, i) => { m[n.id] = positions[i] })
    return m
  }, [nodes, positions])

  const [selected, setSelected] = useState(null)

  function handleClick(node) {
    setSelected(node.id === selected ? null : node.id)
    onSelect?.(node.id === selected ? null : node)
  }

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, -10, -10]} intensity={0.4} color="#6366f1" />

      {/* Edges */}
      {edges.map(edge => {
        const s = posMap[edge.source]
        const t = posMap[edge.target]
        if (!s || !t) return null
        return (
          <MatchEdge
            key={edge.id}
            start={s}
            end={t}
            score={edge.score}
            type={edge.type}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <BusinessNode
          key={node.id}
          position={positions[i]}
          node={node}
          isSelected={selected === node.id}
          onClick={handleClick}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={5}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.4}
      />
    </>
  )
}

export default function BusinessGraph3D({ nodes = [], edges = [], onNodeSelect }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 12], fov: 55 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
    >
      <Scene nodes={nodes} edges={edges} onSelect={onNodeSelect} />
    </Canvas>
  )
}
