namespace microgui {
    import AppInterface = user_interface_base.AppInterface
    import Scene = user_interface_base.Scene
    import CursorScene = user_interface_base.CursorScene
    import CursorSceneWithPriorPage = user_interface_base.CursorSceneWithPriorPage
    import GridNavigator = user_interface_base.GridNavigator
    import ButtonStyles = user_interface_base.ButtonStyles
    import Screen = user_interface_base.Screen
    import Button = user_interface_base.Button
    import font = user_interface_base.font

    abstract class AbstractInputMethod extends Scene {
        protected titleText: string

        upBtnPressed() {}
        downBtnPressed() {}
        leftBtnPressed() {}
        rightBtnPressed() {}
        aBtnPressed() {}
        bBtnPressed() {}

        draw() {
            screen().fillRect(
                0,
                0,
                screen().width,
                screen().height,
                this.backgroundColor
            )

            screen().printCenter(this.titleText, 4)
        }
    }

    export class TickerMenu extends AbstractInputMethod {
        private tickerValues: number[]
        private tickerIncrements: number[]
        private currentTickerIndex: number

        private next: (arg0: number[]) => void
        private back: () => void

        constructor(
            app: AppInterface,
            titleText: string,
            defaultTickerValues: number[],
            backgroundColor?: number,
            next?: (arg0: number[]) => void,
            back?: () => void
        ) {
            super(app, "TickerMenu")

            this.backgroundColor = backgroundColor != null ? backgroundColor : 3

            this.titleText = titleText

            this.tickerValues = defaultTickerValues
            this.tickerIncrements = this.tickerValues.map(_ => 1)
            this.currentTickerIndex = 0

            this.next = next
            this.back = back

            control.onEvent(
                ControllerButtonEvent.Pressed,
                controller.left.id,
                () => this.leftBtnPressed()
            )

            control.onEvent(
                ControllerButtonEvent.Pressed,
                controller.right.id,
                () => this.rightBtnPressed()
            )

            control.onEvent(
                ControllerButtonEvent.Pressed,
                controller.up.id,
                () => this.upBtnPressed()
            )

            control.onEvent(
                ControllerButtonEvent.Pressed,
                controller.down.id,
                () => this.downBtnPressed()
            )

            control.onEvent(
                ControllerButtonEvent.Pressed,
                controller.A.id,
                () => this.aBtnPressed()
            )

            control.onEvent(
                ControllerButtonEvent.Pressed,
                controller.B.id,
                () => this.bBtnPressed()
            )
        }

        upBtnPressed() {
            let tick = true
            control.onEvent(
                ControllerButtonEvent.Released,
                controller.up.id,
                () => (tick = false)
            )
            while (tick) {
                this.tickerValues[this.currentTickerIndex] += 1
                basic.pause(100)
            }
            control.onEvent(
                ControllerButtonEvent.Released,
                controller.up.id,
                () => {}
            )
        }

        downBtnPressed() {
            let tick = true
            control.onEvent(
                ControllerButtonEvent.Released,
                controller.down.id,
                () => (tick = false)
            )
            while (tick) {
                this.tickerValues[this.currentTickerIndex] -= 1
                basic.pause(100)
            }
            control.onEvent(
                ControllerButtonEvent.Released,
                controller.down.id,
                () => {}
            )
        }

        leftBtnPressed() {
            this.currentTickerIndex =
                (((this.currentTickerIndex - 1) %
                    this.tickerIncrements.length) +
                    this.tickerIncrements.length) %
                this.tickerIncrements.length
        }

        rightBtnPressed() {
            this.currentTickerIndex =
                (this.currentTickerIndex + 1) % this.tickerIncrements.length
        }

        aBtnPressed() {
            if (this.next != null) this.next(this.tickerValues)
        }

        bBtnPressed() {
            if (this.back != null) this.back()
        }

