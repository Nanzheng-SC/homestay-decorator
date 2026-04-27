import { useEffect, useState } from 'react'
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
  const pendingAssetType = useDesignStore((state) => state.pendingAssetType)
  const requestRoomTypeChange = useDesignStore(
    (state) => state.requestRoomTypeChange,
  )
  const beginPlacement = useDesignStore((state) => state.beginPlacement)
  const cancelPlacement = useDesignStore((state) => state.cancelPlacement)
  const placePendingAsset = useDesignStore((state) => state.placePendingAsset)
  const selectItem = useDesignStore((state) => state.selectItem)
  const clearSelection = useDesignStore((state) => state.clearSelection)
  const updateItemTransform = useDesignStore(
    (state) => state.updateItemTransform,
  )
  const moveItemOnSurface = useDesignStore((state) => state.moveItemOnSurface)
  const updateItemColor = useDesignStore((state) => state.updateItemColor)
  const removeItem = useDesignStore((state) => state.removeItem)
  const saveDesign = useDesignStore((state) => state.saveDesign)
  const loadDesign = useDesignStore((state) => state.loadDesign)
  const resetDesign = useDesignStore((state) => state.resetDesign)
  const [statusMessage, setStatusMessage] = useState(
    'Choose a room type, then place assets on the floor or walls.',
  )

  const activeRoom = ROOM_TYPES[currentRoomType]
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      if (pendingAssetType) {
        setStatusMessage(cancelPlacement().message)
        return
      }

      if (selectedItemId) {
        clearSelection()
        setStatusMessage('Selection cleared.')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [cancelPlacement, clearSelection, pendingAssetType, selectedItemId])

  function handleRoomTypeSelect(roomTypeId: RoomTypeId) {
    setStatusMessage(requestRoomTypeChange(roomTypeId).message)
  }

  function handleAssetAction(assetType: AssetTypeId) {
    const result =
      pendingAssetType === assetType
        ? cancelPlacement()
        : beginPlacement(assetType)

    setStatusMessage(result.message)
  }

  function handleCancelPlacement() {
    setStatusMessage(cancelPlacement().message)
  }

  function handleSaveDesign() {
    setStatusMessage(saveDesign().message)
  }

  function handleLoadDesign() {
    setStatusMessage(loadDesign().message)
  }

  function handleResetDesign() {
    resetDesign()
    setStatusMessage('Scene cleared. The current room type is unchanged.')
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
    if (!selectedItem || selectedItem.placementSurface === 'wall') {
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
    setStatusMessage(`${removedLabel} removed from the scene.`)
  }

  return (
    <main className="app-shell">
      <EditorSidebar
        currentRoomType={currentRoomType}
        itemCount={items.length}
        pendingAssetType={pendingAssetType}
        statusMessage={statusMessage}
        onAssetAction={handleAssetAction}
        onCancelPlacement={handleCancelPlacement}
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
            pendingAssetType={pendingAssetType}
            roomType={activeRoom}
            selectedItemId={selectedItemId}
            onClearSelection={clearSelection}
            onMoveItemOnSurface={moveItemOnSurface}
            onPlacePendingAsset={placePendingAsset}
            onSelectItem={selectItem}
            onStatusMessage={setStatusMessage}
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
