import { create } from 'zustand'
import { ASSET_CATALOG, ASSET_TYPE_IDS } from '../data/assetCatalog'
import { ROOM_TYPE_IDS } from '../data/roomTypes'
import {
  buildPlacedItem,
  inferSurfaceId,
  matchesPlacementSurface,
  normalizeItemForRoom,
} from '../lib/placement'
import type {
  AssetTypeId,
  DesignItem,
  PlacementSurface,
  RoomTypeId,
  SceneSurfaceId,
  StoredDesignV1,
  Vec3,
} from '../types/design'

const STORAGE_KEY = 'homestay-decorator:design:v1'

type ActionResult = {
  ok: boolean
  message: string
}

type DesignStoreState = {
  currentRoomType: RoomTypeId
  items: DesignItem[]
  selectedItemId: string | null
  pendingAssetType: AssetTypeId | null
  requestRoomTypeChange: (roomTypeId: RoomTypeId) => ActionResult
  setRoomType: (roomTypeId: RoomTypeId) => void
  beginPlacement: (assetType: AssetTypeId) => ActionResult
  cancelPlacement: () => ActionResult
  placePendingAsset: (surfaceId: SceneSurfaceId, point: Vec3) => ActionResult
  selectItem: (itemId: string) => void
  clearSelection: () => void
  updateItemTransform: (
    itemId: string,
    patch: Partial<Pick<DesignItem, 'position' | 'rotation' | 'scale'>>,
  ) => void
  moveItemOnSurface: (
    itemId: string,
    surfaceId: SceneSurfaceId,
    point: Vec3,
  ) => void
  updateItemColor: (itemId: string, color: string) => void
  removeItem: (itemId: string) => void
  saveDesign: () => ActionResult
  loadDesign: () => ActionResult
  resetDesign: () => void
}

function isRoomTypeId(value: unknown): value is RoomTypeId {
  return typeof value === 'string' && ROOM_TYPE_IDS.includes(value as RoomTypeId)
}

function isAssetTypeId(value: unknown): value is AssetTypeId {
  return typeof value === 'string' && ASSET_TYPE_IDS.includes(value as AssetTypeId)
}

function isPlacementSurface(value: unknown): value is PlacementSurface {
  return value === 'floor' || value === 'wall'
}

function isSceneSurfaceId(value: unknown): value is SceneSurfaceId {
  return (
    value === 'floor' ||
    value === 'northWall' ||
    value === 'southWall' ||
    value === 'westWall' ||
    value === 'eastWall'
  )
}

function coerceNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function coerceVec3(value: unknown, fallback: Vec3): Vec3 {
  if (!value || typeof value !== 'object') {
    return { ...fallback }
  }

  const candidate = value as Partial<Vec3>

  return {
    x: coerceNumber(candidate.x, fallback.x),
    y: coerceNumber(candidate.y, fallback.y),
    z: coerceNumber(candidate.z, fallback.z),
  }
}

function coerceDesignItem(
  value: unknown,
  roomTypeId: RoomTypeId,
): DesignItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<DesignItem>

  if (!isAssetTypeId(candidate.assetType)) {
    return null
  }

  const asset = ASSET_CATALOG[candidate.assetType]
  const position = coerceVec3(candidate.position, asset.defaultPosition)
  const rotation = coerceVec3(candidate.rotation, asset.defaultRotation)
  const scale = coerceVec3(candidate.scale, asset.defaultScale)
  const placementSurface = isPlacementSurface(candidate.placementSurface)
    ? candidate.placementSurface
    : asset.placementSurface
  const inferredSurfaceId = inferSurfaceId(
    candidate.assetType,
    roomTypeId,
    position,
  )
  const surfaceId =
    isSceneSurfaceId(candidate.surfaceId) && placementSurface === asset.placementSurface
      ? candidate.surfaceId
      : inferredSurfaceId
  const nextItem: DesignItem = {
    id:
      typeof candidate.id === 'string' && candidate.id.length > 0
        ? candidate.id
        : crypto.randomUUID(),
    assetType: candidate.assetType,
    primitive: asset.primitive,
    placementSurface: asset.placementSurface,
    surfaceId,
    position,
    rotation,
    scale,
    color: typeof candidate.color === 'string' ? candidate.color : asset.color,
  }

  return normalizeItemForRoom(nextItem, roomTypeId)
}

function coerceStoredDesign(value: unknown): StoredDesignV1 | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<StoredDesignV1> & { items?: unknown[] }

  if (candidate.version !== 1 || !isRoomTypeId(candidate.roomTypeId)) {
    return null
  }

  if (!Array.isArray(candidate.items)) {
    return null
  }

  const roomTypeId = candidate.roomTypeId

  return {
    version: 1,
    roomTypeId,
    items: candidate.items
      .map((item) => coerceDesignItem(item, roomTypeId))
      .filter((item): item is DesignItem => item !== null),
  }
}

