// When a marker is found broadcasts and event with its eid

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

ecs.registerComponent({
  name: 'Target Found',
  schema: {
    marker_1: ecs.eid,
    marker_2: ecs.eid,
    marker_3: ecs.eid
  },
  // schemaDefaults: {
  // },
  // data: {
  // },
  // add: (world, component) => {
  // },
  // tick: (world, component) => {
  // },
  // remove: (world, component) => {
  // },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    ecs.defineState('default')
      .initial()
      .listen(world.events.globalId, 'reality.imagefound', (e) => {
        const markers = schemaAttribute.get(eid)
        const markerName = e.data.name
        const markerEid = markers[markerName]
        console.log(e)
        world.events.dispatch(world.events.globalId, 'marker_found', {
          eid: markerEid
        })
      })
  },
})
