export type RoomTypeId = 'standard_room' | 'king_room' | 'loft_room'

export type AssetTypeId = 'bed' | 'toilet' | 'mirror' | 'lamp' | 'display'

export type PrimitiveKind = 'box' | 'cylinder' | 'plane'

export type Vec3 = {
  x: number
  y: number
  z: number
}

export interface DesignItem {
  id: string
  assetType: AssetTypeId
  primitive: PrimitiveKind
  position: Vec3
  rotation: Vec3
  scale: Vec3
  color: string
}

export interface StoredDesignV1 {
  version: 1
  roomTypeId: RoomTypeId
  items: DesignItem[]
}

export interface RoomOpeningDefinition {
  width: number
  height: number
  position: Vec3
  rotationY: number
  color: string
}

export interface RoomTypeDefinition {
  id: RoomTypeId
  label: string
  description: string
  width: number
  depth: number
  height: number
  wallThickness: number
  floorThickness: number
  ceilingThickness: number
  door: RoomOpeningDefinition
  window: RoomOpeningDefinition
  colors: {
    floor: string
    wall: string
    ceiling: string
    door: string
    window: string
  }
}

export interface AssetCatalogEntry {
  id: AssetTypeId
  label: string
  primitive: PrimitiveKind
  size: Vec3
  defaultPosition: Vec3
  defaultRotation: Vec3
  defaultScale: Vec3
  color: string
  description: string
}
