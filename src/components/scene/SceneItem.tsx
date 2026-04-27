import { Edges } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { DoubleSide, type Mesh as ThreeMesh } from 'three'
import { ASSET_CATALOG } from '../../data/assetCatalog'
import type { DesignItem } from '../../types/design'

type SceneItemProps = {
  item: DesignItem
  selected: boolean
  dragging?: boolean
  preview?: boolean
  disabled?: boolean
  onSelect?: (itemId: string) => void
  onDragStart?: (itemId: string) => void
  onDragMove?: (itemId: string, event: ThreeEvent<PointerEvent>) => void
  onDragEnd?: (itemId: string) => void
}

const ignoreRaycast: ThreeMesh['raycast'] = () => undefined

export function SceneItem({
  item,
  selected,
  dragging = false,
  preview = false,
  disabled = false,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}: SceneItemProps) {
  const asset = ASSET_CATALOG[item.assetType]

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (preview || disabled) {
      return
    }

    event.stopPropagation()
    onSelect?.(item.id)
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (preview || disabled) {
      return
    }

    event.stopPropagation()
    const target = event.target as {
      setPointerCapture?: (pointerId: number) => void
    } | null

    target?.setPointerCapture?.(event.pointerId)
    onSelect?.(item.id)
    onDragStart?.(item.id)
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>) {
    if (preview || disabled || !dragging) {
      return
    }

    event.stopPropagation()
    onDragMove?.(item.id, event)
  }

  function handlePointerUp(event: ThreeEvent<PointerEvent>) {
    if (preview || disabled || !dragging) {
      return
    }

    event.stopPropagation()
    const target = event.target as {
      releasePointerCapture?: (pointerId: number) => void
    } | null

    target?.releasePointerCapture?.(event.pointerId)
    onDragEnd?.(item.id)
  }

  return (
    <mesh
      castShadow={!preview}
      position={[item.position.x, item.position.y, item.position.z]}
      raycast={disabled || preview ? ignoreRaycast : undefined}
      receiveShadow
      rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
      scale={[item.scale.x, item.scale.y, item.scale.z]}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {asset.primitive === 'box' ? (
        <boxGeometry args={[asset.size.x, asset.size.y, asset.size.z]} />
      ) : null}

      {asset.primitive === 'cylinder' ? (
        <cylinderGeometry
          args={[asset.size.x / 2, asset.size.z / 2, asset.size.y, 28]}
        />
      ) : null}

      {asset.primitive === 'plane' ? (
        <planeGeometry args={[asset.size.x, asset.size.y]} />
      ) : null}

      <meshStandardMaterial
        color={item.color}
        emissive={selected || dragging ? '#a96320' : '#000000'}
        emissiveIntensity={dragging ? 0.45 : selected ? 0.3 : 0}
        metalness={asset.primitive === 'plane' ? 0.18 : 0.04}
        opacity={preview ? 0.48 : 1}
        roughness={asset.primitive === 'plane' ? 0.38 : 0.72}
        side={asset.primitive === 'plane' ? DoubleSide : undefined}
        transparent={preview}
      />

      {selected && !preview ? <Edges color="#fff4df" scale={1.04} /> : null}
      {preview ? <Edges color="#fff4df" scale={1.06} /> : null}
    </mesh>
  )
}
