namespace microcode {
    import ButtonStyles = user_interface_base.ButtonStyles
    import ButtonStyle = user_interface_base.ButtonStyle

    // DO NOT CHANGE THESE NUMBERS
    export enum Tid {
        // we need markers to indicate the end of a program, page
        END_OF_PROG = 0,
        END_OF_PAGE,

        SENSOR_START = 10,
        TID_SENSOR_START_PAGE = 10,
        TID_SENSOR_PRESS = 11,
        TID_SENSOR_RELEASE = 12,
        TID_SENSOR_ACCELEROMETER = 13,
        TID_SENSOR_TIMER = 14,
        TID_SENSOR_LIGHT = 15, // this is jacdac only
        TID_SENSOR_TEMP = 16,
        TID_SENSOR_RADIO_RECEIVE = 17,
        TID_SENSOR_MICROPHONE = 18,
        TID_SENSOR_CUP_X_WRITTEN = 19,
        TID_SENSOR_CUP_Y_WRITTEN = 20,
        TID_SENSOR_CUP_Z_WRITTEN = 21,
        TID_SENSOR_MAGNET = 22,
        TID_SENSOR_SLIDER = 23,
        TID_SENSOR_ROTARY = 24,
        TID_SENSOR_CAR_WALL = 25,
        TID_SENSOR_LINE = 26,
        TID_SENSOR_LED_LIGHT = 27, // this built-in light sensor on microbit
        TID_SENSOR_MOISTURE = 28,
        TID_SENSOR_DISTANCE = 29,
        TID_SENSOR_REFLECTED = 30,
        SENSOR_END = 30,

        ACTUATOR_START = 40,
        TID_ACTUATOR_SWITCH_PAGE = 40,
        TID_ACTUATOR_SPEAKER = 41,
        TID_ACTUATOR_MICROPHONE = 42, // dead, but don't delete
        TID_ACTUATOR_MUSIC = 43,
        TID_ACTUATOR_PAINT = 44,
        TID_ACTUATOR_RADIO_SEND = 45,
        TID_ACTUATOR_RADIO_SET_GROUP = 46,
        TID_ACTUATOR_RGB_LED = 47,
        TID_ACTUATOR_CUP_X_ASSIGN = 48,
        TID_ACTUATOR_CUP_Y_ASSIGN = 49,
        TID_ACTUATOR_CUP_Z_ASSIGN = 50,
        TID_ACTUATOR_SHOW_NUMBER = 51,
        TID_ACTUATOR_CAR = 52,
        TID_ACTUATOR_SERVO_SET_ANGLE = 53,
        TID_ACTUATOR_RELAY = 54,
        TID_ACTUATOR_SERVO_POWER = 55,
        ACTUATOR_END = 55,

        FILTER_START = 70,
        PRESS_RELEASE_START = 70,
        TID_FILTER_PIN_0 = 70,
        TID_FILTER_PIN_1 = 71,
        TID_FILTER_PIN_2 = 72,
        TID_FILTER_BUTTON_A = 73,
        TID_FILTER_BUTTON_B = 74,
        TID_FILTER_KITA_KEY_1 = 75,
        TID_FILTER_KITA_KEY_2 = 76,
        TID_FILTER_LOGO = 77,
        PRESS_RELEASE_END = 77,
        //
        TID_FILTER_COIN_1 = 78,
        TID_FILTER_COIN_2 = 79,
        TID_FILTER_COIN_3 = 80,
        TID_FILTER_COIN_4 = 81,
        TID_FILTER_COIN_5 = 82,
        //
        TID_FILTER_TIMESPAN_SHORT = 83,
        TID_FILTER_TIMESPAN_LONG = 84,
        TID_FILTER_TIMESPAN_RANDOM = 85,
        TID_FILTER_TIMESPAN_VERY_LONG = 86,
        //
        TID_FILTER_LOUD = 87,
        TID_FILTER_QUIET = 88,
        //
        TID_FILTER_ACCEL = 89, // dead (AFAIK)
        ACCELEROMETER_START = 90,
        TID_FILTER_ACCEL_SHAKE = 90,
        TID_FILTER_ACCEL_TILT_UP = 91,
        TID_FILTER_ACCEL_TILT_DOWN = 92,
        TID_FILTER_ACCEL_TILT_LEFT = 93,
        TID_FILTER_ACCEL_TILT_RIGHT = 94,
        ACCELEROMETER_END = 94,
        //
        TID_FILTER_CUP_X_READ = 95,
        TID_FILTER_CUP_Y_READ = 96,
        TID_FILTER_CUP_Z_READ = 97,
        //
        TID_FILTER_ROTARY_LEFT = 98,
        TID_FILTER_ROTARY_RIGHT = 99,
        //
        TID_FILTER_TEMP_WARMER = 100,
        TID_FILTER_TEMP_COLDER = 101,
        //
        LINE_START = 102,
        TID_FILTER_LINE_LEFT = 102,
        TID_FILTER_LINE_RIGHT = 103,
        TID_FILTER_LINE_BOTH = 104,
        TID_FILTER_LINE_NEITHER = 105,
        TID_FILTER_LINE_NEITHER_LEFT = 106,
        TID_FILTER_LINE_NEITHER_RIGHT = 107,
        LINE_END = 107,

