namespace microcode {
    import Screen = user_interface_base.Screen
    import Sprite = user_interface_base.Sprite
    import Bounds = user_interface_base.Bounds
    import Button = user_interface_base.Button
    import ButtonStyles = user_interface_base.ButtonStyles
    import PickerButtonDef = user_interface_base.PickerButtonDef
    import Vec2 = user_interface_base.Vec2
    import CursorDir = user_interface_base.CursorDir
    import IComponent = user_interface_base.IComponent
    import Affine = user_interface_base.Affine
    import IPlaceable = user_interface_base.IPlaceable
    import PickerNavigator = user_interface_base.PickerNavigator

    type ButtonRuleRep = { [name: string]: Button[] }

    function repNames() {
        return ["sensors", "filters", "actuators", "modifiers"]
    }

    export class RuleEditor implements IComponent, IPlaceable {
        private xfrm_: Affine
        innerWidth: number
        handleBtn: Button
        whenInsertBtn: Button
        doInsertBtn: Button
        arrow: Sprite
        ruleButtons: ButtonRuleRep
        bounds: Bounds
        whenBounds: Bounds
        queuedCursorMove: CursorDir

        //% blockCombine block="xfrm" callInDebugger
        public get xfrm() {
            return this.xfrm_
        }

        constructor(
            private editor: Editor,
            private page: PageEditor,
            public ruledef: RuleDefn,
            public index: number
        ) {
            this.xfrm_ = new Affine()
            this.xfrm_.parent = page.xfrm
            this.handleBtn = new Button({
                parent: this,
                icon: "rule_handle",
                ariaId: "rule",
                x: 0,
                y: 0,
                style: ButtonStyles.Transparent,
                onClick: () => this.showRuleHandleMenu(),
            })
            this.arrow = new Sprite({
                parent: this,
                img: icons.get("rule_arrow"),
            })
            this.ruleButtons = {
                sensors: [],
                filters: [],
                actuators: [],
                modifiers: [],
            }
            this.instantiateProgramTiles()
        }

        private destroyWhenInsertButton() {
            this.whenInsertBtn = undefined
        }

        private needsWhenInsert() {
            if (
                this.ruledef["sensors"].length == 0 ||
                this.getSuggestions("filters", this.ruledef["filters"].length)
                    .length
            ) {
                this.whenInsertBtn = new Button({
                    parent: this,
                    style: ButtonStyles.Transparent,
                    icon: "when_insertion_point",
                    ariaId:
                        this.ruledef["sensors"].length == 0
                            ? "when"
                            : undefined,
                    x: 0,
                    y: 0,
                    onClick: () => this.showWhenInsertMenu(),
                })
            } else {
                this.destroyWhenInsertButton()
            }
        }

        private destroyDoInsertButton() {
            this.doInsertBtn = undefined
        }

        private needsDoInsert() {
            if (
                this.ruledef["actuators"].length == 0 ||
                this.getSuggestions(
                    "modifiers",
                    this.ruledef["modifiers"].length
                ).length
            ) {
                this.doInsertBtn = new Button({
                    parent: this,
                    style: ButtonStyles.Transparent,
                    icon: "do_insertion_point",
                    ariaId:
                        this.ruledef["actuators"].length == 0
                            ? "do"
                            : undefined,
                    x: 0,
                    y: 0,
                    onClick: () => this.showDoInsertMenu(),
                })
            } else {
                this.destroyDoInsertButton()
            }
        }

        private destroyProgramTiles() {
            let changed = false
            repNames().forEach(name => {
                if (this.ruleButtons[name].length) {
                    this.ruleButtons[name] = []
                    changed = true
                }
            })
            // TODO: do we really need this?
            if (changed) this.editor.changed()
        }

