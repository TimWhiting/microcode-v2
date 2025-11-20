namespace microcode {
    function carImages(name: string | number) {
        if (name == Tid.TID_ACTUATOR_CAR) return icondb.car
        if (name == Tid.TID_MODIFIER_CAR_FORWARD) return icondb.car_forward
        if (name == Tid.TID_MODIFIER_CAR_REVERSE) return icondb.car_reverse
        if (name == Tid.TID_MODIFIER_CAR_TURN_LEFT) return icondb.car_left_turn
        if (name == Tid.TID_MODIFIER_CAR_TURN_RIGHT)
            return icondb.car_right_turn
        if (name == Tid.TID_MODIFIER_CAR_STOP) return icondb.stop
        if (name == Tid.TID_MODIFIER_CAR_FORWARD_FAST)
            return icondb.car_forward_fast
        if (name == Tid.TID_MODIFIER_CAR_SPIN_LEFT) return icondb.car_left_spin
        if (name == Tid.TID_MODIFIER_CAR_SPIN_RIGHT)
            return icondb.car_right_spin
        if (name == Tid.TID_MODIFIER_CAR_LED_COLOR_1)
            return icondb.tile_color_red
        if (
            name == Tid.TID_MODIFIER_CAR_LED_COLOR_2 ||
            name == Tid.TID_MODIFIER_ON ||
            name == Tid.TID_FILTER_ON
        )
            return icondb.tile_color_green
        if (name == Tid.TID_MODIFIER_CAR_LED_COLOR_3)
            return icondb.tile_color_blue
        if (
            name == Tid.TID_MODIFIER_CAR_LED_COLOR_4 ||
            name == Tid.TID_MODIFIER_OFF ||
            name == Tid.TID_FILTER_OFF
        )
            return icondb.tile_color_black
        if (name == Tid.TID_MODIFIER_CAR_ARM_OPEN) return icondb.arm_open
        if (name == Tid.TID_MODIFIER_CAR_ARM_CLOSE) return icondb.arm_close
        if (name == Tid.TID_SENSOR_CAR_WALL) return icondb.car_wall
        if (name == Tid.TID_SENSOR_LINE) return icondb.line_sensor
        if (name == Tid.TID_FILTER_LINE_LEFT) return icondb.line_left_on
        if (name == Tid.TID_FILTER_LINE_RIGHT) return icondb.line_right_on
        if (name == Tid.TID_FILTER_LINE_BOTH) return icondb.line_both_on
        if (name == Tid.TID_FILTER_LINE_NEITHER) return icondb.line_neither_on
        if (name == Tid.TID_FILTER_LINE_NEITHER_LEFT)
            return icondb.line_none_from_left
        if (name == Tid.TID_FILTER_LINE_NEITHER_RIGHT)
            return icondb.line_none_from_right
        return null
    }

    function getCarParam2(tile: Tile) {
        const tid = getTid(tile)
        switch (tid) {
            case Tid.TID_MODIFIER_CAR_FORWARD:
                return robot.robots.RobotCompactCommand.MotorRunForward
            case Tid.TID_MODIFIER_CAR_REVERSE:
                return robot.robots.RobotCompactCommand.MotorRunBackward
            case Tid.TID_MODIFIER_CAR_TURN_LEFT:
                return robot.robots.RobotCompactCommand.MotorTurnLeft
            case Tid.TID_MODIFIER_CAR_TURN_RIGHT:
                return robot.robots.RobotCompactCommand.MotorTurnRight
            case Tid.TID_MODIFIER_CAR_STOP:
                return robot.robots.RobotCompactCommand.MotorStop
            case Tid.TID_MODIFIER_CAR_FORWARD_FAST:
                return robot.robots.RobotCompactCommand.MotorRunForwardFast
            case Tid.TID_MODIFIER_CAR_SPIN_LEFT:
                return robot.robots.RobotCompactCommand.MotorSpinLeft
            case Tid.TID_MODIFIER_CAR_SPIN_RIGHT:
                return robot.robots.RobotCompactCommand.MotorSpinRight
            case Tid.TID_MODIFIER_CAR_LED_COLOR_1:
                return robot.robots.RobotCompactCommand.LEDRed
            case Tid.TID_MODIFIER_CAR_LED_COLOR_2:
                return robot.robots.RobotCompactCommand.LEDGreen
            case Tid.TID_MODIFIER_CAR_LED_COLOR_3:
                return robot.robots.RobotCompactCommand.LEDBlue
            case Tid.TID_MODIFIER_CAR_LED_COLOR_4:
                return robot.robots.RobotCompactCommand.LEDOff
            case Tid.TID_MODIFIER_CAR_ARM_OPEN:
                return robot.robots.RobotCompactCommand.ArmOpen
            case Tid.TID_MODIFIER_CAR_ARM_CLOSE:
                return robot.robots.RobotCompactCommand.ArmClose
        }
        return undefined
    }
}

