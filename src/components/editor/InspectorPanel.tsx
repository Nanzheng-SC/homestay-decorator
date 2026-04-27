import { ASSET_CATALOG } from '../../data/assetCatalog'
import type { DesignItem, Vec3 } from '../../types/design'

type InspectorPanelProps = {
  item: DesignItem | null
  onPositionChange: (axis: keyof Vec3, value: number) => void
  onScaleChange: (axis: keyof Vec3, value: number) => void
  onRotationYChange: (value: number) => void
  onColorChange: (color: string) => void
  onRemove: () => void
}

type NumberFieldProps = {
  label: string
  value: number
  step?: number
  min?: number
  onChange: (value: number) => void
}

function NumberField({
  label,
  value,
  step = 0.1,
  min,
  onChange,
}: NumberFieldProps) {
  return (
    <div className="field">
      <label>
        {label}
        <input
          type="number"
          step={step}
          min={min}
          value={Number(value.toFixed(2))}
          onChange={(event) => {
            const nextValue = Number(event.target.value)

            if (!Number.isNaN(nextValue)) {
              onChange(nextValue)
            }
          }}
        />
      </label>
    </div>
  )
}

export function InspectorPanel({
  item,
  onPositionChange,
  onScaleChange,
  onRotationYChange,
  onColorChange,
  onRemove,
}: InspectorPanelProps) {
  return (
    <aside className="inspector-panel panel">
      <section className="panel-section">
        <p className="eyebrow">Inspector</p>
        <h2 className="section-title">属性面板</h2>
        <p className="section-copy">选中组件后可以调整位置、旋转、缩放和颜色。</p>

        {!item ? (
          <div className="inspector-empty">
            点击 3D 区域中的床、镜子、灯等组件后，这里会显示可编辑属性。
          </div>
        ) : (
          <>
            <div className="inspector-meta">
              <strong>{ASSET_CATALOG[item.assetType].label}</strong>
              <span>ID: {item.id.slice(0, 8)}</span>
            </div>

            <div className="field-block">
              <h3>位置</h3>
              <div className="vector-grid">
                <NumberField
                  label="X"
                  value={item.position.x}
                  onChange={(value) => onPositionChange('x', value)}
                />
                <NumberField
                  label="Y"
                  value={item.position.y}
                  onChange={(value) => onPositionChange('y', value)}
                />
                <NumberField
                  label="Z"
                  value={item.position.z}
                  onChange={(value) => onPositionChange('z', value)}
                />
              </div>
            </div>

            <div className="field-block">
              <h3>朝向</h3>
              <div className="single-grid">
                <NumberField
                  label="Rotation Y (deg)"
                  value={(item.rotation.y * 180) / Math.PI}
                  step={5}
                  onChange={(value) => onRotationYChange((value * Math.PI) / 180)}
                />
              </div>
            </div>

            <div className="field-block">
              <h3>缩放</h3>
              <div className="vector-grid">
                <NumberField
                  label="Scale X"
                  value={item.scale.x}
                  min={0.2}
                  onChange={(value) => onScaleChange('x', value)}
                />
                <NumberField
                  label="Scale Y"
                  value={item.scale.y}
                  min={0.2}
                  onChange={(value) => onScaleChange('y', value)}
                />
                <NumberField
                  label="Scale Z"
                  value={item.scale.z}
                  min={0.2}
                  onChange={(value) => onScaleChange('z', value)}
                />
              </div>
            </div>

            <div className="field-block">
              <h3>颜色</h3>
              <div className="single-grid">
                <div className="field">
                  <label>
                    Primitive Color
                    <input
                      type="color"
                      value={item.color}
                      onChange={(event) => onColorChange(event.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="field-block">
              <button type="button" className="danger-button" onClick={onRemove}>
                删除当前组件
              </button>
            </div>
          </>
        )}
      </section>
    </aside>
  )
}
