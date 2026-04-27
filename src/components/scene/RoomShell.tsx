import { DoubleSide, type Mesh as ThreeMesh } from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { getAllowedSurfaceIds, getSurfaceCoordinate } from '../../lib/placement'
import type {
  PlacementSurface,
  RoomOpeningDefinition,
  RoomTypeDefinition,
  SceneSurfaceId,
  Vec3,
} from '../../types/design'

type RoomShellProps = {
  roomType: RoomTypeDefinition
  activePlacementSurface: PlacementSurface | null
  onBackgroundClick: () => void
  onSurfaceClick: (surfaceId: SceneSurfaceId, point: Vec3) => void
  onSurfacePointerMove: (surfaceId: SceneSurfaceId, point: Vec3) => void
}

const ignoreRaycast: ThreeMesh['raycast'] = () => undefined

function openingArgs(
  opening: RoomOpeningDefinition,
): [number, number, number] {
  const isSideWall = Math.abs(Math.abs(opening.rotationY) - Math.PI / 2) < 0.001

  return isSideWall
    ? [0.08, opening.height, opening.width]
    : [opening.width, opening.height, 0.08]
}

function toVec3(point: { x: number; y: number; z: number }): Vec3 {
  return { x: point.x, y: point.y, z: point.z }
}

function surfaceTint(
  activePlacementSurface: PlacementSurface | null,
  surfaceId: SceneSurfaceId,
): { color: string; opacity: number } {
  if (!activePlacementSurface) {
    return { color: '#355f62', opacity: 0.03 }
  }

  const enabled = getAllowedSurfaceIds(activePlacementSurface).includes(surfaceId)

  return enabled
    ? { color: '#6fa3a5', opacity: 0.16 }
    : { color: '#8b5a34', opacity: 0.04 }
}

