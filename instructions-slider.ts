// This is a component that animates UI properties using 8th Wall's Studio API
// Animates background corner radius from 0 to 50 and top margin from 0 to 70%

import * as ecs from '@8thwall/ecs'

// Helper function to interpolate between two colors
const interpolateColor = (color1, color2, progress) => {
  // Convert hex colors to RGB
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')
  
  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)
  
  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)
  
  // Interpolate RGB values
  const r = Math.round(r1 + (r2 - r1) * progress)
  const g = Math.round(g1 + (g2 - g1) * progress)
  const b = Math.round(b1 + (b2 - b1) * progress)
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

// Helper function to update UI based on current state and marker status
const updateUIState = (world, component) => {
  const {buttonEntity, textEntity, buttonEntityText, markerFoundText} = component.schema
  const {markerFound, currentState} = component.data

  // If marker is found and we're in completed state, show marker found UI
  if (markerFound && currentState === 'completed') {
    // Hide button and text entity
    if (buttonEntity) {
      ecs.Hidden.set(world, buttonEntity)
    }
    if (textEntity && !ecs.Hidden.has(world, textEntity)) {
      ecs.Hidden.set(world, textEntity)
    }
    
    // Show marker found text
    if (markerFoundText && ecs.Hidden.has(world, markerFoundText)) {
      ecs.Hidden.remove(world, markerFoundText)
    }
  }
  // If marker is not found and we're in completed state, show normal completed UI
  else if (!markerFound && currentState === 'completed') {
    // Show button and text entity
    if (buttonEntity && ecs.Hidden.has(world, buttonEntity)) {
      ecs.Hidden.remove(world, buttonEntity)
    }
    if (textEntity && ecs.Hidden.has(world, textEntity)) {
      ecs.Hidden.remove(world, textEntity)
    }
    
    // Hide marker found text
    if (markerFoundText && !ecs.Hidden.has(world, markerFoundText)) {
      ecs.Hidden.set(world, markerFoundText)
    }
  }
}

