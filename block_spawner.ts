// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.
import {MuralBlock} from './block'

ecs.registerComponent({
  name: 'Block Spawner',
  schema: {
    camS: ecs.eid,
    // @asset
    block1: ecs.string,
    // @asset
    block2: ecs.string,
    // @asset
    block4: ecs.string,
    blockPrefab: ecs.eid
  },
  // schemaDefaults: {
  // },
  data: {
    blockEid: ecs.eid,
  },
  // add: (world, component) => {
  //   world.events.addListener(world.events.globalId, 'reality.imagefound', (e) => {
  //     const centerPos = e.data.position
  //     const sphereEid = world.createEntity()
  //     ecs.SphereGeometry.set(world, sphereEid, {radius: 0.5})
  //     ecs.Material.set(world, sphereEid, {r: 239, g: 45, b: 94})
  //     ecs.Position.set(world, sphereEid, {x: centerPos.x, y: centerPos.y, z: centerPos.z})
  //   })
  // },
  // tick: (world, component) => {
  // },
  // remove: (world, component) => {
  // },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    const markerFound = ecs.defineTrigger()
    const markerSearchState = ecs.defineState('marker_search')
      .initial()
      .listen(world.events.globalId, 'marker_found', (e) => {
        const {block1, block2, block4, blockPrefab, camS} = schemaAttribute.get(eid)
        const meshes = [block1, block2, block4].filter(m => m)
        if (meshes.length === 0) {
          console.warn('🛠️ No meshes defined in Block Spawner!')
          return
        }
        // Choose one randomly
        const block = meshes[Math.floor(Math.random() * meshes.length)]
        const transformM = world.transform.getWorldTransform(e.data.eid)
        const blockEid = world.createEntity(blockPrefab)
        if (MuralBlock.has(world, blockEid)) {
          console.log('here')
          MuralBlock.set(world, blockEid, {
            cameraSphere: camS,
          })
        }
        ecs.GltfModel.set(world, blockEid, {url: block})
        world.transform.setWorldTransform(blockEid, transformM)
        dataAttribute.set(eid, {blockEid})
        markerFound.trigger()
      })

    const waitHotspotActivated = ecs.defineState('wait_hotspot_activated')
      .listen(world.events.globalId, 'marker_found', (e) => {
        const {blockEid} = dataAttribute.get(eid)
        const transformM = world.transform.getWorldTransform(e.data.eid)
        world.transform.setWorldTransform(blockEid, transformM)
        console.log('re-localized')
      })
      .onEvent(
        'hotspot_activated',
        'wait_note_dismissed',
        {
          target: world.events.globalId,
          where: () => {
            const {blockEid} = dataAttribute.get(eid)
            console.log('hotspot activated deleting block', blockEid)
            if (blockEid) {
              world.time.setTimeout(() => {
                console.log('deleting block')
                world.deleteEntity(blockEid)
              }, 1700)
            }
            return true
          },
        }
      )
    // This should have just two states but it can create an event that it created the block
    const waitForNoteState = ecs.defineState('wait_note_dismissed')
      .onEvent(
        'note_dismissed',
        'marker_search',
        {
          target: world.events.globalId,
          where: (event) => {
            console.log('note_dismissed', event)
            return true
          },
        }
      )
    // .listen(world.events.globalId, 'note_dismissed', (e) => {
    // })
      // .listen(world.events.globalId, ecs.input.SCREEN_TOUCH_START, (e) => {
      //   world.events.dispatch(world.events.globalId, 'hotspot_activated', {
      //     eid: e.data.target,
      //   })
      // })

    markerSearchState.onTrigger(markerFound, waitHotspotActivated)
  },
})