        ACCELEROMETER_START2 = 108,
        TID_FILTER_ACCEL_FACE_UP = 108,
        TID_FILTER_ACCEL_FACE_DOWN = 109,
        ACCELEROMETER_END2 = 109,

        TID_FILTER_ON = 110,
        TID_FILTER_OFF = 111,

        FILTER_END = 111,

        MODIFIER_START = 150,
        //
        TID_MODIFIER_PAGE_1 = 150,
        TID_MODIFIER_PAGE_2 = 151,
        TID_MODIFIER_PAGE_3 = 152,
        TID_MODIFIER_PAGE_4 = 153,
        TID_MODIFIER_PAGE_5 = 154,
        //
        TID_MODIFIER_COIN_1 = 155,
        TID_MODIFIER_COIN_2 = 156,
        TID_MODIFIER_COIN_3 = 157,
        TID_MODIFIER_COIN_4 = 158,
        TID_MODIFIER_COIN_5 = 159,
        //
        TID_MODIFIER_ICON_EDITOR = 160,
        TID_MODIFIER_COLOR_RED = 161,
        TID_MODIFIER_COLOR_DARKPURPLE = 162,
        //
        EMOJI_BEGIN = 163,
        TID_MODIFIER_EMOJI_GIGGLE = 163,
        TID_MODIFIER_EMOJI_HAPPY = 164,
        TID_MODIFIER_EMOJI_HELLO = 165,
        TID_MODIFIER_EMOJI_MYSTERIOUS = 166,
        TID_MODIFIER_EMOJI_SAD = 167,
        TID_MODIFIER_EMOJI_SLIDE = 168,
        TID_MODIFIER_EMOJI_SOARING = 169,
        TID_MODIFIER_EMOJI_SPRING = 170,
        TID_MODIFIER_EMOJI_TWINKLE = 171,
        TID_MODIFIER_EMOJI_YAWN = 172,
        EMOJI_END = 172,
        //
        TID_MODIFIER_CUP_X_READ = 173,
        TID_MODIFIER_CUP_Y_READ = 174,
        TID_MODIFIER_CUP_Z_READ = 175,
        TID_MODIFIER_RADIO_VALUE = 176,
        TID_MODIFIER_RANDOM_TOSS = 177,
        TID_MODIFIER_LOOP = 178,
        TID_MODIFIER_MELODY_EDITOR = 179,
        TID_MODIFIER_TEMP_READ = 180,
        //
        TID_MODIFIER_RGB_LED_COLOR_X = 181,
        TID_MODIFIER_RGB_LED_COLOR_1 = 182,
        TID_MODIFIER_RGB_LED_COLOR_2 = 183,
        TID_MODIFIER_RGB_LED_COLOR_3 = 184,
        TID_MODIFIER_RGB_LED_COLOR_4 = 185,
        TID_MODIFIER_RGB_LED_COLOR_5 = 186,
        TID_MODIFIER_RGB_LED_COLOR_6 = 187,
        TID_MODIFIER_RGB_LED_COLOR_RAINBOW = 188,
        TID_MODIFIER_RGB_LED_COLOR_SPARKLE = 189,
        //
        CAR_MODIFIER_BEGIN = 190,
        TID_MODIFIER_CAR_FORWARD = 190,
        TID_MODIFIER_CAR_REVERSE = 191,
        TID_MODIFIER_CAR_TURN_LEFT = 192,
        TID_MODIFIER_CAR_TURN_RIGHT = 193,
        TID_MODIFIER_CAR_STOP = 194,
        TID_MODIFIER_CAR_FORWARD_FAST = 195,
        TID_MODIFIER_CAR_SPIN_LEFT = 196,
        TID_MODIFIER_CAR_SPIN_RIGHT = 197,
        TID_MODIFIER_CAR_LED_COLOR_1 = 198,
        TID_MODIFIER_CAR_LED_COLOR_2 = 199,
        TID_MODIFIER_CAR_LED_COLOR_3 = 200,
        TID_MODIFIER_CAR_LED_COLOR_4 = 201,
        TID_MODIFIER_CAR_ARM_OPEN = 202,
        TID_MODIFIER_CAR_ARM_CLOSE = 203,
        CAR_MODIFIER_END = 203,

        TID_MODIFIER_ON = 204,
        TID_MODIFIER_OFF = 205,
        MODIFER_END = 205,

        TID_OPERATOR_START = 210,
        TID_OPERATOR_PLUS = 210,
        TID_OPERATOR_MINUS = 211,
        TID_OPERATOR_MULTIPLY = 212,
        TID_OPERATOR_DIVIDE = 213,
        TID_OPERATOR_END = 213,

        TID_COMPARE_START = 220,
        TID_COMPARE_EQ = 220,
        TID_COMPARE_NEQ = 221,
        TID_COMPARE_LT = 222,
        TID_COMPARE_LTE = 223,
        TID_COMPARE_GT = 224,
        TID_COMPARE_GTE = 225,
        TID_COMPARE_END = 225,
    }

    type RangeMap = { [id: string]: [Tid, Tid] }