export function RoomShell({
  roomType,
  activePlacementSurface,
  onBackgroundClick,
  onSurfaceClick,
  onSurfacePointerMove,
}: RoomShellProps) {
  const halfWidth = roomType.width / 2
  const halfDepth = roomType.depth / 2
  const floorWidth = roomType.width - roomType.wallThickness
  const floorDepth = roomType.depth - roomType.wallThickness
  const northTint = surfaceTint(activePlacementSurface, 'northWall')
  const southTint = surfaceTint(activePlacementSurface, 'southWall')
  const westTint = surfaceTint(activePlacementSurface, 'westWall')
  const eastTint = surfaceTint(activePlacementSurface, 'eastWall')
  const floorTint = surfaceTint(activePlacementSurface, 'floor')

  function handleBackgroundClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onBackgroundClick()
  }

  function handleSurfaceMove(
    surfaceId: SceneSurfaceId,
    event: ThreeEvent<PointerEvent>,
  ) {
    event.stopPropagation()
    onSurfacePointerMove(surfaceId, toVec3(event.point))
  }

  function handleSurfaceClick(
    surfaceId: SceneSurfaceId,
    event: ThreeEvent<MouseEvent>,
  ) {
    event.stopPropagation()
    onSurfaceClick(surfaceId, toVec3(event.point))
  }

  return (
    <group onClick={handleBackgroundClick}>
      <mesh position={[0, -roomType.floorThickness / 2, 0]} receiveShadow raycast={ignoreRaycast}>
        <boxGeometry
          args={[roomType.width, roomType.floorThickness, roomType.depth]}
        />
        <meshStandardMaterial color={roomType.colors.floor} />
      </mesh>

      <mesh
        position={[0, roomType.height + roomType.ceilingThickness / 2, 0]}
        raycast={ignoreRaycast}
      >
        <boxGeometry
          args={[roomType.width, roomType.ceilingThickness, roomType.depth]}
        />
        <meshStandardMaterial
          color={roomType.colors.ceiling}
          opacity={0.44}
          transparent
        />
      </mesh>

      <mesh
        position={[0, roomType.height / 2, -halfDepth]}
        receiveShadow
        raycast={ignoreRaycast}
      >
        <boxGeometry
          args={[roomType.width, roomType.height, roomType.wallThickness]}
        />
        <meshStandardMaterial
          color={roomType.colors.wall}
          opacity={0.82}
          transparent
        />
      </mesh>

      <mesh
        position={[0, roomType.height / 2, halfDepth]}
        receiveShadow
        raycast={ignoreRaycast}
      >
        <boxGeometry
          args={[roomType.width, roomType.height, roomType.wallThickness]}
        />
        <meshStandardMaterial
          color={roomType.colors.wall}
          opacity={0.6}
          transparent
        />
      </mesh>

      <mesh
        position={[-halfWidth, roomType.height / 2, 0]}
        receiveShadow
        raycast={ignoreRaycast}
      >
        <boxGeometry
          args={[roomType.wallThickness, roomType.height, roomType.depth]}
        />
        <meshStandardMaterial
          color={roomType.colors.wall}
          opacity={0.74}
          transparent
        />
      </mesh>

      <mesh
        position={[halfWidth, roomType.height / 2, 0]}
        receiveShadow
        raycast={ignoreRaycast}
      >
        <boxGeometry
          args={[roomType.wallThickness, roomType.height, roomType.depth]}
        />
        <meshStandardMaterial
          color={roomType.colors.wall}
          opacity={0.68}
          transparent
        />
      </mesh>

      <mesh
        position={[
          roomType.door.position.x,
          roomType.door.position.y,
          roomType.door.position.z,
        ]}
        rotation={[0, roomType.door.rotationY, 0]}
        castShadow
        raycast={ignoreRaycast}
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
        raycast={ignoreRaycast}
      >
        <boxGeometry args={openingArgs(roomType.window)} />
        <meshStandardMaterial
          color={roomType.colors.window}
          metalness={0.1}
          opacity={0.52}
          roughness={0.12}
          transparent
        />
      </mesh>

      <mesh
        position={[0, 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event) => handleSurfaceClick('floor', event)}
        onPointerMove={(event) => handleSurfaceMove('floor', event)}
      >
        <planeGeometry args={[floorWidth, floorDepth]} />
        <meshStandardMaterial
          color={floorTint.color}
          opacity={floorTint.opacity}
          side={DoubleSide}
          transparent
        />
      </mesh>

      <mesh
        position={[0, roomType.height / 2, getSurfaceCoordinate(roomType, 'northWall')]}
        onClick={(event) => handleSurfaceClick('northWall', event)}
        onPointerMove={(event) => handleSurfaceMove('northWall', event)}
      >
        <planeGeometry args={[floorWidth, roomType.height]} />
        <meshStandardMaterial
          color={northTint.color}
          opacity={northTint.opacity}
          side={DoubleSide}
          transparent
        />
      </mesh>

      <mesh
        position={[0, roomType.height / 2, getSurfaceCoordinate(roomType, 'southWall')]}
        rotation={[0, Math.PI, 0]}
        onClick={(event) => handleSurfaceClick('southWall', event)}
        onPointerMove={(event) => handleSurfaceMove('southWall', event)}
      >
        <planeGeometry args={[floorWidth, roomType.height]} />
        <meshStandardMaterial
          color={southTint.color}
          opacity={southTint.opacity}
          side={DoubleSide}
          transparent
        />
      </mesh>

      <mesh
        position={[getSurfaceCoordinate(roomType, 'westWall'), roomType.height / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        onClick={(event) => handleSurfaceClick('westWall', event)}
        onPointerMove={(event) => handleSurfaceMove('westWall', event)}
      >
        <planeGeometry args={[floorDepth, roomType.height]} />
        <meshStandardMaterial
          color={westTint.color}
          opacity={westTint.opacity}
          side={DoubleSide}
          transparent
        />
      </mesh>

      <mesh
        position={[getSurfaceCoordinate(roomType, 'eastWall'), roomType.height / 2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        onClick={(event) => handleSurfaceClick('eastWall', event)}
        onPointerMove={(event) => handleSurfaceMove('eastWall', event)}
      >
        <planeGeometry args={[floorDepth, roomType.height]} />
        <meshStandardMaterial
          color={eastTint.color}
          opacity={eastTint.opacity}
          side={DoubleSide}
          transparent
        />
      </mesh>
    </group>
  )
}
