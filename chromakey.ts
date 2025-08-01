// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.
import {ChromaKeyMaterial} from './chroma-material'

const {THREE} = window as any

const ChromaTexture = ecs.registerComponent({
  name: 'Chroma Texture',
  schema: {
    // @asset
    video: ecs.string,
    width: ecs.f32,
    height: ecs.f32,
    // @group start background:color
    r: ecs.f32,
    g: ecs.f32,
    b: ecs.f32,
    // @group end
    similarity: ecs.f32,
    smoothness: ecs.f32,
    spill: ecs.f32,
  },
  schemaDefaults: {
    r: 69,
    g: 251,
    b: 0,
    similarity: 0.095,
    smoothness: 0.082,
    spill: 0.214,
  },
  // data: {
  // },
  add: (world, component) => {
    ecs.Hidden.set(world, component.eid, {})
    const {video, r, g, b, width, height, similarity, smoothness, spill} = component.schema
    if (video === '') {
      console.error('No video defined on chromakey component')
      return
    }

    const object3d = world.three.entityToObject.get(component.eid)
    const keyColor = new THREE.Color(`rgb(${r}, ${g}, ${b})`)

    const greenScreenMaterial = new ChromaKeyMaterial(
      video, keyColor, width, height, similarity, smoothness, spill
    )

    setTimeout(() => {
      object3d.material = greenScreenMaterial
      ecs.Hidden.remove(world, component.eid)
    }, 500)
  },
  // tick: (world, component) => {
  // },
  // remove: (world, component) => {
  // },
  // stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
  //   ecs.defineState('default').initial()
  // },
})

export {ChromaTexture}
