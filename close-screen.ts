// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.
// Toggles visibility between two components when clicked - hides one and shows the other

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

ecs.registerComponent({
  name: 'close-screen',
  schema: {
    componentToHide: ecs.eid,
    componentToShow: ecs.eid,
  },
  stateMachine: ({world, eid, schemaAttribute}) => {
    ecs.defineState('default')
      .initial()
      .listen(eid, ecs.input.UI_CLICK, () => {
        const {componentToHide, componentToShow} = schemaAttribute.get(eid)
    
        if (componentToHide) {
          ecs.Hidden.set(world, componentToHide, {})
        }
        
        if (componentToShow) {
          ecs.Hidden.remove(world, componentToShow)
        }
      })
  },
})
