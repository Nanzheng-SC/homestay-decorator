import type { ThreeEvent } from '@react-three/fiber'
import type {
  RoomOpeningDefinition,
  RoomTypeDefinition,
} from '../../types/design'

type RoomShellProps = {
  roomType: RoomTypeDefinition
  onBackgroundClick: () => void
}

function openingArgs(
  opening: RoomOpeningDefinition,
): [number, number, number] {
  const isSideWall = Math.abs(Math.abs(opening.rotationY) - Math.PI / 2) < 0.001

  return isSideWall
    ? [0.08, opening.height, opening.width]
    : [opening.width, opening.height, 0.08]
}

export function RoomShell({ roomType, onBackgroundClick }: RoomShellProps) {
  const halfWidth = roomType.width / 2
  const halfDepth = roomType.depth / 2

  function handleBackgroundClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onBackgroundClick()
  }

  return (
    <group onClick={handleBackgroundClick}>
      <mesh position={[0, -roomType.floorThickness / 2, 0]} receiveShadow>
        <boxGeometry
          args={[roomType.width, roomType.floorThickness, roomType.depth]}
        />
        <meshStandardMaterial color={roomType.colors.floor} />
      </mesh>

      <mesh position={[0, roomType.height + roomType.ceilingThickness / 2, 0]}>
        <boxGeometry
          args={[roomType.width, roomType.ceilingThickness, roomType.depth]}
        />
        <meshStandardMaterial color={roomType.colors.ceiling} />
      </mesh>

      <mesh position={[0, roomType.height / 2, -halfDepth]} receiveShadow>
        <boxGeometry
          args={[roomType.width, roomType.height, roomType.wallThickness]}
        />
        <meshStandardMaterial color={roomType.colors.wall} />
      </mesh>

      <mesh position={[0, roomType.height / 2, halfDepth]} receiveShadow>
        <boxGeometry
          args={[roomType.width, roomType.height, roomType.wallThickness]}
        />
        <meshStandardMaterial color={roomType.colors.wall} />
      </mesh>

      <mesh position={[-halfWidth, roomType.height / 2, 0]} receiveShadow>
        <boxGeometry
          args={[roomType.wallThickness, roomType.height, roomType.depth]}
        />
        <meshStandardMaterial color={roomType.colors.wall} />
      </mesh>

      <mesh position={[halfWidth, roomType.height / 2, 0]} receiveShadow>
        <boxGeometry
          args={[roomType.wallThickness, roomType.height, roomType.depth]}
        />
        <meshStandardMaterial color={roomType.colors.wall} />
      </mesh>

      <mesh
        position={[
          roomType.door.position.x,
          roomType.door.position.y,
          roomType.door.position.z,
        ]}
        rotation={[0, roomType.door.rotationY, 0]}
        castShadow
      >
        <boxGeometry args={openingArgs(roomType.door)} />
        <meshStandardMaterial color={roomType.colors.door} />
      </mesh>

      <mesh
        position={[
          roomType.window.position.x,
          roomType.window.position.y,
          roomType.window.position.z,
        ]}
        rotation={[0, roomType.window.rotationY, 0]}
      >
        <boxGeometry args={openingArgs(roomType.window)} />
        <meshStandardMaterial
          color={roomType.colors.window}
          metalness={0.1}
          opacity={0.62}
          roughness={0.12}
          transparent
        />
      </mesh>
    </group>
  )
}