const IntroScreenTimer = ecs.registerComponent({
  name: 'Instructions Screen',
  schema: {
    duration: ecs.f32,
    easingFunction: ecs.string,
    buttonEntityText: ecs.eid,
    textEntity: ecs.eid,
    buttonEntity: ecs.eid,
    markerFoundText: ecs.eid,
  },
  schemaDefaults: {
    duration: 2000, // 2 seconds default animation duration
    easingFunction: 'Quadratic',
  },
  data: {
    markerFound: ecs.boolean,
    currentState: ecs.string,
  },
  add: (world, component) => {
    // Initialize data
    component.data.markerFound = false
    component.data.currentState = 'idle'
    
    // Set up global event listener for marker_found event
    world.events.addListener(world.events.globalId, 'marker_found', () => {
    //   console.log('Marker found event received')
      component.data.markerFound = true
      
      // Update UI based on current state and marker status
      updateUIState(world, component)
    })
    
    // Listen for hotspot_activated event to hide the component
    world.events.addListener(world.events.globalId, 'hotspot_activated', () => {
      console.log('Hotspot activated - hiding instructions screen and resetting marker status')
      component.data.markerFound = false
      
      // Update UI to reflect reset marker status
      updateUIState(world, component)
      
      ecs.Hidden.set(world, component.eid)
    })
    
    // Listen for note_dismissed event to show the component again
    world.events.addListener(world.events.globalId, 'note_dismissed', () => {
      console.log('Note dismissed - showing instructions screen')
      ecs.Hidden.remove(world, component.eid)
    })
    
    // // Listen for marker lost event to reset marker status and update UI
    // world.events.addListener(world.events.globalId, 'reality.imagelost', () => {
    //   console.log('Marker lost - resetting marker status and updating UI')
    //   component.data.markerFound = false
      
    //   // Update UI to reflect reset marker status
    //   updateUIState(world, component)
    // })
  },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    ecs.defineState('idle')
      .initial()
      .onEnter(() => {
        // Update current state
        dataAttribute.get(eid).currentState = 'idle'
        
        // Wait for button click to start animation
        const {textEntity, markerFoundText, buttonEntity} = schemaAttribute.get(eid)
        
        // Check if this entity has a UI component
        if (!ecs.Ui.has(world, eid)) {
          console.warn('IntroScreenTimer: Entity must have a UI component to animate')
          return
        }

        // Hide text component and marker found text initially
        ecs.Hidden.set(world, textEntity)
        ecs.Hidden.set(world, markerFoundText)

        // Set initial UI values
        ecs.Ui.mutate(world, eid, (cursor) => {
          cursor.borderRadius = 0
          cursor.position = 'absolute'
          cursor.top = '0%'
        })
        
        // Set initial button background color to #004CFF
        if (buttonEntity && ecs.Ui.has(world, buttonEntity)) {
          ecs.Ui.mutate(world, buttonEntity, (cursor) => {
            cursor.background = '#004CFF'
          })
        }
      })
      .onEvent(ecs.input.UI_CLICK, 'animating', {
        target: eid,
        beforeTransition: (e) => {
          const {buttonEntity} = schemaAttribute.get(eid)

          // Check if button is hidden
          if (buttonEntity && ecs.Hidden.has(world, buttonEntity)) {
            console.log("Button is hidden - ignoring click")
            return true // Prevent transition
          }
          
          if (e.target === buttonEntity) {
            console.log("Button entity matched - starting animation")
            return false // Allow transition
          } else {
            console.log("Button entity did not match")
            return true // Prevent transition
          }
        }
      })

    ecs.defineState('animating')
      .onEnter(() => {
        // Update current state
        dataAttribute.get(eid).currentState = 'animating'
        
        const {duration, easingFunction, buttonEntityText, textEntity, buttonEntity} = schemaAttribute.get(eid)

        // Create custom animation for corner radius
        const startTime = Date.now()
        const initialRadius = 0
        const targetRadius = 50
        const initialTop = 0
        const targetTop = 85
        const initialColor = '#004CFF'
        const targetColor = '#DEDEDE'
        const easeIn = true
        const easeOut = true
        const animateStep = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          // Apply easing function
          let easedProgress = progress
          if (easeIn && easeOut) {
            easedProgress = progress * progress * (3 - 2 * progress) // smoothstep
          } else if (easeIn) {
            easedProgress = progress * progress
          } else if (easeOut) {
            easedProgress = 1 - (1 - progress) * (1 - progress)
          }

          // Calculate current values
          const currentRadius = initialRadius + (targetRadius - initialRadius) * easedProgress
          const currentTop = initialTop + (targetTop - initialTop) * easedProgress
          const currentColor = interpolateColor(initialColor, targetColor, easedProgress)

          // Apply the animated values
          ecs.Ui.mutate(world, eid, (cursor) => {
            cursor.borderRadius = currentRadius
            cursor.top = `${currentTop}%`
          })
          
          // Apply button color animation
          if (buttonEntity && ecs.Ui.has(world, buttonEntity)) {
            ecs.Ui.mutate(world, buttonEntity, (cursor) => {
              cursor.background = currentColor
            })
          }

          // Continue animation or finish
          if (progress < 1) {
            requestAnimationFrame(animateStep)
          } else {
            // Animation completed - update button and text components
            console.log('Animation complete')
            // Update button text (buttonEntityText is the child text entity of the button)
            if (buttonEntityText && ecs.Ui.has(world, buttonEntityText)) {
              ecs.Ui.mutate(world, buttonEntityText, (cursor) => {
                cursor.text = "See Marker's Guide"
              })
            }
            
            // Show text component by removing Hidden component
            if (textEntity && ecs.Hidden.has(world, textEntity)) {
              ecs.Hidden.remove(world, textEntity)
            }
            
            // Set up button click listener after animation completes
            if (buttonEntity) {
              // Transition to completed state
              world.events.dispatch(eid, 'animation_finished')
            }
          }
        }

        // Start the animation
        requestAnimationFrame(animateStep)
      })
      .onEvent('animation_finished', 'completed')

    ecs.defineState('completed')
      .onEnter(() => {
        // Update current state
        dataAttribute.get(eid).currentState = 'completed'
        
        // Animation sequence is complete
        console.log('All animations and updates complete')
        
        // Check if marker was already found and update UI accordingly
        const component = {
          schema: schemaAttribute.get(eid),
          data: dataAttribute.get(eid)
        }
        updateUIState(world, component)
      })
      .onEvent(ecs.input.UI_CLICK, 'reversing', {
        target: eid,
        beforeTransition: (e) => {
          const {buttonEntity} = schemaAttribute.get(eid)
          
          // Check if instructions component is hidden
          if (ecs.Hidden.has(world, eid)) {
            console.log("Instructions component is hidden - ignoring click")
            return true // Prevent transition
          }
          
          // Check if button is hidden
          if (buttonEntity && ecs.Hidden.has(world, buttonEntity)) {
            console.log("Button is hidden - ignoring click")
            return true // Prevent transition
          }
          
          if (e.target === buttonEntity) {
            console.log("Button clicked again - reversing animation")
            return false // Allow transition to reversing
          } else {
            console.log("Button entity did not match")
            return true // Prevent transition
          }
        }
      })

    ecs.defineState('reversing')
      .onEnter(() => {
        // Update current state
        dataAttribute.get(eid).currentState = 'reversing'
        
        const {duration, easingFunction, buttonEntityText, textEntity, buttonEntity} = schemaAttribute.get(eid)

        // Change button text immediately when reverse starts
        if (buttonEntityText && ecs.Ui.has(world, buttonEntityText)) {
          ecs.Ui.mutate(world, buttonEntityText, (cursor) => {
            cursor.text = "Find Markers" // Change to original text at start of reverse
          })
        }

        if (textEntity && !ecs.Hidden.has(world, textEntity)) {
            ecs.Hidden.set(world, textEntity)
        }

        // Create reverse animation
        const startTime = Date.now()
        const initialRadius = 50 // Start from extended state
        const targetRadius = 0   // Go back to initial state
        const initialTop = 85    // Start from extended state
        const targetTop = 0      // Go back to initial state
        const initialColor = '#DEDEDE' // Start from changed color
        const targetColor = '#004CFF'  // Go back to original color
        const easeIn = true
        const easeOut = true
        
        const animateStep = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          // Apply easing function
          let easedProgress = progress
          if (easeIn && easeOut) {
            easedProgress = progress * progress * (3 - 2 * progress) // smoothstep
          } else if (easeIn) {
            easedProgress = progress * progress
          } else if (easeOut) {
            easedProgress = 1 - (1 - progress) * (1 - progress)
          }

          // Calculate current values (reversing)
          const currentRadius = initialRadius + (targetRadius - initialRadius) * easedProgress
          const currentTop = initialTop + (targetTop - initialTop) * easedProgress
          const currentColor = interpolateColor(initialColor, targetColor, easedProgress)

          // Apply the animated values
          ecs.Ui.mutate(world, eid, (cursor) => {
            cursor.borderRadius = currentRadius
            cursor.top = `${currentTop}%`
          })
          
          // Apply button color animation (reverse)
          if (buttonEntity && ecs.Ui.has(world, buttonEntity)) {
            ecs.Ui.mutate(world, buttonEntity, (cursor) => {
              cursor.background = currentColor
            })
          }

          // Continue animation or finish
          if (progress < 1) {
            requestAnimationFrame(animateStep)
          } else {
            // Reverse animation completed - hide text
            console.log('Reverse animation complete')
            
            // Transition back to idle state
            world.events.dispatch(eid, 'reverse_finished')
          }
        }

        // Start the reverse animation
        requestAnimationFrame(animateStep)
      })
      .onEvent('reverse_finished', 'idle')
  },
})

export {IntroScreenTimer}