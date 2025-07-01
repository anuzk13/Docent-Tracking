import * as ecs from '@8thwall/ecs'

const sphereEntities = []
const lineEntities = []
const relativeSpherePositions = []
let imageLineEntity = null

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
      const axisAngle = axis.scale(Math.PI) // PI radians = 180 degrees
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
  const sphereZ = radius * z

  return {sphereX, sphereY, sphereZ}
}

const sphereInPlaneParams = (numSpheres, radius, index, centerPos, planeZ) => {
  const segmentCount = numSpheres
  const angle = (index / segmentCount) * Math.PI * 2
  const xOffset = radius * Math.cos(angle)
  const yOffset = radius * Math.sin(angle)
  const sphereX = xOffset
  const sphereY = yOffset
  const sphereZ = planeZ

  return {sphereX, sphereY, sphereZ}
}

const lineToCenterParams = (spherePos, centerPos) => {
  const {sphereX, sphereY, sphereZ} = spherePos
  const spherePosVec = ecs.math.vec3.from({x: sphereX, y: sphereY, z: sphereZ})
  const centerPosVec = ecs.math.vec3.from(centerPos)
  const directionVec = spherePosVec.minus(centerPosVec)
  const height = directionVec.length()
  const midpoint = centerPosVec.mix(spherePosVec, 0.5)
  const rotationQuat = createYAlignRotation(directionVec)
  return {height, midpoint, rotationQuat}
}

ecs.registerComponent({
  name: 'keep-visible-on-lost',

  add: (world, component) => {
    world.events.addListener(world.events.globalId, 'reality.imagefound', (e) => {
      const centerPos = e.data.position
      const radius = 5
      const segmentCount = 10

      if (!sphereEntities.length) {
        // Initial spawn: spheres around Z-axis (circle on XY plane)
        for (let i = 0; i < segmentCount; i++) {
          const relativePos = sphereInAreaParams(segmentCount, radius, i)
          const sphereX =  centerPos.x + relativePos.sphereX
          const sphereY =  centerPos.y + relativePos.sphereY
          const sphereZ =  centerPos.z + relativePos.sphereZ
          relativeSpherePositions.push(relativePos)
          const sphereEid = world.createEntity()
          sphereEntities.push(sphereEid)
          ecs.SphereGeometry.set(world, sphereEid, {radius: 0.5})
          ecs.Material.set(world, sphereEid, {r: 239, g: 45, b: 94})
          ecs.Position.set(world, sphereEid, {x: sphereX, y: sphereY, z: sphereZ})

          const spherePos = {sphereX, sphereY, sphereZ}
          const lineParams = lineToCenterParams(spherePos, centerPos)
          const lineEid = world.createEntity()
          lineEntities.push(lineEid)
          const {height, midpoint, rotationQuat} = lineParams

          ecs.CylinderGeometry.set(world, lineEid, {radius: 0.005, height})
          ecs.Material.set(world, lineEid, {r: 150, g: 150, b: 150})
          ecs.Position.set(world, lineEid, midpoint)
          ecs.Quaternion.set(world, lineEid, rotationQuat)
        }

        // Create vertical line from image center down to floor (y=0)
        imageLineEntity = world.createEntity()
        const height = centerPos.y
        ecs.CylinderGeometry.set(world, imageLineEntity, {radius: 0.005, height})
        ecs.Material.set(world, imageLineEntity, {r: 150, g: 150, b: 150 })
        ecs.Position.set(world, imageLineEntity, {x: centerPos.x, y: height / 2, z: centerPos.z})
      } else {
        // Restore positions
        sphereEntities.forEach((sphereEid, i) => {
          const relativePos = relativeSpherePositions[i]
          const sphereX =  centerPos.x + relativePos.sphereX
          const sphereY =  centerPos.y + relativePos.sphereY
          const sphereZ =  centerPos.z + relativePos.sphereZ

          ecs.Position.set(world, sphereEid, {
            x: sphereX, y: sphereY, z: sphereZ,
          })

          const lineEid = lineEntities[i]
          const spherePos = {sphereX, sphereY, sphereZ}
          const lineParams = lineToCenterParams(spherePos, centerPos)
          const {midpoint, rotationQuat} = lineParams
          ecs.Position.set(world, lineEid, midpoint)
          ecs.Quaternion.set(world, lineEid, rotationQuat)
        })

        const height = centerPos.y
        ecs.Position.set(world, imageLineEntity, {x: centerPos.x, y: height / 2, z: centerPos.z})
        ecs.CylinderGeometry.set(world, imageLineEntity, {radius: 0.005, height})
      }
    })
  },
})
