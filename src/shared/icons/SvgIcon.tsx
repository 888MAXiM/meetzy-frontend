import type { FC } from "react"
import type { SvgProps } from "../../types/shared"

const SvgIcon: FC<SvgProps> = (props) => {
  return (
    <svg className={props.className} style={props.style} onClick={props.onClick} id={props.id}>
      <use href={`/assets/svg/icon-sprite.svg#${props.iconId}`}></use>
    </svg>
  )
}
export default SvgIcon