    export const ranges: RangeMap = {
        sensors: [Tid.SENSOR_START, Tid.SENSOR_END],
        filters: [Tid.FILTER_START, Tid.FILTER_END],
        actuators: [Tid.ACTUATOR_START, Tid.ACTUATOR_END],
        modifiers: [Tid.MODIFIER_START, Tid.MODIFER_END],
        mathOperators: [Tid.TID_OPERATOR_START, Tid.TID_OPERATOR_END],
        comparisonOperators: [Tid.TID_COMPARE_START, Tid.TID_COMPARE_END],
    }

    export function tidToString(e: Tid) {
        return "T" + e.toString()
    }

    // TODO: should separate {sensors, filters, etc} into different namespaces
    export function isSensor(tid: Tid) {
        return tid >= Tid.SENSOR_START && tid <= Tid.SENSOR_END
    }

    export function isFilter(tid: Tid) {
        return (
            (tid >= Tid.FILTER_START && tid <= Tid.FILTER_END) ||
            isMathOperator(tid) ||
            isComparisonOperator(tid)
        )
    }

    export function isActuator(tid: Tid) {
        return tid >= Tid.ACTUATOR_START && tid <= Tid.ACTUATOR_END
    }

    export function isModifier(tid: Tid) {
        return (
            (tid >= Tid.MODIFIER_START && tid <= Tid.MODIFER_END) ||
            isMathOperator(tid)
        )
    }

    export function isMathOperator(tid: Tid) {
        return tid >= Tid.TID_OPERATOR_START && tid <= Tid.TID_OPERATOR_END
    }

    export function isComparisonOperator(tid: Tid) {
        return tid >= Tid.TID_COMPARE_START && tid <= Tid.TID_COMPARE_END
    }

    function isPressReleaseEvent(tidEnum: Tid) {
        return (
            Tid.PRESS_RELEASE_START <= tidEnum &&
            tidEnum <= Tid.PRESS_RELEASE_END
        )
    }

    function isAccelerometerEvent(tidEnum: Tid) {
        return (
            (Tid.ACCELEROMETER_START <= tidEnum &&
                tidEnum <= Tid.ACCELEROMETER_END) ||
            (Tid.ACCELEROMETER_START2 <= tidEnum &&
                tidEnum <= Tid.ACCELEROMETER_END2)
        )
    }

    function isLineEvent(tidEnum: Tid) {
        return Tid.LINE_START <= tidEnum && tidEnum <= Tid.LINE_END
    }

    function isFilterConstant(tidEnum: Tid) {
        return (
            Tid.TID_FILTER_COIN_1 <= tidEnum && tidEnum <= Tid.TID_FILTER_COIN_5
        )
    }

    function isFilterVariable(tidEnum: Tid) {
        return (
            Tid.TID_FILTER_CUP_X_READ <= tidEnum &&
            tidEnum <= Tid.TID_FILTER_CUP_Z_READ
        )
    }

    function isModifierConstant(tidEnum: Tid) {
        return (
            Tid.TID_MODIFIER_COIN_1 <= tidEnum &&
            tidEnum <= Tid.TID_MODIFIER_COIN_5
        )
    }

    function isModifierVariable(tidEnum: Tid) {
        return (
            Tid.TID_MODIFIER_CUP_X_READ <= tidEnum &&
            tidEnum <= Tid.TID_MODIFIER_CUP_Z_READ
        )
    }

    function isTimespan(tidEnum: Tid) {
        return (
            Tid.TID_FILTER_TIMESPAN_SHORT <= tidEnum &&
            tidEnum <= Tid.TID_FILTER_TIMESPAN_VERY_LONG
        )
    }

    function isEmoji(tidEnum: Tid) {
        return Tid.EMOJI_BEGIN <= tidEnum && tidEnum <= Tid.EMOJI_END
    }

    function isPage(tidEnum: Tid) {
        return (
            Tid.TID_MODIFIER_PAGE_1 <= tidEnum &&
            tidEnum <= Tid.TID_MODIFIER_PAGE_5
        )
    }

    function isLedColor(tidEnum: Tid) {
        return (
            Tid.TID_MODIFIER_RGB_LED_COLOR_1 <= tidEnum &&
            tidEnum <= Tid.TID_MODIFIER_RGB_LED_COLOR_6
        )
    }

    function isLedModifier(tidEnum: Tid) {
        return (
            isLedColor(tidEnum) ||
            tidEnum == Tid.TID_MODIFIER_RGB_LED_COLOR_RAINBOW ||
            tidEnum == Tid.TID_MODIFIER_RGB_LED_COLOR_SPARKLE
        )
    }

    function isCarModifier(tidEnum: Tid) {
        return (
            Tid.CAR_MODIFIER_BEGIN <= tidEnum && tidEnum <= Tid.CAR_MODIFIER_END
        )
    }

    export function isTerminal(tile: Tile) {
        const tid = getTid(tile)
        // everything else except some filters are not terminal
        if (!isFilter(tid)) return false
        // the following filters are not terminal
        if (
            isFilterConstant(tid) ||
            isTimespan(tid) ||
            isFilterVariable(tid) ||
            isMathOperator(tid) ||
            isComparisonOperator(tid)
        )
            return false
        // all other filters are terminal
        return true
    }

    export function isVisible(tile: Tile) {
        const tid = getTid(tile)
        // these tids are dead
        if (tid == Tid.TID_ACTUATOR_MICROPHONE || tid == Tid.TID_FILTER_ACCEL)
            return false
        return true
    }