        draw() {
            super.draw()

            const xDiff = screen().width / (this.tickerValues.length + 1)

            for (let i = 0; i < this.tickerValues.length; i++) {
                const value: string = "" + this.tickerValues[i]
                screen().print(
                    value,
                    (i + 1) * xDiff - 3,
                    screen().height / 2,
                    0
                )

                screen().fillTriangle(
                    (i + 1) * xDiff - 4,
                    screen().height / 2 - 2,
                    (i + 1) * xDiff -
                        4 +
                        (font.charWidth * value.length + 1) +
                        1,
                    screen().height / 2 - 2,
                    (i + 1) * xDiff -
                        4 +
                        (font.charWidth * value.length + 1) / 2 +
                        1,
                    screen().height / 2 - 7,
                    5
                )

                screen().fillTriangle(
                    (i + 1) * xDiff - 4,
                    screen().height / 2 + 9,
                    (i + 1) * xDiff -
                        4 +
                        (font.charWidth * value.length + 1) +
                        1,
                    screen().height / 2 + 9,
                    (i + 1) * xDiff -
                        4 +
                        (font.charWidth * value.length + 1) / 2 +
                        1,
                    screen().height / 2 + 14,
                    5
                )
            }
        }
    }

    export enum KeyboardLayouts {
        QWERTY,
        NUMERIC,
    }

    interface IKeyboard {
        appendText(txt: string): void
        deletePriorCharacters(n: number): void
        swapCase(): void
        nextScene(): void
        textLen(): number
        getText(): string
        shakeText(): void
    }

    type KeyboardBtnFn = (btn: Button, kb: IKeyboard) => void
    type SpecialBtnData = {
        btnRow: number
        btnCol: number
        behaviour: (btn: Button, kb: IKeyboard) => void
    }
    type KeyboardLayoutData = {
        [id: number]: {
            btnTexts: string[][]
            defaultBtnBehaviour: KeyboardBtnFn
            specialBtnBehaviours: SpecialBtnData[]
        }
    }

    const __keyboardLayout: KeyboardLayoutData = {
        [KeyboardLayouts.QWERTY]: {
            btnTexts: [
                ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
                ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
                ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"],
                ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
                ["<-", "^", " _______ ", "ENTER"],
            ],
            defaultBtnBehaviour: (btn: Button, kb: IKeyboard) => {
                kb.appendText(btn.state[0])
            },
            specialBtnBehaviours: [
                {
                    btnRow: 4,
                    btnCol: 0,
                    behaviour: (btn: Button, kb: IKeyboard) =>
                        kb.deletePriorCharacters(1),
                }, // Backspace
                {
                    btnRow: 4,
                    btnCol: 1,
                    behaviour: (btn: Button, kb: IKeyboard) => kb.swapCase(),
                }, // Change case
                {
                    btnRow: 4,
                    btnCol: 2,
                    behaviour: (btn: Button, kb: IKeyboard) =>
                        kb.appendText(" "),
                }, // Spacebar
                {
                    btnRow: 4,
                    btnCol: 3,
                    behaviour: (btn: Button, kb: IKeyboard) => kb.nextScene(),
                }, // ENTER
            ],
        },

        /**
         * Ensures that the user inputs result in a valid number.
         * E.g: prevents two decimal places, - only at start, etc
         */
        [KeyboardLayouts.NUMERIC]: {
            btnTexts: [
                ["0", "1", "2", "3", "4"],
                ["5", "6", "7", "8", "9"],
                ["<-", "-", ".", "ENTER"],
            ],
            defaultBtnBehaviour: (btn: Button, kb: IKeyboard) => {
                kb.appendText(btn.state[0])
            },
            specialBtnBehaviours: [
                {
                    btnRow: 2,
                    btnCol: 0,
                    behaviour: (btn: Button, kb: IKeyboard) =>
                        kb.deletePriorCharacters(1),
                }, // Backspace
                {
                    btnRow: 2,
                    btnCol: 1,
                    behaviour: (btn: Button, kb: IKeyboard) => {
                        if (kb.textLen() == 0) kb.appendText(btn.state[0])
                        else kb.shakeText()
                    },
                }, // Add a "-", but only if first symbol,
                {
                    btnRow: 2,
                    btnCol: 2,
                    behaviour: (btn: Button, kb: IKeyboard) => {
                        const txt = kb.getText()
                        const len = txt.length
                        const decimalAlreadyPresent = txt.includes(".")
                        if (
                            len == 0 ||
                            txt[len - 1] == "-" ||
                            decimalAlreadyPresent
                        )
                            kb.shakeText()
                        else kb.appendText(".")
                    },
                }, // Decimal point
                {
                    btnRow: 2,
                    btnCol: 3,
                    behaviour: (btn: Button, kb: IKeyboard) => {
                        const txt = kb.getText()
                        const len = txt.length
                        if (
                            len > 0 &&
                            txt[len - 1] != "-" &&
                            txt[len - 1] != "."
                        )
                            // Last rule could be removed, casting "1." to number is valid.
                            kb.nextScene()
                        else kb.shakeText()
                    },
                }, // ENTER
            ],
        },
    }

