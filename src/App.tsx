import { useState } from 'react'
import './App.css'
import { EditorSidebar } from './components/editor/EditorSidebar'
import { InspectorPanel } from './components/editor/InspectorPanel'
import { DesignCanvas } from './components/scene/DesignCanvas'
import { ASSET_CATALOG } from './data/assetCatalog'
import { ROOM_TYPES } from './data/roomTypes'
import { useDesignStore } from './store/useDesignStore'
import type { AssetTypeId, RoomTypeId, Vec3 } from './types/design'

function App() {
  const currentRoomType = useDesignStore((state) => state.currentRoomType)
  const items = useDesignStore((state) => state.items)
  const selectedItemId = useDesignStore((state) => state.selectedItemId)
  const requestRoomTypeChange = useDesignStore(
    (state) => state.requestRoomTypeChange,
  )
  const addAsset = useDesignStore((state) => state.addAsset)
  const selectItem = useDesignStore((state) => state.selectItem)
  const clearSelection = useDesignStore((state) => state.clearSelection)
  const updateItemTransform = useDesignStore(
    (state) => state.updateItemTransform,
  )
  const updateItemColor = useDesignStore((state) => state.updateItemColor)
  const removeItem = useDesignStore((state) => state.removeItem)
  const saveDesign = useDesignStore((state) => state.saveDesign)
  const loadDesign = useDesignStore((state) => state.loadDesign)
  const resetDesign = useDesignStore((state) => state.resetDesign)
  const [statusMessage, setStatusMessage] = useState(
    '选择一个房型，添加基础组件，开始搭建你的民宿房间。',
  )

  const activeRoom = ROOM_TYPES[currentRoomType]
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null

  function handleRoomTypeSelect(roomTypeId: RoomTypeId) {
    setStatusMessage(requestRoomTypeChange(roomTypeId).message)
  }

  function handleAddAsset(assetType: AssetTypeId) {
    addAsset(assetType)
    setStatusMessage(`已添加 ${ASSET_CATALOG[assetType].label}。`)
  }

  function handleSaveDesign() {
    setStatusMessage(saveDesign().message)
  }

  function handleLoadDesign() {
    setStatusMessage(loadDesign().message)
  }

  function handleResetDesign() {
    resetDesign()
    setStatusMessage('已清空当前组件，保留当前房型。')
  }

  function handlePositionChange(axis: keyof Vec3, value: number) {
    if (!selectedItem) {
      return
    }

    updateItemTransform(selectedItem.id, {
      position: { ...selectedItem.position, [axis]: value },
    })
  }

  function handleScaleChange(axis: keyof Vec3, value: number) {
    if (!selectedItem) {
      return
    }

    updateItemTransform(selectedItem.id, {
      scale: { ...selectedItem.scale, [axis]: Math.max(0.2, value) },
    })
  }

  function handleRotationChange(value: number) {
    if (!selectedItem) {
      return
    }

    updateItemTransform(selectedItem.id, {
      rotation: { ...selectedItem.rotation, y: value },
    })
  }

  function handleColorChange(value: string) {
    if (!selectedItem) {
      return
    }

    updateItemColor(selectedItem.id, value)
  }

  function handleRemoveSelectedItem() {
    if (!selectedItem) {
      return
    }

    const removedLabel = ASSET_CATALOG[selectedItem.assetType].label
    removeItem(selectedItem.id)
    setStatusMessage(`已移除 ${removedLabel}。`)
  }

  return (
    <main className="app-shell">
      <EditorSidebar
        currentRoomType={currentRoomType}
        itemCount={items.length}
        statusMessage={statusMessage}
        onAddAsset={handleAddAsset}
        onLoadDesign={handleLoadDesign}
        onResetDesign={handleResetDesign}
        onRoomTypeSelect={handleRoomTypeSelect}
        onSaveDesign={handleSaveDesign}
      />

      <section className="canvas-panel panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">3D Editor</p>
            <h1>{activeRoom.label}</h1>
          </div>
          <p className="panel-copy">{activeRoom.description}</p>
        </header>

        <div className="scene-frame">
          <DesignCanvas
            items={items}
            roomType={activeRoom}
            selectedItemId={selectedItemId}
            onClearSelection={clearSelection}
            onSelectItem={selectItem}
          />
        </div>
      </section>

      <InspectorPanel
        item={selectedItem}
        onColorChange={handleColorChange}
        onPositionChange={handlePositionChange}
        onRemove={handleRemoveSelectedItem}
        onRotationYChange={handleRotationChange}
        onScaleChange={handleScaleChange}
      />
    </main>
  )
}

export default App