    export function defaultModifier(tid: Tid): Tile {
        switch (tid) {
            case Tid.TID_ACTUATOR_RELAY:
            case Tid.TID_ACTUATOR_SERVO_POWER:
                return Tid.TID_MODIFIER_OFF
            case Tid.TID_ACTUATOR_SPEAKER:
                return Tid.TID_MODIFIER_EMOJI_GIGGLE
            case Tid.TID_ACTUATOR_CAR:
                return Tid.TID_MODIFIER_CAR_STOP
            case Tid.TID_ACTUATOR_RGB_LED:
                return Tid.TID_MODIFIER_RGB_LED_COLOR_RAINBOW
            case Tid.TID_ACTUATOR_PAINT: {
                return getEditor(Tid.TID_MODIFIER_ICON_EDITOR)
            }
            case Tid.TID_ACTUATOR_MUSIC: {
                return getEditor(Tid.TID_MODIFIER_MELODY_EDITOR)
            }
            default:
                return undefined
        }
    }

    export function filterModifierWithDelete(tile: Tile): boolean {
        const tid = getTid(tile)
        return !(isMathOperator(tid) || isComparisonOperator(tid))
    }

    export function buttonStyle(tile: Tile): ButtonStyle {
        return getFieldEditor(tile)
            ? ButtonStyles.Transparent
            : ButtonStyles.FlatWhite
    }

    export function priority(tile: Tile): number {
        const tid = getTid(tile)
        if (isFilter(tid)) {
            if (isFilterConstant(tid)) return getParam(tid)
            if (isLineEvent(tid)) {
                if (tid == Tid.TID_FILTER_LINE_BOTH) return 101
                else return tid
            }
            switch (tid) {
                case Tid.TID_FILTER_BUTTON_A:
                    return 0
                case Tid.TID_FILTER_BUTTON_B:
                    return 1
                case Tid.TID_FILTER_LOGO:
                    return 2
                case Tid.TID_FILTER_PIN_0:
                    return 3
                case Tid.TID_FILTER_PIN_1:
                    return 4
                case Tid.TID_FILTER_PIN_2:
                    return 5
                case Tid.TID_FILTER_TIMESPAN_SHORT:
                    return 10
                case Tid.TID_FILTER_TIMESPAN_LONG:
                    return 20
                case Tid.TID_FILTER_TIMESPAN_VERY_LONG:
                    return 30
                case Tid.TID_FILTER_TIMESPAN_RANDOM:
                    return 40
            }
            return tid
        } else if (isModifier(tid)) {
            if (tid == Tid.TID_MODIFIER_LOOP)
                // loop always at end
                return 1000
            return tid
        }
        switch (tid) {
            // sensors
            case Tid.TID_SENSOR_PRESS:
                return 9
            case Tid.TID_SENSOR_RELEASE:
                return 10
            case Tid.TID_SENSOR_ACCELEROMETER:
                return 20
            case Tid.TID_SENSOR_MICROPHONE:
                return 30
            case Tid.TID_SENSOR_TEMP:
                return 40
            case Tid.TID_SENSOR_LED_LIGHT:
                return 50
            case Tid.TID_SENSOR_RADIO_RECEIVE:
                return 100
            case Tid.TID_SENSOR_TIMER:
                return 110
            case Tid.TID_SENSOR_START_PAGE:
                return 108
            case Tid.TID_SENSOR_CUP_X_WRITTEN:
                return 200
            case Tid.TID_SENSOR_CUP_Y_WRITTEN:
                return 201
            case Tid.TID_SENSOR_CUP_Z_WRITTEN:
                return 202
            // Robot car
            case Tid.TID_SENSOR_CAR_WALL:
                return 300
            case Tid.TID_SENSOR_LINE:
                return 301
            // Jacdac
            case Tid.TID_SENSOR_SLIDER:
                return 500
            case Tid.TID_SENSOR_ROTARY:
                return 501
            case Tid.TID_SENSOR_LIGHT:
                return 502
            case Tid.TID_SENSOR_ROTARY:
                return 503
            case Tid.TID_SENSOR_REFLECTED:
                return 504
            case Tid.TID_SENSOR_DISTANCE:
                return 505
            case Tid.TID_SENSOR_MOISTURE:
                return 506

            case Tid.TID_ACTUATOR_PAINT:
                return 10
            case Tid.TID_ACTUATOR_SHOW_NUMBER:
                return 15
            case Tid.TID_ACTUATOR_SPEAKER:
                return 20
            case Tid.TID_ACTUATOR_MUSIC:
                return 22
            case Tid.TID_ACTUATOR_RADIO_SEND:
                return 100
            case Tid.TID_ACTUATOR_RADIO_SET_GROUP:
                return 105
            case Tid.TID_ACTUATOR_SWITCH_PAGE:
                return 110
            case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
                return 200
            case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
                return 201
            case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
                return 202
            // car
            case Tid.TID_ACTUATOR_CAR:
                return 500
            // jacdac
            case Tid.TID_ACTUATOR_RGB_LED:
                return 600
            case Tid.TID_ACTUATOR_SERVO_POWER:
                return 601
            case Tid.TID_ACTUATOR_SERVO_SET_ANGLE:
                return 602
            case Tid.TID_ACTUATOR_RELAY:
                return 603
        }
        return 1000
    }

