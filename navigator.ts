namespace microcode {
    import RowNavigator = user_interface_base.RowNavigator
    import PickerNavigator = user_interface_base.PickerNavigator
    import Picker = user_interface_base.Picker
    import Button = user_interface_base.Button

    // this adds accessibility for rule
    export class RuleRowNavigator extends RowNavigator {
        private rules: RuleDefn[]

        constructor() {
            super()
            this.rules = []
        }

        getRowCount() {
            return this.buttonGroups.length
        }

        /* overrides */
        public clear() {
            super.clear()
            this.rules = []
        }

        public addRule(rule: RuleDefn) {
            this.rules.push(rule)
        }

        public atRuleStart() {
            return this.row >= 1 && this.col == 0
        }

        protected reportAria(ret: Button) {
            if (!reportAria) return
            if (!ret) {
                return
            }

            let accessibilityMessage: accessibility.AccessibilityMessage
            if (this.row > 0 && this.col == 0) {
                const ruleDef = this.rules[this.row - 1]

                const whens = ruleDef.sensors
                    .concat(ruleDef.filters)
                    .map(s => tidToString(s))

                const dos: string[] = ruleDef.actuators
                    .concat(ruleDef.modifiers.map(t => getTid(t)))
                    .map(s => tidToString(s))

                accessibilityMessage = <accessibility.RuleAccessibilityMessage>{
                    type: "rule",
                    whens,
                    dos,
                }
            } else {
                accessibilityMessage = <accessibility.TileAccessibilityMessage>{
                    type: "tile",
                    value: (ret ? ret.ariaId : "") || "",
                    force: true,
                }
            }
            accessibility.setLiveContent(accessibilityMessage)
        }
    }

    // accessibility for melody
    export class MelodyNavigator extends PickerNavigator {
        constructor(picker: Picker) {
            super(picker)
            this.row = 2
            this.col = 2
        }
        protected reportAria() {
            if (!reportAria) return
            super.reportAria()
            if (this.row == -1) return
            const on = true // TODO btn.getIcon() === "note_on"
            const index = this.hasDelete ? this.row - 1 : this.row
            accessibility.setLiveContent(<
                accessibility.NoteAccessibilityMessage
            >{
                type: "note",
                on,
                index,
                force: true,
            })
        }
    }

    // accessibility for LEDs
    export class LEDNavigator extends PickerNavigator {
        constructor(picker: Picker) {
            super(picker)
            this.row = 2
            this.col = 2
        }
        protected reportAria() {
            if (!reportAria) return
            super.reportAria()
            if (this.row == -1) return
            const on = true // TODO: btn.getIcon() == "solid_red"
            accessibility.setLiveContent(<
                accessibility.LEDAccessibilityMessage
            >{
                type: "led",
                on,
                x: this.col,
                y: this.row,
                force: true,
            })
        }
    }
}