export const useDesignStore = create<DesignStoreState>((set, get) => ({
  currentRoomType: 'standard_room',
  items: [],
  selectedItemId: null,
  pendingAssetType: null,

  requestRoomTypeChange: (roomTypeId) => {
    if (roomTypeId === get().currentRoomType) {
      return { ok: true, message: 'The selected room type is already active.' }
    }

    if (
      get().items.length > 0 &&
      !window.confirm(
        'Switching the room type will clear all placed assets. Continue?',
      )
    ) {
      return { ok: false, message: 'Room type change was cancelled.' }
    }

    set({
      currentRoomType: roomTypeId,
      items: [],
      selectedItemId: null,
      pendingAssetType: null,
    })

    return { ok: true, message: 'Room type changed and the scene was reset.' }
  },

  setRoomType: (roomTypeId) => {
    set({
      currentRoomType: roomTypeId,
      pendingAssetType: null,
      selectedItemId: null,
    })
  },

  beginPlacement: (assetType) => {
    set({ pendingAssetType: assetType, selectedItemId: null })

    return {
      ok: true,
      message: `Placement mode enabled for ${ASSET_CATALOG[assetType].label}.`,
    }
  },

  cancelPlacement: () => {
    if (!get().pendingAssetType) {
      return { ok: true, message: 'Placement mode is already idle.' }
    }

    set({ pendingAssetType: null })

    return { ok: true, message: 'Placement mode cancelled.' }
  },

  placePendingAsset: (surfaceId, point) => {
    const pendingAssetType = get().pendingAssetType

    if (!pendingAssetType) {
      return { ok: false, message: 'No asset is waiting to be placed.' }
    }

    const nextItem = buildPlacedItem(
      pendingAssetType,
      get().currentRoomType,
      surfaceId,
      point,
    )

    if (!nextItem) {
      const asset = ASSET_CATALOG[pendingAssetType]
      const target =
        asset.placementSurface === 'floor' ? 'the floor' : 'a wall surface'

      return { ok: false, message: `Place ${asset.label} on ${target}.` }
    }

    set((state) => ({
      items: [...state.items, nextItem],
      pendingAssetType: null,
      selectedItemId: nextItem.id,
    }))

    return {
      ok: true,
      message: `${ASSET_CATALOG[pendingAssetType].label} placed in the scene.`,
    }
  },

  selectItem: (itemId) => {
    set({ selectedItemId: itemId })
  },

  clearSelection: () => {
    set({ selectedItemId: null })
  },

  updateItemTransform: (itemId, patch) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        return normalizeItemForRoom(
          {
            ...item,
            position: patch.position ?? item.position,
            rotation: patch.rotation ?? item.rotation,
            scale: patch.scale ?? item.scale,
          },
          state.currentRoomType,
        )
      }),
    }))
  },

  moveItemOnSurface: (itemId, surfaceId, point) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== itemId) {
          return item
        }

        const asset = ASSET_CATALOG[item.assetType]
        const nextSurfaceId =
          item.placementSurface === 'wall' ? item.surfaceId : surfaceId

        if (!matchesPlacementSurface(asset, nextSurfaceId)) {
          return item
        }

        return normalizeItemForRoom(
          {
            ...item,
            position: point,
            surfaceId: nextSurfaceId,
          },
          state.currentRoomType,
        )
      }),
    }))
  },

  updateItemColor: (itemId, color) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, color } : item,
      ),
    }))
  },

  removeItem: (itemId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
      selectedItemId:
        state.selectedItemId === itemId ? null : state.selectedItemId,
    }))
  },

  saveDesign: () => {
    try {
      const snapshot: StoredDesignV1 = {
        version: 1,
        roomTypeId: get().currentRoomType,
        items: get().items,
      }

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))

      return { ok: true, message: 'Design saved to local storage.' }
    } catch {
      return {
        ok: false,
        message: 'Unable to write the design snapshot to local storage.',
      }
    }
  },

  loadDesign: () => {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return { ok: false, message: 'No saved design was found in local storage.' }
    }

    try {
      const parsed = coerceStoredDesign(JSON.parse(raw))

      if (!parsed) {
        return { ok: false, message: 'Saved data is invalid and cannot be loaded.' }
      }

      set({
        currentRoomType: parsed.roomTypeId,
        items: parsed.items,
        pendingAssetType: null,
        selectedItemId: null,
      })

      return { ok: true, message: 'Design loaded from local storage.' }
    } catch {
      return { ok: false, message: 'Saved data is corrupted and cannot be parsed.' }
    }
  },

  resetDesign: () => {
    set({ items: [], pendingAssetType: null, selectedItemId: null })
  },
}))