namespace icondb {
    export const car = bmp`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . f f f f f f f f . . . .
    . . . f f 1 1 1 1 1 1 f f . . .
    . . f f 1 1 1 1 1 1 1 1 f f . .
    . . f f 1 1 1 1 1 1 1 d f f . .
    . . f f 1 d d d d d d d f f . .
    . f f f f f f f f f f f f f f .
    . f f 9 f f f f f f f f 9 f f .
    . f 9 1 9 f f f f f f 9 1 9 f d
    . f f 9 f f f f f f f f 9 f f d
    . f f f f f f f f f f f f f f d
    . . f f d . . . . . . . f f d d
    . . f f d . . . . . . . f f d .
    . . f f . . . . . . . . f f . .
    . . . . . . . . . . . . . . . .
`

    export const car_forward = bmp`
    . . . . . . . . . . . . . . . .
    . . . . . . . c . . . . . . . .
    . . . . . . c 7 c . . . . . . .
    . . . . . c 7 7 7 c . . . . . .
    . . . . c 7 7 7 7 7 c . . . . .
    . . . c 7 7 7 7 7 7 7 c . . . .
    . . . c 7 7 7 7 7 7 7 c . . . .
    . . . c c c 7 7 7 c c c d . . .
    . . . . . c 7 7 7 c d d d . . .
    . . . . . c 7 7 7 c d . . . . .
    . . . . . c 7 7 7 c d . . . . .
    . . . . . c 7 7 7 c d . . . . .
    . . . . . c 7 7 7 c d . . . . .
    . . . . . c c c c c . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
`
    export const car_forward_fast = bmp`
    . . . . . . . c . . . . . . . .
    . . . . . . c 7 c . . . . . . .
    . . . . . c 7 7 7 c . . . . . .
    . . . . c 7 7 7 7 7 c . . . . .
    . . . c 7 7 7 7 7 7 7 c . . . .
    . . . c 7 7 7 7 7 7 7 c . . . .
    . . . c c c c c c c c c d . . .
    . . . . . . . . . . . . . . . .
    . . . . . c c c c c . . . . . .
    . . . . . c 7 7 7 c d . . . . .
    . . . . . c c c c c d . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . c 7 7 7 c . . . . . .
    . . . . . c c c c c d . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . c 7 7 7 c d . . . . .    
    `

    export const car_reverse = bmp`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . c c c c c . . . . .
    . . . . . . c 7 7 7 c . . . . .
    . . . . . . c 7 7 7 c d . . . .
    . . . . . . c 7 7 7 c d . . . .
    . . . . . . c 7 7 7 c d . . . .
    . . . . . . c 7 7 7 c d . . . .
    . . . . c c c 7 7 7 c c c . . .
    . . . . c 7 7 7 7 7 7 7 c . . .
    . . . . c 7 7 7 7 7 7 7 c . . .
    . . . . . c 7 7 7 7 7 c . . . .
    . . . . . . c 7 7 7 c . . . . .
    . . . . . . . c 7 c . . . . . .
    . . . . . . . . c . . . . . . .
    . . . . . . . . . . . . . . . .
`

    export const car_left_turn = bmp`
    . . . . . . . . . . . . . . . .
    . . . . . c c c . . . . . . . .
    . . . . c 7 7 c . . . . . . . .
    . . . c 7 7 7 c c c c . . . . .
    . . c 7 7 7 7 7 7 7 7 c . . . .
    . c 7 7 7 7 7 7 7 7 7 7 c . . .
    . . c 7 7 7 7 7 7 7 7 7 7 c . .
    . . . c 7 7 7 c c 7 7 7 7 7 c .
    . . . . c 7 7 c d c 7 7 7 7 c .
    . . . . . c c c . . c 7 7 7 c d
    . . . . . . . . . . c 7 7 7 c d
    . . . . . . . . . . c 7 7 7 c d
    . . . . . . . . . . c 7 7 7 c d
    . . . . . . . . . . c 7 7 7 c d
    . . . . . . . . . . c c c c c .
    . . . . . . . . . . . . . . . .
`