        private processSection(name: string, rule: RuleRep) {
            const tiles = rule[name]
            tiles.forEach((tile, index) => {
                const button = new Button({
                    parent: this,
                    style: buttonStyle(tile),
                    icon: getIcon(tile),
                    ariaId: tidToString(getTid(tile)),
                    x: 0,
                    y: 0,
                    onClick: () => this.editTile(name, index),
                })
                this.ruleButtons[name].push(button)
            })
            return tiles.length > 0
        }

        private instantiateProgramTiles() {
            this.destroyProgramTiles()
            const rule = this.ruledef.getRuleRep()
            let changed = false
            Object.keys(rule).forEach(name => {
                changed = this.processSection(name, rule) || changed
            })
            this.needsWhenInsert()
            this.needsDoInsert()
            if (changed) this.page.changed()
        }

        private showRuleHandleMenu() {
            // don't show up at index 0 or down at end
            const btns: PickerButtonDef[] = [
                {
                    icon: "plus",
                    ariaId: "add_rule",
                },
                {
                    icon: "delete",
                    ariaId: "delete_rule",
                },
            ]
            if (this.index > 0) {
                btns.push({
                    icon: "rule_up",
                    ariaId: "rule_up",
                })
            }
            if (this.index < this.page.ruleEditors.length - 2) {
                btns.push({
                    icon: "rule_down",
                    ariaId: "rule_down",
                })
            }
            this.editor.picker.setGroup(btns)
            this.editor.picker.show({
                onClick: index =>
                    this.handleRuleHandleMenuSelection(
                        btns[index].icon as string
                    ),
            })
        }

        private nextEmpty(name: string, index: number) {
            return (
                (name == "sensors" &&
                    this.ruledef.filters.length == 0 &&
                    this.whenInsertBtn) ||
                (name == "filters" &&
                    index == this.ruledef.filters.length - 1 &&
                    (this.whenInsertBtn ||
                        this.ruledef.actuators.length == 0)) ||
                (name == "actuators" &&
                    this.ruledef.modifiers.length == 0 &&
                    this.doInsertBtn) ||
                (name == "modifiers" &&
                    index == this.ruledef.modifiers.length - 1 &&
                    this.doInsertBtn)
            )
        }