    // TODO: need exit on B or Enter

    export class Keyboard extends CursorScene implements IKeyboard {
        private btns: Button[][]
        private text: string
        private isUpperCase: boolean
        private nextBtnFn: (keyboardText: string) => void
        private keyboardLayout: KeyboardLayouts
        private maxTxtLength: number

        /** This is just the region with buttons; this Keyboard Scene takes up the entire screen. This keyboardBounds doesn't include the text display. */
        private keyboardBounds: user_interface_base.Bounds

        // Special effects:
        private frameCounter: number
        private shakingText: boolean
        private shakeTextCounter: number
        private shakeStrength: number = 5

        private readonly FRAME_COUNTER_CURSOR_ON = 20
        private readonly FRAME_COUNTER_CURSOR_OFF = 60
        private readonly MAX_TEXT_LENGTH = 22

        private foregroundColor: number

        constructor(opts: {
            app: AppInterface
            layout: KeyboardLayouts
            cb: (keyboardText: string) => void
            init?: number
            foregroundColor?: number
            backgroundColor?: number
            maxTxtLength?: number
        }) {
            super(opts.app, new GridNavigator([[]])) // GridNavigator setup in startup()
            this.text = opts.init ? opts.init.toString() : ""
            this.isUpperCase = true
            this.maxTxtLength = opts.maxTxtLength
                ? Math.min(opts.maxTxtLength, this.MAX_TEXT_LENGTH)
                : this.MAX_TEXT_LENGTH

            this.nextBtnFn = opts.cb
            this.frameCounter = 0
            this.shakingText = false
            this.shakeTextCounter = 0

            this.keyboardLayout = opts.layout

            this.keyboardBounds = new user_interface_base.Bounds({
                width: Screen.WIDTH - 8,
                height: 72,
                top: Screen.TOP_EDGE + 44,
                left: Screen.LEFT_EDGE + 4,
            })

            this.foregroundColor = opts.foregroundColor
                ? opts.foregroundColor
                : 4 // Default to orange
            this.backgroundColor = opts.backgroundColor
                ? opts.backgroundColor
                : 6 // Default to blue
        }

        startup() {
            super.startup()

            const data = __keyboardLayout[this.keyboardLayout]
            this.btns = data.btnTexts.map(_ => [])

            const charWidth = bitmaps.font8.charWidth
            const charHeight = bitmaps.font8.charHeight

            const ySpacing =
                (this.keyboardBounds.height - charHeight) / data.btnTexts.length

            for (let row = 0; row < data.btnTexts.length; row++) {
                const bitmapWidths = data.btnTexts[row].map(
                    (txt: string) => charWidth * (txt.length + 1) - 4
                )
                const totalWidth: number = bitmapWidths.reduce(
                    (total: number, w: number) => total + w,
                    0
                )

                const xSpacing =
                    (this.keyboardBounds.width - totalWidth) /
                    (bitmapWidths.length + 2)

                let x = -Screen.HALF_WIDTH + xSpacing
                for (let col = 0; col < data.btnTexts[row].length; col++) {
                    const bitmapWidth = bitmapWidths[col]
                    x += (bitmapWidths[col] + xSpacing) >> 1
                    this.btns[row][col] = new Button({
                        parent: null,
                        style: ButtonStyles.Transparent,
                        icon: bitmaps.create(bitmapWidth, charHeight),
                        ariaId: "",
                        x,
                        y: -(charHeight >> 1) + ySpacing * row,
                        onClick: (btn: Button) =>
                            data.defaultBtnBehaviour(btn, this),
                        state: [data.btnTexts[row][col]],
                    })
                    x += (bitmapWidths[col] + xSpacing) >> 1
                }
            }

            // Setup special btn behaviours:
            data.specialBtnBehaviours.forEach((data: SpecialBtnData, i) => {
                this.btns[data.btnRow][data.btnCol].onClick = (btn: Button) =>
                    data.behaviour(btn, this)
            })
            this.navigator.setBtns(this.btns)
        }

