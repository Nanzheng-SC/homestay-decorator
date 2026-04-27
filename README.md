# homestay-decorator

民宿 3D 房间装修编辑器的 MVP 骨架，基于 `Vite + React + TypeScript + Three.js + @react-three/fiber + @react-three/drei + Zustand`。

## 当前能力

- 三个房型：`standard_room`、`king_room`、`loft_room`
- 简单几何体生成房间壳体：地板、四面墙、天花板、门、窗
- 三栏布局：左侧操作区、中间 3D 编辑区、右侧属性面板
- 五类基础组件：床、马桶、镜子、灯、电视 / 投影
- Zustand 管理房型、组件列表、选中项
- LocalStorage 保存 / 加载单份草稿

## 安装与运行

```powershell
npm.cmd install
npm.cmd run dev
```

生产构建：

```powershell
npm.cmd run build
```

## 目录

```text
src/
  components/
    editor/
    scene/
  data/
    assetCatalog.ts
    roomTypes.ts
  store/
    useDesignStore.ts
  types/
    design.ts
```
