import MUISlider from "@material-ui/lab/Slider"

import React, { Component } from "react"
import DataManager from "../../managers/DataManager"
import { GameManager } from "../../managers/GameManager"
import { FPSClockSubscriberOptions } from "../../utils/FPSClock"

interface Props {}

interface State {
  frame: number
  maxFrame: number
}

class Slider extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      frame: 0,
      maxFrame: DataManager.getInstance().data.frames.length - 1,
    }
    GameManager.getInstance().clock.subscribe(this.onFrame)
  }

  onFrame = ({ frame }: FPSClockSubscriberOptions) => {
    this.setState({ frame })
  }

  handleChange = (_: any, value: number) => {
    const frame = Math.round(value)
    GameManager.getInstance().clock.setFrame(frame)
  }

  render() {
    const { frame, maxFrame } = this.state

    return (
      <div>
        <MUISlider
          value={frame}
          aria-labelledby="label"
          onChange={this.handleChange}
          min={0}
          max={maxFrame}
        />
      </div>
    )
  }
}

export default Slider