        //-------------------
        // Interface Methods:
        //-------------------

        public appendText(str: string) {
            if (this.textLen() < this.maxTxtLength) {
                this.frameCounter = KEYBOARD_FRAME_COUNTER_CURSOR_ON
                this.text += str
            } else {
                this.shakingText = true
            }
        }

        public deletePriorCharacters(n: number) {
            this.text =
                this.text.length > 0
                    ? this.text.substr(0, this.text.length - n)
                    : this.text
            this.frameCounter = KEYBOARD_FRAME_COUNTER_CURSOR_ON
        }

        public swapCase(): void {
            this.isUpperCase = !this.isUpperCase

            const swapCaseFn = this.isUpperCase
                ? (t: string) => {
                      return t.toUpperCase()
                  }
                : (t: string) => {
                      return t.toLowerCase()
                  }

            const specialBtnData: SpecialBtnData[] =
                __keyboardLayout[this.keyboardLayout].specialBtnBehaviours
            const specialBtnRows: number[] = specialBtnData.map(
                (sbd: SpecialBtnData) => sbd.btnRow
            )
            const specialBtnCols: number[] = specialBtnData.map(
                (sbd: SpecialBtnData) => sbd.btnCol
            )

            const isSpecialBtn = (row: number, col: number): boolean => {
                return (
                    specialBtnRows.indexOf(row) != -1 &&
                    specialBtnRows.indexOf(col) != -1
                )
            }

            // Skip special char row:
            for (let i = 0; i < this.btns.length - 1; i++) {
                for (let j = 0; j < this.btns[i].length; j++) {
                    if (!isSpecialBtn) continue

                    const btnText: string = this.btns[i][j].state[0] as string
                    this.btns[i][j].state[0] = swapCaseFn(btnText)
                }
            }
        }

        public getText() {
            return this.text
        }

        public textLen() {
            return this.text.length
        }

        public nextScene(): void {
            this.nextBtnFn(this.text)
        }

        public shakeText(): void {
            this.shakingText = true
        }

        draw() {
            this.frameCounter += 1

            const charWidth = bitmaps.font8.charWidth
            const charHeight = bitmaps.font8.charHeight

            const white = 1
            const black = 15

            // Blue base colour:
            Screen.fillRect(
                Screen.LEFT_EDGE,
                Screen.TOP_EDGE,
                Screen.WIDTH,
                Screen.HEIGHT,
                this.backgroundColor
            )

            // Black border around the text window for depth
            Screen.fillRect(
                Screen.LEFT_EDGE + 3,
                Screen.TOP_EDGE + 4,
                Screen.WIDTH - 7,
                34,
                black
            )

            // White text window, slightly smaller than the black
            Screen.fillRect(
                Screen.LEFT_EDGE + 6,
                Screen.TOP_EDGE + 6,
                Screen.WIDTH - 12,
                32,
                white
            )

            const txtXpos = (this.text.length * charWidth) >> 1
            const txtYPos = 17

            // Don't draw the cursor if beyond the max length, shake the text a bit:
            if (this.shakingText) {
                if (this.shakeTextCounter % 5 == 0) {
                    screen().print(
                        this.text,
                        Screen.HALF_WIDTH - txtXpos - this.shakeStrength,
                        txtYPos,
                        black
                    )
                } else {
                    screen().print(
                        this.text,
                        Screen.HALF_WIDTH - txtXpos,
                        txtYPos,
                        black
                    )
                }

                if (this.shakeTextCounter >= 5) {
                    this.shakingText = false
                    this.shakeTextCounter = 0
                } else {
                    this.shakeTextCounter += 1
                }
            } else {
                // At max-length, done shaking the text
                screen().printCenter(this.text, txtYPos, black)

                if (this.frameCounter >= this.FRAME_COUNTER_CURSOR_ON) {
                    screen().print(
                        "_",
                        Screen.HALF_WIDTH + txtXpos,
                        txtYPos,
                        black
                    )

                    if (this.frameCounter >= this.FRAME_COUNTER_CURSOR_OFF)
                        this.frameCounter = 0
                }
            }

            // Orange Keyboard with a black shadow on the bot & right edge (depth effect):

            // Black border around right & bot edge:
            Screen.fillRect(
                this.keyboardBounds.left,
                this.keyboardBounds.top,
                this.keyboardBounds.width + 2,
                this.keyboardBounds.height + 2,
                black
            )

            // Orange keyboard that the white text will be ontop of:
            Screen.fillRect(
                this.keyboardBounds.left,
                this.keyboardBounds.top,
                this.keyboardBounds.width,
                this.keyboardBounds.height,
                this.foregroundColor
            )

            for (let i = 0; i < this.btns.length; i++) {
                for (let j = 0; j < this.btns[i].length; j++) {
                    const btn = this.btns[i][j]
                    const btnText = btn.state[0]

                    const x =
                        screen().width / 2 +
                        btn.xfrm.localPos.x -
                        btn.icon.width / 2 +
                        1
                    const y =
                        screen().height / 2 +
                        btn.xfrm.localPos.y +
                        charHeight -
                        12

                    btn.draw()
                    screen().print(btnText, x, y, white)
                }
            }

            super.draw()
        }
    }