    const only5 = [
        Tid.TID_FILTER_COIN_1,
        Tid.TID_FILTER_COIN_2,
        Tid.TID_FILTER_COIN_3,
        Tid.TID_FILTER_COIN_4,
        Tid.TID_FILTER_COIN_5,
    ]

    export function getConstraints(tile: Tile): Constraints {
        const tid = getTid(tile)
        switch (tid) {
            case Tid.TID_SENSOR_PRESS:
            case Tid.TID_SENSOR_RELEASE:
                return { allow: ["press_event"] }
            case Tid.TID_SENSOR_START_PAGE:
                return { allow: ["timespan"] }
            case Tid.TID_SENSOR_CUP_X_WRITTEN:
                return {
                    allow: ["value_in", "comparison"],
                    disallow: [Tid.TID_FILTER_CUP_X_READ],
                }
            case Tid.TID_SENSOR_CUP_Y_WRITTEN:
                return {
                    allow: ["value_in", "comparison"],
                    disallow: [Tid.TID_FILTER_CUP_Y_READ],
                }
            case Tid.TID_SENSOR_CUP_Z_WRITTEN:
                return {
                    allow: ["value_in", "comparison"],
                    disallow: [Tid.TID_FILTER_CUP_Z_READ],
                }
            case Tid.TID_SENSOR_RADIO_RECEIVE:
                return {
                    allow: ["value_in", "comparison"],
                    provides: [Tid.TID_SENSOR_RADIO_RECEIVE],
                }
            case Tid.TID_SENSOR_SLIDER:
            case Tid.TID_SENSOR_CAR_WALL:
            case Tid.TID_SENSOR_MAGNET:
            case Tid.TID_SENSOR_LIGHT:
            case Tid.TID_SENSOR_LED_LIGHT:
            case Tid.TID_SENSOR_DISTANCE:
            case Tid.TID_SENSOR_MOISTURE:
                return { allow: only5 }
            case Tid.TID_SENSOR_REFLECTED:
                // return { allow: only5 }
                return { allow: ["on_off_event"] }
            case Tid.TID_SENSOR_MICROPHONE:
                return {
                    allow: only5.concat([
                        Tid.TID_FILTER_LOUD,
                        Tid.TID_FILTER_QUIET,
                    ]),
                }
            case Tid.TID_SENSOR_TEMP:
                return { allow: ["temperature_event"] }
            case Tid.TID_SENSOR_ROTARY:
                return { allow: ["rotary_event"] }
            case Tid.TID_SENSOR_LINE:
                return { allow: ["line"] }
            case Tid.TID_SENSOR_TIMER:
                return { allow: ["timespan"] }
            case Tid.TID_SENSOR_ACCELEROMETER:
                return { allow: ["accel_event"] }
            case Tid.TID_ACTUATOR_PAINT:
                return { allow: ["icon_editor", "loop"] }
            case Tid.TID_ACTUATOR_SPEAKER:
                return { allow: ["sound_emoji", "loop"] }
            case Tid.TID_ACTUATOR_MUSIC:
                return { allow: ["melody_editor", "loop"] }
            case Tid.TID_ACTUATOR_RADIO_SEND:
            case Tid.TID_ACTUATOR_SHOW_NUMBER:
            case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
            case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
            case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
                return { allow: ["value_out", "constant"] }
            case Tid.TID_ACTUATOR_RGB_LED:
                return { allow: ["rgb_led", "loop"] }
            case Tid.TID_ACTUATOR_SERVO_SET_ANGLE:
            case Tid.TID_ACTUATOR_RADIO_SET_GROUP:
            case Tid.TID_MODIFIER_LOOP:
                return { only: ["constant"] }
            case Tid.TID_ACTUATOR_SWITCH_PAGE:
                return { allow: ["page"] }
            case Tid.TID_ACTUATOR_CAR:
                return { allow: ["car"] }
            case Tid.TID_MODIFIER_RADIO_VALUE:
                return { requires: [Tid.TID_SENSOR_RADIO_RECEIVE] }
            case Tid.TID_MODIFIER_RANDOM_TOSS:
                return {
                    allow: ["constant"],
                    disallow: ["value_out", "math_not_add"],
                }
            case Tid.TID_ACTUATOR_RELAY:
            case Tid.TID_ACTUATOR_SERVO_POWER:
                return { allow: ["on_off"] }
        }
        return undefined
    }

