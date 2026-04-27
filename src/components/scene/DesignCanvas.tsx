import { OrbitControls } from '@react-three/drei'
import { Canvas, type ThreeEvent } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Plane, Ray, Vector3 } from 'three'
import { ASSET_CATALOG } from '../../data/assetCatalog'
import { buildPreviewItem, getSurfaceCoordinate } from '../../lib/placement'
import { RoomShell } from './RoomShell'
import { SceneItem } from './SceneItem'
import type {
  AssetTypeId,
  DesignItem,
  RoomTypeDefinition,
  SceneSurfaceId,
  Vec3,
} from '../../types/design'

type DesignCanvasProps = {
  roomType: RoomTypeDefinition
  items: DesignItem[]
  selectedItemId: string | null
  pendingAssetType: AssetTypeId | null
  onSelectItem: (itemId: string) => void
  onClearSelection: () => void
  onPlacePendingAsset: (surfaceId: SceneSurfaceId, point: Vec3) => {
    ok: boolean
    message: string
  }
  onMoveItemOnSurface: (
    itemId: string,
    surfaceId: SceneSurfaceId,
    point: Vec3,
  ) => void
  onStatusMessage: (message: string) => void
}

type HoverPlacement = {
  surfaceId: SceneSurfaceId
  point: Vec3
}

function intersectRayWithSurface(
  ray: Ray,
  roomType: RoomTypeDefinition,
  surfaceId: SceneSurfaceId,
): Vec3 | null {
  const plane = new Plane()

  switch (surfaceId) {
    case 'floor':
      plane.set(new Vector3(0, 1, 0), 0)
      break
    case 'northWall':
      plane.set(
        new Vector3(0, 0, 1),
        -getSurfaceCoordinate(roomType, 'northWall'),
      )
      break
    case 'southWall':
      plane.set(
        new Vector3(0, 0, -1),
        getSurfaceCoordinate(roomType, 'southWall'),
      )
      break
    case 'westWall':
      plane.set(
        new Vector3(1, 0, 0),
        -getSurfaceCoordinate(roomType, 'westWall'),
      )
      break
    case 'eastWall':
      plane.set(
        new Vector3(-1, 0, 0),
        getSurfaceCoordinate(roomType, 'eastWall'),
      )
      break
  }

  const result = ray.intersectPlane(plane, new Vector3())

  return result ? { x: result.x, y: result.y, z: result.z } : null
}

export function DesignCanvas({
  roomType,
  items,
  selectedItemId,
  pendingAssetType,
  onSelectItem,
  onClearSelection,
  onPlacePendingAsset,
  onMoveItemOnSurface,
  onStatusMessage,
}: DesignCanvasProps) {
  const [hoverPlacement, setHoverPlacement] = useState<HoverPlacement | null>(null)
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null)
  const didMoveDuringDragRef = useRef(false)
  const gridSize = Math.max(roomType.width, roomType.depth) * 1.8
  const previewItem =
    pendingAssetType && hoverPlacement
      ? buildPreviewItem(
          pendingAssetType,
          roomType,
          hoverPlacement.surfaceId,
          hoverPlacement.point,
        )
      : null

  function handleSurfacePointerMove(surfaceId: SceneSurfaceId, point: Vec3) {
    if (!pendingAssetType) {
      return
    }

    setHoverPlacement({ surfaceId, point })
  }

  function handleSurfaceClick(surfaceId: SceneSurfaceId, point: Vec3) {
    if (draggingItemId) {
      return
    }

    if (!pendingAssetType) {
      onClearSelection()
      return
    }

    const result = onPlacePendingAsset(surfaceId, point)
    onStatusMessage(result.message)

    if (result.ok) {
      setHoverPlacement(null)
    }
  }

  function handleDragStart(itemId: string) {
    setDraggingItemId(itemId)
    didMoveDuringDragRef.current = false
  }

  function handleDragMove(itemId: string, event: ThreeEvent<PointerEvent>) {
    const item = items.find((candidate) => candidate.id === itemId)

    if (!item) {
      return
    }

    const point = intersectRayWithSurface(event.ray, roomType, item.surfaceId)

    if (!point) {
      return
    }

    didMoveDuringDragRef.current = true
    onMoveItemOnSurface(itemId, item.surfaceId, point)
  }

  function handleDragEnd(itemId: string) {
    const item = items.find((candidate) => candidate.id === itemId)

    setDraggingItemId(null)

    if (item && didMoveDuringDragRef.current) {
      onStatusMessage(`${ASSET_CATALOG[item.assetType].label} moved.`)
    }

    didMoveDuringDragRef.current = false
  }

  return (
    <Canvas
      key={roomType.id}
      shadows
      camera={{
        position: [roomType.width * 0.9, roomType.height * 1.02, roomType.depth],
        fov: 42,
      }}
      onPointerMissed={() => {
        if (!pendingAssetType) {
          onClearSelection()
        }
      }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#e7efe8']} />
      <fog attach="fog" args={['#e7efe8', gridSize, gridSize * 2.2]} />

      <ambientLight intensity={1.1} />
      <directionalLight
        castShadow
        intensity={1.6}
        position={[roomType.width, roomType.height * 1.8, roomType.depth]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <OrbitControls
        enabled={!draggingItemId}
        makeDefault
        target={[0, roomType.height * 0.45, 0]}
        minDistance={4}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.02}
      />

      <gridHelper
        args={[gridSize, 28, '#8a6f50', '#c6b59d']}
        position={[0, 0.01, 0]}
      />

      <RoomShell
        activePlacementSurface={
          pendingAssetType ? ASSET_CATALOG[pendingAssetType].placementSurface : null
        }
        roomType={roomType}
        onBackgroundClick={onClearSelection}
        onSurfaceClick={handleSurfaceClick}
        onSurfacePointerMove={handleSurfacePointerMove}
      />

      {items.map((item) => (
        <SceneItem
          key={item.id}
          disabled={pendingAssetType !== null}
          dragging={item.id === draggingItemId}
          item={item}
          selected={item.id === selectedItemId}
          onDragEnd={handleDragEnd}
          onDragMove={handleDragMove}
          onDragStart={handleDragStart}
          onSelect={onSelectItem}
        />
      ))}

      {previewItem ? <SceneItem item={previewItem} preview selected={false} /> : null}
    </Canvas>
  )
}
