import {
  AnimationClip,
  AnimationMixer,
  Euler,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
} from "three"

import { BALL } from "../constants/gameObjectNames"
import AnimationManager from "../managers/AnimationManager"
import BallManager from "../managers/models/BallManager"
import PlayerManager from "../managers/models/PlayerManager"
import { ReplayData } from "../models/ReplayData"
import {
  getActionClipName,
  getPositionName,
  getRotationName,
} from "./utils/animationNameGetters"
import { getCarName, getGroupName } from "./utils/playerNameGetters"

interface KeyframeData {
  duration: number
  positionValues: number[]
  positionTimes: number[]
  rotationValues: number[]
  rotationTimes: number[]
}

/**
 * Class is responsible for all position and rotation-based updating of models that occur inside
 * the three.js scene. Builds animation mixers that are used to display animations but do not
 * directly interact with the models themselves outside of the required naming conventions that
 * keyframe tracks provide.
 */
const defaultAnimationBuilder = (
  replayData: ReplayData,
  playerModels: PlayerManager[],
  ballModel: BallManager,
  useBallRotation: boolean = true
): AnimationManager => {
  /**
   * Replay data is of this form:
   * [posX, posZ, posY, rotX, rotZ, royY]
   *
   * Three is RH as opposed to Unreal/Unity's LH axes and uses y as the up axis. All angles
   * are in the range -PI to PI.
   *
   * For parsed data information, see:
   * https://github.com/SaltieRL/carball/blob/master/carball/json_parser/actor_parsing.py#L107
   *
   */
  const dataToVector = (data: any[]) => {
    const x = data[0]
    const z = data[1]
    const y = data[2]
    return new Vector3(x, y, z)
  }
  const dataToQuaternion = (data: any[]) => {
    const q = new Quaternion()
    const x = data[3] // ** is made neg to reverse the RL angle sign convention
    const y = -data[4]
    const z = data[5]
    q.setFromEuler(new Euler(z, y, x, "ZYX")) // ! Possibly messed up order or signs
    return q
  }
  const generateKeyframeData = (posRotData: any[]): KeyframeData => {
    const positions: number[] = []
    const rotations: number[] = []

    let totalDuration = 0
    const positionTimes: number[] = []
    const rotationTimes: number[] = []

    // !! NOTE: This is where posRotData gets converted!

    posRotData.forEach((data, index) => {
      const pos_x = data[0] // ! Possibly messed up order or signs
      const pos_z = data[1]
      const pos_y = data[2]
      positions.push(pos_x, pos_y, pos_z) // x, y, z

      const rot_x = data[3] // ! Possibly messed up order or signs
      const rot_y = data[4]
      const rot_z = data[5]

      const q = new Quaternion()
      q.setFromEuler(new Euler(rot_x, rot_y, rot_z))
      rotations.push(q.x, q.y, q.z, q.w)

      positionTimes.push(totalDuration)
      rotationTimes.push(totalDuration)

      // Add the delta
      totalDuration += replayData.frames[index][0]

      // // Apply position frame
      // const newVector = dataToVector(data)
      // newVector.toArray(positions, positions.length)

      // // Apply rotation frame
      // const newQuat = dataToQuaternion(data)
      // newQuat.toArray(rotations, rotations.length)
    })

    console.log("positionTimes", positionTimes)
    console.log("positions", positions)
    console.log("rotationTimes", rotationTimes)
    console.log("rotations", rotations)
    console.log("totalDuration", totalDuration)

    return {
      duration: totalDuration,
      positionTimes,
      positionValues: positions,
      rotationTimes,
      rotationValues: rotations,
    }
  }

  const playerClips = []
  // First, generate player clips
  for (let player = 0; player < 2; player++) {
    // ! NOTE: Hardcoded player number to 2 for now
    const playerData = replayData.players[player]
    const playerName = `${replayData.names[player]}`
    const playerKeyframeData = generateKeyframeData(playerData)

    console.log("Player Keyframe Data:", playerKeyframeData)
    console.log("Player Name:", playerName)
    console.log("Player Data:", playerData)

    // Note that Three.JS requires this .position/.quaternion naming convention, and that
    // the object we wish to modify must have this associated name.
    const playerPosKeyframes = new VectorKeyframeTrack(
      getPositionName(getGroupName(playerName)),
      playerKeyframeData.positionTimes,
      playerKeyframeData.positionValues
    )
    const playerRotKeyframes = new QuaternionKeyframeTrack(
      getRotationName(getCarName(playerName)),
      playerKeyframeData.rotationTimes,
      playerKeyframeData.rotationValues
    )

    const playerClip = new AnimationClip(
      getActionClipName(playerName),
      playerKeyframeData.duration,
      [playerPosKeyframes, playerRotKeyframes]
    )
    playerClips.push(playerClip)
  }
  // Then, generate the ball clip
  const ballData = replayData.ball
  const ballKeyframeData = generateKeyframeData(ballData)

  const ballPosKeyframes = new VectorKeyframeTrack(
    getPositionName(BALL),
    ballKeyframeData.positionTimes,
    ballKeyframeData.positionValues
  )
  const ballRotKeyframes = new QuaternionKeyframeTrack(
    getRotationName(BALL),
    ballKeyframeData.rotationTimes,
    ballKeyframeData.rotationValues
  )
  const ballClip = new AnimationClip(
    getActionClipName(BALL),
    ballKeyframeData.duration,
    useBallRotation ? [ballPosKeyframes, ballRotKeyframes] : [ballPosKeyframes]
  )
  return AnimationManager.init({
    playerClips,
    ballClip,
    playerMixers: playerModels.map(
      (model) => new AnimationMixer(model.carGroup)
    ),
    ballMixer: new AnimationMixer(ballModel.ball),
  })
}

export default defaultAnimationBuilder
