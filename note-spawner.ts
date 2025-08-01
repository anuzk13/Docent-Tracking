// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

import {ChromaTexture} from './chromakey'

ecs.registerComponent({
  name: 'Note Spawner',
  schema: {
    dismissButton: ecs.eid,
    // @asset
    video1: ecs.string,
    // @asset
    video2: ecs.string,
     // @asset
    video3: ecs.string,
     // @asset
    video4: ecs.string,
     // @asset
    video5: ecs.string,
     // @asset
    video6: ecs.string,
     // @asset
    video7: ecs.string,
     // @asset
    video8: ecs.string,
     // @asset
    video9: ecs.string,
     // @asset
    video10: ecs.string,
  },
  // schemaDefaults: {
  // },
  data: {
    noteEid: ecs.eid,
    usedNotesString: ecs.string,
  },
  add: (world, component) => {
    // Initialize empty string to track used notes (comma-separated indices)
    component.data.usedNotesString = ""
  },
  // tick: (world, component) => {
  // },
  // remove: (world, component) => {
  // },
  stateMachine: ({world, eid, schemaAttribute, dataAttribute}) => {
    const noteShown = ecs.defineTrigger()
    const noteDismissed = ecs.defineTrigger()

    const waitFotHostspot = ecs.defineState('default')
      .initial()
      .onEnter(() => {
        console.log("entered the default note state")
      })
      .listen(world.events.globalId, 'hotspot_activated', (e) => {
        console.log('hotspot_activated', e)
        const {dismissButton} = schemaAttribute.get(eid)
        const data = dataAttribute.get(eid)
        
        const notes = ['video1', 'video2', 'video3',
                       'video4', 'video5', 'video6',
                       'video7', 'video8', 'video9', 'video10']
        
        // Parse used notes from string
        const usedNotes = data.usedNotesString ? 
          data.usedNotesString.split(',').map(n => parseInt(n, 10)).filter(n => !isNaN(n)) : []
        
        // Get available notes (not yet used)
        let availableIndices = notes.map((_, index) => index).filter(index => !usedNotes.includes(index))
        
        // If no notes available, reset the used notes
        if (availableIndices.length === 0) {
          console.log('All notes used, resetting available notes')
          availableIndices = notes.map((_, index) => index) // Reset to all indices
          dataAttribute.set(eid, {...data, usedNotesString: ""})
        }
        
        // Pick a random note from available ones
        const randomAvailableIndex = Math.floor(Math.random() * availableIndices.length)
        const selectedIndex = availableIndices[randomAvailableIndex]
        const randomNote = notes[selectedIndex]
        const noteVideo = schemaAttribute.get(eid)[randomNote]
        
        // Mark this note as used
        const updatedUsedNotes = usedNotes.concat(selectedIndex)
        const updatedUsedNotesString = updatedUsedNotes.join(',')
        dataAttribute.set(eid, {...data, usedNotesString: updatedUsedNotesString})
        console.log(`Showing note: ${randomNote}, used notes: ${updatedUsedNotes.length}/${notes.length}`)
        
        const cameraEid = world.camera.getActiveEid()
        const noteEid = world.createEntity('Video Plane')
        world.setParent(noteEid, cameraEid)
        if (ChromaTexture.has(world, noteEid)) {
          ChromaTexture.set(world, noteEid, {
            video: noteVideo,
          })
        }

        setTimeout(() => {
          ecs.Hidden.remove(world, dismissButton)
        }, 1200)
        dataAttribute.set(eid, {noteEid})
        noteShown.trigger()
      })

    const waitState = ecs.defineState('wait_note_dismissed')
      .onEnter(() => console.log('Waiting for note dismissal…'))
      .listen(world.events.globalId, 'note_dismissed', (e) => {
        const data = dataAttribute.get(eid)
        if (data.noteEid) {
          world.deleteEntity(data.noteEid as bigint)
        }
        noteDismissed.trigger()
      })

    waitFotHostspot.onTrigger(noteShown, waitState)
    waitState.onTrigger(noteDismissed, waitFotHostspot)
  },
})