        private editTile(name: string, index: number) {
            const ruleTiles = this.ruledef.getRuleRep()[name]
            const tileUpdated = (tile: Tile) => {
                let numberAdded = 0
                let deleted = false
                if (tile) {
                    if (index >= ruleTiles.length) {
                        reportEvent("tile.add", { tid: getTid(tile) })
                        numberAdded = this.ruledef.push(tile, name)
                    } else {
                        reportEvent("tile.update", { tid: getTid(tile) })
                        this.ruledef.updateAt(name, index, tile)
                    }
                } else {
                    deleted = this.ruledef.deleteAt(name, index)
                    reportEvent("tile.delete")
                }
                Language.ensureValid(this.ruledef)
                this.editor.saveAndCompileProgram()
                this.instantiateProgramTiles()
                if (numberAdded == 1 && this.nextEmpty(name, index)) {
                    // Queue a move to the right
                    this.queuedCursorMove = CursorDir.Right
                } else if (numberAdded == 2) {
                    // Queue two moves to the right
                    this.queuedCursorMove = CursorDir.Down
                } else if (deleted) {
                    // Queue a move to the left
                    this.queuedCursorMove = CursorDir.Left
                }
                this.page.changed()
            }
            const newFieldEditor = (tile: ModifierEditor, del = false) => {
                const newOne = del ? tile : tile.getNewInstance()
                const fieldEditor = getFieldEditor(newOne)
                this.editor.captureBackground()
                fieldEditor.editor(
                    newOne.getField(),
                    this.editor.picker,
                    () => {
                        this.editor.releaseBackground()
                        tileUpdated(newOne)
                    },
                    del
                        ? () => {
                              this.editor.releaseBackground()
                              tileUpdated(undefined)
                          }
                        : undefined
                )
            }
            if (
                index < ruleTiles.length &&
                ruleTiles[index] instanceof ModifierEditor
            ) {
                newFieldEditor(ruleTiles[index] as ModifierEditor, true)
                return
            }
            const suggestions = this.getSuggestions(name, index)
            const btns: PickerButtonDef[] = suggestions.map(tile => {
                return {
                    icon: <string>getIcon(tile),
                    ariaId: tidToString(getTid(tile)),
                }
            })
            // special case for field editor
            if (
                suggestions.length == 1 &&
                suggestions[0] instanceof ModifierEditor
            ) {
                let theOne =
                    index > 0 && ruleTiles[index - 1] instanceof ModifierEditor
                        ? (ruleTiles[index - 1] as ModifierEditor)
                        : (suggestions[0] as ModifierEditor)
                newFieldEditor(theOne)
                return
            }
            let onDelete = undefined
            let selectedButton = -1
            if (index < ruleTiles.length) {
                const tile = ruleTiles[index]
                // TODO: don't allow delete on operators
                onDelete = filterModifierWithDelete(tile)
                    ? () => {
                          tileUpdated(undefined)
                      }
                    : undefined
                const selected = btns.indexOf(
                    btns.find(b => b.icon === getIcon(getTid(tile))) // TODO
                )
                if (selected >= 0) {
                    selectedButton = selected
                }
            }
            if (btns.length) {
                this.editor.picker.setGroup(btns)
                this.editor.picker.show({
                    title: accessibility.ariaToTooltip(name),
                    navigator: () => new PickerNavigator(this.editor.picker),
                    onClick: idx => {
                        let theOne = suggestions[idx]
                        if (theOne instanceof ModifierEditor) {
                            // there is more work to do                l
                            theOne =
                                index > 0 &&
                                ruleTiles[index - 1] instanceof ModifierEditor
                                    ? (ruleTiles[index - 1] as ModifierEditor)
                                    : theOne
                            newFieldEditor(theOne)
                        }
                        tileUpdated(theOne)
                    },
                    onDelete,
                    selected: selectedButton,
                })
            }
            return
        }

        private handleRuleHandleMenuSelection(iconId: string) {
            if (iconId === "plus") {
                this.page.insertRuleAt(this.index)
            } else if (iconId === "delete") {
                this.page.deleteRuleAt(this.index)
            } else if (iconId === "rule_up") {
                this.page.moveRuleAt(this.index, true)
            } else if (iconId === "rule_down") {
                this.page.moveRuleAt(this.index, false)
            }
        }

        private showWhenInsertMenu() {
            if (this.ruledef.sensors.length) {
                this.editTile("filters", this.ruledef.filters.length)
            } else {
                this.editTile("sensors", 0)
            }
        }

        private showDoInsertMenu() {
            if (this.ruledef.actuators.length) {
                this.editTile("modifiers", this.ruledef.modifiers.length)
            } else {
                this.editTile("actuators", 0)
            }
        }

        private getSuggestions(name: string, index: number) {
            return Language.getTileSuggestions(this.ruledef, name, index)
        }

        public getRuleButtons() {
            // TODO: can this be done lazily instead?
            const btns: Button[] = []
            btns.push(this.handleBtn)
            this.ruleButtons.sensors.forEach(b => btns.push(b))
            this.ruleButtons.filters.forEach(b => btns.push(b))

            if (this.whenInsertBtn) btns.push(this.whenInsertBtn)

            this.ruleButtons.actuators.forEach(b => btns.push(b))
            this.ruleButtons.modifiers.forEach(b => btns.push(b))

            if (this.doInsertBtn) btns.push(this.doInsertBtn)

            return btns
        }

        public isEmpty() {
            return this.ruledef.isEmpty()
        }

        update() {
            if (this.queuedCursorMove) {
                switch (this.queuedCursorMove) {
                    case CursorDir.Down:
                        control.raiseEvent(
                            ControllerButtonEvent.Pressed,
                            controller.right.id
                        )
                    case CursorDir.Right: {
                        control.raiseEvent(
                            ControllerButtonEvent.Pressed,
                            controller.right.id
                        )
                        break
                    }
                    case CursorDir.Left: {
                        control.raiseEvent(
                            ControllerButtonEvent.Pressed,
                            controller.left.id
                        )
                        break
                    }
                    // Add other cases as needed
                }
                this.queuedCursorMove = undefined
            }
        }

