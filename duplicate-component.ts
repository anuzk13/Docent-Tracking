// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

let planeEntity = null

ecs.registerComponent({
  name: 'duplicate-component',
  // schema: {
  // },
  // schemaDefaults: {
  // },
  // data: {
  // },
  add: (world, component) => {
    world.events.addListener(world.events.globalId, 'reality.imagefound', (e) => {
      if (!planeEntity) {
        const comp = ecs.Scale.get(world, component.eid)
        const transformM =  world.transform.getWorldTransform(component.eid)
        planeEntity = world.createEntity()
        ecs.PlaneGeometry.set(world, planeEntity, { width:1, height: 1})
        ecs.Material.set(world, planeEntity, {r: 255, g: 255, b: 255})
        world.transform.setWorldTransform(planeEntity, transformM)
      } else {
        const transformM =  world.transform.getWorldTransform(component.eid)
        world.transform.setWorldTransform(planeEntity, transformM)
      }
    })
  },
  // tick: (world, component) => {
  // },
  // remove: (world, component) => {
  // },
  // stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
  //   ecs.defineState('default').initial()
  // },
})
