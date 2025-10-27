namespace microcode {
    // TODO: put in checks for Math and Decimal
    // - Math: enables more operators and comparisons

    export enum EditorMode {
        Classic,
        Math,
        Decimal,
    }

    export let editorMode = EditorMode.Decimal
    export let jacdacEnabled = false
}
