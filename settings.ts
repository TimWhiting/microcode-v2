namespace microcode {
    export let microcodeClassic = false
    export let jacdacEnabled = false
    export let reportAria = false

    // screen for selecting from samples

    import GUIComponentAlignment = microgui.GUIComponentAlignment
    import RadioButtonCollection = microgui.RadioButtonCollection
    import RadioButton = microgui.RadioButton
    import GUIComponentScene = microgui.GUIComponentScene

    export const selectMode = new RadioButtonCollection({
        alignment: GUIComponentAlignment.CENTRE, // Change to move around, use xOffset and yOffset for small shifts.
        btns: [
            new RadioButton({
                text: "hi",
                onClick: () => {
                    basic.showString("a")
                },
            }),
            new RadioButton({
                text: "hiyaaaaaaaaaa",
                onClick: () => {
                    basic.showString("b")
                },
            }),
            new RadioButton({
                text: "hello",
                onClick: () => {
                    basic.showString("c")
                },
            }),
            new RadioButton({
                text: "a",
                onClick: () => {
                    basic.showString("d")
                },
            }),
            new RadioButton({
                text: "b",
                onClick: () => {
                    basic.showString("e")
                },
            }),
        ],
        isActive: true,
        title: "The title", // Optional
        colour: 3, // Optional
        xOffset: 0, // Optional small shift in X
        yOffset: 0, // Optional small shift in Y
        xScaling: 1.0, // Optional Scaling; if you want to make it wider or thinner.
        yScaling: 1.0, // Optional Scaling; if you want to make it taller or shorter.
    })
}
