namespace microcode {
    export let microcodeClassic = false
    export let jacdacEnabled = false
    export let reportAria = false

    // screen for selecting from samples

    import GUIComponentAlignment = microgui.GUIComponentAlignment
    import RadioButtonCollection = microgui.RadioButtonCollection
    import RadioButton = microgui.RadioButton
    import AppInterface = user_interface_base.AppInterface

    // TODO: back button
    // TODO: store in settings

    const selectMode = new RadioButtonCollection({
        alignment: GUIComponentAlignment.CENTRE, // Change to move around, use xOffset and yOffset for small shifts.
        btns: [
            new RadioButton({
                text: "Classic: 1-5 dots",
                onClick: () => {
                    microcodeClassic = true
                },
            }),
            new RadioButton({
                text: "Decimal: base 10",
                onClick: () => {
                    microcodeClassic = false
                },
            }),
        ],
        isActive: true,
        title: "Select Mode", // Optional
        colour: 3, // Optional
        xOffset: 0, // Optional small shift in X
        yOffset: 0, // Optional small shift in Y
        xScaling: 1.0, // Optional Scaling; if you want to make it wider or thinner.
        yScaling: 1.0, // Optional Scaling; if you want to make it taller or shorter.
        backBtn: () => {
            app.popScene()
        }, // Optional
    })

    export class MicroCodeSettings extends microgui.GUIComponentScene {
        constructor(app: AppInterface) {
            super({
                app,
                components: [selectMode],
            })
        }
    }
}
