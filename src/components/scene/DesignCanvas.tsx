import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { RoomShell } from './RoomShell'
import { SceneItem } from './SceneItem'
import type { DesignItem, RoomTypeDefinition } from '../../types/design'

type DesignCanvasProps = {
  roomType: RoomTypeDefinition
  items: DesignItem[]
  selectedItemId: string | null
  onSelectItem: (itemId: string) => void
  onClearSelection: () => void
}

export function DesignCanvas({
  roomType,
  items,
  selectedItemId,
  onSelectItem,
  onClearSelection,
}: DesignCanvasProps) {
  const gridSize = Math.max(roomType.width, roomType.depth) * 2

  return (
    <Canvas
      key={roomType.id}
      shadows
      camera={{
        position: [roomType.width, roomType.height * 1.2, roomType.depth * 1.35],
        fov: 48,
      }}
      onPointerMissed={onClearSelection}
    >
      <color attach="background" args={['#e7efe8']} />
      <fog attach="fog" args={['#e7efe8', gridSize, gridSize * 2.4]} />

      <ambientLight intensity={1.15} />
      <directionalLight
        castShadow
        intensity={1.7}
        position={[roomType.width, roomType.height * 1.8, roomType.depth]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <OrbitControls
        makeDefault
        target={[0, roomType.height * 0.45, 0]}
        minDistance={4}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2.04}
      />

      <gridHelper
        args={[gridSize, 28, '#8a6f50', '#c6b59d']}
        position={[0, 0.01, 0]}
      />

      <RoomShell roomType={roomType} onBackgroundClick={onClearSelection} />

      {items.map((item) => (
        <SceneItem
          key={item.id}
          item={item}
          selected={item.id === selectedItemId}
          onSelect={onSelectItem}
        />
      ))}
    </Canvas>
  )
}
