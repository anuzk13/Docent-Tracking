// This is a component file. You can use this file to define a custom component for your project.
// This component will appear as a custom component in the editor.

import * as ecs from '@8thwall/ecs'  // This is how you access the ecs library.

let rootEntity = null

const createYAlignRotation = (targetDirectionVec) => {
  // The default orientation of a cylinder's height is along the Y-axis.
  const defaultUp = ecs.math.vec3.xyz(0, 1, 0)
  const targetDirection = targetDirectionVec.normalize()
  // Find the dot product between the two vectors. This is the cosine of the angle between them.
  const dotProduct = defaultUp.dot(targetDirection)

  // Handle edge cases where the vectors are already aligned or perfectly opposite.
  if (Math.abs(dotProduct) > 0.99999) {
    if (dotProduct > 0) {
      // Vectors are aligned. No rotation is needed. Return the identity quaternion.
      return ecs.math.quat.from({x: 0, y: 0, z: 0, w: 1})
    } else {
      // Vectors are opposite. We need a 180-degree rotation. We can rotate around any
      // perpendicular axis; the X-axis is a simple choice.
      const axis = ecs.math.vec3.xyz(1, 0, 0)
      const axisAngle = axis.scale(Math.PI)
      return ecs.math.quat.axisAngle(axisAngle)
    }
  }

  // Standard case: vectors are not parallel.
  // The axis to rotate around is the cross product of the start and end vectors.
  const rotationAxis = defaultUp.cross(targetDirection)
  // The angle to rotate by is the inverse cosine of the dot product.
  const rotationAngle = Math.acos(dotProduct)
  // An axis-angle is represented by a vector where the direction is the axis
  // and the magnitude is the angle.
  const axisAngle = rotationAxis.normalize().scale(rotationAngle)
  // Create the final quaternion from our calculated axis and angle.
  return ecs.math.quat.axisAngle(axisAngle)
}

const sphereInAreaParams = (numSpheres, radius, index) => {
  // Use the Fibonacci sphere algorithm for a uniform distribution on a sphere.
  const segmentCount = numSpheres
  const offset = 2 / segmentCount
  const increment = Math.PI * (3 - Math.sqrt(5))

  const y = ((index * offset) - 1) + (offset / 2)
  const radiusAtY = Math.sqrt(1 - y * y)

  const phi = ((index + 1) % segmentCount) * increment

  const x = Math.cos(phi) * radiusAtY
  const z = Math.sin(phi) * radiusAtY

  const sphereX = radius * x
  const sphereY = radius * y
  const sphereZ = -Math.abs(radius * z)

  return {sphereX, sphereY, sphereZ}
}

const sphereInPlaneParams = (numSpheres, radius, index, planeZ) => {
  const segmentCount = numSpheres
  const angle = (index / segmentCount) * Math.PI * 2
  const xOffset = radius * Math.cos(angle)
  const yOffset = radius * Math.sin(angle)
  const sphereX = xOffset
  const sphereY = yOffset
  const sphereZ = planeZ

  return {sphereX, sphereY, sphereZ}
}

const lineToCenterParams = (spherePos) => {
  const {sphereX, sphereY, sphereZ} = spherePos
  const spherePosVec = ecs.math.vec3.from({x: sphereX, y: sphereY, z: sphereZ})
  const centerPosVec = ecs.math.vec3.from({x: 0, y: 0, z: 0})
  const directionVec = spherePosVec.minus(centerPosVec)
  const height = directionVec.length()
  const midpoint = centerPosVec.mix(spherePosVec, 0.5)
  const rotationQuat = createYAlignRotation(directionVec)
  return {height, midpoint, rotationQuat}
}

const addSphereentities = (world) => {

}

ecs.registerComponent({
  name: 'add-sphere-children',
  // schema: {
  // },
  // schemaDefaults: {
  // },
  // data: {
  // },
  add: (world, component) => {
    world.events.addListener(world.events.globalId, 'reality.imagefound', (e) => {
      if (!rootEntity) {
        rootEntity = world.createEntity()
        const transformM =  world.transform.getWorldTransform(component.eid)
        world.transform.setWorldTransform(rootEntity, transformM)

        // const sphereEid = world.createEntity()
        // ecs.SphereGeometry.set(world, sphereEid, {radius: 0.5})
        // ecs.Material.set(world, sphereEid, {r: 239, g: 45, b: 94})
        // ecs.Position.set(world, sphereEid, {x: 0, y: 0, z: 0})

        // world.setParent(sphereEid, rootEntity)

        const radius = 10
        const segmentCount = 10
        const zOffset = 5

        for (let i = 0; i < segmentCount; i++) {
          const relativePos = sphereInAreaParams(segmentCount, radius, i)
          const {sphereX, sphereY, sphereZ} = relativePos

          const sphereEid = world.createEntity()
          ecs.SphereGeometry.set(world, sphereEid, {radius: 0.5})
          ecs.Material.set(world, sphereEid, {r: 239, g: 45, b: 94})
          ecs.Position.set(world, sphereEid, {x: sphereX, y: sphereY, z: sphereZ})

          world.setParent(sphereEid, rootEntity)

          const spherePos = {sphereX, sphereY, sphereZ}
          const lineParams = lineToCenterParams(spherePos)
          const lineEid = world.createEntity()
          const {height, midpoint, rotationQuat} = lineParams

          ecs.CylinderGeometry.set(world, lineEid, {radius: 0.005, height})
          ecs.Material.set(world, lineEid, {r: 150, g: 150, b: 150})
          ecs.Position.set(world, lineEid, midpoint)
          ecs.Quaternion.set(world, lineEid, rotationQuat)

          world.setParent(lineEid, rootEntity)
        }
      } else {
        const transformM = world.transform.getWorldTransform(component.eid)
        world.transform.setWorldTransform(rootEntity, transformM)
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