    export const car_left_spin = bmp`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . c c c c c . . . . . .
    . . . . c 7 7 7 7 7 c . . . . .
    . . . c 7 7 7 7 7 7 7 c . . . .
    . . c 7 7 7 7 7 7 7 7 7 c . . .
    . . c 7 7 7 c c 7 7 7 7 7 c . .
    c c c 7 7 7 c c c 7 7 7 7 7 c .
    c 7 7 7 7 7 7 7 c c 7 7 7 7 c .
    c 7 7 7 7 7 7 7 c d c 7 7 7 c d
    . c 7 7 7 7 7 c d . c 7 7 7 c d
    . . c 7 7 7 c d . . c 7 7 7 c d
    . . . c 7 c d . . . c 7 7 7 c d
    . . . . c . . . . . c 7 7 7 c d
    . . . . . . . . . . c c c c c .
    . . . . . . . . . . . . . . . .    
    `

    export const car_wall = bmp`
    . . . . . . . . . . . . . . . .
    d d d d d d d d d d d d d d d d
    2 2 2 2 d 2 2 2 2 d 2 2 2 2 d 2
    2 2 2 2 d 2 2 2 2 d 2 2 2 2 d 2
    d d d d d d d d d d d d d d d d
    2 2 d 2 2 2 2 d 2 2 2 2 d 2 2 2
    2 2 d 2 2 2 2 d 2 2 2 2 d 2 2 2
    d d d d d d d d d d d d d d d d
    2 2 2 2 d 2 2 2 2 d 2 2 2 2 d 2
    2 2 2 2 d 2 2 2 2 f f f f f f 2
    d d d d d d d d d f 1 1 1 1 f d
    2 2 d 2 2 2 2 d 2 f d d d d f 2
    2 2 d 2 2 2 2 d f 9 f f f f 9 f
    d d d d d d d d f 1 f f f f 1 f
    . . . . . . . . f f f f f f f f
    . . . . . . . . . f . . . . f .
`

