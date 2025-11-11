namespace microcode {
    import Screen = user_interface_base.Screen
    import CursorScene = user_interface_base.CursorScene
    import PickerButtonDef = user_interface_base.PickerButtonDef
    import Button = user_interface_base.Button
    import ButtonStyles = user_interface_base.ButtonStyles
    import AppInterface = user_interface_base.AppInterface
    import font = user_interface_base.font

    export class Home extends CursorScene {
        constructor(app: AppInterface) {
            super(app)
        }

        /* override */ startup() {
            super.startup()

            this.navigator.setBtns([
                [
                    new Button({
                        parent: null,
                        style: ButtonStyles.Transparent,
                        icon: "edit_program",
                        ariaId: "C0",
                        x: -60,
                        y: 30,
                        onClick: () => {
                            this.app.popScene()
                            this.app.pushScene(new Editor(this.app))
                        },
                    }),
                    new Button({
                        parent: null,
                        style: ButtonStyles.Transparent,
                        icon: "smiley_buttons",
                        ariaId: "C1",
                        x: -20,
                        y: 30,
                        onClick: () => {
                            // this.app.popScene()
                            this.app.pushScene(new SamplesGallery(this.app))
                        },
                    }),
                    new Button({
                        parent: null,
                        style: ButtonStyles.Transparent,
                        icon: "largeDisk",
                        ariaId: "load",
                        x: 20,
                        y: 30,
                        onClick: () => {
                            this.pickDiskSLot()
                        },
                    }),
                    new Button({
                        parent: null,
                        style: ButtonStyles.Transparent,
                        icon: "largeSettingsGear",
                        ariaId: "settings",
                        x: 60,
                        y: 30,
                        onClick: () => {
                            this.app.popScene()
                            this.app.pushScene(new Settings(this.app))
                        },
                    }),
                ],
            ])
        }

        private pickDiskSLot() {
            const btns: PickerButtonDef[] = diskSlots().map(slot => {
                return {
                    icon: slot,
                }
            })
            this.picker.setGroup(btns)
            this.picker.show({
                title: accessibility.ariaToTooltip("load"),
                onClick: index => {
                    let buf = settings.readBuffer(btns[index].icon)
                    if (!buf) {
                        // handles case where nothing is in slot
                        buf = Buffer.create(6)
                        for (let i = 0; i < 5; ++i) buf[i] = Tid.END_OF_PAGE
                        buf[5] = Tid.END_OF_PROG
                    }
                    settings.writeBuffer(SAVESLOT_AUTO, buf)
                    this.app.popScene()
                    this.app.pushScene(new Editor(this.app))
                },
            })
        }

        /* override */ activate() {
            super.activate()
            this.backgroundColor = 15
            // docs.setup(this.app)
        }

        private drawVersion() {
            const font = bitmaps.font5
            Screen.print(
                microcode.VERSION,
                Screen.RIGHT_EDGE - font.charWidth * microcode.VERSION.length,
                Screen.BOTTOM_EDGE - font.charHeight - 1,
                0xb,
                font
            )
        }

        private yOffset = -Screen.HEIGHT >> 1
        draw() {
            Screen.fillRect(
                Screen.LEFT_EDGE,
                Screen.TOP_EDGE,
                Screen.WIDTH,
                Screen.HEIGHT,
                0xc
            )
            this.yOffset = Math.min(0, this.yOffset + 2)
            const t = control.millis()
            const dy = this.yOffset == 0 ? (Math.idiv(t, 800) & 1) - 1 : 0
            const margin = 2
            const OFFSET = (Screen.HEIGHT >> 1) - wordLogo.height - margin
            const y = Screen.TOP_EDGE + OFFSET + dy
            Screen.drawTransparentImage(
                wordLogo,
                Screen.LEFT_EDGE + ((Screen.WIDTH - wordLogo.width) >> 1) + dy,
                y + this.yOffset
            )
            Screen.drawTransparentImage(
                icondb.microbitLogo,
                Screen.LEFT_EDGE +
                    ((Screen.WIDTH - icondb.microbitLogo.width) >> 1) +
                    dy,
                y - wordLogo.height + this.yOffset + margin
            )
            if (!this.yOffset) {
                const tagline = resolveTooltip("tagline")
                // const tagline = "" // TODO: fix this
                Screen.print(
                    tagline,
                    Screen.LEFT_EDGE +
                        ((Screen.WIDTH + wordLogo.width) >> 1) +
                        dy -
                        font.charWidth * tagline.length,
                    Screen.TOP_EDGE +
                        OFFSET +
                        wordLogo.height +
                        dy +
                        this.yOffset +
                        1,
                    0xb,
                    font
                )
            }

            this.navigator.drawComponents()
            this.drawVersion()
            super.draw()
        }
    }
}
