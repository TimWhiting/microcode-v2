namespace microcode {
    export interface Constraints {
        provides?: number[]
        requires?: number[]
        only?: (string | number)[]
        allow?: (string | number)[]
        disallow?: (string | number)[]
    }

    function mergeConstraints(src: Constraints, dst: Constraints) {
        if (!src) {
            return
        }
        if (src.provides) {
            src.provides.forEach(item => dst.provides.push(item))
        }
        if (src.requires) {
            src.requires.forEach(item => dst.requires.push(item))
        }
        if (src.only) {
            src.only.forEach(item => dst.only.push(item))
        }
        if (src.allow) {
            src.allow.forEach(item => dst.allow.push(item))
        }
        if (src.disallow) {
            src.disallow.forEach(item => dst.disallow.push(item))
        }
    }

    function isCompatibleWith(src: Constraints, c: Constraints): boolean {
        if (!src) return true
        if (src.requires) {
            let compat = false
            src.requires.forEach(
                req => (compat = compat || c.provides.some(pro => pro === req))
            )
            if (!compat) return false
        }
        return true
    }

    function filterModifierCompat(
        tile: Tile,
        category: string | number,
        c: Constraints
    ): boolean {
        const tid = getTid(tile)
        const only = c.only.some(cat => cat === category || cat === tid)
        if (only) return true
        if (c.only.length) return false

        const allows = c.allow.some(cat => cat === category || cat === tid)
        if (!allows) return false

        const disallows = !c.disallow.some(
            cat => cat === category || cat === tid
        )
        if (!disallows) return false

        return true
    }

    export type Tile = number | ModifierEditor

    export function getTid(tile: Tile): number {
        if (tile instanceof ModifierEditor) return tile.tid
        return tile
    }

    export function getIcon(tile: Tile) {
        if (tile instanceof ModifierEditor) return tile.getIcon()
        return tile
    }

    export type RuleRep = { [name: string]: Tile[] }
    export class RuleDefn {
        sensors: number[]
        filters: number[]
        actuators: number[]
        modifiers: Tile[]

        constructor() {
            this.sensors = []
            this.filters = []
            this.actuators = []
            this.modifiers = []
        }

        get sensor() {
            if (this.sensors.length == 0) return Tid.TID_SENSOR_START_PAGE
            return this.sensors[0]
        }

        public getRuleRep(): RuleRep {
            return {
                sensors: this.sensors,
                filters: this.filters,
                actuators: this.actuators,
                modifiers: this.modifiers,
            }
        }

        public isEmpty(): boolean {
            return this.sensors.length === 0 && this.actuators.length === 0
        }

        public push(tile: Tile, name: string): number {
            const tiles = this.getRuleRep()[name]
            tiles.push(tile)
            if (name == "filters" || name == "modifiers") {
                if (
                    name == "filters" &&
                    tiles.length == 1 &&
                    !isComparisonOperator(getTid(tiles[0]))
                ) {
                    if (
                        (getKind(this.sensor) == TileKind.Radio &&
                            this.sensor != Tid.TID_SENSOR_LINE) ||
                        getKind(this.sensor) == TileKind.Variable
                    ) {
                        tiles.insertAt(0, Tid.TID_COMPARE_EQ)
                        return 2
                    }
                } else {
                    const index = tiles.length - 2
                    if (index >= 0) {
                        const secondLast = tiles[index]
                        if (
                            (getKind(secondLast) == TileKind.Literal ||
                                getKind(secondLast) == TileKind.Variable) &&
                            (getKind(tile) == TileKind.Literal ||
                                getKind(tile) == TileKind.Variable ||
                                getKind(tile) == TileKind.RandomToss)
                        ) {
                            tiles.insertAt(index + 1, Tid.TID_OPERATOR_PLUS)
                            return 2
                        }
                    }
                }
            }
            return 1
        }

        public deleteAt(name: string, index: number) {
            const ruleTiles = this.getRuleRep()[name]
            const tile = ruleTiles[index]
            ruleTiles.splice(index, 1)
            // TODO: random toss deleted, followed by a math operator
            if (name == "filters" || name == "modifiers") {
                const newIndex = this.deleteIncompatibleTiles(name, index, tile)
                return newIndex < index
            }
            return false
        }

        private getSuggestions(name: string, index: number) {
            return Language.getTileSuggestions(this, name, index)
        }

        private deleteIncompatibleTiles(
            name: string,
            index: number,
            tile: Tile
        ): number {
            const doit = (name: string, i: number) => {
                const ruleTiles = this.getRuleRep()[name]

                while (i < ruleTiles.length) {
                    const suggestions = this.getSuggestions(name, i)
                    const compatible = suggestions.find(
                        t => getTid(t) == getTid(ruleTiles[i])
                    )
                    if (compatible) i++
                    else {
                        ruleTiles.splice(i, ruleTiles.length - i)
                        return false
                    }
                }
                return true
            }
            // first, look to see if we should delete a math operator
            const ruleTiles = this.getRuleRep()[name]
            if (index > 0) {
                const tile = ruleTiles[index - 1]
                if (isMathOperator(getTid(tile))) {
                    ruleTiles.splice(index - 1, 1)
                    index--
                }
            } else if (index == 0) {
                const tile = ruleTiles[index]
                if (isMathOperator(getTid(tile))) {
                    ruleTiles.splice(index, 1)
                }
            }
            // now delete incompatible tiles
            doit(name, index)
            if (name === "filters") {
                // a change in the the when section may affect the do section
                let ok = doit("actuators", 0)
                if (ok) doit("modifiers", 0)
                else this.getRuleRep()["modifiers"] = []
            }
            return index
        }

        public updateAt(name: string, index: number, tile: Tile) {
            const tiles = this.getRuleRep()[name]
            const oldTile = tiles[index]
            tiles[index] = tile
            if (oldTile != tile) {
                if (
                    oldTile == Tid.TID_MODIFIER_RANDOM_TOSS ||
                    tile == Tid.TID_MODIFIER_RANDOM_TOSS
                )
                    tiles.splice(index + 1, tiles.length - (index + 1))
            }
        }

        public toBuffer(bw: BufferWriter) {
            if (this.isEmpty()) return
            bw.writeByte(this.sensor)
            this.filters.forEach(filter => bw.writeByte(filter))
            this.actuators.forEach(act => bw.writeByte(act))
            this.modifiers.forEach(mod => {
                bw.writeByte(getTid(mod))
                const fieldEditor = getFieldEditor(mod)
                if (fieldEditor) {
                    bw.writeBuffer(
                        fieldEditor.toBuffer((mod as ModifierEditor).getField())
                    )
                }
            })
        }

        public static fromBuffer(br: BufferReader) {
            const defn = new RuleDefn()
            assert(!br.eof())
            const sensorEnum = br.readByte()
            assert(isSensor(sensorEnum))
            defn.sensors.push(sensorEnum)
            assert(!br.eof())
            while (isFilter(br.peekByte())) {
                const filterEnum = br.readByte()
                defn.push(filterEnum, "filters")
                assert(!br.eof())
            }
            assert(!br.eof())
            if (!isActuator(br.peekByte())) {
                return defn
            }
            assert(!br.eof())
            const actuatorEnum = br.readByte()
            defn.actuators.push(actuatorEnum)
            assert(!br.eof())
            while (isModifier(br.peekByte())) {
                const modifierEnum = br.readByte()
                const modifier = getEditor(modifierEnum)
                if (modifier instanceof ModifierEditor) {
                    const field = modifier.fieldEditor.fromBuffer(br)
                    const newOne = modifier.getNewInstance(field)
                    defn.modifiers.push(<any>newOne)
                } else {
                    defn.push(modifierEnum, "modifiers")
                }
                assert(!br.eof())
            }
            return defn
        }
    }

    export class PageDefn {
        rules: RuleDefn[]

        constructor() {
            this.rules = []
        }

        public trim() {
            while (
                this.rules.length &&
                this.rules[this.rules.length - 1].isEmpty()
            ) {
                this.rules.pop()
            }
        }

        public deleteRuleAt(index: number) {
            if (index >= 0 && index < this.rules.length) {
                this.rules.splice(index, 1)
            }
        }

        public insertRuleAt(index: number) {
            if (index >= 0 && index < this.rules.length) {
                const newRule = new RuleDefn()
                // STS Array.splice doesn't support insert :(
                // this.rules.splice(index, 0, new RuleDefn());
                const newRules: RuleDefn[] = []
                for (let i = 0; i < index; ++i) {
                    newRules.push(this.rules[i])
                }
                newRules.push(newRule)
                for (let i = index; i < this.rules.length; ++i) {
                    newRules.push(this.rules[i])
                }
                this.rules = newRules
                return newRule
            }
            return undefined
        }

        public toBuffer(bw: BufferWriter) {
            this.rules.forEach(rule => rule.toBuffer(bw))
            bw.writeByte(Tid.END_OF_PAGE)
        }

        public static fromBuffer(br: BufferReader) {
            const defn = new PageDefn()
            assert(!br.eof())
            while (br.peekByte() != Tid.END_OF_PAGE) {
                defn.rules.push(RuleDefn.fromBuffer(br))
                assert(!br.eof())
            }
            br.readByte()
            return defn
        }
    }

    export function PAGE_IDS() {
        return [
            Tid.TID_MODIFIER_PAGE_1,
            Tid.TID_MODIFIER_PAGE_2,
            Tid.TID_MODIFIER_PAGE_3,
            Tid.TID_MODIFIER_PAGE_4,
            Tid.TID_MODIFIER_PAGE_5,
        ]
    }

    export class ProgramDefn {
        pages: PageDefn[]

        constructor() {
            this.pages = PAGE_IDS().map(id => new PageDefn())
        }

        public trim() {
            this.pages.map(page => page.trim())
        }

        public toBuffer() {
            const bw = new BufferWriter()
            const magic = Buffer.create(4)
            magic.setNumber(NumberFormat.UInt32LE, 0, 0x3e92f825)
            bw.writeBuffer(magic)
            this.pages.forEach(page => page.toBuffer(bw))
            bw.writeByte(Tid.END_OF_PROG)
            console.log(`toBuffer: ${bw.length}b`)
            return bw.buffer
        }

        public static fromBuffer(br: BufferReader) {
            const defn = new ProgramDefn()
            assert(!br.eof())
            const magic = br.readBuffer(4)
            if (magic.getNumber(NumberFormat.UInt32LE, 0) != 0x3e92f825) {
                console.log("bad magic")
                return defn
            }
            defn.pages = []
            assert(!br.eof())
            while (br.peekByte() != Tid.END_OF_PROG) {
                defn.pages.push(PageDefn.fromBuffer(br))
                assert(!br.eof())
            }
            br.readByte()
            return defn
        }
    }

    function mkConstraints(): Constraints {
        const c: Constraints = {
            provides: [],
            only: [],
            requires: [],
            allow: [],
            disallow: [],
        }
        return c
    }

    export class Language {
        public static getTileSuggestions(
            rule: RuleDefn,
            name: string,
            index: number
        ): Tile[] {
            const tile = rule.getRuleRep()[name][index]

            let rangeName = name
            if (isComparisonOperator(getTid(tile)))
                rangeName = "comparisonOperators"
            else if (isMathOperator(getTid(tile))) rangeName = "mathOperators"

            // based on the name, we have a range of tiles to choose from
            const [lower, upper] = ranges[rangeName]
            let all: Tile[] = []
            for (let i = lower; i <= upper; ++i) {
                const ed = getEditor(i)
                if (ed) all.push(ed)
                else all.push(i)
            }
            all = all
                .filter((tile: Tile) => isVisible(tile))
                .sort((t1, t2) => priority(t1) - priority(t2))

            if (name === "sensors" || name === "actuators") return all

            // Collect existing tiles up to index.
            let existing: Tile[] = []
            const ruleRep = rule.getRuleRep()
            for (let i = 0; i < index; ++i) {
                const tile = ruleRep[name][i]
                existing.push(tile)
            }

            // Return empty set if the last existing tile is a "terminal".
            if (existing.length) {
                const last = existing[existing.length - 1]
                if (
                    isTerminal(last) ||
                    (name === "filters" && isTerminal(rule.sensors[0])) ||
                    (name === "modifiers" && isTerminal(rule.actuators[0]))
                ) {
                    return []
                }
            }

            // Collect the built-up constraints.
            const collect = mkConstraints()
            if (name === "modifiers" && rule.actuators.length) {
                const src = getConstraints(rule.actuators[0])
                mergeConstraints(src, collect)
            }
            if (rule.sensors.length) {
                const src = getConstraints(rule.sensors[0])
                mergeConstraints(src, collect)
            }

            existing.forEach(tile => {
                const src = getConstraints(tile)
                mergeConstraints(src, collect)
            })

            return all.filter(tile => {
                const src = getConstraints(tile)
                const cat = getCategory(tile)
                return (
                    isCompatibleWith(src, collect) &&
                    filterModifierCompat(tile, cat, collect)
                )
            })
        }

        public static ensureValid(rule: RuleDefn) {
            // TODO: Handle more cases. ex:
            // - filters not valid for new sensor
            // - modifiers not valid for new sensor or actuator
            if (!rule.sensors.length) {
                rule.filters = []
            }
            if (!rule.actuators.length) {
                rule.modifiers = []
            }
        }
    }
}