    export const line_sensor = bmp`
    . . . . . . . . . . . . . . . .
    . b d d d d c f f c d d d d b .
    . b d d d d c f f c d d d d b .
    . b d d d d c f f c d d d d b .
    . d d d d d c f f c d d d d d .
    . d d d d d c f f c d d d d d .
    . d d d d d c f f c d d d d d .
    . b d d d d c f f c d d d d b .
    . b d d d d c f c c d d d d b .
    . b d d d d c f c f f f f f f .
    . d d d d d c f c f 1 1 1 1 f .
    . d d d d d c f c f d d d d f .
    . d d d d d c c f 9 f f f f 9 f
    . b d d d d c c f 1 f f f f 1 f
    . b d d d d c c f f f f f f f f
    . . . . . . . . . f . . . . f .
`
    export const line_neither_on = bmp`
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . . . . . . . . . . . .
. . . . . d d . d d . . . . . .
. . . . d 1 d . d 1 d . . . . .
. . . d 1 1 d . d 1 1 d . . . .
. . d 1 1 1 d . d 1 1 1 d . . .
. d 1 1 1 1 d . d 1 1 1 1 d . .
. d 1 1 1 1 d . d 1 1 1 1 d . .
. d 1 1 1 1 d . d 1 1 1 1 d . .
. d 1 1 1 1 d . d 1 1 1 1 d . .
. d 1 1 1 d . . . d 1 1 1 d . .
. d 1 1 d . . . . . d 1 1 d . .
. d 1 d . . . . . . . d 1 d . .
. d d . . . . . . . . . d d . .
. . . . . . . . . . . . . . . .
`
    export const line_left_on = bmp`
    . c f f f c . . . . . . . . . .
    . c f f f c . . . . . . . . . .
    . c f f f b . . . . . . . . . .
    . c f f f d d . d d . . . . . .
    . c f f d 7 d . d 1 d . . . . .
    . c f d 7 7 d . d 1 1 d . . . .
    . b d 7 7 7 d . d 1 1 1 d . . .
    . d 7 7 7 7 d . d 1 1 1 1 d . .
    . d 7 7 7 7 d . d 1 1 1 1 d . .
    . d 7 7 7 7 d . d 1 1 1 1 d . .
    . d 7 7 7 7 d . d 1 1 1 1 d . .
    . d 7 7 7 d . . . d 1 1 1 d . .
    . d 7 7 d b . . . . d 1 1 d . .
    . d 7 d f c . . . . . d 1 d . .
    . d d f f c . . . . . . d d . .
    . b f f f c . . . . . . . . . .`
    export const line_right_on = bmp`
    . . . . . . . . . c f f f c . .
    . . . . . . . . . c f f f c . .
    . . . . . . . . . b f f f c . .
    . . . . . d d . d d f f f c . .
    . . . . d 1 d . d 7 d f f c . .
    . . . d 1 1 d . d 7 7 d f c . .
    . . d 1 1 1 d . d 7 7 7 d b . .
    . d 1 1 1 1 d . d 7 7 7 7 d . .
    . d 1 1 1 1 d . d 7 7 7 7 d . .
    . d 1 1 1 1 d . d 7 7 7 7 d . .
    . d 1 1 1 1 d . d 7 7 7 7 d . .
    . d 1 1 1 d . . . d 7 7 7 d . .
    . d 1 1 d . . . . b d 7 7 d . .
    . d 1 d . . . . . c f d 7 d . .
    . d d . . . . . . c f f d d . .
    . . . . . . . . . c f f f b . .
`
    export const line_both_on = bmp`
    . . . . . c f f f c . . . . . .
    . . . . . c f f f c . . . . . .
    . . . . . b f f f b . . . . . .
    . . . . . d d f d d . . . . . .
    . . . . d 7 d f d 7 d . . . . .
    . . . d 7 7 d f d 7 7 d . . . .
    . . d 7 7 7 d f d 7 7 7 d . . .
    . d 7 7 7 7 d f d 7 7 7 7 d . .
    . d 7 7 7 7 d f d 7 7 7 7 d . .
    . d 7 7 7 7 d f d 7 7 7 7 d . .
    . d 7 7 7 7 d f d 7 7 7 7 d . .
    . d 7 7 7 d f f f d 7 7 7 d . .
    . d 7 7 d b f f f b d 7 7 d . .
    . d 7 d . c f f f c . d 7 d . .
    . d d . . c f f f c . . d d . .
    . . . . . c f f f c . . . . . .
`

    export const line_none_from_left = bmp`
. c f f f c . . . . . . . . . .
. c f f f c . . . . . . . . . .
. c f f f c . . . . . . . . . .
. c f f f c . . . . . . d d . d
. c f f f c . . . . . d 1 d . d
. c f f f c . . . . d 1 1 d . d
. c f f f c . . . d 1 1 1 d . d
. c f f f c . . d 1 1 1 1 d . d
. c f f f c . . d 1 1 1 1 d . d
. c f f f c . . d 1 1 1 1 d . d
. c f f f c . . d 1 1 1 1 d . d
. c f f f c . . d 1 1 1 d . . .
. c f f f c . . d 1 1 d . . . .
. c f f f c . . d 1 d . . . . .
. c f f f c . . d d . . . . . .
. c f f f c . . . . . . . . . .
`

    export const line_none_from_right = bmp`
    . . . . . . . . . . c f f f c .
    . . . . . . . . . . c f f f c .
    . . . . . . . . . . c f f f c .
    d . d d . . . . . . c f f f c .
    d . d 1 d . . . . . c f f f c .
    d . d 1 1 d . . . . c f f f c .
    d . d 1 1 1 d . . . c f f f c .
    d . d 1 1 1 1 d . . c f f f c .
    d . d 1 1 1 1 d . . c f f f c .
    d . d 1 1 1 1 d . . c f f f c .
    d . d 1 1 1 1 d . . c f f f c .
    . . . d 1 1 1 d . . c f f f c .
    . . . . d 1 1 d . . c f f f c .
    . . . . . d 1 d . . c f f f c .
    . . . . . . d d . . c f f f c .
    . . . . . . . . . . c f f f c .    
    `
}