    export function getCategory(tile: Tile): string {
        const tid = getTid(tile)
        if (isPressReleaseEvent(tid)) return "press_event"
        if (isLineEvent(tid)) return "line"
        if (isTimespan(tid)) return "timespan"
        if (isAccelerometerEvent(tid)) return "accel_event"
        if (isEmoji(tid)) return "sound_emoji"
        if (isComparisonOperator(tid)) return "comparison"
        if (isFilterConstant(tid) || isFilterVariable(tid)) return "value_in"
        if (isModifierConstant(tid)) return "constant"
        if (isModifierVariable(tid) || isMathOperator(tid)) return "value_out"
        if (isPage(tid)) return "page"
        if (isCarModifier(tid)) return "car"
        if (isLedModifier(tid)) return "rgb_led"
        switch (tid) {
            case Tid.TID_FILTER_ON:
            case Tid.TID_FILTER_OFF:
                return "on_off_event"
            case Tid.TID_MODIFIER_ON:
            case Tid.TID_MODIFIER_OFF:
                return "on_off"
            case Tid.TID_FILTER_ROTARY_LEFT:
            case Tid.TID_FILTER_ROTARY_RIGHT:
                return "rotary_event"
            case Tid.TID_FILTER_TEMP_WARMER:
            case Tid.TID_FILTER_TEMP_COLDER:
                return "temperature_event"
            case Tid.TID_FILTER_LOUD:
            case Tid.TID_FILTER_QUIET: // dead
                return "sound_event"
            case Tid.TID_MODIFIER_LOOP:
                return "loop"
            case Tid.TID_MODIFIER_ICON_EDITOR:
                return "icon_editor"
            case Tid.TID_MODIFIER_MELODY_EDITOR:
                return "melody_editor"
            case Tid.TID_MODIFIER_RANDOM_TOSS:
            case Tid.TID_MODIFIER_TEMP_READ:
            case Tid.TID_MODIFIER_RADIO_VALUE:
                return "value_out"
            case Tid.TID_OPERATOR_DIVIDE:
            case Tid.TID_OPERATOR_MINUS:
            case Tid.TID_OPERATOR_MULTIPLY:
                return "math_not_add"
        }
        return undefined
    }

    export enum TileKind {
        Literal = 1, // value is P
        Variable, // value is variables[P]
        Page, // value is page[P]
        EventCode,
        Timespan,
        RadioValue,
        Temperature,

        // Filter/actuator kinds
        Radio, // radio send/recv
        RandomToss, // random number
        NumFmt, // on actuator - P is numfmt
        Sequence,
    }

    export function getKind(tile: Tile): TileKind {
        const tid = getTid(tile)
        if (
            isLineEvent(tid) ||
            isFilterConstant(tid) ||
            isModifierConstant(tid) ||
            tid == Tid.TID_MODIFIER_ON ||
            tid == Tid.TID_MODIFIER_OFF
        )
            return TileKind.Literal
        if (isTimespan(tid)) return TileKind.Timespan
        if (isPage(tid)) return TileKind.Page
        if (isCarModifier(tid)) return TileKind.NumFmt
        switch (tid) {
            case Tid.TID_SENSOR_RADIO_RECEIVE:
            case Tid.TID_SENSOR_CAR_WALL:
            case Tid.TID_SENSOR_LINE:
                return TileKind.Radio
            case Tid.TID_MODIFIER_RADIO_VALUE:
                return TileKind.RadioValue
            case Tid.TID_SENSOR_TEMP:
            case Tid.TID_MODIFIER_TEMP_READ:
                return TileKind.Temperature
            case Tid.TID_MODIFIER_RANDOM_TOSS:
                return TileKind.RandomToss
            case Tid.TID_FILTER_ROTARY_LEFT:
            case Tid.TID_FILTER_ROTARY_RIGHT:
            case Tid.TID_FILTER_TEMP_WARMER:
            case Tid.TID_FILTER_TEMP_COLDER:
            case Tid.TID_FILTER_ACCEL_SHAKE:
            case Tid.TID_FILTER_ACCEL_TILT_UP:
            case Tid.TID_FILTER_ACCEL_TILT_DOWN:
            case Tid.TID_FILTER_ACCEL_TILT_LEFT:
            case Tid.TID_FILTER_ACCEL_TILT_RIGHT:
            case Tid.TID_FILTER_ACCEL_FACE_DOWN:
            case Tid.TID_FILTER_ACCEL_FACE_UP:
            case Tid.TID_FILTER_LOUD:
            case Tid.TID_FILTER_QUIET:
            case Tid.TID_FILTER_ON:
            case Tid.TID_FILTER_OFF:
            case Tid.TID_FILTER_BUTTON_A:
            case Tid.TID_FILTER_BUTTON_B:
            case Tid.TID_FILTER_LOGO:
            case Tid.TID_FILTER_PIN_0:
            case Tid.TID_FILTER_PIN_1:
            case Tid.TID_FILTER_PIN_2:
                return TileKind.EventCode
            case Tid.TID_ACTUATOR_PAINT:
            case Tid.TID_ACTUATOR_SPEAKER:
            case Tid.TID_ACTUATOR_MUSIC:
            case Tid.TID_ACTUATOR_RGB_LED:
            case Tid.TID_ACTUATOR_CAR:
                return TileKind.Sequence
            case Tid.TID_ACTUATOR_RADIO_SEND:
            case Tid.TID_ACTUATOR_RADIO_SET_GROUP:
            case Tid.TID_ACTUATOR_SERVO_SET_ANGLE:
            case Tid.TID_ACTUATOR_RELAY:
            case Tid.TID_ACTUATOR_SERVO_POWER:
                return TileKind.NumFmt
            case Tid.TID_SENSOR_CUP_X_WRITTEN:
            case Tid.TID_SENSOR_CUP_Y_WRITTEN:
            case Tid.TID_SENSOR_CUP_Z_WRITTEN:
            case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
            case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
            case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
            case Tid.TID_FILTER_CUP_X_READ:
            case Tid.TID_FILTER_CUP_Y_READ:
            case Tid.TID_FILTER_CUP_Z_READ:
            case Tid.TID_MODIFIER_CUP_X_READ:
            case Tid.TID_MODIFIER_CUP_Y_READ:
            case Tid.TID_MODIFIER_CUP_Z_READ:
                return TileKind.Variable
        }
        return undefined
    }