        public layout() {
            const ruleRep = this.ruleButtons
            const v = new Vec2()
            this.whenBounds = new Bounds()

            const whenTiles = ruleRep.sensors.concat(ruleRep.filters)
            const doTiles = ruleRep.actuators.concat(ruleRep.modifiers)
            if (this.whenInsertBtn) whenTiles.push(this.whenInsertBtn)
            if (this.doInsertBtn) doTiles.push(this.doInsertBtn)

            const firstWhenTile = whenTiles[0]
            const lastWhenTile = whenTiles[whenTiles.length - 1]

            this.handleBtn.xfrm.localPos = v
            v.x += this.handleBtn.width
            this.whenBounds.left = v.x

            v.x += firstWhenTile.width >> 1
            v.x += 2

            const layoutButtons = (btns: Button[]) => {
                btns.forEach((btn, index) => {
                    if (index) {
                        v.x += btns[index - 1].width >> 1
                        v.x += btn.width >> 1
                        v.x += 1
                    }
                    btn.xfrm.localPos = v
                })
            }

            layoutButtons(whenTiles)

            v.x += lastWhenTile.bounds.width >> 1
            this.whenBounds.right = v.x

            v.x += this.arrow.bounds.width >> 1
            v.x += 1

            this.arrow.xfrm.localPos.x = v.x
            v.x += this.arrow.bounds.width
            v.x += 2

            layoutButtons(doTiles)

            if (this.doInsertBtn) {
                this.doInsertBtn.xfrm.localPos = v
            }

            this.bounds = undefined

            const updateSizeFromButtons = (btns: Button[]) => {
                btns.forEach(btn => {
                    if (!this.bounds) {
                        this.bounds = btn.bounds
                            .clone()
                            .translate(btn.xfrm.localPos)
                    } else {
                        this.bounds.add(
                            Bounds.Translate(btn.bounds, btn.xfrm.localPos)
                        )
                    }
                })
            }

            updateSizeFromButtons(whenTiles)
            updateSizeFromButtons(doTiles)

            if (!this.bounds) {
                this.bounds = new Bounds()
            } else {
                this.bounds.grow(1)
            }

            // Ensure that the rule "tray" is at least as wide as the screen
            this.innerWidth = this.bounds.width
            this.bounds.width = Math.max(this.bounds.width, Screen.WIDTH)

            this.whenBounds.left = this.bounds.left
            this.whenBounds.top = this.bounds.top
            this.whenBounds.height = this.bounds.height
        }

        isOffScreen(): boolean {
            const y = this.xfrm.worldPos.y
            const b = this.bounds
            return (
                y + b.top > Screen.BOTTOM_EDGE || y + b.bottom < Screen.TOP_EDGE
            )
        }

        draw() {
            control.enablePerfCounter()
            if (this.isOffScreen()) return

            this.drawBackground()
            this.handleBtn.draw()
            if (this.whenInsertBtn) this.whenInsertBtn.draw()
            this.arrow.draw()
            if (this.doInsertBtn) this.doInsertBtn.draw()
            repNames().forEach(name => {
                const buttons = this.ruleButtons[name]
                for (let i = 0; i < buttons.length; ++i) {
                    const btn = buttons[i]
                    if (!btn.isOffScreenX()) btn.draw()
                }
            })
        }

        private drawBackground() {
            control.enablePerfCounter()
            Screen.fillBoundsXfrm(this.xfrm, this.bounds, 11)
            Screen.fillBoundsXfrm(this.xfrm, this.whenBounds, 13)
            Screen.outlineBoundsXfrm(this.xfrm, this.bounds, 1, 12)
        }
    }
}
