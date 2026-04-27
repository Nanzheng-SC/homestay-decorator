import { create } from 'zustand'
import { ASSET_CATALOG, ASSET_TYPE_IDS } from '../data/assetCatalog'
import { ROOM_TYPE_IDS } from '../data/roomTypes'
import type {
  AssetTypeId,
  DesignItem,
  PrimitiveKind,
  RoomTypeId,
  StoredDesignV1,
  Vec3,
} from '../types/design'

const STORAGE_KEY = 'homestay-decorator:design:v1'

const PLACEMENT_OFFSETS: Array<Pick<Vec3, 'x' | 'z'>> = [
  { x: 0, z: 0 },
  { x: 1.35, z: 0.55 },
  { x: -1.35, z: -0.45 },
  { x: 1.05, z: -1.15 },
  { x: -1.1, z: 1.1 },
  { x: 0.4, z: 1.55 },
  { x: -0.55, z: -1.55 },
]

type ActionResult = {
  ok: boolean
  message: string
}

type DesignStoreState = {
  currentRoomType: RoomTypeId
  items: DesignItem[]
  selectedItemId: string | null
  requestRoomTypeChange: (roomTypeId: RoomTypeId) => ActionResult
  setRoomType: (roomTypeId: RoomTypeId) => void
  addAsset: (assetType: AssetTypeId) => void
  selectItem: (itemId: string) => void
  clearSelection: () => void
  updateItemTransform: (
    itemId: string,
    patch: Partial<Pick<DesignItem, 'position' | 'rotation' | 'scale'>>,
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

function isPrimitiveKind(value: unknown): value is PrimitiveKind {
  return value === 'box' || value === 'cylinder' || value === 'plane'
}

function isVec3(value: unknown): value is Vec3 {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<Vec3>

  return (
    typeof candidate.x === 'number' &&
    typeof candidate.y === 'number' &&
    typeof candidate.z === 'number'
  )
}

function isDesignItem(value: unknown): value is DesignItem {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<DesignItem>

  return (
    typeof candidate.id === 'string' &&
    isAssetTypeId(candidate.assetType) &&
    isPrimitiveKind(candidate.primitive) &&
    isVec3(candidate.position) &&
    isVec3(candidate.rotation) &&
    isVec3(candidate.scale) &&
    typeof candidate.color === 'string' &&
    ASSET_CATALOG[candidate.assetType].primitive === candidate.primitive
  )
}

function isStoredDesignV1(value: unknown): value is StoredDesignV1 {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<StoredDesignV1>

  return (
    candidate.version === 1 &&
    isRoomTypeId(candidate.roomTypeId) &&
    Array.isArray(candidate.items) &&
    candidate.items.every((item) => isDesignItem(item))
  )
}

function buildItem(assetType: AssetTypeId, itemCount: number): DesignItem {
  const asset = ASSET_CATALOG[assetType]
  const offset = PLACEMENT_OFFSETS[itemCount % PLACEMENT_OFFSETS.length]

  return {
    id: crypto.randomUUID(),
    assetType,
    primitive: asset.primitive,
    position: {
      x: asset.defaultPosition.x + offset.x,
      y: asset.defaultPosition.y,
      z: asset.defaultPosition.z + offset.z,
    },
    rotation: { ...asset.defaultRotation },
    scale: { ...asset.defaultScale },
    color: asset.color,
  }
}

export const useDesignStore = create<DesignStoreState>((set, get) => ({
  currentRoomType: 'standard_room',
  items: [],
  selectedItemId: null,

  requestRoomTypeChange: (roomTypeId) => {
    if (roomTypeId === get().currentRoomType) {
      return { ok: true, message: '当前已经是这个房型。' }
    }

    if (
      get().items.length > 0 &&
      !window.confirm('切换房型会清空当前组件，是否继续？')
    ) {
      return { ok: false, message: '已取消房型切换。' }
    }

    set({
      currentRoomType: roomTypeId,
      items: [],
      selectedItemId: null,
    })

    return { ok: true, message: '房型已切换，当前组件已清空。' }
  },

  setRoomType: (roomTypeId) => {
    set({ currentRoomType: roomTypeId, selectedItemId: null })
  },

  addAsset: (assetType) => {
    set((state) => ({
      items: [...state.items, buildItem(assetType, state.items.length)],
    }))
  },

  selectItem: (itemId) => {
    set({ selectedItemId: itemId })
  },

  clearSelection: () => {
    set({ selectedItemId: null })
  },

  updateItemTransform: (itemId, patch) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              position: patch.position ?? item.position,
              rotation: patch.rotation ?? item.rotation,
              scale: patch.scale ?? item.scale,
            }
          : item,
      ),
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

      return { ok: true, message: '设计已保存到浏览器 LocalStorage。' }
    } catch {
      return { ok: false, message: '保存失败，当前浏览器无法写入 LocalStorage。' }
    }
  },

  loadDesign: () => {
    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return { ok: false, message: '未找到已保存的设计。' }
    }

    try {
      const parsed: unknown = JSON.parse(raw)

      if (!isStoredDesignV1(parsed)) {
        return { ok: false, message: '已保存的数据格式无效，无法加载。' }
      }

      set({
        currentRoomType: parsed.roomTypeId,
        items: parsed.items,
        selectedItemId: null,
      })

      return { ok: true, message: '设计已从 LocalStorage 加载。' }
    } catch {
      return { ok: false, message: '加载失败，LocalStorage 数据已损坏。' }
    }
  },

  resetDesign: () => {
    set({ items: [], selectedItemId: null })
  },
}))