    export function getParam(tile: Tile): any {
        const tid = getTid(tile)
        if (isModifierConstant(tid)) return tid - Tid.TID_MODIFIER_COIN_1 + 1
        if (isFilterConstant(tid)) return tid - Tid.TID_FILTER_COIN_1 + 1
        if (isPage(tid)) return tid - Tid.TID_MODIFIER_PAGE_1 + 1
        if (isLedColor(tid)) return "led_solid"
        if (isCarModifier(tid)) return jacs.NumFmt.F64
        if (isAccelerometerEvent(tid) || isPressReleaseEvent(tid)) return tid
        switch (tid) {
            case Tid.TID_SENSOR_CUP_X_WRITTEN:
            case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
            case Tid.TID_FILTER_CUP_X_READ:
            case Tid.TID_MODIFIER_CUP_X_READ:
                return "cup_x"
            case Tid.TID_SENSOR_CUP_Y_WRITTEN:
            case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
            case Tid.TID_FILTER_CUP_Y_READ:
            case Tid.TID_MODIFIER_CUP_Y_READ:
                return "cup_y"
            case Tid.TID_SENSOR_CUP_Z_WRITTEN:
            case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
            case Tid.TID_FILTER_CUP_Z_READ:
            case Tid.TID_MODIFIER_CUP_Z_READ:
                return "cup_z"
            //
            case Tid.TID_FILTER_ROTARY_LEFT:
            case Tid.TID_FILTER_TEMP_COLDER:
            case Tid.TID_FILTER_OFF:
                return SensorChange.Down
            //
            case Tid.TID_FILTER_ROTARY_RIGHT:
            case Tid.TID_FILTER_TEMP_WARMER:
            case Tid.TID_FILTER_ON:
                return SensorChange.Up
            //
            case Tid.TID_MODIFIER_ON:
                return SensorChange.Up
            case Tid.TID_MODIFIER_OFF:
                return SensorChange.Down
            //
            case Tid.TID_FILTER_LINE_BOTH:
                return robot.robots.RobotCompactCommand.LineBoth
            case Tid.TID_FILTER_LINE_LEFT:
                return robot.robots.RobotCompactCommand.LineLeft
            case Tid.TID_FILTER_LINE_RIGHT:
                return robot.robots.RobotCompactCommand.LineRight
            case Tid.TID_FILTER_LINE_NEITHER:
                return robot.robots.RobotCompactCommand.LineNone
            case Tid.TID_FILTER_LINE_NEITHER_LEFT:
                return robot.robots.RobotCompactCommand.LineLostLeft
            case Tid.TID_FILTER_LINE_NEITHER_RIGHT:
                return robot.robots.RobotCompactCommand.LineLostRight
            //
            case Tid.TID_FILTER_TIMESPAN_SHORT:
                return 250
            case Tid.TID_FILTER_TIMESPAN_LONG:
                return 1000
            case Tid.TID_FILTER_TIMESPAN_VERY_LONG:
                return 5000
            case Tid.TID_FILTER_TIMESPAN_RANDOM:
                return -1000
            //
            case Tid.TID_ACTUATOR_SERVO_SET_ANGLE:
                return jacs.NumFmt.I32
            case Tid.TID_ACTUATOR_RELAY:
            case Tid.TID_ACTUATOR_SERVO_POWER:
                return jacs.NumFmt.U32
        }
        return tid
    }