    const KEYBOARD_FRAME_COUNTER_CURSOR_ON = 20
    const KEYBOARD_FRAME_COUNTER_CURSOR_OFF = 40
    const KEYBOARD_MAX_TEXT_LENGTH = 20

    export class KeyboardMenu extends CursorSceneWithPriorPage {
        private static WIDTHS: number[] = [10, 10, 10, 10, 4]
        private btns: Button[][]
        private btnsText: string[][]
        private text: string
        private isUpperCase: boolean
        private next: (arg0: string) => void
        private frameCounter: number
        private shakeText: boolean
        private shakeTextCounter: number

        constructor(app: AppInterface, next: (arg0: string) => void) {
            super(app, function () {}, new GridNavigator())
            this.text = ""
            this.isUpperCase = true

            this.btnsText = [
                ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
                ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
                ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"],
                ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
                ["<-", "^", " _______ ", "ENTER"],
            ]

            this.btns = this.btnsText.map((row: string[]) => [])

            this.next = next
            this.frameCounter = 0
            this.shakeText = false
            this.shakeTextCounter = 0
        }

        /* override */ startup() {
            super.startup()

            const defaultBehaviour = (btn: Button) => {
                if (this.text.length < KEYBOARD_MAX_TEXT_LENGTH) {
                    this.text += btn.state[0]
                    this.frameCounter = KEYBOARD_FRAME_COUNTER_CURSOR_ON
                } else {
                    this.shakeText = true
                }
            }

            for (let i = 0; i < this.btns.length; i++) {
                const xDiff = screen().width / (KeyboardMenu.WIDTHS[i] + 1)
                for (let j = 0; j < this.btnsText[i].length; j++) {
                    this.btns[i][j] = new Button({
                        parent: null,
                        style: ButtonStyles.Transparent,
                        icon: bitmaps.create(10, 10),
                        ariaId: "",
                        x: xDiff * (j + 1) - screen().width / 2,
                        y: 13 * (i + 1) - 18,
                        onClick: defaultBehaviour,
                        state: [i, j], // Coords of the button; used to lookup this.btnsText
                    })
                }
            }

            const botRowBehaviours = [
                (btn: Button) => {
                    this.text =
                        this.text.length > 0
                            ? this.text.substr(0, this.text.length - 1)
                            : this.text
                    this.frameCounter = KEYBOARD_FRAME_COUNTER_CURSOR_ON
                }, // BACKSPACE
                (btn: Button) => {
                    this.changeCase()
                }, // CHANGE CASE
                (btn: Button) => {
                    if (this.text.length < KEYBOARD_MAX_TEXT_LENGTH) {
                        this.text += " "
                        this.frameCounter = KEYBOARD_FRAME_COUNTER_CURSOR_ON
                    } else {
                        this.shakeText = true
                    }
                }, // SPACEBAR
                (btn: Button) => {
                    this.next(this.text)
                }, // ENTER
            ]

            const icons = [
                bitmaps.create(16, 10),
                bitmaps.create(10, 10),
                bitmaps.create(55, 10),
                bitmaps.create(33, 10),
            ]
            const x = [22, 38, 74, 124]

            const specialBtnRow = this.btns.length - 1
            for (let j = 0; j < this.btns[specialBtnRow].length; j++) {
                this.btns[specialBtnRow][j] = new Button({
                    parent: null,
                    style: ButtonStyles.Transparent,
                    icon: icons[j],
                    ariaId: "",
                    x: x[j] - screen().width / 2,
                    y: 13 * 5 - 18,
                    onClick: botRowBehaviours[j],
                })
            }

            this.changeCase()
            this.navigator.setBtns(this.btns)
        }

