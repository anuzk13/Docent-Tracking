// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.
// Waits for 5 seconds and then closes the intro screen

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

ecs.registerComponent({
  name: 'Intro Screen Timer',
  schema: {
    introScreen: ecs.eid,
    instructionsComponent: ecs.eid,
    delaySeconds: ecs.f32,
  },
  schemaDefaults: {
    delaySeconds: 5.0,
  },
  data: {
    timerStarted: ecs.boolean,
  },
  add: (world, component) => {
    // Initialize the timer as not started
    component.data.timerStarted = false
  },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    ecs.defineState('waiting')
      .initial()
      .onEnter(() => {
        const {delaySeconds, introScreen, instructionsComponent} = schemaAttribute.get(eid)
        const data = dataAttribute.get(eid)
        
        if (!data.timerStarted) {
          console.log(`Starting intro screen timer for ${delaySeconds} seconds`)
          dataAttribute.set(eid, {timerStarted: true})

          world.time.setTimeout(() => {
            console.log('Timer expired, closing intro screen and showing instructions')
            
            // Hide intro screen
            if (introScreen && ecs.Hidden) {
              ecs.Hidden.set(world, introScreen, {})
              console.log('Intro screen closed')
            }
            
            // Show instructions component
            if (instructionsComponent && ecs.Hidden.has(world, instructionsComponent)) {
              ecs.Hidden.remove(world, instructionsComponent)
              console.log('Instructions component shown')
            }
          }, delaySeconds * 1000)
        }
      })
  },
})