    export function getParam2(tile: Tile): number {
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

            case Tid.TID_MODIFIER_RGB_LED_COLOR_1:
                return 0x2f0000
            case Tid.TID_MODIFIER_RGB_LED_COLOR_2:
                return 0x002f00
            case Tid.TID_MODIFIER_RGB_LED_COLOR_3:
                return 0x00002f
            case Tid.TID_MODIFIER_RGB_LED_COLOR_4:
                return 0x2f002f
            case Tid.TID_MODIFIER_RGB_LED_COLOR_5:
                return 0x2f2f00
            case Tid.TID_MODIFIER_RGB_LED_COLOR_6:
                return 0x000000
            case Tid.TID_MODIFIER_ICON_EDITOR:
                return 400 // ms
            case Tid.TID_MODIFIER_MELODY_EDITOR:
                return 250 // ms
        }
        return undefined
    }

    export function defaultEventCode(tile: Tile) {
        const tid = getTid(tile)
        switch (tid) {
            case Tid.TID_SENSOR_TEMP:
            case Tid.TID_SENSOR_LINE: // TODO: generalize from Jacdac
            case Tid.TID_SENSOR_REFLECTED:
            case Tid.TID_SENSOR_MICROPHONE:
                return SensorChange.Up
            case Tid.TID_SENSOR_ACCELEROMETER:
            case Tid.TID_SENSOR_PRESS:
            case Tid.TID_SENSOR_RELEASE:
            case Tid.TID_SENSOR_RADIO_RECEIVE:
                return -1 // any
            default:
                return undefined
        }
    }

    export function jdExternalClass(tile: Tile) {
        const tid = getTid(tile)
        switch (tid) {
            case Tid.TID_FILTER_KITA_KEY_1:
            case Tid.TID_FILTER_KITA_KEY_2:
                return jacs.ServiceClass.Button
            case Tid.TID_SENSOR_SLIDER:
                return jacs.ServiceClass.Potentiometer
            case Tid.TID_SENSOR_MAGNET:
                return jacs.ServiceClass.MagneticFieldLevel
            case Tid.TID_SENSOR_LIGHT:
                return jacs.ServiceClass.LightLevel
            case Tid.TID_SENSOR_ROTARY:
                return jacs.ServiceClass.RotaryEncoder
            case Tid.TID_ACTUATOR_RGB_LED:
                return jacs.ServiceClass.Led
            case Tid.TID_ACTUATOR_SERVO_SET_ANGLE:
            case Tid.TID_ACTUATOR_SERVO_POWER:
                return jacs.ServiceClass.Servo
            case Tid.TID_ACTUATOR_RELAY:
                return jacs.ServiceClass.Relay
            case Tid.TID_SENSOR_MOISTURE:
                return jacs.ServiceClass.Moisture
            case Tid.TID_SENSOR_DISTANCE:
                return jacs.ServiceClass.Distance
            case Tid.TID_SENSOR_REFLECTED:
                return jacs.ServiceClass.Reflected
            default:
                return undefined
        }
    }

    export function serviceClassName(tile: Tile): jacs.ServiceClass {
        const tid = getTid(tile)
        switch (tid) {
            case Tid.TID_SENSOR_PRESS:
            case Tid.TID_SENSOR_RELEASE:
                return jacs.ServiceClass.Button
            case Tid.TID_SENSOR_TEMP:
                return jacs.ServiceClass.Temperature
            case Tid.TID_SENSOR_RADIO_RECEIVE:
            case Tid.TID_ACTUATOR_RADIO_SEND:
            case Tid.TID_ACTUATOR_RADIO_SET_GROUP:
            case Tid.TID_SENSOR_LINE:
            case Tid.TID_SENSOR_CAR_WALL:
            case Tid.TID_ACTUATOR_CAR:
                return jacs.ServiceClass.Radio
            case Tid.TID_SENSOR_SLIDER:
                return jacs.ServiceClass.Potentiometer
            case Tid.TID_SENSOR_MAGNET:
                return jacs.ServiceClass.MagneticFieldLevel
            case Tid.TID_SENSOR_LIGHT:
            case Tid.TID_SENSOR_LED_LIGHT:
                return jacs.ServiceClass.LightLevel
            case Tid.TID_SENSOR_ROTARY:
                return jacs.ServiceClass.RotaryEncoder
            case Tid.TID_SENSOR_ACCELEROMETER:
                return jacs.ServiceClass.Accelerometer
            case Tid.TID_SENSOR_MICROPHONE:
                return jacs.ServiceClass.SoundLevel
            case Tid.TID_ACTUATOR_PAINT:
            case Tid.TID_ACTUATOR_SHOW_NUMBER:
                return jacs.ServiceClass.DotMatrix
            case Tid.TID_ACTUATOR_SPEAKER:
                return jacs.ServiceClass.SoundPlayer
            case Tid.TID_ACTUATOR_MUSIC:
                return jacs.ServiceClass.Buzzer
            case Tid.TID_ACTUATOR_RGB_LED:
                return jacs.ServiceClass.Led
            case Tid.TID_ACTUATOR_SERVO_SET_ANGLE:
            case Tid.TID_ACTUATOR_SERVO_POWER:
                return jacs.ServiceClass.Servo
            case Tid.TID_ACTUATOR_RELAY:
                return jacs.ServiceClass.Relay
            case Tid.TID_SENSOR_DISTANCE:
                return jacs.ServiceClass.Distance
            case Tid.TID_SENSOR_REFLECTED:
                return jacs.ServiceClass.Reflected
            case Tid.TID_SENSOR_MOISTURE:
                return jacs.ServiceClass.Moisture
            default:
                return undefined
        }
    }

    /* TODO: don't need this low-level approach, but need to recall which JD we support
    export function serviceCommand(tile: Tile) {
        const tid = getTid(tile)
        switch (tid) {
            case Tid.TID_ACTUATOR_PAINT:
            case Tid.TID_ACTUATOR_RGB_LED:
            case Tid.TID_ACTUATOR_SERVO_SET_ANGLE:
                return jacs.CMD_SET_REG | 0x2
            case Tid.TID_ACTUATOR_RELAY:
            case Tid.TID_ACTUATOR_SERVO_POWER:
                return jacs.CMD_SET_REG | 0x1
            case Tid.TID_ACTUATOR_SPEAKER:
            case Tid.TID_ACTUATOR_MUSIC:
                return 0x80
            case Tid.TID_ACTUATOR_CAR:
            case Tid.TID_ACTUATOR_RADIO_SEND:
                return 0x81
            case Tid.TID_ACTUATOR_RADIO_SET_GROUP:
                return jacs.CMD_SET_REG | 0x80
            default:
                return undefined
        }
    }
    */
}