        private changeCase() {
            this.isUpperCase = !this.isUpperCase

            const toUpperCase = (btnText: string) => {
                return btnText.toUpperCase()
            }
            const toLowerCase = (btnText: string) => {
                return btnText.toLowerCase()
            }
            const swapCase = this.isUpperCase ? toUpperCase : toLowerCase

            // Don't do special char row:
            for (let i = 0; i < this.btns.length - 1; i++) {
                for (let j = 0; j < this.btns[i].length; j++) {
                    const btnText = this.btnsText[i][j]
                    this.btnsText[i][j] = j < 40 ? swapCase(btnText) : btnText
                }
            }
        }

        draw() {
            this.frameCounter += 1

            // Blue base colour:
            Screen.fillRect(
                Screen.LEFT_EDGE,
                Screen.TOP_EDGE,
                Screen.WIDTH,
                Screen.HEIGHT,
                6 // Blue
            )

            // Black border around the text window for depth
            Screen.fillRect(
                Screen.LEFT_EDGE + 3,
                Screen.TOP_EDGE + 4,
                Screen.WIDTH - 7,
                34,
                15 // Black
            )

            // White text window, slightly smaller than the black
            Screen.fillRect(
                Screen.LEFT_EDGE + 6,
                Screen.TOP_EDGE + 6,
                Screen.WIDTH - 12,
                32,
                1 // White
            )

            // Legal text length, draw a flickering cursor using this.frameCounter:
            if (this.text.length < KEYBOARD_MAX_TEXT_LENGTH) {
                screen().printCenter(this.text, 17, 15)
                if (this.frameCounter >= KEYBOARD_FRAME_COUNTER_CURSOR_ON) {
                    screen().print(
                        "_",
                        screen().width / 2 +
                            (this.text.length * bitmaps.font8.charWidth) / 2,
                        17,
                        15
                    )

                    if (this.frameCounter >= KEYBOARD_FRAME_COUNTER_CURSOR_OFF)
                        this.frameCounter = 0
                }
            }

            // Don't draw the cursor if beyond the max length, shake the text a bit:
            else if (this.shakeText) {
                if (this.shakeTextCounter % 5 == 0) {
                    screen().print(
                        this.text,
                        screen().width / 2 -
                            (this.text.length * bitmaps.font8.charWidth) / 2 -
                            2,
                        17,
                        15
                    )
                } else {
                    screen().print(
                        this.text,
                        screen().width / 2 -
                            (this.text.length * bitmaps.font8.charWidth) / 2,
                        17,
                        15
                    )
                }

                if (this.shakeTextCounter >= 5) {
                    this.shakeText = false
                    this.shakeTextCounter = 0
                } else this.shakeTextCounter += 1
            }

            // At max-length, done shaking the text:
            else {
                screen().printCenter(this.text, 17, 15)
            }

            // Orange Keyboard with a black shadow on the bot & right edge (depth effect):

            // Black border around right & bot edge:
            Screen.fillRect(
                Screen.LEFT_EDGE + 4,
                Screen.TOP_EDGE + 47,
                Screen.WIDTH - 6,
                71,
                15 // Black
            )

            // Orange keyboard that the white text will be ontop of:
            Screen.fillRect(
                Screen.LEFT_EDGE + 4,
                Screen.TOP_EDGE + 44,
                Screen.WIDTH - 8,
                72,
                4 // Orange
            )

            for (let i = 0; i < this.btns.length; i++) {
                for (let j = 0; j < this.btns[i].length; j++) {
                    const btn = this.btns[i][j]
                    const btnText = this.btnsText[i][j]

                    const x =
                        screen().width / 2 +
                        btn.xfrm.localPos.x -
                        btn.icon.width / 2 +
                        2
                    const y =
                        screen().height / 2 +
                        btn.xfrm.localPos.y +
                        font.charHeight -
                        12

                    btn.draw()
                    screen().print(btnText, x, y, 1) // White text
                }
            }

            // super.draw()
        }
    }

