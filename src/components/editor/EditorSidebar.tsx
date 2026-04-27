import { ASSET_CATALOG, ASSET_TYPE_IDS } from '../../data/assetCatalog'
import { ROOM_TYPE_IDS, ROOM_TYPES } from '../../data/roomTypes'
import type { AssetTypeId, RoomTypeId } from '../../types/design'

type EditorSidebarProps = {
  currentRoomType: RoomTypeId
  itemCount: number
  statusMessage: string
  onRoomTypeSelect: (roomTypeId: RoomTypeId) => void
  onAddAsset: (assetType: AssetTypeId) => void
  onSaveDesign: () => void
  onLoadDesign: () => void
  onResetDesign: () => void
}

export function EditorSidebar({
  currentRoomType,
  itemCount,
  statusMessage,
  onRoomTypeSelect,
  onAddAsset,
  onSaveDesign,
  onLoadDesign,
  onResetDesign,
}: EditorSidebarProps) {
  return (
    <aside className="editor-sidebar">
      <section className="panel status-card">
        <span className="status-badge">MVP Ready</span>
        <p className="status-message">{statusMessage}</p>

        <div className="status-stats">
          <div className="stat-box">
            <span>当前房型</span>
            <strong>{ROOM_TYPES[currentRoomType].label}</strong>
          </div>
          <div className="stat-box">
            <span>组件数量</span>
            <strong>{itemCount}</strong>
          </div>
        </div>
      </section>

      <section className="panel panel-section">
        <h2 className="section-title">房型选择</h2>
        <p className="section-copy">切换房型会刷新房间壳体，已有组件会先提示确认。</p>

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
        <h2 className="section-title">基础组件</h2>
        <p className="section-copy">第一版统一用简单几何体占位，优先验证状态和编辑流程。</p>

        <div className="button-grid">
          {ASSET_TYPE_IDS.map((assetTypeId) => {
            const asset = ASSET_CATALOG[assetTypeId]

            return (
              <button
                key={assetTypeId}
                type="button"
                className="asset-button"
                onClick={() => onAddAsset(assetTypeId)}
              >
                <strong>添加{asset.label}</strong>
                <span>{asset.description}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="panel panel-section">
        <h2 className="section-title">保存与加载</h2>
        <p className="section-copy">当前设计会被保存为单份草稿，存放在浏览器 LocalStorage。</p>

        <div className="button-grid compact">
          <button type="button" className="action-button" onClick={onSaveDesign}>
            保存到本地
          </button>
          <button type="button" className="action-button" onClick={onLoadDesign}>
            从本地加载
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={onResetDesign}
          >
            清空组件
          </button>
        </div>
      </section>
    </aside>
  )
}
