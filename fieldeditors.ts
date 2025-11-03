namespace microcode {
    import PickerButtonDef = user_interface_base.PickerButtonDef
    import Picker = user_interface_base.Picker
    import ButtonStyles = user_interface_base.ButtonStyles

    export function getFieldEditor(tile: Tile): FieldEditor {
        if (tile instanceof ModifierEditor) return tile.fieldEditor
        return undefined
    }

    class FieldEditor {
        init(): any {
            return undefined
        }
        clone(field: any): any {
            return undefined
        }
        editor(
            field: any,
            picker: Picker,
            onHide: () => void,
            onDelete?: () => void
        ): void {}
        toImage(field: any): Bitmap {
            return undefined
        }
        toBuffer(field: any): Buffer {
            return undefined
        }
        fromBuffer(buf: BufferReader): any {
            return undefined
        }
    }

    export class ModifierEditor {
        constructor(public tid: number) {
            this.firstInstance = false
        }
        fieldEditor: FieldEditor
        firstInstance: boolean
        getField(): any {
            return null
        }
        getIcon(): string | number | Bitmap {
            return null
        }
        getNewInstance(field: any = null): ModifierEditor {
            return null
        }
    }

    interface BoxedNumber {
        num: number
    }

    // TODO: conversion from constant to FieldEditor
    export class DecimalFieldEditor extends FieldEditor {
        init() {
            return { num: 1.0 }
        }
        clone(bn: BoxedNumber) {
            return { num: bn.num }
        }
        editor(
            field: any,
            picker: Picker,
            onHide: () => void,
            onDelete?: () => void
        ) {
            decimalEditor(field, onHide, onDelete)
        }
        toImage(field: BoxedNumber) {
            return icondb.numberToDecimalImage(field.num)
        }
        toBuffer(field: BoxedNumber): Buffer {
            const buf = Buffer.create(4)
            // console.log(`toBuffer ${field.num}`)
            buf.setNumber(NumberFormat.Float32LE, 0, field.num)
            return buf
        }
        fromBuffer(buf: BufferReader): BoxedNumber {
            const num = buf.readFloat()
            // console.log(`fromBuffer ${num}`)
            return { num }
        }
    }

    export class DecimalEditor extends ModifierEditor {
        field: BoxedNumber
        constructor(field: BoxedNumber) {
            super(Tid.TID_DECIMAL_EDITOR)
            this.fieldEditor = new DecimalFieldEditor()
            this.field = this.fieldEditor.clone(
                field ? field : this.fieldEditor.init()
            )
        }

        getField() {
            return this.field
        }

        getIcon(): string | number | Bitmap {
            return this.firstInstance
                ? getIcon(Tid.TID_DECIMAL_EDITOR)
                : this.fieldEditor.toImage(this.field.num)
        }

        getNewInstance(field: any = null) {
            return new DecimalEditor(field ? field : this.field)
        }
    }

    export class IconFieldEditor extends FieldEditor {
        init() {
            return bmp`
        . . . . .
        . 1 . 1 .
        . . . . . 
        1 . . . 1
        . 1 1 1 .
        `
        }
        clone(img: Bitmap) {
            return img.clone()
        }
        editor(
            field: any,
            picker: Picker,
            onHide: () => void,
            onDelete?: () => void
        ) {
            iconEditor(field, picker, onHide, onDelete)
        }
        toImage(field: any) {
            return icondb.renderMicrobitLEDs(field)
        }
        toBuffer(img: Bitmap) {
            const ret = Buffer.create(4)
            for (let index = 0; index < 25; index++) {
                let byte = index >> 3
                let bit = index & 7
                let col = index % 5
                let row = Math.idiv(index, 5)
                ret[byte] |= img.getPixel(col, row) << bit
            }
            return ret
        }
        fromBuffer(br: BufferReader) {
            const buf = br.readBuffer(4)
            const img = bitmaps.create(5, 5)
            for (let index = 0; index < 25; index++) {
                let byte = index >> 3
                let bit = index & 7
                let col = index % 5
                let row = Math.idiv(index, 5)
                img.setPixel(col, row, (buf[byte] >> bit) & 1)
            }
            return img
        }
    }

    export class IconEditor extends ModifierEditor {
        field: Bitmap
        constructor(field: Bitmap = null) {
            super(Tid.TID_MODIFIER_ICON_EDITOR)
            this.fieldEditor = new IconFieldEditor()
            this.field = this.fieldEditor.clone(
                field ? field : this.fieldEditor.init()
            )
        }

        getField() {
            return this.field
        }

        getIcon(): string | number | Bitmap {
            return this.firstInstance
                ? getIcon(Tid.TID_MODIFIER_ICON_EDITOR)
                : this.fieldEditor.toImage(this.field)
        }

        getNewInstance(field: any = null) {
            return new IconEditor(field ? field : this.field.clone())
        }
    }

    export interface Melody {
        notes: string
        tempo: number
    }

    export const MELODY_LENGTH = 4
    export const NUM_NOTES = 5

    export const noteNames = ["C", "D", "E", "F", "G", "A", "B", "C5", "D5"]

    export class MelodyFieldEditor extends FieldEditor {
        init() {
            return { notes: `0240`, tempo: 120 }
        }
        clone(melody: Melody) {
            return { notes: melody.notes.slice(0), tempo: melody.tempo }
        }
        editor(
            field: any,
            picker: Picker,
            onHide: () => void,
            onDelete?: () => void
        ) {
            melodyEditor(field, picker, onHide, onDelete)
        }
        toImage(field: any) {
            return icondb.melodyToImage(field)
        }
        toBuffer(melody: Melody) {
            const buf = Buffer.create(3)
            buf.setUint8(0, melody.tempo)
            // convert the melody notes into list of integers
            const notes = melody.notes.split("")
            // fill the buffer with the notes, 4 bits for each note
            for (let i = 0; i < MELODY_LENGTH; i++) {
                const byte = i >> 1
                const bit = (i & 1) << 2
                if (notes[i] != ".") {
                    const note = (parseInt(notes[i]) || 0) + 1
                    buf.setUint8(
                        byte + 1,
                        buf.getUint8(byte + 1) | (note << bit)
                    )
                }
            }
            return buf
        }
        fromBuffer(br: BufferReader) {
            const buf = br.readBuffer(3)
            const tempo = buf[0]
            let notes = ""
            // read the notes from the buffer
            for (let i = 0; i < MELODY_LENGTH; i++) {
                const byte = i >> 1
                const bit = (i & 1) << 2
                const note = (buf[byte + 1] >> bit) & 0xf
                notes += note == 0 ? "." : (note - 1).toString()
            }
            return { tempo, notes }
        }
    }

    export class MelodyEditor extends ModifierEditor {
        field: Melody
        constructor(field: Melody = null) {
            super(Tid.TID_MODIFIER_MELODY_EDITOR)
            this.firstInstance = false
            this.fieldEditor = new MelodyFieldEditor()
            this.field = this.fieldEditor.clone(
                field ? field : this.fieldEditor.init()
            )
        }

        getField() {
            return this.field
        }

        getIcon(): string | number | Bitmap {
            return this.firstInstance
                ? getIcon(Tid.TID_MODIFIER_MELODY_EDITOR)
                : this.fieldEditor.toImage(this.field)
        }

        getNewInstance(field: any = null) {
            return new MelodyEditor(
                field ? field : this.fieldEditor.clone(this.field)
            )
        }
        // music.play(music.stringPlayable("C - E - G F E D ", 120), music.PlaybackMode.UntilDone)
        getNoteSequence() {
            const notes = this.field.notes.split("")
            let result = ""
            for (const n of notes) {
                if (n == ".") result += "- "
                else result += noteNames[parseInt(n)] + " "
            }
            return result
        }
    }

    let iconEditorTile: ModifierEditor = undefined
    let melodyEditorTile: ModifierEditor = undefined
    let decimalEditorTile: ModifierEditor = undefined
    export function getEditor(tid: Tid): ModifierEditor {
        if (tid == Tid.TID_MODIFIER_ICON_EDITOR) {
            if (!iconEditorTile) {
                iconEditorTile = new IconEditor()
                iconEditorTile.firstInstance = true
            }
            return iconEditorTile
        } else if (tid == Tid.TID_MODIFIER_MELODY_EDITOR) {
            if (!melodyEditorTile) {
                melodyEditorTile = new MelodyEditor()
                melodyEditorTile.firstInstance = true
            }
            return melodyEditorTile
        } else if (tid == Tid.TID_DECIMAL_EDITOR) {
            if (!decimalEditorTile) {
                decimalEditorTile = new DecimalEditor(undefined)
                decimalEditorTile.firstInstance = true
            }
            return decimalEditorTile
        }
        return undefined
    }

    function decimalEditor(
        bn: BoxedNumber,
        onHide: () => void,
        onDelete?: () => void
    ) {
        const kb = new microgui.Keyboard({
            app,
            layout: microgui.KeyboardLayouts.NUMERIC,
            cb: (txt: string) => {
                bn.num = +txt
                app.popScene()
                onHide()
            },
            init: bn.num,
            foregroundColor: 3, // optional arg
            backgroundColor: 6, // optional arg
            maxTxtLength: 5, // optional arg
        })
        app.pushScene(kb)
    }

    function iconEditor(
        image5x5: Bitmap,
        picker: Picker,
        onHide: () => void,
        onDelete?: () => void
    ) {
        const getColor = (col: number, row: number) => {
            return image5x5.getPixel(col, row) ? "solid_red" : "solid_black"
        }

        // TODO: replace this with a function from index to colo
        let defs: PickerButtonDef[] = []
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                defs.push({
                    icon: getColor(col, row),
                })
            }
        }
        picker.setGroup(defs)

        const red = icons.get("solid_red")
        const black = icons.get("solid_black")

        picker.show(
            {
                width: 5,
                title: accessibility.ariaToTooltip(
                    tidToString(Tid.TID_MODIFIER_ICON_EDITOR)
                ),
                onClick: (index: number) => {
                    let row = Math.idiv(index, 5)
                    let col = index % 5
                    const on = image5x5.getPixel(col, row)
                    image5x5.setPixel(col, row, on ? 0 : 1)
                    defs[index].icon = getColor(col, row)
                    picker.draw()
                },
                onHide,
                onDelete,
                navigator: () => new LEDNavigator(picker),
                style: ButtonStyles.Transparent,
            },
            false
        )
    }

    function melodyEditor(
        melody: Melody,
        picker: Picker,
        onHide: () => void,
        onDelete?: () => void
    ) {
        const getIcon = (col: number, row: number) => {
            const note_icon =
                melody.notes[col] === "."
                    ? "note_off"
                    : parseInt(melody.notes[col]) === NUM_NOTES - 1 - row
                    ? "note_on"
                    : "note_off"
            return note_icon
        }

        let defs: PickerButtonDef[] = []
        for (let row = 0; row < NUM_NOTES; row++) {
            for (let col = 0; col < MELODY_LENGTH; col++) {
                defs.push({
                    icon: getIcon(col, row),
                })
            }
        }
        picker.setGroup(defs)

        picker.show(
            {
                width: MELODY_LENGTH,
                title: accessibility.ariaToTooltip(
                    tidToString(Tid.TID_MODIFIER_MELODY_EDITOR)
                ),
                onClick: index => {
                    let row = Math.idiv(index, MELODY_LENGTH)
                    let col = index % MELODY_LENGTH
                    if (getIcon(col, row) !== "note_on") {
                        const note = (NUM_NOTES - 1 - row).toString()
                        const buf = Buffer.create(6)
                        // TODO: setNote(buf, 0, note)
                        // new jacs.TopWriter().deployFreq(buf)
                    }
                    melody.notes =
                        melody.notes.slice(0, col) +
                        (getIcon(col, row) === "note_on"
                            ? "."
                            : (NUM_NOTES - 1 - row).toString()) +
                        melody.notes.slice(col + 1)
                    for (row = 0; row < NUM_NOTES; row++) {
                        defs[row * MELODY_LENGTH + col].icon = getIcon(col, row)
                    }
                    picker.draw()
                    picker.navigator.updateAria()
                },
                onHide,
                onDelete,
                navigator: () => new MelodyNavigator(picker),
                style: ButtonStyles.Transparent,
            },
            false
        )
    }
}

/*

https://makecode.microbit.org/_i9X6j2F9F68T
MicroGUI Numeric Keyboard 
"microgui": "github:microbit-apps/MicroGUI#v0.0.21",
 
const app = new microgui.App();



*/