    export class CalculatorMenu extends CursorSceneWithPriorPage {
        private static WIDTHS: number[] = [10, 5, 4]
        private btns: Button[]
        private btnText: string[]
        private text: string
        private next: (arg0: GraphableFunction) => void
        private frameCounter: number
        private shakeText: boolean
        private shakeTextCounter: number

        constructor(
            app: AppInterface,
            next: (arg0: GraphableFunction) => void
        ) {
            super(app, function () {}, new GridNavigator()) // 3, 1, CalculatorMenu.WIDTHS
            this.text = ""

            this.btns = []
            this.btnText = [
                "0",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "x",
                "+",
                "-",
                "/",
                "*",
                "sin",
                "cos",
                "tan",
                "ENTER",
            ]

            this.next = next
        }

        /* override */ startup() {
            super.startup()

            const defaultBehaviour = (btn: Button) => {
                this.text += btn.state[0] + " "
            }

            const behaviours = []
            for (let i = 0; i < 18; i++) behaviours.push(defaultBehaviour)

            behaviours.push((btn: Button) => {
                const expression = "3 * sin x"
                const tokens = this.text.split(" ") // this.text
                const variableName = "x"

                // for (let i = 0; i < tokens.length; i++) {
                //     basic.showString(tokens[i])
                // }

                const f = (x: number): number => {
                    let result = 0
                    let currentOperation = "="

                    for (let i = 0; i < tokens.length - 1; i++) {
                        const token = tokens[i]
                        if (!isNaN(+token)) {
                            const num = +token
                            result = performOperation(
                                result,
                                num,
                                currentOperation
                            )
                        } else if (token === "x") {
                            result = performOperation(
                                result,
                                x,
                                currentOperation
                            )
                        } else if (token === "sin") {
                            result = performOperation(result, x, "sin")
                        } else if (token === "cos") {
                            result = performOperation(result, x, "cos")
                        } else if (token === "tan") {
                            result = performOperation(result, x, "tan")
                        } else {
                            currentOperation = token
                        }
                    }

                    return result
                }

                // Function to perform the operations
                function performOperation(
                    a: number,
                    b: number,
                    operation: string
                ): number {
                    switch (operation) {
                        case "=":
                            return a
                        case "+":
                            return a + b
                        case "-":
                            return a - b
                        case "*":
                            return a * b
                        case "/":
                            return a / b
                        case "sin":
                            return Math.sin(b)
                        case "cos":
                            return Math.cos(b)
                        case "tan":
                            return Math.tan(b)
                        default:
                            return b
                    }
                }

                this.next(new GraphableFunction(f))
            })

            let flatIndex = 0
            const bitmapWidths = [
                10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 25,
                25, 25, 35,
            ]
            const xStarts = [15, 25, 23]
            for (let i = 0; i < 3; i++) {
                const width = CalculatorMenu.WIDTHS[i]
                const len = this.btnText
                    .slice(flatIndex, flatIndex + width)
                    .reduce((r, s) => r + s.length, 0)
                const xDiff =
                    screen().width / (len - this.btnText[flatIndex].length + 2)
                let cumWidth = 0

                for (let j = 0; j < CalculatorMenu.WIDTHS[i]; j++) {
                    this.btns.push(
                        new Button({
                            parent: null,
                            style: ButtonStyles.Transparent,
                            icon: bitmaps.create(bitmapWidths[flatIndex], 10),
                            ariaId: "",
                            x:
                                xStarts[i] +
                                cumWidth * xDiff -
                                screen().width / 2,
                            y: 13 * i - 6,
                            onClick: behaviours[flatIndex],
                            state: [flatIndex],
                        })
                    )
                    cumWidth += this.btnText[flatIndex].length
                    flatIndex += 1
                }
            }

            this.navigator.setBtns([this.btns])
        }

