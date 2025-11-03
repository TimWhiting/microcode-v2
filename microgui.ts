//% block="MicroGUI" weight=100, color=#000A83
namespace microgui {
    import AppInterface = user_interface_base.AppInterface
    import Scene = user_interface_base.Scene

    import Bounds = user_interface_base.Bounds
    import Screen = user_interface_base.Screen
    import Button = user_interface_base.Button
    import font = user_interface_base.font

    /**
     * Util function used within this file, useful for ensuring that prior bindings are not kept when using a new component.
     */
    function unbindShieldButtons() {
        context.onEvent(
            ControllerButtonEvent.Pressed,
            controller.A.id,
            () => {}
        )
        context.onEvent(
            ControllerButtonEvent.Pressed,
            controller.A.id + keymap.PLAYER_OFFSET,
            () => {}
        )
        context.onEvent(
            ControllerButtonEvent.Pressed,
            controller.B.id,
            () => {}
        )
        context.onEvent(
            ControllerButtonEvent.Pressed,
            controller.up.id,
            () => {}
        )
        context.onEvent(
            ControllerButtonEvent.Pressed,
            controller.down.id,
            () => {}
        )
        context.onEvent(
            ControllerButtonEvent.Pressed,
            controller.left.id,
            () => {}
        )
        context.onEvent(
            ControllerButtonEvent.Pressed,
            controller.right.id,
            () => {}
        )
    }

    /**
     * Passed to the constructor of a GUIComponent to quickly align it.
     * Alignment may be further adjusted by an xOffset & yOffset.
     * These alignments are used to calculate left & top values for a Bounds object.
     * This Bounds object is the extent of the component.
     * See getLeftAndTop in GUIComponentAbstract for how this is calculated.
     */

    //% emitAsConstant color=#FF5733
    export const enum GUIComponentAlignment {
        //% block="TOP"
        TOP,
        //% block="LEFT"
        LEFT,
        //% block="RIGHT"
        RIGHT,
        //% block="BOT"
        BOT,
        //% block="CENTRE"
        CENTRE,
        //% block="TOP RIGHT"
        TOP_RIGHT,
        //% block="TOP LEFT"
        TOP_LEFT,
        //% block="BOT RIGHT"
        BOT_RIGHT,
        //% block="BOT LEFT"
        BOT_LEFT,
    }

    /**
     * Greatly simplifies the creation & alignment of GUI components.
     * A GUI Component has a .context for storage of hidden component state.
     */
    export abstract class GUIComponentAbstract extends Scene {
        /** Which of the 9 options should this component snap to? */
        private alignment: GUIComponentAlignment

        /** What is the width of this component, without any xScaling? */
        private unscaledWidth: number

        /** What is the height of this component, without any yScaling? */
        private unscaledHeight: number

        /**
         * Can the user interact with this component? Will the Window ignore its A, B, etc presses?
         * Modified by Window.makeComponentActive()
         */
        protected isActive: boolean

        /** Should this component be drawn on the screen? Modified by optional arg of Window.makeComponentActive() */
        protected isHidden: boolean

        /** A component can store arbitrary information, this information may be passed to it via Window.updateComponentsContext() */
        protected context: any[]

        /** The rectangle that this component embodies. The width & height are equal to DEFAULT_WIDTH * this.xScaling. */
        protected bounds: Bounds
        protected backgroundColour: number = 3

        /** Modifies the DEFAULT_WIDTH of this screen to change its size. */
        private xScaling: number = 1.0

        /** Modifies the DEFAULT_HEIGHT of this screen to change its size. */
        private yScaling: number = 1.0

        /** For minor tweaks to positioning of this.alignment. Modifies this.bounds.left */
        private xOffset: number

        /** For minor tweaks to positioning of this.alignment. Modifies this.bounds.top */
        private yOffset: number

        /** Does this component have coloured (shadowed) borders? */
        private hasBorder: boolean

        private showBackground: boolean

        constructor(opts: {
            alignment: GUIComponentAlignment
            isActive: boolean
            isHidden?: boolean
            xOffset?: number
            yOffset?: number
            xScaling?: number
            yScaling?: number
            colour?: number
            border?: boolean
            showBackground?: boolean
        }) {
            super()

            this.alignment = opts.alignment

            this.isActive = opts.isActive
            this.isHidden = opts.isHidden != null ? opts.isHidden : false

            this.context = []

            this.xScaling = opts.xScaling ? opts.xScaling : this.xScaling
            this.yScaling = opts.yScaling ? opts.yScaling : this.yScaling

            this.backgroundColour = opts.colour
                ? opts.colour
                : this.backgroundColour

            this.xOffset = opts.xOffset != null ? opts.xOffset : 0
            this.yOffset = opts.yOffset != null ? opts.yOffset : 0

            this.unscaledWidth = screen().width >> 1
            this.unscaledHeight = screen().height >> 1
            this.hasBorder = opts.border != null ? opts.border : false

            this.showBackground =
                opts.showBackground != null ? opts.showBackground : true

            const pos = this.getLeftAndTop()
            const left = pos[0]
            const top = pos[1]

            this.bounds = new Bounds({
                width: this.unscaledWidth * this.xScaling,
                height: this.unscaledHeight * this.yScaling,
                left,
                top,
            })
        }

        //------------------
        // Helper functions:
        //------------------

