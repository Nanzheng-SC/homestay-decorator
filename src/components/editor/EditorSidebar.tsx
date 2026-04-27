import { ASSET_CATALOG, ASSET_TYPE_IDS } from '../../data/assetCatalog'
import { ROOM_TYPE_IDS, ROOM_TYPES } from '../../data/roomTypes'
import type { AssetTypeId, RoomTypeId } from '../../types/design'

type EditorSidebarProps = {
  currentRoomType: RoomTypeId
  itemCount: number
  pendingAssetType: AssetTypeId | null
  statusMessage: string
  onRoomTypeSelect: (roomTypeId: RoomTypeId) => void
  onAssetAction: (assetType: AssetTypeId) => void
  onCancelPlacement: () => void
  onSaveDesign: () => void
  onLoadDesign: () => void
  onResetDesign: () => void
}

export function EditorSidebar({
  currentRoomType,
  itemCount,
  pendingAssetType,
  statusMessage,
  onRoomTypeSelect,
  onAssetAction,
  onCancelPlacement,
  onSaveDesign,
  onLoadDesign,
  onResetDesign,
}: EditorSidebarProps) {
  return (
    <aside className="editor-sidebar">
      <section className="panel status-card">
        <span className="status-badge">MVP Builder</span>
        <p className="status-message">{statusMessage}</p>

        <div className="status-stats">
          <div className="stat-box">
            <span>Room</span>
            <strong>{ROOM_TYPES[currentRoomType].label}</strong>
          </div>
          <div className="stat-box">
            <span>Assets</span>
            <strong>{itemCount}</strong>
          </div>
        </div>

        {pendingAssetType ? (
          <div className="placement-banner">
            <strong>Placement mode</strong>
            <span>{ASSET_CATALOG[pendingAssetType].label} is waiting in the scene.</span>
            <button
              type="button"
              className="danger-button"
              onClick={onCancelPlacement}
            >
              Cancel placement
            </button>
          </div>
        ) : null}
      </section>

      <section className="panel panel-section">
        <h2 className="section-title">Room Types</h2>
        <p className="section-copy">
          Changing the room clears placed assets after a confirmation prompt.
        </p>

        <div className="button-grid">
          {ROOM_TYPE_IDS.map((roomTypeId) => {
            const roomType = ROOM_TYPES[roomTypeId]

            return (
              <button
                key={roomTypeId}
                type="button"
                className={`room-button ${
                  roomTypeId === currentRoomType ? 'active' : ''
                }`}
                onClick={() => onRoomTypeSelect(roomTypeId)}
              >
                <strong>{roomType.label}</strong>
                <span>{roomType.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel panel-section">
        <h2 className="section-title">Primitive Assets</h2>
        <p className="section-copy">
          Click an asset to enter placement mode, then click the floor or a wall.
        </p>

        <div className="button-grid">
          {ASSET_TYPE_IDS.map((assetTypeId) => {
            const asset = ASSET_CATALOG[assetTypeId]
            const isPending = pendingAssetType === assetTypeId

            return (
              <button
                key={assetTypeId}
                type="button"
                className={`asset-button ${isPending ? 'active' : ''}`}
                onClick={() => onAssetAction(assetTypeId)}
              >
                <strong>{isPending ? `Cancel ${asset.label}` : `Place ${asset.label}`}</strong>
                <span>{asset.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel panel-section">
        <h2 className="section-title">Save and Load</h2>
        <p className="section-copy">
          The current design persists as a single draft in local storage.
        </p>

        <div className="button-grid compact">
          <button type="button" className="action-button" onClick={onSaveDesign}>
            Save draft
          </button>
          <button type="button" className="action-button" onClick={onLoadDesign}>
            Load draft
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={onResetDesign}
          >
            Clear scene
          </button>
        </div>
      </section>
    </aside>
  )
}
