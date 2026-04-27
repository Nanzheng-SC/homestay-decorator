import { Edges } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { DoubleSide } from 'three'
import { ASSET_CATALOG } from '../../data/assetCatalog'
import type { DesignItem } from '../../types/design'

type SceneItemProps = {
  item: DesignItem
  selected: boolean
  onSelect: (itemId: string) => void
}

export function SceneItem({ item, selected, onSelect }: SceneItemProps) {
  const asset = ASSET_CATALOG[item.assetType]

  function handleClick(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation()
    onSelect(item.id)
  }

  return (
    <mesh
      castShadow
      position={[item.position.x, item.position.y, item.position.z]}
      receiveShadow
      rotation={[item.rotation.x, item.rotation.y, item.rotation.z]}
      scale={[item.scale.x, item.scale.y, item.scale.z]}
      onClick={handleClick}
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
        emissive={selected ? '#a96320' : '#000000'}
        emissiveIntensity={selected ? 0.35 : 0}
        metalness={asset.primitive === 'plane' ? 0.18 : 0.04}
        roughness={asset.primitive === 'plane' ? 0.38 : 0.72}
        side={asset.primitive === 'plane' ? DoubleSide : undefined}
      />

      {selected ? <Edges color="#fff4df" scale={1.04} /> : null}
    </mesh>
  )
}