        draw() {
            this.frameCounter += 1

            // Blue base colour:
            Screen.fillRect(
                Screen.LEFT_EDGE,
                Screen.TOP_EDGE,
                Screen.WIDTH,
                Screen.HEIGHT,
                6 // Blue
            )

            // Black border around the text window for depth
            Screen.fillRect(
                Screen.LEFT_EDGE + 3,
                Screen.TOP_EDGE + 4,
                Screen.WIDTH - 7,
                34,
                15 // Black
            )

            // White text window, slightly smaller than the black
            Screen.fillRect(
                Screen.LEFT_EDGE + 6,
                Screen.TOP_EDGE + 6,
                Screen.WIDTH - 12,
                32,
                1 // White
            )

            // Legal text length, draw a flickering cursor using this.frameCounter:
            if (this.text.length < KEYBOARD_MAX_TEXT_LENGTH) {
                screen().printCenter(this.text, 17, 15)
                if (this.frameCounter >= KEYBOARD_FRAME_COUNTER_CURSOR_ON) {
                    screen().print(
                        "_",
                        screen().width / 2 +
                            (this.text.length * bitmaps.font8.charWidth) / 2,
                        17,
                        15
                    )

                    if (this.frameCounter >= KEYBOARD_FRAME_COUNTER_CURSOR_OFF)
                        this.frameCounter = 0
                }
            }

            // Don't draw the cursor if beyond the max length, shake the text a bit:
            else if (this.shakeText) {
                if (this.shakeTextCounter % 5 == 0) {
                    screen().print(
                        this.text,
                        screen().width / 2 -
                            (this.text.length * bitmaps.font8.charWidth) / 2 -
                            2,
                        17,
                        15
                    )
                } else {
                    screen().print(
                        this.text,
                        screen().width / 2 -
                            (this.text.length * bitmaps.font8.charWidth) / 2,
                        17,
                        15
                    )
                }

                if (this.shakeTextCounter >= 5) {
                    this.shakeText = false
                    this.shakeTextCounter = 0
                } else this.shakeTextCounter += 1
            }

            // At max-length, done shaking the text:
            else {
                screen().printCenter(this.text, 17, 15)
            }

            // Orange Keyboard with a black shadow on the bot & right edge (depth effect):

            // Black border around right & bot edge:
            Screen.fillRect(
                Screen.LEFT_EDGE + 4,
                Screen.TOP_EDGE + 47,
                Screen.WIDTH - 6,
                71,
                15 // Black
            )

            // Orange keyboard that the white text will be ontop of:
            Screen.fillRect(
                Screen.LEFT_EDGE + 4,
                Screen.TOP_EDGE + 44,
                Screen.WIDTH - 8,
                72,
                4 // Orange
            )

            for (let i = 0; i < this.btns.length; i++) {
                this.btns[i].draw()

                const x =
                    screen().width / 2 +
                    this.btns[i].xfrm.localPos.x -
                    this.btns[i].icon.width / 2 +
                    2
                const y =
                    screen().height / 2 +
                    this.btns[i].xfrm.localPos.y +
                    font.charHeight -
                    12
                screen().print(this.btnText[i], x, y, 1) // White text
            }

            super.draw()
        }
    }

    export class CallbackMenu extends CursorSceneWithPriorPage {
        private btns: Button[]
        private btnText: string[]
        private callbacks: ((btn: Button) => void)[][]

        constructor(
            app: AppInterface,
            callbacks: ((btn: Button) => void)[][],
            priorFn?: () => void
        ) {
            super(
                app,
                priorFn != null ? priorFn : function () {},
                new GridNavigator()
                // callbacks.length,
                // (callbacks.length > 0) ? callbacks[0].length : 0
            )
            this.btns = []
            this.callbacks = callbacks
        }

        /* override */ startup() {
            super.startup()

            for (let i = 0; i < this.callbacks.length; i++) {
                for (let j = 0; j < this.callbacks[0].length; j++) {
                    this.btns.push(
                        new Button({
                            parent: null,
                            style: ButtonStyles.Transparent,
                            icon: bitmaps.create(10, 10),
                            ariaId: "",
                            x: screen().width / 2,
                            y: screen().height / 2,
                            onClick: this.callbacks[i][j],
                        })
                    )
                }
            }
            this.navigator.setBtns([this.btns])
        }

        draw() {
            Screen.fillRect(
                Screen.LEFT_EDGE,
                Screen.TOP_EDGE,
                Screen.WIDTH,
                Screen.HEIGHT,
                6 // Blue
            )

            this.btns.forEach(btn => btn.draw())
        }
    }
}
