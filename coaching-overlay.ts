import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Coaching Overlay',
  schema: {
    scene: ecs.eid,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('default')
      .initial()
      .listen(world.events.globalId, 'reality.trackingstatus', (e) => {
        const {scene} = schemaAttribute.get(eid)

        if (e.data.status === 'LIMITED') {
        // show coaching overlay, hide scene
          ecs.Hidden.remove(world, eid)
          ecs.Hidden.set(world, scene)
        } else if (e.data.status === 'NORMAL') {
        // hide coaching overlay, show scene
          ecs.Hidden.set(world, eid)
          ecs.Hidden.remove(world, scene)
        }
      })
  },
})
