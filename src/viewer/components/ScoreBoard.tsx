import { styled } from "@material-ui/styles"
import debounce from "lodash.debounce"
import React, { PureComponent } from "react"

import {
  addFrameListener,
  FrameEvent,
  removeFrameListener,
} from "../../eventbus/events/frame"
import DataManager from "../../managers/DataManager"
import { Goal } from "../../models/ReplayMetadata"
import { getGameTime } from "../../operators/frameGetters"
import { getPlayerById } from "../../operators/metadataGetters"

interface Props {}
interface State {
  team0Score: number
  team1Score: number
  gameTime: number
}

export default class Scoreboard extends PureComponent<Props, State> {
  onFrame = debounce(
    ({ frame }: FrameEvent) => {
      const { data } = DataManager.getInstance()
      const gameTime = getGameTime(data, frame)
      if (gameTime !== this.state.gameTime) {
        this.setState({ gameTime })
      }
      this.updateGameScore(frame)
    },
    250,
    { maxWait: 250 }
  )

  constructor(props: Props) {
    super(props)
    this.state = {
      team0Score: 0,
      team1Score: 0,
      gameTime: 300,
    }

    addFrameListener(this.onFrame)
  }

  componentWillUnmount() {
    removeFrameListener(this.onFrame)
    this.onFrame.cancel()
  }

  getTimerString() {
    let { gameTime } = this.state
    // The frame is filled as -100 when the data is missing, so we set the minimum to 0
    gameTime = gameTime < 0 ? 0 : gameTime
    const seconds = gameTime % 60
    const minutes = (gameTime - seconds) / 60
    const secondsString = seconds < 10 ? `0${seconds}` : seconds
    return `${minutes}:${secondsString}`
  }

  render() {
    const { team0Score, team1Score } = this.state
    return (
      <ScoreContainer>
        <BlueScoreCard>
          <Score>{team0Score}</Score>
        </BlueScoreCard>
        <GameTimeCard>
          <GameTime>{this.getTimerString()}</GameTime>
        </GameTimeCard>
        <OrangeScoreCard>
          <Score>{team1Score}</Score>
        </OrangeScoreCard>
      </ScoreContainer>
    )
  }

  private updateGameScore(frameNumber: number) {
    const { metadata } = DataManager.getInstance()

    let team0Score = 0
    let team1Score = 0
    metadata.gameMetadata.goals.forEach((goal: Goal) => {
      if (goal.frameNumber <= frameNumber) {
        const player = getPlayerById(metadata, goal.playerId.id)
        if (player) {
          if (player.isOrange) {
            team1Score++
          } else {
            team0Score++
          }
        }
      }
    })
    if (
      team0Score !== this.state.team0Score ||
      team1Score !== this.state.team1Score
    ) {
      this.setState({ team0Score, team1Score })
    }
  }
}

const ScoreContainer = styled("div")({
  display: "flex",
  alignItems: "stretch",
  top: 0,
  position: "absolute",
  zIndex: 10,
  left: "50%",
  textAlign: "center",
  transform: "translateX(-50%)",
  width: 400,
  borderStyle: "solid",
  borderWidth: 3,
  borderColor: "#fffa",
  borderBottomRightRadius: 10,
  borderBottomLeftRadius: 10,
})

const OrangeScoreCard = styled("div")({
  backgroundColor: "#e27740aa",
  borderBottomRightRadius: 5,
  flex: 1,
})

const BlueScoreCard = styled("div")({
  backgroundColor: "#4874efaa",
  borderBottomLeftRadius: 5,
  flex: 1,
})

const Score = styled("div")({
  color: "#fff",
  fontFamily: "monospace",
  fontSize: "xx-large",
})

const GameTimeCard = styled("div")({
  backgroundColor: "#000a",
})

const GameTime = styled("div")({
  color: "#fff",
  fontFamily: "monospace",
  fontSize: "xx-large",
  width: 100,
})
