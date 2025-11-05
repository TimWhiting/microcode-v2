namespace microcode {
    // mapping of micro:bit and DAL namespace into MicroCode tiles

    type IdMap = { [id: number]: number }

    // see DAL for these values
    const matchPressReleaseTable: IdMap = {
        1: Tid.TID_FILTER_BUTTON_A, // DAL.DEVICE_ID_BUTTON_A
        2: Tid.TID_FILTER_BUTTON_B, // DAL.DEVICE_ID_BUTTON_B
        121: Tid.TID_FILTER_LOGO, // DAL.MICROBIT_ID_LOGO
        100: Tid.TID_FILTER_PIN_0, // DAL.ID_PIN_P0
        101: Tid.TID_FILTER_PIN_1, // DAL.ID_PIN_P1
        102: Tid.TID_FILTER_PIN_2, // DAL.ID_PIN_P2
    }

    const gestures = [
        Gesture.Shake,
        Gesture.LogoUp,
        Gesture.LogoDown,
        Gesture.TiltLeft,
        Gesture.TiltRight,
        Gesture.ScreenUp,
        Gesture.ScreenDown,
    ]

    const gestures2tids = [
        Tid.TID_FILTER_ACCEL_SHAKE,
        Tid.TID_FILTER_ACCEL_TILT_UP,
        Tid.TID_FILTER_ACCEL_TILT_DOWN,
        Tid.TID_FILTER_ACCEL_TILT_LEFT,
        Tid.TID_FILTER_ACCEL_TILT_RIGHT,
        Tid.TID_FILTER_ACCEL_FACE_UP,
        Tid.TID_FILTER_ACCEL_FACE_DOWN,
    ]

    const buttons = [
        DAL.DEVICE_ID_BUTTON_A,
        DAL.DEVICE_ID_BUTTON_B,
        DAL.MICROBIT_ID_LOGO,
    ]

    const pins = [TouchPin.P0, TouchPin.P1, TouchPin.P2]
    const pin2tid = [
        Tid.TID_FILTER_PIN_0,
        Tid.TID_FILTER_PIN_1,
        Tid.TID_FILTER_PIN_2,
    ]

    export class MicrobitHost implements RuntimeHost {
        constructor() {
            this._handler = (s: number, f: number) => {}

            control.singleSimulator()
            // make sure we have V2 simulator
            input.onLogoEvent(TouchButtonEvent.Pressed, function () {})

            buttons.forEach(b => {
                context.onEvent(b, DAL.DEVICE_EVT_ANY, () => {
                    const ev = control.eventValue()
                    this._handler(
                        ev == DAL.DEVICE_BUTTON_EVT_DOWN
                            ? Tid.TID_SENSOR_PRESS
                            : ev == DAL.DEVICE_BUTTON_EVT_UP
                            ? Tid.TID_SENSOR_RELEASE
                            : undefined,
                        matchPressReleaseTable[b]
                    )
                })
            })

            pins.forEach((p, index) => {
                input.onPinPressed(p, () => {
                    this._handler(Tid.TID_SENSOR_PRESS, pin2tid[index])
                })
                input.onPinReleased(p, () => {
                    this._handler(Tid.TID_SENSOR_RELEASE, pin2tid[index])
                })
            })

            gestures.forEach((g, index) => {
                input.onGesture(g, () => {
                    this._handler(
                        Tid.TID_SENSOR_ACCELEROMETER,
                        gestures2tids[index]
                    )
                })
            })

            // handle all other accelerometer events
            // context.onEvent(
            //     DAL.DEVICE_ID_GESTURE, // DEVICE_ID_GESTURE
            //     DAL.DEVICE_EVT_ANY,
            //     () => {
            //         if (control.eventValue() != Gesture.Shake) {
            //             let ev = matchAccelerometerTable[control.eventValue()]
            //             if (ev)
            //                 this._handler(
            //                     Tid.TID_SENSOR_ACCELEROMETER,
            //                     matchAccelerometerTable[control.eventValue()]
            //                 )
            //         }
            //     }
            // )
            // context.onEvent(
            //     DAL.DEVICE_ID_SYSTEM_LEVEL_DETECTOR,
            //     DAL.DEVICE_EVT_ANY,
            //     () => {
            //         const ev = control.eventValue()
            //         this._handler(
            //             Tid.TID_SENSOR_MICROPHONE,
            //             ev == DAL.LEVEL_THRESHOLD_HIGH
            //                 ? Tid.TID_FILTER_LOUD
            //                 : ev == DAL.LEVEL_THRESHOLD_LOW
            //                 ? Tid.TID_FILTER_QUIET
            //                 : undefined
            //         )
            //     }
            // )
            radio.onReceivedNumber(radioNum => {
                this._handler(Tid.TID_SENSOR_RADIO_RECEIVE, radioNum)
            })
        }

        private _handler: (sensorTid: number, filter: number) => void
        registerOnSensorEvent(
            handler: (sensorTid: number, filter: number) => void
        ) {
            this._handler = handler
        }

        emitClearScreen() {
            const anim = hex`
                0001000000
                0000010000
                0000000100
                0000000002
                0000000004
                0000000008
                0000001000
                0000100000
                0010000000
                0800000000
                0400000000
                0200000000
                0000000000
            `
            let pos = 0
            while (pos < anim.length) {
                for (let col = 0; col < 5; col++) {
                    for (let row = 0; row < 5; row++) {
                        const onOff =
                            anim[pos + col + (row >> 3)] & (1 << (row & 7))
                        if (onOff) led.plot(col, row)
                        else led.unplot(col, row)
                    }
                }
                control.waitMicros(20000)
                pos = pos + 5
            }
        }

        public execute(action: ActionTid, param: any) {
            switch (action) {
                case Tid.TID_ACTUATOR_PAINT:
                    this.showIcon(param)
                    return
                case Tid.TID_ACTUATOR_SHOW_NUMBER:
                    basic.showNumber(param)
                    return
                case Tid.TID_ACTUATOR_RADIO_SET_GROUP:
                    radio.setGroup(param)
                    return
                case Tid.TID_ACTUATOR_RADIO_SEND:
                    radio.sendNumber(param)
                    return
                case Tid.TID_ACTUATOR_SPEAKER:
                    music.play(
                        music.builtinPlayableSoundEffect(this.getSound(param)),
                        music.PlaybackMode.UntilDone
                    )
                    return
                case Tid.TID_ACTUATOR_MUSIC:
                    music.play(
                        music.stringPlayable(param, 120),
                        music.PlaybackMode.UntilDone
                    )
                    return
            }
        }

        private showIcon(img: Bitmap) {
            let s: string[] = []
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 5; col++) {
                    if (img.getPixel(col, row)) led.plot(col, row)
                    else led.unplot(col, row)
                }
            }
            // TODO: do want this here? do we really want to yield?
            basic.pause(400)
        }

        private getSound(sound: Tid) {
            switch (sound) {
                case Tid.TID_MODIFIER_EMOJI_GIGGLE:
                    return soundExpression.giggle
                case Tid.TID_MODIFIER_EMOJI_HAPPY:
                    return soundExpression.happy
                case Tid.TID_MODIFIER_EMOJI_HELLO:
                    return soundExpression.hello
                case Tid.TID_MODIFIER_EMOJI_MYSTERIOUS:
                    return soundExpression.mysterious
                case Tid.TID_MODIFIER_EMOJI_SAD:
                    return soundExpression.sad
                case Tid.TID_MODIFIER_EMOJI_SLIDE:
                    return soundExpression.slide
                case Tid.TID_MODIFIER_EMOJI_SOARING:
                    return soundExpression.soaring
                case Tid.TID_MODIFIER_EMOJI_SPRING:
                    return soundExpression.spring
                case Tid.TID_MODIFIER_EMOJI_TWINKLE:
                    return soundExpression.twinkle
                case Tid.TID_MODIFIER_EMOJI_YAWN:
                    return soundExpression.yawn
            }
            return soundExpression.giggle
        }
    }
}

/*

                // TODO: convert this to external sensor with events and values
                // TODO: and lift out
                const radioVal = this.getRadioVal()
                if (
                    sensor == Tid.TID_SENSOR_CAR_WALL ||
                    sensor == Tid.TID_SENSOR_LINE
                ) {
                    // this hack separates radio ranges used to communicate with robot car
                    if (
                        robot.robots.RobotCompactCommand.ObstacleState <
                        radioVal
                    )
                        if (sensor == Tid.TID_SENSOR_CAR_WALL)
                            return this.filterOnEvent(
                                radioVal -
                                    robot.robots.RobotCompactCommand
                                        .ObstacleState
                            )
                        else if (
                            robot.robots.RobotCompactCommand.LineState <=
                            radioVal
                        )
                            return this.filterOnEvent(radioVal)
                } else if (
                    radioVal < robot.robots.RobotCompactCommand.ObstacleState
                )
                    return this.filterViaCompare()

*/