        private getLeftAndTop(): number[] {
            let left = 0
            let top = 0

            switch (this.alignment) {
                case GUIComponentAlignment.TOP: {
                    left =
                        -((this.unscaledWidth * this.xScaling) >> 1) +
                        this.xOffset
                    top = -(screen().height >> 1) + this.yOffset
                    break
                }
                case GUIComponentAlignment.LEFT: {
                    left = -(screen().width >> 1) + this.xOffset
                    top =
                        -((this.unscaledHeight * this.yScaling) >> 1) +
                        this.yOffset
                    break
                }
                case GUIComponentAlignment.RIGHT: {
                    left =
                        (screen().width >> 1) -
                        this.unscaledWidth * this.xScaling +
                        this.xOffset
                    top =
                        -((this.unscaledHeight * this.yScaling) >> 1) +
                        this.yOffset
                    break
                }
                case GUIComponentAlignment.BOT: {
                    left =
                        -((this.unscaledWidth * this.xScaling) >> 1) +
                        this.xOffset
                    top =
                        (screen().height >> 1) -
                        this.unscaledHeight * this.yScaling -
                        this.yOffset
                    break
                }
                case GUIComponentAlignment.CENTRE: {
                    left =
                        -((this.unscaledWidth * this.xScaling) >> 1) +
                        this.xOffset
                    top =
                        -((this.unscaledHeight * this.yScaling) >> 1) +
                        this.yOffset
                    break
                }
                case GUIComponentAlignment.TOP_RIGHT: {
                    left =
                        (screen().width >> 1) -
                        this.unscaledWidth * this.xScaling +
                        this.xOffset
                    top = -(screen().height >> 1) + this.yOffset
                    break
                }
                case GUIComponentAlignment.TOP_LEFT: {
                    left = -(screen().width >> 1) + this.xOffset
                    top = -(screen().height >> 1) + this.yOffset
                    break
                }
                case GUIComponentAlignment.BOT_RIGHT: {
                    left =
                        (screen().width >> 1) -
                        this.unscaledWidth * this.xScaling +
                        this.xOffset
                    top =
                        (screen().height >> 1) -
                        this.unscaledHeight * this.yScaling -
                        this.yOffset
                    break
                }
                case GUIComponentAlignment.BOT_LEFT: {
                    left = -(screen().width >> 1) + this.xOffset
                    top =
                        (screen().height >> 1) -
                        this.unscaledHeight * this.yScaling -
                        this.yOffset
                    break
                }
            }

            return [left, top]
        }

        //-------------------------
        // Public facing functions:
        //-------------------------

        /**
         * Adjusts .xScaling & .yScaling, then this.bounds() as appropriate.
         * @param xScaling 1.0 is default; affects this.bounds.width: width = (this.xScaling * this.unscaledWidth)
         * @param yScaling 1.0 is default; affects this.bounds.height: height = (this.yScaling * this.unscaledHeight)
         */
        public rescale(xScaling: number, yScaling: number): void {
            if (this.bounds != null) {
                this.xScaling = xScaling
                this.yScaling = yScaling
                this.bounds = new Bounds({
                    width: this.unscaledWidth * this.xScaling,
                    height: this.unscaledHeight * this.yScaling,
                    left: this.bounds.left,
                    top: this.bounds.top,
                })
            }
        }

        /**
         *
         * @param xScaling 1.0 is default; affects this.bounds.width: width = (this.xScaling * this.unscaledWidth)
         * @param yScaling 1.0 is default; affects this.bounds.height: height = (this.yScaling * this.unscaledHeight)
         */
        public rescaleWidthTo(newWidth: number): void {
            if (this.bounds != null) {
                this.xScaling = newWidth / this.unscaledWidth
                this.bounds.left = this.getLeftAndTop()[0]
                this.bounds.top = this.getLeftAndTop()[1]

                this.bounds = new Bounds({
                    width: this.unscaledWidth * this.xScaling,
                    height: this.unscaledHeight * this.yScaling,
                    left: this.bounds.left,
                    top: this.bounds.top,
                })
            }
        }

        /**
         *
         * @param xScaling 1.0 is default; affects this.bounds.width: width = (this.xScaling * this.unscaledWidth)
         * @param yScaling 1.0 is default; affects this.bounds.height: height = (this.yScaling * this.unscaledHeight)
         */
        public rescaleHeightTo(newHeight: number): void {
            if (this.bounds != null) {
                this.yScaling = newHeight / this.unscaledHeight

                this.bounds.left = this.getLeftAndTop()[0]
                this.bounds.top = this.getLeftAndTop()[1]

                this.bounds = new Bounds({
                    width: this.unscaledWidth * this.xScaling,
                    height: this.unscaledHeight * this.yScaling,
                    left: this.bounds.left,
                    top: this.bounds.top,
                })
            }
        }

        /**
         * Invoked by parent, see Window.
         */
        public draw(): void {
            if (this.showBackground) {
                screen().fillRect(
                    this.bounds.left + (screen().width >> 1) + 2,
                    this.bounds.top + (screen().height >> 1) + 2,
                    this.bounds.width,
                    this.bounds.height,
                    15
                )

                this.bounds.fillRect(this.backgroundColour)
            }
        }

        public get width() {
            return this.unscaledWidth * this.xScaling
        }
        public get height() {
            return this.unscaledHeight * this.yScaling
        }
        public get active() {
            return this.isActive
        }
        public get hidden() {
            return this.isHidden
        }

        public getAlignment(): number {
            return this.alignment
        }
        public makeActive(): void {
            this.isActive = true
        }
        public unmakeActive(): void {
            this.isActive = false
        }

        public hide(): void {
            this.isHidden = true
        }
        public unHide(): void {
            this.isHidden = false
        }

        /**
         * This should be overriden.
         * Other components should use this to get this components state.
         * @returns pertinent component state information, in appropriate format; at child components discretion.
         */
        public getContext(): any[] {
            return this.context
        }

        public addContext(newContext: any[]) {
            this.context.push(newContext)
        }

        public clearContext(): void {
            this.context = []
        }

        public setBounds(bounds: Bounds): void {
            this.bounds = bounds
        }
    }

    //% block = "createTextBox" weight=50
    //% blockSetVariable=textBox
    export function createTextBox(isActive: boolean): TextBox {
        return new TextBox({
            alignment: GUIComponentAlignment.CENTRE,
            isActive,
            title: "Title",
            text: "Text",
            xScaling: 1.0,
            yScaling: 1.0,
            colour: 3,
            border: true,
            showBackground: true,
        })
    }

    /**
     * Component that contains a Title + a chunk of text.
     */
    //% autoCreate=microgui.createTextBox color=#5F7FF0
    export class TextBox extends GUIComponentAbstract {
        private title: string
        private maxCharactersPerLine: number
        private textChunks: string[]

