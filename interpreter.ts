namespace microcode {
    // an interpreter for ProgramDefn

    // TODO:
    // - strange behavior in sim on coin-flip example
    //  - shake events come very fast??? race condition?
    // - microphone: event -> number doesn't work - number doesn't appear
    //.   - note same behavior not present with temperature
    // - firefly behavior is wrong - switching between pages too fast
    //.    - tokens = cup_x == 3 + 5 (precedence seems wrong)
    //     - result = 5, should be false
    // - no change in operator to right of random-toss (used to work)?
    // - cursor reposition on delete/update rule...
    // - tooltips in picker
    // - round semantics

    // delay on sending stuff in pipes and changing pages
    const ANTI_FREEZE_DELAY = 50

    function createParser(props: expr.ExpressionParserConstructor) {
        const parser = new expr.ExpressionParser({
            variables: props.variables || { pi: 3.141592653589793 },
        })
        const operators: expr.OperatorMap = {
            "+": (a, b) => a + b,
            "-": (a, b) => a - b,
            "*": (a, b) => a * b,
            "/": (a, b) => a / b,
            ">": (a, b) => a > b,
            ">=": (a, b) => a >= b,
            "<": (a, b) => a < b,
            "<=": (a, b) => a <= b,
            "==": (a, b) => a === b,
            "!=": (a, b) => a !== b,
        }
        const functions: expr.FunctionMap = {
            rnd: (s, max: number[]) => Math.floor(Math.random() * max[0]) + 1,
        }
        parser.setFunctions(functions)
        parser.setOperators(operators)
        return parser
    }

    enum OutputResource {
        LEDScreen = 1000,
        Speaker,
        Radio,
        PageCounter,
    }

    class RuleClosure {
        private wakeTime: number = 0
        private actionRunning: boolean = false
        private modifierIndex: number = 0
        private loopIndex: number = 0
        constructor(
            private index: number,
            public rule: RuleDefn,
            private interp: Interpreter
        ) {}

        public active() {
            return this.actionRunning
        }

        kill() {
            this.actionRunning = false
            this.modifierIndex = 0
            this.loopIndex = 0
        }

        public matchWhen(sensorName: string | number, event = 0): boolean {
            const sensor = this.rule.sensor
            if (getKind(sensor) == TileKind.Variable) {
                const pipeId = getParam(sensor)
                if (pipeId == sensorName) return this.filterViaCompare()
            } else {
                const thisSensorName =
                    typeof sensorName == "string" ? tidToSensor(sensor) : ""
                if (
                    sensorName == thisSensorName ||
                    (typeof sensorName == "number" && sensorName == sensor)
                ) {
                    const eventCode = this.lookupEventCode()
                    if (eventCode) {
                        return eventCode == -1 || event == eventCode
                    } else {
                        return this.filterViaCompare()
                    }
                }
            }
            return false
        }

        private filterViaCompare(): boolean {
            if (this.rule.filters.length) {
                return this.interp.getValue(
                    [this.rule.sensor].concat(this.rule.filters),
                    0
                ) as boolean
            } else {
                return true // sensor changed value, but no constraint
            }
        }

        private lookupEventCode() {
            const sensor = this.rule.sensor
            // get default event for sensor, if exists
            let evCode = defaultEventCode(sensor)
            if (evCode) {
                // override if user specifies event code
                for (const m of this.rule.filters)
                    if (getKind(m) == TileKind.EventCode) {
                        return getParam(m)
                    }
                return evCode
            }
            return undefined
        }

        public runDoSection() {
            // make sure we have something to do
            if (this.rule.actuators.length == 0) return
            // prevent re-entrancy
            if (this.actionRunning) return
            this.actionRunning = true
            control.runInBackground(() => {
                while (this.actionRunning) {
                    if (this.wakeTime > 0) {
                        basic.pause(this.wakeTime)
                        this.wakeTime = 0
                    }
                    this.queueAction()
                    // TODO: queueAction asks to run on a resource
                    // TODO: pause here and wait for permission
                    // TODO: if no, permission, stop running this action
                    this.checkForLoopFinish()
                    // yield, otherwise the app will hang
                    basic.pause(0)
                }
            })
        }

        private checkForLoopFinish() {
            if (!this.actionRunning) return
            control.waitMicros(ANTI_FREEZE_DELAY * 1000)
            if (this.modifierIndex < this.rule.modifiers.length) {
                const m = this.rule.modifiers[this.modifierIndex]
                if (getTid(m) == Tid.TID_MODIFIER_LOOP) {
                    if (this.modifierIndex == this.rule.modifiers.length - 1) {
                        // forever loop
                        this.modifierIndex = 0
                    } else {
                        // get the loop bound
                        const loopBound = this.interp.constantFold(
                            this.rule.modifiers.slice(this.modifierIndex + 1),
                            0
                        )
                        this.loopIndex++
                        if (this.loopIndex >= loopBound) {
                            // end of loop
                            this.kill()
                        } else {
                            // repeat
                            this.modifierIndex = 0
                        }
                    }
                }
            } else {
                this.kill()
                // restart timer
                if (this.rule.sensor == Tid.TID_SENSOR_TIMER) {
                    const wake = this.getWakeTime()
                    if (wake > 0) {
                        this.actionRunning = true
                    }
                }
            }
        }

        // use this to determine conflicts between rules
        public getOutputResource() {
            if (this.rule.actuators.length == 0) return undefined
            const action = this.rule.actuators[0]
            switch (action) {
                case Tid.TID_ACTUATOR_PAINT:
                case Tid.TID_ACTUATOR_SHOW_NUMBER:
                    return OutputResource.LEDScreen
                case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
                    return action
                case Tid.TID_ACTUATOR_RADIO_SEND:
                case Tid.TID_ACTUATOR_RADIO_SET_GROUP:
                    return OutputResource.Radio
                case Tid.TID_ACTUATOR_MUSIC:
                case Tid.TID_ACTUATOR_SPEAKER:
                    return OutputResource.Speaker
                case Tid.TID_ACTUATOR_SWITCH_PAGE:
                    return OutputResource.PageCounter
            }
            return undefined
        }

        private queueAction() {
            if (this.wakeTime > 0 || !this.actionRunning) return
            const actuator = this.rule.actuators[0]
            const resource = this.getOutputResource()

            let param: any = undefined
            let oneShot = false
            if (this.rule.modifiers.length == 0) {
                param = defaultModifier(actuator)
            } else {
                switch (actuator) {
                    case Tid.TID_ACTUATOR_PAINT: {
                        const mod = this.rule.modifiers[this.modifierIndex]
                        const modEditor = mod as ModifierEditor
                        param = modEditor.getField()
                        break
                    }
                    case Tid.TID_ACTUATOR_MUSIC: {
                        const mod = this.rule.modifiers[this.modifierIndex]
                        param = (mod as MelodyEditor).getNoteSequence()
                        break
                    }
                    case Tid.TID_ACTUATOR_SPEAKER: {
                        param = getParam(
                            this.rule.modifiers[this.modifierIndex]
                        )
                        break
                    }
                    case Tid.TID_ACTUATOR_SHOW_NUMBER:
                    case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
                    case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
                    case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
                    case Tid.TID_ACTUATOR_RADIO_SEND:
                    case Tid.TID_ACTUATOR_RADIO_SET_GROUP: {
                        param = this.interp.getValue(this.rule.modifiers, 0)
                        oneShot = true
                        break
                    }
                    case Tid.TID_ACTUATOR_SWITCH_PAGE: {
                        let targetPage = 1
                        for (const m of this.rule.modifiers)
                            if (getKind(m) == TileKind.Page)
                                targetPage = getParam(m)
                        param = targetPage
                        oneShot = true
                        break
                    }
                }
            }
            if (!oneShot) this.modifierIndex++
            else this.actionRunning = false // for now
            this.interp.queueAction(this.index, resource, actuator, param)
        }

        public getWakeTime() {
            this.wakeTime = 0
            const sensor = this.rule.sensor
            if (
                sensor == Tid.TID_SENSOR_TIMER ||
                sensor == Tid.TID_SENSOR_START_PAGE
            ) {
                // const timer = this.addProc(name + "_timer")
                let period = 0
                let randomPeriod = 0
                for (const m of this.rule.filters) {
                    const mJdparam = getParam(m)
                    if (getKind(m) == TileKind.Timespan) {
                        if (mJdparam >= 0) period += mJdparam
                        else randomPeriod += -mJdparam // see hack in jdParam
                    }
                }
                if (
                    sensor == Tid.TID_SENSOR_TIMER &&
                    period == 0 &&
                    randomPeriod == 0
                ) {
                    period = 1000 // reasonable default
                }
                if (period == 0) period = ANTI_FREEZE_DELAY
                if (randomPeriod > 0)
                    period += Math.floor(Math.random() * randomPeriod)
                this.wakeTime = period
                return period
            }
            return 0
        }
    }

    // TODO: this should be part of RuntimeHost

    type SensorMap = { [id: string]: { normalized: boolean; tid: number } }
    const sensorInfo: SensorMap = {
        Light: { normalized: true, tid: Tid.TID_SENSOR_LED_LIGHT },
        Microphone: { normalized: true, tid: Tid.TID_SENSOR_MICROPHONE },
        Temperature: { normalized: false, tid: Tid.TID_SENSOR_TEMP },
        Magnet: { normalized: true, tid: Tid.TID_SENSOR_MAGNET },
    }

    function tidToSensor(tid: number): string {
        let result: string = undefined
        Object.keys(sensorInfo).forEach(k => {
            const keyTid = sensorInfo[k].tid
            if (tid == keyTid) result = k
        })
        return result
    }

    export enum SensorChange {
        Up,
        Down,
    }

    export type SensorTid =
        | Tid.TID_SENSOR_ACCELEROMETER
        | Tid.TID_SENSOR_PRESS
        | Tid.TID_SENSOR_RELEASE
        | Tid.TID_SENSOR_RADIO_RECEIVE

    export type ActionTid =
        | Tid.TID_ACTUATOR_PAINT
        | Tid.TID_ACTUATOR_SHOW_NUMBER
        | Tid.TID_ACTUATOR_SPEAKER
        | Tid.TID_ACTUATOR_MUSIC
        | Tid.TID_ACTUATOR_RADIO_SEND
        | Tid.TID_ACTUATOR_RADIO_SET_GROUP

    export interface RuntimeHost {
        // notifications
        emitClearScreen(): void
        // inputs
        registerOnSensorEvent(
            handler: (sensorTid: number, filter: number) => void
        ): void
        // timing, yielding
        // outputs
        execute(tid: ActionTid, param: any): void
    }

    export class Interpreter {
        private exprParser: expr.ExpressionParser = undefined
        private hasErrors: boolean = false
        private running: boolean = false
        private currentPage: number = 0
        private ruleClosures: RuleClosure[] = []
        private activeRuleStepped: number = 0
        private activeRuleCount: number = 0
        private sensors: Sensor[] = []

        // state storage for variables and other temporary global state
        // (local per-rule state is kept in RuleClosure)
        public state: expr.VariableMap = {}

        constructor(private program: ProgramDefn, private host: RuntimeHost) {
            this.host.emitClearScreen()
            this.host.registerOnSensorEvent((t, f) => this.onSensorEvent(t, f))
            this.exprParser = createParser({})
            this.running = true
            this.switchPage(0)
            this.startSensors()
        }

        private stopAllRules() {
            this.ruleClosures.forEach(r => r.kill())
            this.ruleClosures = []
        }

        private switchPage(page: number) {
            console.log(`switch to page ${page}`)
            this.stopAllRules()
            control.waitMicros(ANTI_FREEZE_DELAY * 1000)
            // set up new rule closures
            this.currentPage = page
            this.program.pages[this.currentPage].rules.forEach((r, index) => {
                this.ruleClosures.push(new RuleClosure(index, r, this))
            })
            // start up rules
            this.ruleClosures.forEach(rc => {
                const wake = rc.getWakeTime()
                if (wake > 0) rc.runDoSection()
            })
        }

        public queueAction(
            ruleIndex: number,
            resource: number,
            action: Tile,
            param: any
        ) {
            this.checkForStepCompleted()
            switch (action) {
                case Tid.TID_ACTUATOR_SWITCH_PAGE:
                    this.switchPage(param - 1)
                    return
                case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
                    const varName = getParam(action)
                    this.updateState(ruleIndex, varName, param)
                    return
                default:
                    this.host.execute(action as ActionTid, param)
            }
        }

        // TODO: we need to have the notion of a round in which the various
        // TODO: active rules tell us what they want to update and then at the end
        // TODO: of the round, we decide what updates to actually do

        private updateState(ruleIndex: number, pipe: string, v: number) {
            this.checkForStepCompleted()
            // earliest in lexical order wins for a resource
            this.state[pipe] = v
            control.waitMicros(ANTI_FREEZE_DELAY * 1000)
            // see if any rule matches
            const activeRules: RuleClosure[] = []
            this.ruleClosures.forEach(rc => {
                if (rc.matchWhen(pipe)) activeRules.push(rc)
            })
            this.processNewActiveRules(activeRules)
        }

        private checkForStepCompleted() {
            this.activeRuleStepped++
            if (this.activeRuleCount == this.activeRuleStepped) {
            }
        }

        private processNewActiveRules(activeRules: RuleClosure[]) {
            this.activeRuleStepped = 0
            this.activeRuleCount = this.ruleClosures.filter(rc =>
                rc.active()
            ).length
            activeRules.forEach(r => {
                r.kill()
                r.runDoSection()
            })
        }

        // the following two methods could be unified
        public onSensorEvent(sensorTid: number, filter: number = -1) {
            if (!sensorTid || !this.running) return
            // see if any rule matches
            const activeRules: RuleClosure[] = []
            this.ruleClosures.forEach(rc => {
                if (rc.matchWhen(sensorTid, filter)) activeRules.push(rc)
            })
            this.processNewActiveRules(activeRules)
        }

        private notifySensorChange(
            tid: number,
            name: string,
            val: number,
            change: SensorChange
        ) {
            if (!this.running) return
            // see if any rule matches
            const activeRules: RuleClosure[] = []
            this.ruleClosures.forEach(rc => {
                if (rc.matchWhen(name, change)) activeRules.push(rc)
            })
            this.processNewActiveRules(activeRules)
        }

        private getSensorValue(sensor: Sensor) {
            const gen1to5 = (v: number) => Math.round(4 * v) + 1
            return sensorInfo[sensor.getName()].normalized
                ? gen1to5(sensor.getNormalisedReading())
                : sensor.getReading()
        }

        private startSensors() {
            // initialize sensors
            this.sensors.push(Sensor.getFromName("Light"))
            this.sensors.push(Sensor.getFromName("Temperature"))
            this.sensors.push(Sensor.getFromName("Magnet"))
            this.sensors.push(Sensor.getFromName("Microphone"))
            this.sensors.forEach(s => {
                this.state[s.getName()] = this.getSensorValue(s)
            })
            control.inBackground(() => {
                while (this.running) {
                    // poll the sensors and check for change
                    this.sensors.forEach(s => {
                        const oldReading = this.state[s.getName()] as number
                        const newReading = this.getSensorValue(s)
                        const normalized = sensorInfo[s.getName()].normalized
                        const delta = Math.abs(newReading - oldReading)
                        if (
                            (normalized && newReading != oldReading) ||
                            (!normalized && delta >= 1)
                        ) {
                            this.state[s.getName()] = newReading
                            this.notifySensorChange(
                                sensorInfo[s.getName()].tid,
                                s.getName(),
                                newReading,
                                newReading > oldReading
                                    ? SensorChange.Up
                                    : SensorChange.Down
                            )
                        }
                    })
                    basic.pause(300)
                }
            })
        }

        stop() {
            this.stopAllRules()
            this.running = false
        }

        private error(msg: string) {
            this.hasErrors = true
            console.error("Error: " + msg)
        }

        private getExprValue(expr: Tile): string {
            switch (getTid(expr)) {
                case Tid.TID_OPERATOR_DIVIDE:
                    return "/"
                case Tid.TID_OPERATOR_MULTIPLY:
                    return "*"
                case Tid.TID_OPERATOR_MINUS:
                    return "-"
                case Tid.TID_OPERATOR_PLUS:
                    return "+"
                case Tid.TID_COMPARE_EQ:
                    return "=="
                case Tid.TID_COMPARE_NEQ:
                    return "!="
                case Tid.TID_COMPARE_GT:
                    return ">"
                case Tid.TID_COMPARE_GTE:
                    return ">="
                case Tid.TID_COMPARE_LT:
                    return "<"
                case Tid.TID_COMPARE_LTE:
                    return "<="
            }
            const kind = getKind(expr)
            const param = getParam(expr)
            switch (kind) {
                // TODO: get rid of special casing for Temperature and Radio
                case TileKind.Temperature:
                    return "Temperature"
                case TileKind.Literal:
                    return (param as number).toString()
                case TileKind.Variable:
                    let name = param
                    if (!name) name = tidToSensor(getTid(expr))
                    return name
                case TileKind.RadioValue:
                case TileKind.Radio:
                    return "Radio"
                default:
                    this.error(`can't emit kind ${kind} for ${getTid(expr)}`)
                    return undefined
            }
        }

        // this is for the special case of loops and random-toss
        public constantFold(tiles: Tile[], defl: number) {
            let result = defl
            for (const t of tiles) {
                if (getKind(t) == TileKind.Literal) result += getParam(t)
            }
            return result
        }

        public getValue(tiles: Tile[], defl: number): number | boolean {
            let tokens: string[] = []
            for (let i = 0; i < tiles.length; i++) {
                const m = tiles[i]
                if (getTid(m) == Tid.TID_MODIFIER_RANDOM_TOSS) {
                    const max =
                        i == tiles.length - 1
                            ? 2
                            : this.constantFold(tiles.slice(i + 1), 0)
                    const callRnd = ["rnd", "(", max.toString(), ")"]
                    for (const t of callRnd) {
                        tokens.push(t)
                    }
                    break
                } else {
                    tokens.push(this.getExprValue(m))
                }
            }
            console.log(`tokens = ${tokens.join(" ")}`)
            const result = this.exprParser.evaluate(tokens, this.state)
            console.log(`result = ${result}`)
            return result
        }
    }
}
