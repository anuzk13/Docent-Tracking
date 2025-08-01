// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.
// Based on https://www.8thwall.com/8thwall/studio-hotspots/code/hotspot.ts

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

const MuralBlock = ecs.registerComponent({
  name: 'Mural Block',
  schema: {
    speed: ecs.i32,
    highlightedSpeed: ecs.i32,
    cameraSphere: ecs.eid,
  },
  schemaDefaults: {
    speed: 5000,
    highlightedSpeed: 1500,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('idle')
      .initial()
      .onEnter(() => {
        const {speed} = schemaAttribute.get(eid)
        ecs.RotateAnimation.set(world, eid, {
          loop: true,
          autoFrom: true,
          toY: 360,
          shortestPath: false,
          duration: speed,
        })
      })
      .listen(eid, ecs.input.SCREEN_TOUCH_START, (e) => {
        if (e.data.target === eid) {
          const {highlightedSpeed, cameraSphere} = schemaAttribute.get(eid)
          const camSpherePos = world.transform.getWorldPosition(cameraSphere)

          // Store camera as animation target
          ecs.PositionAnimation.set(world, eid, {
            autoFrom: true,
            toX: camSpherePos.x,
            toY: camSpherePos.y,
            toZ: camSpherePos.z,
            duration: 1300,
            loop: false,
            reverse: false,
            easeIn: true,
            easeOut: true,
            easingFunction: 'Quadratic',
          })

          ecs.ScaleAnimation.set(world, eid, {
            toX: 0,
            toY: 0,
            toZ: 0,
            autoFrom: true,
            duration: 1300,
            loop: false,
            reverse: false,
            easeIn: false,
            easeOut: false,
            easingFunction: 'Quadratic',
          })

          ecs.RotateAnimation.mutate(world, eid, (cursor) => {
            cursor.duration = highlightedSpeed
          })

          world.events.dispatch(world.events.globalId, 'hotspot_activated', {
            // @ts-ignore
            eid: e.data.target,
          })
        }
      })
  },
})

export {MuralBlock}
