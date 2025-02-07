import React from "react"
import SvgIcon from "@mui/material/SvgIcon"

type Props = {
  color?: string
}

const ErrorIcon = ({ color }: Props) => {
  return (
    <SvgIcon color="error">
      <path
        fill={color}
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
      />
    </SvgIcon>
  )
}

export default ErrorIcon
