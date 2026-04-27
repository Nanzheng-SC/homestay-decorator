import { ASSET_CATALOG } from '../data/assetCatalog'
import { ROOM_TYPES } from '../data/roomTypes'
import type {
  AssetCatalogEntry,
  AssetTypeId,
  DesignItem,
  PlacementSurface,
  RoomTypeDefinition,
  RoomTypeId,
  SceneSurfaceId,
  Vec3,
} from '../types/design'

const EDGE_PADDING = 0.08
const WALL_INSET = 0.045

export const WALL_SURFACE_IDS: SceneSurfaceId[] = [
  'northWall',
  'southWall',
  'westWall',
  'eastWall',
]

function clamp(value: number, min: number, max: number) {
  if (min > max) {
    return (min + max) / 2
  }

  return Math.min(max, Math.max(min, value))
}

function getHalfSize(asset: AssetCatalogEntry, scale: Vec3): Vec3 {
  return {
    x: (asset.size.x * scale.x) / 2,
    y: (asset.size.y * scale.y) / 2,
    z: (asset.size.z * scale.z) / 2,
  }
}

function getFloorExtents(
  asset: AssetCatalogEntry,
  scale: Vec3,
  rotationY: number,
): Pick<Vec3, 'x' | 'z'> {
  if (asset.primitive === 'cylinder') {
    const radius = Math.max(asset.size.x * scale.x, asset.size.z * scale.z) / 2

    return { x: radius, z: radius }
  }

  const halfX = (asset.size.x * scale.x) / 2
  const halfZ = (asset.size.z * scale.z) / 2
  const cosY = Math.abs(Math.cos(rotationY))
  const sinY = Math.abs(Math.sin(rotationY))

  return {
    x: halfX * cosY + halfZ * sinY,
    z: halfX * sinY + halfZ * cosY,
  }
}

export function getAllowedSurfaceIds(
  placementSurface: PlacementSurface,
): SceneSurfaceId[] {
  return placementSurface === 'floor' ? ['floor'] : WALL_SURFACE_IDS
}

export function getWallRotationY(surfaceId: SceneSurfaceId): number {
  switch (surfaceId) {
    case 'northWall':
      return 0
    case 'southWall':
      return Math.PI
    case 'westWall':
      return Math.PI / 2
    case 'eastWall':
      return -Math.PI / 2
    default:
      return 0
  }
}

export function matchesPlacementSurface(
  asset: AssetCatalogEntry,
  surfaceId: SceneSurfaceId,
): boolean {
  return getAllowedSurfaceIds(asset.placementSurface).includes(surfaceId)
}

export function getSurfaceCoordinate(
  roomType: RoomTypeDefinition,
  surfaceId: SceneSurfaceId,
): number {
  switch (surfaceId) {
    case 'northWall':
      return -roomType.depth / 2 + roomType.wallThickness / 2 + WALL_INSET
    case 'southWall':
      return roomType.depth / 2 - roomType.wallThickness / 2 - WALL_INSET
    case 'westWall':
      return -roomType.width / 2 + roomType.wallThickness / 2 + WALL_INSET
    case 'eastWall':
      return roomType.width / 2 - roomType.wallThickness / 2 - WALL_INSET
    default:
      return 0
  }
}

export function resolvePlacementTransform(
  roomType: RoomTypeDefinition,
  asset: AssetCatalogEntry,
  surfaceId: SceneSurfaceId,
  point: Vec3,
  scale: Vec3,
  rotation: Vec3,
): Pick<DesignItem, 'position' | 'rotation'> | null {
  if (!matchesPlacementSurface(asset, surfaceId)) {
    return null
  }

  const halfSize = getHalfSize(asset, scale)
  const innerHalfWidth =
    roomType.width / 2 - roomType.wallThickness / 2 - EDGE_PADDING
  const innerHalfDepth =
    roomType.depth / 2 - roomType.wallThickness / 2 - EDGE_PADDING

  if (surfaceId === 'floor') {
    const extents = getFloorExtents(asset, scale, rotation.y)

    return {
      position: {
        x: clamp(point.x, -innerHalfWidth + extents.x, innerHalfWidth - extents.x),
        y: halfSize.y,
        z: clamp(point.z, -innerHalfDepth + extents.z, innerHalfDepth - extents.z),
      },
      rotation: { ...rotation },
    }
  }

  const nextRotation = { x: 0, y: getWallRotationY(surfaceId), z: 0 }
  const minY = halfSize.y + EDGE_PADDING
  const maxY = roomType.height - halfSize.y - EDGE_PADDING
  const clampedY = clamp(point.y, minY, maxY)

  switch (surfaceId) {
    case 'northWall':
    case 'southWall':
      return {
        position: {
          x: clamp(point.x, -innerHalfWidth + halfSize.x, innerHalfWidth - halfSize.x),
          y: clampedY,
          z: getSurfaceCoordinate(roomType, surfaceId),
        },
        rotation: nextRotation,
      }
    case 'westWall':
    case 'eastWall':
      return {
        position: {
          x: getSurfaceCoordinate(roomType, surfaceId),
          y: clampedY,
          z: clamp(point.z, -innerHalfDepth + halfSize.x, innerHalfDepth - halfSize.x),
        },
        rotation: nextRotation,
      }
    default:
      return null
  }
}

