import * as ecs from '@8thwall/ecs'

ecs.registerComponent({
  name: 'Close Note',
  data: {
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('default')
      .initial()
      .listen(eid, ecs.input.UI_CLICK, () => {
        world.events.dispatch(world.events.globalId, 'note_dismissed', {})
        ecs.Hidden.set(world, eid)
      })
  },
})