        constructor(opts: {
            alignment: GUIComponentAlignment
            isActive: boolean
            isHidden?: boolean
            xOffset?: number
            yOffset?: number
            xScaling?: number
            yScaling?: number
            colour?: number
            border?: boolean
            title?: string
            text?: string | string[]
            showBackground?: boolean
        }) {
            super({
                alignment: opts.alignment,
                xOffset: opts.xOffset != null ? opts.xOffset : 0,
                yOffset: opts.yOffset != null ? opts.yOffset : 0,
                isActive: opts.isActive,
                isHidden: opts.isHidden,
                xScaling: opts.xScaling,
                yScaling: opts.yScaling,
                colour: opts.colour,
                border: opts.border,
                showBackground: opts.showBackground,
            })

            this.title = opts.title != null ? opts.title : ""
            this.maxCharactersPerLine = this.width / (font.charWidth + 1)

            if (opts.text == null) {
                this.textChunks = [""]
            } else if (typeof opts.text === "string") {
                this.textChunks = []

                for (
                    let i = 0;
                    i < opts.text.length;
                    i += this.maxCharactersPerLine
                ) {
                    this.textChunks.push(
                        opts.text.slice(i, i + this.maxCharactersPerLine)
                    )
                }
            } else {
                this.textChunks = opts.text
            }
        }

        draw() {
            super.draw()
            // this.printCenter(this.text)

            const titleOffset = (font.charWidth * this.title.length) >> 1

            screen().print(
                this.title,
                (screen().width >> 1) +
                    this.bounds.left +
                    (this.width >> 1) -
                    titleOffset,
                (screen().height >> 1) + this.bounds.top + 2
            )

            let yOffset = 12
            this.textChunks.forEach(textChunk => {
                const textOffset = (font.charWidth * textChunk.length) >> 1
                screen().print(
                    textChunk,
                    (screen().width >> 1) +
                        this.bounds.left +
                        (this.width >> 1) -
                        textOffset,
                    (screen().height >> 1) + this.bounds.top + 2 + yOffset
                )

                yOffset += 10
            })
        }
    }

    //% block="Slider" weight=50, color=#F01000
    export class GUISlider extends TextBox {
        private maximum: number
        private minimum: number
        private sliderColour: number