export function buildPlacedItem(
  assetType: AssetTypeId,
  roomTypeId: RoomTypeId,
  surfaceId: SceneSurfaceId,
  point: Vec3,
): DesignItem | null {
  const asset = ASSET_CATALOG[assetType]
  const roomType = ROOM_TYPES[roomTypeId]
  const transform = resolvePlacementTransform(
    roomType,
    asset,
    surfaceId,
    point,
    asset.defaultScale,
    asset.defaultRotation,
  )

  if (!transform) {
    return null
  }

  return {
    id: crypto.randomUUID(),
    assetType,
    primitive: asset.primitive,
    placementSurface: asset.placementSurface,
    surfaceId,
    position: transform.position,
    rotation: transform.rotation,
    scale: { ...asset.defaultScale },
    color: asset.color,
  }
}

export function buildPreviewItem(
  assetType: AssetTypeId,
  roomType: RoomTypeDefinition,
  surfaceId: SceneSurfaceId,
  point: Vec3,
): DesignItem | null {
  const asset = ASSET_CATALOG[assetType]
  const transform = resolvePlacementTransform(
    roomType,
    asset,
    surfaceId,
    point,
    asset.defaultScale,
    asset.defaultRotation,
  )

  if (!transform) {
    return null
  }

  return {
    id: `preview-${assetType}`,
    assetType,
    primitive: asset.primitive,
    placementSurface: asset.placementSurface,
    surfaceId,
    position: transform.position,
    rotation: transform.rotation,
    scale: { ...asset.defaultScale },
    color: asset.color,
  }
}

export function inferSurfaceId(
  assetType: AssetTypeId,
  roomTypeId: RoomTypeId,
  position: Vec3,
): SceneSurfaceId {
  const asset = ASSET_CATALOG[assetType]

  if (asset.placementSurface === 'floor') {
    return 'floor'
  }

  const roomType = ROOM_TYPES[roomTypeId]
  const distances: Array<[SceneSurfaceId, number]> = [
    ['northWall', Math.abs(position.z - getSurfaceCoordinate(roomType, 'northWall'))],
    ['southWall', Math.abs(position.z - getSurfaceCoordinate(roomType, 'southWall'))],
    ['westWall', Math.abs(position.x - getSurfaceCoordinate(roomType, 'westWall'))],
    ['eastWall', Math.abs(position.x - getSurfaceCoordinate(roomType, 'eastWall'))],
  ]

  distances.sort((left, right) => left[1] - right[1])

  return distances[0][0]
}

export function normalizeItemForRoom(
  item: DesignItem,
  roomTypeId: RoomTypeId,
): DesignItem {
  const asset = ASSET_CATALOG[item.assetType]
  const roomType = ROOM_TYPES[roomTypeId]
  const surfaceId =
    item.placementSurface === 'floor'
      ? 'floor'
      : WALL_SURFACE_IDS.includes(item.surfaceId)
        ? item.surfaceId
        : inferSurfaceId(item.assetType, roomTypeId, item.position)
  const transform = resolvePlacementTransform(
    roomType,
    asset,
    surfaceId,
    item.position,
    item.scale,
    item.rotation,
  )

  if (!transform) {
    return buildPlacedItem(item.assetType, roomTypeId, surfaceId, item.position) ?? item
  }

  return {
    ...item,
    placementSurface: asset.placementSurface,
    surfaceId,
    primitive: asset.primitive,
    position: transform.position,
    rotation: transform.rotation,
  }
}