        constructor(opts: {
            alignment: GUIComponentAlignment
            isActive: boolean
            isHidden?: boolean
            xOffset?: number
            yOffset?: number
            xScaling?: number
            yScaling?: number
            colour?: number
            backgroundColour?: number
            showBackground?: boolean
            border?: boolean
            title?: string
            sliderMax?: number
            sliderMin?: number
        }) {
            super({
                alignment: opts.alignment,
                isActive: opts.isActive,
                isHidden: opts.isHidden,
                xOffset: opts.xOffset != null ? opts.xOffset : 0,
                yOffset: opts.yOffset != null ? opts.yOffset : 0,
                xScaling: opts.xScaling,
                yScaling: opts.yScaling,
                colour: opts.backgroundColour,
                border: opts.border,
                showBackground: opts.showBackground,
            })

            this.maximum = opts.sliderMax != null ? opts.sliderMax : 100
            this.minimum = opts.sliderMin != null ? opts.sliderMin : 0
            this.sliderColour = opts.colour != null ? opts.colour : 13

            this.context = [
                (Math.abs(this.maximum) + Math.abs(this.minimum)) / 2,
            ]

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.up.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.up.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        this.context[0] = Math.min(
                            this.context[0] + 10,
                            this.maximum
                        )
                        basic.pause(100)
                    }
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.up.id,
                        () => {}
                    )
                }
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.down.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.down.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        this.context[0] = Math.max(
                            this.context[0] - 10,
                            this.minimum
                        )
                        basic.pause(100)
                    }
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.down.id,
                        () => {}
                    )
                }
            )
        }

        draw() {
            super.draw()

            const rodWidth = 10

            // Black border for shadow effect:
            screen().fillRect(
                this.bounds.left +
                    (this.bounds.width >> 1) +
                    (screen().width >> 1) -
                    (rodWidth >> 1),
                this.bounds.top + (screen().height >> 1),
                rodWidth + 1,
                this.bounds.height + 1,
                0
            )

            screen().fillRect(
                this.bounds.left +
                    (this.bounds.width >> 1) +
                    (screen().width >> 1) -
                    (rodWidth >> 1),
                this.bounds.top + (screen().height >> 1),
                rodWidth,
                this.bounds.height,
                this.sliderColour
            )

            const sliderWidth = 20
            const sliderHeight = 10
            const y =
                this.context[0] /
                (Math.abs(this.minimum) + Math.abs(this.maximum))
            const slideableRegion = this.bounds.height - sliderHeight

            // Black border for shadow effect:
            screen().fillRect(
                this.bounds.left +
                    (this.bounds.width >> 1) +
                    (screen().width >> 1) -
                    (sliderWidth >> 1),
                this.bounds.top +
                    (screen().height >> 1) +
                    (slideableRegion - y * slideableRegion),
                sliderWidth + 1,
                sliderHeight + 1,
                0
            )

            screen().fillRect(
                this.bounds.left +
                    (this.bounds.width >> 1) +
                    (screen().width >> 1) -
                    (sliderWidth >> 1),
                this.bounds.top +
                    (screen().height >> 1) +
                    (slideableRegion - y * slideableRegion),
                sliderWidth,
                sliderHeight,
                this.sliderColour
            )
        }
    }

    const KEYBOARD_FRAME_COUNTER_CURSOR_ON = 20
    const KEYBOARD_FRAME_COUNTER_CURSOR_OFF = 40
    const KEYBOARD_MAX_TEXT_LENGTH = 20

    // export class KeyboardComponent extends GUIComponentAbstract {
    //     private static WIDTHS: number[] = [10, 10, 10, 10, 4]
    //     // private btns: Button[]
    //     private btnBounds: Bounds[]
    //     private btnText: string[]

    //     private text: string;
    //     private upperCase: boolean;
    //     private next: (arg0: string) => void;
    //     private frameCounter: number;
    //     private shakeText: boolean
    //     private shakeTextCounter: number

    //     constructor(opts: {
    //         alignment: GUIComponentAlignment,
    //         isActive: boolean,
    //         next: (arg0: string) => void,
    //         isHidden?: boolean,
    //         xOffset?: number,
    //         yOffset?: number,
    //         xScaling?: number,
    //         yScaling?: number,
    //         colour?: number,
    //     }) {
    //         super({
    //             alignment: opts.alignment,
    //             isActive: opts.isActive,
    //             isHidden: (opts.isHidden != null) ? opts.isHidden : false,
    //             xOffset: (opts.xOffset != null) ? opts.xOffset : 0,
    //             yOffset: (opts.yOffset != null) ? opts.yOffset : 0,
    //             xScaling: opts.xScaling,
    //             yScaling: opts.yScaling,
    //             colour: opts.colour
    //         })

    //         this.text = ""
    //         this.upperCase = true

    //         // this.btns = [];
    //         this.btnBounds = [];

    //         this.btnText = [
    //             "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    //             "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    //             "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
    //             "U", "V", "W", "X", "Y", "Z", ",", ".", "?", "!",
    //                "<-",   "^",     " _______ ",      "ENTER"
    //         ];

    //         this.next = opts.next
    //         this.frameCounter = 0;
    //         this.shakeText = false;
    //         this.shakeTextCounter = 0;

    //         const defaultBehaviour = (btn: Button) => {
    //             if (this.text.length < KEYBOARD_MAX_TEXT_LENGTH) {
    //                 this.text += this.btnText[btn.state[0]]
    //                 this.frameCounter = KEYBOARD_FRAME_COUNTER_CURSOR_ON
    //             }
    //             else {
    //                 this.shakeText = true
    //             }
    //         }

    //         for (let i = 0; i < 4; i++) {
    //             const xDiff = screen().width / (KeyboardComponent.WIDTHS[i] + 1);
    //             for (let j = 0; j < 10; j++) {
    //                 this.btns.push(
    //                     new Button({
    //                         parent: null,
    //                         style: ButtonStyles.Transparent,
    //                         icon: bitmaps.create(10, 10),
    //                         ariaId: "",
    //                         x: (xDiff * (j + 1)) - (screen().width >> 1),
    //                         y: (13 * (i + 1)) - 18,
    //                         onClick: defaultBehaviour,
    //                         state: [(i * 10) + j]
    //                     })
    //                 )
    //             }
    //         }

    //         const botRowBehaviours = [
    //             () => {
    //                 this.text =
    //                     (this.text.length > 0)
    //                         ? this.text.substr(0, this.text.length - 1)
    //                         : this.text
    //                 this.frameCounter = KEYBOARD_FRAME_COUNTER_CURSOR_ON
    //             },
    //             () => { this.changeCase() },
    //             () => {
    //                 if (this.text.length < KEYBOARD_MAX_TEXT_LENGTH) {
    //                     this.text += " ";
    //                     this.frameCounter = KEYBOARD_FRAME_COUNTER_CURSOR_ON;
    //                 }
    //                 else {
    //                     this.shakeText = true
    //                 }
    //             },
    //             () => { this.next(this.text) }
    //         ]

    //         const icons = [bitmaps.create(16, 10), bitmaps.create(10, 10), bitmaps.create(55, 10), bitmaps.create(33, 10)]
    //         const x = [22, 38, 74, 124]
    //         for (let i = 0; i < 4; i++) {
    //             this.btns.push(
    //                 new Button({
    //                     parent: null,
    //                     style: ButtonStyles.Transparent,
    //                     icon: icons[i],
    //                     ariaId: "",
    //                     x: x[i] - (screen().width >> 1),
    //                     y: (13 * 5) - 18,
    //                     onClick: botRowBehaviours[i]
    //                 })
    //             )
    //         }

    //         this.changeCase()
    //     }

    //     private changeCase() {
    //         this.upperCase = !this.upperCase;

    //         if (this.upperCase)
    //             this.btnText = this.btnText.map((btn, i) =>
    //                 btn = (i < 40) ? btn.toUpperCase() : btn
    //             )
    //         else
    //             this.btnText = this.btnText.map((btn, i) =>
    //                 btn = (i < 40) ? btn.toLowerCase() : btn
    //             )
    //     }

    //     draw() {
    //         super.draw()
    //         this.frameCounter += 1

    //         for (let i = 0; i < this.btns.length; i++) {
    //             const x = (screen().width >> 1) + this.btns[i].xfrm.localPos.x - (this.btns[i].icon.width >> 1) + 2
    //             const y = (screen().height >> 1) + this.btns[i].xfrm.localPos.y + font.charHeight - 12
    //             screen().print(this.btnText[i], x, y, 1) // White text
    //         }
    //     }
    // }

    //% block="Create a text button | with text $text on click $callback event || at x $x at y $y with colour $colour with text colour $textColour"
    //% draggableParameters
    //% blockSetVariable=textBtn
    export function createTextBtn(
        text: string,
        callback: () => void,
        x?: number,
        y?: number,
        colour?: number,
        textColour?: number
    ): TextButton {
        return new TextButton({
            text,
            callback,
            x,
            y,
            colour,
            textColour,
        })
    }

    //% color=#007777
    export class TextButton {
        public bounds: Bounds
        private shadowBounds: Bounds

        public callback: () => void

        private text: string
        private colour: number
        private shadowColour: number
        private textColour: number

        constructor(opts: {
            text: string
            callback: () => void
            x?: number
            y?: number
            colour?: number
            textColour?: number
        }) {
            this.text = opts.text

            const x = opts.x != null ? opts.x : 0
            const y = opts.y != null ? opts.y : 0
            this.bounds = new Bounds({
                top: y,
                left: x,
                width: font.charWidth * (this.text.length + 1) + 1, // + 1 for the cursor in ButtonCollection to draw on top of.
                height: font.charHeight + 2,
            })

            this.shadowBounds = new Bounds({
                top: this.bounds.top,
                left: this.bounds.left + 1,
                width: this.bounds.width + 1, // + 1 for the cursor in ButtonCollection to draw on top of.
                height: this.bounds.height + 1,
            })

            this.callback = opts.callback

            this.colour = opts.colour != null ? opts.colour : 6
            this.shadowColour = 15
            this.textColour = opts.textColour != null ? opts.textColour : 1
        }

        public shiftBounds(
            leftShift: number,
            topShift: number,
            widthShift: number,
            heightShift: number
        ) {
            this.bounds.left += leftShift
            this.bounds.top += topShift
            this.bounds.width += widthShift
            this.bounds.height += heightShift

            this.shadowBounds.left += leftShift
            this.shadowBounds.top += topShift
            this.shadowBounds.width += widthShift
            this.shadowBounds.height += heightShift
        }

        public setShadowColour(newColour: number) {
            this.shadowColour = newColour
        }

        draw() {
            this.shadowBounds.fillRect(this.shadowColour)
            this.bounds.fillRect(this.colour)

            screen().print(
                this.text,
                this.bounds.left + (screen().width >> 1) + 3,
                this.bounds.top + (screen().height >> 1) + 1,
                this.textColour
            )
        }
    }

    //% block="Create a text button collection | with alignment $alignment is active $isActive with buttons $textBtns || is hidden $isHidden with x offset $xOffset with y offset $yOffset with xScaling $xScaling with yScaling $yScaling with colour $colour has a border $border with title $title with text $text shows the background $showBackground"
    //% textBtns.defl = "createTextBtn"
    //% blockSetVariable=textBtnCollection
    export function createTextBtnCollection(
        alignment: GUIComponentAlignment,
        isActive: boolean,
        textBtns: TextButton[],
        isHidden?: boolean,
        xOffset?: number,
        yOffset?: number,
        xScaling?: number,
        yScaling?: number,
        colour?: number,
        border?: boolean,
        title?: string,
        text?: string[]
    ): TextButtonCollection {
        return new TextButtonCollection({
            alignment,
            isActive,
            textBtns,
            isHidden,
            xOffset,
            yOffset,
            xScaling,
            yScaling,
            colour,
            border,
            title,
            text,
        })
    }

    export class TextButtonCollection extends GUIComponentAbstract {
        private title: string
        private textBtns: TextButton[]
        private selectedTextBtnIndex: number
        private cursorBounds: Bounds

        constructor(opts: {
            alignment: GUIComponentAlignment
            isActive: boolean
            textBtns: TextButton[]
            isHidden?: boolean
            xOffset?: number
            yOffset?: number
            xScaling?: number
            yScaling?: number
            colour?: number
            border?: boolean
            title?: string
            text?: string | string[]
        }) {
            super({
                alignment: opts.alignment,
                xOffset: opts.xOffset != null ? opts.xOffset : 0,
                yOffset: opts.yOffset != null ? opts.yOffset : 0,
                isActive: opts.isActive,
                isHidden: opts.isHidden,
                xScaling: opts.xScaling,
                yScaling: opts.yScaling,
                colour: opts.colour,
                border: opts.border,
            })

            this.title = opts.title != null ? opts.title : ""
            this.textBtns = opts.textBtns != null ? opts.textBtns : []
            this.selectedTextBtnIndex = 0

            const titleYOffset = this.title != "" ? 13 : 0
            const btnXOffset =
                this.textBtns.length > 0
                    ? this.bounds.width / (this.textBtns.length + 1)
                    : 0

            let cumulativeXOffset = 0
            this.textBtns.forEach(btn => {
                btn.shiftBounds(
                    this.bounds.left,
                    this.bounds.top + titleYOffset + cumulativeXOffset,
                    0,
                    0
                )
                cumulativeXOffset += btnXOffset
            })

            // Cursor:
            if (this.textBtns.length > 0) {
                this.cursorBounds = new Bounds({
                    top:
                        this.textBtns[this.selectedTextBtnIndex].bounds.top - 1,
                    left: this.textBtns[this.selectedTextBtnIndex].bounds.left,
                    width:
                        this.textBtns[this.selectedTextBtnIndex].bounds.width +
                        2,
                    height:
                        this.textBtns[this.selectedTextBtnIndex].bounds.height +
                        2,
                })
                this.textBtns[this.selectedTextBtnIndex].setShadowColour(6)
            }
        }

        public makeActive() {
            super.makeActive()
            this.setupButtonBindings()
        }

        setupButtonBindings() {
            unbindShieldButtons()

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.A.id,
                () => {
                    if (this.textBtns.length > 0) {
                        this.textBtns[this.selectedTextBtnIndex].callback()
                    }
                }
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.up.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.up.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        this.textBtns[
                            this.selectedTextBtnIndex
                        ].setShadowColour(15)

                        const len = this.textBtns.length
                        this.selectedTextBtnIndex =
                            (((this.selectedTextBtnIndex - 1) % len) + len) %
                            len

                        this.cursorBounds = new Bounds({
                            top:
                                this.textBtns[this.selectedTextBtnIndex].bounds
                                    .top - 1,
                            left: this.textBtns[this.selectedTextBtnIndex]
                                .bounds.left,
                            width:
                                this.textBtns[this.selectedTextBtnIndex].bounds
                                    .width + 2,
                            height:
                                this.textBtns[this.selectedTextBtnIndex].bounds
                                    .height + 2,
                        })
                        this.textBtns[
                            this.selectedTextBtnIndex
                        ].setShadowColour(6)

                        basic.pause(200) // tick rate
                    }

                    // Reset binding
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.up.id,
                        () => {}
                    )
                }
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.down.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.down.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        this.textBtns[
                            this.selectedTextBtnIndex
                        ].setShadowColour(15)

                        this.selectedTextBtnIndex =
                            (this.selectedTextBtnIndex + 1) %
                            this.textBtns.length
                        this.cursorBounds = new Bounds({
                            top:
                                this.textBtns[this.selectedTextBtnIndex].bounds
                                    .top - 1,
                            left: this.textBtns[this.selectedTextBtnIndex]
                                .bounds.left,
                            width:
                                this.textBtns[this.selectedTextBtnIndex].bounds
                                    .width + 2,
                            height:
                                this.textBtns[this.selectedTextBtnIndex].bounds
                                    .height + 2,
                        })
                        this.textBtns[
                            this.selectedTextBtnIndex
                        ].setShadowColour(6)

                        basic.pause(200) // tick rate
                    }

                    // Reset binding
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.down.id,
                        () => {}
                    )
                }
            )
        }

        draw() {
            super.draw()

            const titleOffset = (font.charWidth * this.title.length) >> 1

            screen().print(
                this.title,
                (screen().width >> 1) +
                    this.bounds.left +
                    (this.width >> 1) -
                    titleOffset,
                (screen().height >> 1) + this.bounds.top + 2
            )

            this.textBtns.forEach(btn => btn.draw())

            if (this.textBtns.length > 0) {
                this.cursorBounds.drawRect(9)
            }
        }
    }
    //% block="Radio Button" weight=50, color=#28edB3
    export class RadioButton {
        public text: string
        private textColour: number
        private x: number
        private y: number
        private onClick: (obj?: Object) => void
        private isSelected: boolean

        constructor(opts: {
            text: string
            onClick: (obj: Object) => void
            colour?: number
        }) {
            this.text = opts.text
            this.x = null
            this.y = null
            this.onClick = opts.onClick
            this.isSelected = false
            this.textColour = opts.colour == null ? 15 : opts.colour
        }

        public setSelected(isSelected: boolean) {
            this.isSelected = isSelected
        }

        public setPosition(x: number, y: number) {
            this.x = x
            this.y = y
        }

        public click() {
            this.onClick()
        }

        draw() {
            screen().fillCircle(
                this.x - 6,
                this.y + 3,
                4,
                this.isSelected ? 6 : 1
            )

            screen().print(this.text, this.x, this.y, this.textColour)
        }
    }

    //% block="Radio Button Collection" weight=50, color=#F6FAB4
    export class RadioButtonCollection extends GUIComponentAbstract {
        private title: string
        private btns: RadioButton[]
        private selectedTextBtnIndex: number

        private xBorder = 12
        private minYBorder = 5
        private static MINIMUM_BUTTON_Y_SPACING: number = 2

        constructor(opts: {
            alignment: GUIComponentAlignment
            isActive: boolean
            btns: RadioButton[]
            isHidden?: boolean
            xOffset?: number
            yOffset?: number
            xScaling?: number
            yScaling?: number
            colour?: number
            border?: boolean
            title?: string
            text?: string | string[]
        }) {
            super({
                alignment: opts.alignment,
                xOffset: opts.xOffset != null ? opts.xOffset : 0,
                yOffset: opts.yOffset != null ? opts.yOffset : 0,
                isActive: opts.isActive,
                isHidden: opts.isHidden,
                xScaling: opts.xScaling,
                yScaling: opts.yScaling,
                colour: opts.colour,
                border: opts.border,
            })

            this.title = opts.title != null ? opts.title : ""
            this.btns = opts.btns != null ? opts.btns : []

            const originalWidth = this.bounds.width
            const originalHeight = this.bounds.height
            this.autoScale()

            const yBorder = this.bounds.height * 0.1
            const ySpacing =
                (this.bounds.height - yBorder) / (this.btns.length + 1)

            for (let i = 0; i < this.btns.length; i++) {
                this.btns[i].setPosition(
                    this.xBorder + this.bounds.left + originalWidth,
                    yBorder +
                        this.bounds.top +
                        originalHeight +
                        (i + 1) * ySpacing -
                        3
                )
                this.btns[i].setSelected(false)
            }

            if (this.btns.length > 0) {
                // Choose the current active button:
                this.selectedTextBtnIndex = 0
                this.btns[this.selectedTextBtnIndex].setSelected(true)
            }

            super.makeActive()
            this.setupButtonBindings()
        }

        private autoScale() {
            const yBorder = 0
            const ySpacing =
                font.charHeight * RadioButtonCollection.MINIMUM_BUTTON_Y_SPACING

            // AutoScaling height:
            const maxComponentHeight = yBorder + ySpacing * this.btns.length - 3

            if (this.bounds.height < maxComponentHeight) {
                this.rescaleHeightTo(maxComponentHeight)
            }

            // AutoScaling width:
            const titleWidth = (this.title.length + 1) * font.charWidth

            const btnTextWidthFn = (btn: RadioButton) =>
                this.xBorder + (btn.text.length + 1) * font.charWidth

            const maxComponentWidth = this.btns.reduce(
                (acc, btn) =>
                    btnTextWidthFn(btn) > acc ? btnTextWidthFn(btn) : acc,
                titleWidth
            )

            if (this.bounds.width < maxComponentWidth) {
                this.rescaleWidthTo(maxComponentWidth)
            }
        }

        public makeActive() {
            super.makeActive()
            this.setupButtonBindings()
        }

        setupButtonBindings() {
            unbindShieldButtons()

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.A.id,
                () => {
                    this.btns[this.selectedTextBtnIndex].click()
                }
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.up.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.up.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        this.btns[this.selectedTextBtnIndex].setSelected(false)
                        const len = this.btns.length
                        this.selectedTextBtnIndex =
                            (((this.selectedTextBtnIndex - 1) % len) + len) %
                            len

                        this.btns[this.selectedTextBtnIndex].setSelected(true)
                        basic.pause(200) // tick rate
                    }

                    // Reset binding
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.up.id,
                        () => {}
                    )
                }
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.down.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.down.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        this.btns[this.selectedTextBtnIndex].setSelected(false)
                        this.selectedTextBtnIndex =
                            (this.selectedTextBtnIndex + 1) % this.btns.length
                        this.btns[this.selectedTextBtnIndex].setSelected(true)
                        basic.pause(200) // tick rate
                    }

                    // Reset binding
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.down.id,
                        () => {}
                    )
                }
            )
        }

        draw() {
            super.draw()

            const titleOffset = (font.charWidth * this.title.length) >> 1

            screen().print(
                this.title,
                (screen().width >> 1) +
                    this.bounds.left +
                    (this.width >> 1) -
                    titleOffset,
                (screen().height >> 1) + this.bounds.top + 2
            )

            this.btns.forEach(btn => btn.draw())
        }
    }

    //% block="Create a component scene | on app $app with background colour $colour with components $components"
    //% textBtns.defl = ""
    //% blockSetVariable=componentScene
    export function createComponentScene(
        app: AppInterface,
        colour?: number,
        components?: GUIComponentAbstract[]
    ): GUIComponentScene {
        return new GUIComponentScene({
            app,
            colour,
            components,
        })
    }

    /**
     * Holds other components,
     * One component is active at a time
     */
    //% color=#40BF24
    export class GUIComponentScene extends Scene {
        private components: GUIComponentAbstract[]
        private currentComponentID: number

        constructor(opts: {
            app: AppInterface
            colour?: number
            components?: GUIComponentAbstract[]
        }) {
            super(opts.app)

            if (opts.colour != null) this.backgroundColor = opts.colour

            this.components = opts.components != null ? opts.components : []
            this.currentComponentID = 0
        }

        public addComponents(newComponents: GUIComponentAbstract[]) {
            this.components = this.components.concat(newComponents)

            if (this.components.length == newComponents.length) {
                this.components[this.currentComponentID].makeActive()
            }
        }

        public activate() {
            super.activate()
            if (this.components.length > 0)
                this.components[this.currentComponentID].makeActive()
        }

        public deactivate() {
            super.activate()

            this.components[this.currentComponentID].hide()
            this.components[this.currentComponentID].unmakeActive()
        }

        public makeComponentActive(componentID: number, hideOthers: boolean) {
            this.currentComponentID = componentID
            this.focus(hideOthers)
        }

        public updateComponentsContext(componentID: number, context: any[]) {
            this.components[componentID].addContext(context)
        }

        /* override */ startup() {
            super.startup()
        }

        private focus(hideOthers: boolean) {
            if (hideOthers)
                this.components.forEach(component => {
                    component.hide()
                })
            this.components.forEach(component => {
                component.unmakeActive()
            })

            this.components[this.currentComponentID].unHide()
            this.components[this.currentComponentID].makeActive()
        }

        showAllComponents() {
            this.components.forEach(component => component.unHide())
        }

        draw() {
            super.draw()

            screen().fillRect(
                0,
                0,
                screen().width,
                screen().height,
                this.backgroundColor
            )

            if (this.components != null) {
                this.components.forEach(component => {
                    if (!component.hidden && !component.active) component.draw()
                })
            }

            // Always draw active ontop
            this.components[this.currentComponentID].draw()
        }
    }
    //% block="Button Collection" weight=50, color=#F5F575
    export class ButtonCollection extends GUIComponentAbstract {
        private btns: Button[][]
        private numberOfRows: number
        private numberOfCols: number[]

        private cursorBounds: Bounds
        private cursorOutlineColour: number
        private cursorRow: number
        private cursorCol: number

        constructor(opts: {
            alignment: GUIComponentAlignment
            btns: Button[][]
            isActive: boolean
            isHidden?: boolean
            noAutoScaling?: boolean
            xOffset?: number
            yOffset?: number
            xScaling?: number
            yScaling?: number
            colour?: number
            border?: boolean
            title?: string
            cursorColour?: number
        }) {
            super({
                alignment: opts.alignment,
                xOffset: opts.xOffset != null ? opts.xOffset : 0,
                yOffset: opts.yOffset != null ? opts.yOffset : 0,
                isActive: opts.isActive,
                isHidden: opts.isHidden,
                xScaling: opts.xScaling,
                yScaling: opts.yScaling,
                colour: opts.colour,
                border: opts.border,
            })

            // Set to null in case the opts.btns are [[]].
            // This is checked before drawing.
            this.cursorBounds = null

            const autoScaling =
                opts.noAutoScaling == null ? true : !opts.noAutoScaling

            if (opts.btns != null) {
                this.btns = opts.btns

                const yBorder = this.bounds.height * 0.15
                const xBorder = this.bounds.width * 0.15
                const ySpacing: number =
                    (this.bounds.height + yBorder) / (this.btns.length + 1)

                // Adjust button x & y to be relative to this components window left & top:
                for (let i = 0; i < this.btns.length; i++) {
                    const row = this.btns[i]

                    const xSpacing: number =
                        (this.bounds.width + xBorder) / (row.length + 1)
                    for (let j = 0; j < row.length; j++) {
                        const btn = row[j]
                        if (autoScaling && btn.xfrm.localPos.x == 0)
                            btn.xfrm.localPos.x =
                                this.bounds.left +
                                (j + 1) * xSpacing -
                                (xBorder >> 1)
                        else
                            btn.xfrm.localPos.x =
                                this.bounds.left +
                                btn.xfrm.localPos.x +
                                (btn.width >> 1)
                        if (autoScaling && btn.xfrm.localPos.y == 0)
                            btn.xfrm.localPos.y =
                                this.bounds.top +
                                (i + 1) * ySpacing -
                                (yBorder >> 1)
                        else
                            btn.xfrm.localPos.y =
                                this.bounds.top +
                                btn.xfrm.localPos.y +
                                (btn.height >> 1)
                    }
                }

                this.isActive = opts.isActive

                this.numberOfCols = this.btns.map(row => row.length)
                this.numberOfRows = this.btns.length

                // Its possible the programmer makes the first row empty and fills it later:
                let startingRow = null
                for (let i = 0; i < this.numberOfRows; i++) {
                    if (this.numberOfCols[i] > 0) {
                        startingRow = i
                        break
                    }
                }

                if (startingRow != null) {
                    this.cursorBounds = new Bounds({
                        width: this.btns[0][0].width + 4,
                        height: this.btns[0][0].height + 4,
                        left:
                            this.btns[0][0].xfrm.localPos.x -
                            (this.btns[0][0].width >> 1) -
                            2,
                        top:
                            this.btns[0][0].xfrm.localPos.y -
                            (this.btns[0][0].height >> 1) -
                            2,
                    })
                    this.cursorOutlineColour =
                        opts.cursorColour != null ? opts.cursorColour : 9 // Default is light blue
                    this.cursorRow = startingRow
                    this.cursorCol = 0
                }
                if (this.isActive) this.bindShieldButtons()
            }
        }

        bindShieldButtons() {
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.up.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.up.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        this.cursorRow =
                            (((this.cursorRow - 1) % this.numberOfRows) +
                                this.numberOfRows) %
                            this.numberOfRows // Non-negative modulo

                        // Row above might have less cols, adjust if neccessary:
                        if (this.numberOfCols[this.cursorRow] <= this.cursorCol)
                            this.cursorCol =
                                this.numberOfCols[this.cursorRow] - 1
                        this.updateCursor()

                        basic.pause(200)
                    }

                    // Reset binding
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.up.id,
                        () => {}
                    )
                }
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.down.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.down.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        this.cursorRow =
                            (this.cursorRow + 1) % this.numberOfRows

                        // Row below might have less cols, adjust if neccessary:
                        if (this.numberOfCols[this.cursorRow] <= this.cursorCol)
                            this.cursorCol =
                                this.numberOfCols[this.cursorRow] - 1
                        this.updateCursor()

                        basic.pause(200)
                    }

                    // Reset binding
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.down.id,
                        () => {}
                    )
                }
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.left.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.left.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        if (this.cursorCol == 0)
                            this.cursorCol =
                                this.numberOfCols[this.cursorRow] - 1
                        else this.cursorCol -= 1
                        this.updateCursor()

                        basic.pause(200) // tick rate
                    }

                    // Reset binding
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.left.id,
                        () => {}
                    )
                }
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.right.id,
                () => {
                    let tick = true
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.right.id,
                        () => (tick = false)
                    )

                    // Control logic:
                    while (tick) {
                        if (this.cursorCol == this.numberOfCols[this.cursorRow])
                            this.cursorCol = 0
                        else
                            this.cursorCol =
                                (this.cursorCol + 1) %
                                this.numberOfCols[this.cursorRow]
                        this.updateCursor()

                        basic.pause(200) // tick rate
                    }

                    // Reset binding
                    context.onEvent(
                        ControllerButtonEvent.Released,
                        controller.right.id,
                        () => {}
                    )
                }
            )

            // click
            const click = () => this.click()
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.A.id,
                click
            )
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.A.id + keymap.PLAYER_OFFSET,
                click
            )
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.B.id,
                () => this.back()
            )
        }

        makeActive() {
            this.isActive = true
            this.bindShieldButtons()
        }

        unmakeActive() {
            this.isActive = false
            unbindShieldButtons()
        }

        click() {
            this.btns[this.cursorRow][this.cursorCol].onClick(
                this.btns[this.cursorRow][this.cursorCol]
            )
        }

        back() {}

        updateCursor() {
            const x = this.cursorRow
            const y = this.cursorCol
            this.cursorBounds = new Bounds({
                width: this.btns[x][y].width + 4,
                height: this.btns[x][y].height + 4,
                left:
                    this.btns[x][y].xfrm.localPos.x -
                    (this.btns[x][y].width >> 1) -
                    2,
                top:
                    this.btns[x][y].xfrm.localPos.y -
                    (this.btns[x][y].height >> 1) -
                    2,
            })
            this.drawCursor()
        }

        drawCursor() {
            this.cursorBounds.fillRect(this.cursorOutlineColour)
        }

        drawCursorText() {
            const text = this.btns[this.cursorRow][this.cursorCol].ariaId

            if (text) {
                const pos = this.cursorBounds
                const n = text.length
                const font = user_interface_base.font
                const w = font.charWidth * n
                const h = font.charHeight
                const x = Math.max(
                    Screen.LEFT_EDGE + 1,
                    Math.min(
                        Screen.RIGHT_EDGE - 1 - w,
                        pos.left + (pos.width >> 1) - (w >> 1)
                    )
                )
                const y = Math.min(
                    pos.top + pos.height + 1,
                    Screen.BOTTOM_EDGE - 1 - font.charHeight
                )
                Screen.fillRect(x - 1, y - 1, w + 1, h + 2, 15)
                Screen.print(text, x, y, 1, font)
            }
        }

        draw() {
            if (!this.isHidden) {
                super.draw()
                if (this.isActive && this.cursorBounds != null) {
                    this.drawCursor()
                }

                this.btns.forEach(btnRow => btnRow.forEach(btn => btn.draw()))

                if (this.isActive && this.cursorBounds != null) {
                    this.drawCursorText()
                }
            }
        }
    }

    export class KeyboardComponent extends ButtonCollection {
        constructor(opts: {
            alignment: GUIComponentAlignment
            isActive: boolean
            next: (arg0: string) => void
            isHidden?: boolean
            xOffset?: number
            yOffset?: number
            xScaling?: number
            yScaling?: number
            colour?: number
        }) {
            super({
                alignment: opts.alignment,
                btns: [
                    [
                        new Button({
                            icon: "accelerometer",
                            onClick: () => basic.showNumber(0),
                        }),
                    ],
                ],
                isActive: opts.isActive,
                isHidden: opts.isHidden != null ? opts.isHidden : false,
                xOffset: opts.xOffset != null ? opts.xOffset : 0,
                yOffset: opts.yOffset != null ? opts.yOffset : 0,
                xScaling: opts.xScaling,
                yScaling: opts.yScaling,
                colour: opts.colour,
            })
        }
    }
}

namespace user_interface_base {
    /**
     * Ovverides the B button on the controller to go invoke a passed function.
     * That passed function is normally {this.app.popScene(); this.app.pushScene(new ...);
     * Defaults to RowNavigator if not passsed.
     */
    export class CursorSceneWithPriorPage extends CursorScene {
        private goBack1PageFn: () => void

        constructor(
            app: AppInterface,
            goBack1PageFn: () => void,
            navigator?: INavigator
        ) {
            super(app)
            this.backgroundColor = 11

            if (navigator) this.navigator = navigator
            else this.navigator = null
            this.goBack1PageFn = goBack1PageFn
        }

        /* override */ startup() {
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.right.id,
                () => this.moveCursor(CursorDir.Right)
            )
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.up.id,
                () => this.moveCursor(CursorDir.Up)
            )
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.down.id,
                () => this.moveCursor(CursorDir.Down)
            )
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.left.id,
                () => this.moveCursor(CursorDir.Left)
            )

            // click
            const click = () => this.cursor.click()
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.A.id,
                click
            )
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.A.id + keymap.PLAYER_OFFSET,
                click
            )
            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.B.id,
                () => this.back()
            )

            context.onEvent(
                ControllerButtonEvent.Pressed,
                controller.B.id,
                () => this.goBack1PageFn()
            )
            this.cursor = new Cursor()
            this.picker = new Picker(this.cursor)

            if (this.navigator == null) this.navigator = new RowNavigator()
            this.cursor.navigator = this.navigator
        }
    }
}
