namespace microcode {
    // an interpreter for ProgramDefn

    class Error {
        constructor(public msg: string) {}
    }

    // delay on sending stuff in pipes and changing pages
    const ANTI_FREEZE_DELAY = 50

    type ValueType = number | string | boolean | any[] | object
    type VariableMap = { [key: string]: ValueType }
    type SensorMap = { [key: number]: number }

    enum OutputResource {
        LEDScreen = 1000,
        Speaker,
        RadioGroup, // well radio group affects subsequent radio.send
        PageCounter,
    }

    function getOutputResource(action: Tid) {
        switch (action) {
            case Tid.TID_ACTUATOR_PAINT:
            case Tid.TID_ACTUATOR_SHOW_NUMBER:
                return OutputResource.LEDScreen
            case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
            case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
            case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
                return action
            case Tid.TID_ACTUATOR_RADIO_SET_GROUP:
                return OutputResource.RadioGroup
            case Tid.TID_ACTUATOR_MUSIC:
            case Tid.TID_ACTUATOR_SPEAKER:
                return OutputResource.Speaker
            case Tid.TID_ACTUATOR_SWITCH_PAGE:
                return OutputResource.PageCounter
        }
        return undefined
    }

    enum ActionKind {
        Instant,
        Sequence,
    }

    function getActionKind(action: Tid) {
        switch (action) {
            case Tid.TID_ACTUATOR_PAINT:
            case Tid.TID_ACTUATOR_MUSIC:
            case Tid.TID_ACTUATOR_SPEAKER:
                return ActionKind.Sequence
        }
        return ActionKind.Instant
    }

    class RuleClosure {
        private backgroundActive = false
        private wakeTime: number = 0
        private actionRunning: boolean = false
        private modifierIndex: number = 0
        private loopIndex: number = 0
        private timerGoAhead: boolean = false
        constructor(
            public index: number,
            public rule: RuleDefn,
            private interp: Interpreter
        ) {}

        public active() {
            return this.actionRunning
        }

        public start(timer = false) {
            if (this.actionRunning) return
            const time = this.getWakeTime()
            if (!timer || time > 0) this.timerOrSequenceRule()
        }

        kill() {
            this.wakeTime = 0
            this.actionRunning = false
            this.modifierIndex = 0
            this.loopIndex = 0
            // give the background fiber chance to finish
            // otherwise may spawn second on start after kill
            while (this.backgroundActive) {
                basic.pause(0)
            }
        }

        public matchWhen(tid: number, event = 0): boolean {
            const sensor = this.rule.sensor
            if (tid != sensor) return false
            if (
                sensor == Tid.TID_SENSOR_START_PAGE &&
                this.rule.filters.length == 0
            ) {
                return true
            } else if (getKind(sensor) == TileKind.Variable) {
                return this.filterViaCompare()
            } else {
                const eventCode = this.lookupEventCode()
                if (eventCode) {
                    return eventCode == -1 || event == eventCode
                } else {
                    return this.filterViaCompare()
                }
            }
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

        private timerOrSequenceRule() {
            if (this.backgroundActive) {
                this.interp.error(
                    `trying to spawn another background fiber for ${this.index}`
                )
            }
            // make sure we have something to do
            if (this.rule.actuators.length == 0) return
            // prevent re-entrancy
            if (this.actionRunning) return
            this.actionRunning = true
            control.runInBackground(() => {
                this.backgroundActive = true
                while (this.actionRunning) {
                    if (this.wakeTime > 0) {
                        basic.pause(this.wakeTime)
                        this.wakeTime = 0
                        this.interp.addEvent({
                            kind: MicroCodeEventKind.TimerFire,
                            ruleIndex: this.index,
                        } as TimerEvent)
                        this.timerGoAhead = false
                        while (this.actionRunning && !this.timerGoAhead) {
                            basic.pause(1)
                        }
                    }

                    if (!this.actionRunning) break
                    this.runAction()

                    const actionKind = this.getActionKind()
                    if (actionKind === ActionKind.Sequence) this.modifierIndex++
                    else this.modifierIndex = this.rule.modifiers.length

                    if (!this.actionRunning) break
                    this.checkForLoopFinish()

                    // yield, otherwise the app will hang
                    basic.pause(5)
                }
                this.backgroundActive = false
                // restart timer
                if (this.rule.sensor == Tid.TID_SENSOR_TIMER) {
                    this.interp.addEvent({
                        kind: MicroCodeEventKind.RestartTimer,
                        ruleIndex: this.index,
                    } as TimerEvent)
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
                        const loopBound = this.interp.getValue(
                            this.rule.modifiers.slice(this.modifierIndex + 1),
                            0
                        ) as number
                        this.loopIndex++
                        if (this.loopIndex >= loopBound) {
                            this.actionRunning = false
                        } else {
                            this.modifierIndex = 0
                        }
                    }
                }
            } else {
                this.actionRunning = false
            }
        }

        public releaseTimer() {
            this.timerGoAhead = true
        }

        // use this to determine conflicts between rules
        public getOutputResource() {
            if (this.rule.actuators.length == 0) return undefined
            return getOutputResource(this.rule.actuators[0])
        }

        public getActionKind() {
            if (this.rule.actuators.length == 0) return undefined
            return getActionKind(this.rule.actuators[0])
        }

        public getParamInstant() {
            const actuator = this.rule.actuators[0]
            if (this.rule.modifiers.length == 0)
                return defaultModifier(actuator)

            switch (actuator) {
                case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
                case Tid.TID_ACTUATOR_SHOW_NUMBER:
                case Tid.TID_ACTUATOR_RADIO_SEND:
                case Tid.TID_ACTUATOR_RADIO_SET_GROUP: {
                    return this.interp.getValue(this.rule.modifiers, 0)
                }
                case Tid.TID_ACTUATOR_SWITCH_PAGE: {
                    let targetPage = 1
                    for (const m of this.rule.modifiers)
                        if (getKind(m) == TileKind.Page)
                            targetPage = getParam(m)
                    return targetPage
                }
            }
            return undefined
        }

        public runInstant() {
            const actuator = this.rule.actuators[0]
            const param = this.getParamInstant()
            this.interp.runAction(this.index, actuator, param)
            this.kill()
        }

        private runAction() {
            const actuator = this.rule.actuators[0]
            let param: any = undefined
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
                        // TODO: get the whole sequence and do as one shot, to avoid burps
                        const mod = this.rule.modifiers[this.modifierIndex]
                        param = (mod as MelodyEditor).getNoteSequence()
                        break
                    }
                    case Tid.TID_ACTUATOR_SPEAKER: {
                        param = this.rule.modifiers[this.modifierIndex]
                        break
                    }
                    default:
                        param = this.getParamInstant()
                }
            }
            this.interp.runAction(this.index, actuator, param)
            if (this.getActionKind() === ActionKind.Instant)
                this.interp.processNewState()
        }

        private getWakeTime() {
            this.wakeTime = 0
            const sensor = this.rule.sensor
            if (
                sensor == Tid.TID_SENSOR_TIMER ||
                sensor == Tid.TID_SENSOR_START_PAGE
            ) {
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
                if (randomPeriod > 0)
                    period += Math.floor(Math.random() * randomPeriod)
                this.wakeTime = period
                return period
            }
            return 0
        }
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
        emitClearScreen(): void
        registerOnSensorEvent(
            handler: (tid: number, filter: number) => void
        ): void
        getSensorValue(tid: number, normalized: boolean): number
        execute(tid: ActionTid, param: any): void
    }

    const vars2tids: VariableMap = {
        cup_x: Tid.TID_SENSOR_CUP_X_WRITTEN,
        cup_y: Tid.TID_SENSOR_CUP_Y_WRITTEN,
        cup_z: Tid.TID_SENSOR_CUP_Z_WRITTEN,
    }

    enum MicroCodeEventKind {
        StateUpdate,
        SensorUpdate,
        SwitchPage,
        StartPage,
        TimerFire,
        RestartTimer,
    }

    interface MicroCodeEvent {
        kind: MicroCodeEventKind
    }

    interface StateUpdateEvent extends MicroCodeEvent {
        kind: MicroCodeEventKind.StateUpdate
        updatedVars: string[]
    }

    interface SensorUpdateEvent extends MicroCodeEvent {
        kind: MicroCodeEventKind.SensorUpdate
        sensor: number
        filter: number
    }

    interface SwitchPageEvent extends MicroCodeEvent {
        kind: MicroCodeEventKind.SwitchPage
        index: number
    }

    interface TimerEvent extends MicroCodeEvent {
        kind: MicroCodeEventKind.TimerFire | MicroCodeEventKind.RestartTimer
        ruleIndex: number
    }

    interface StartPageEvent extends MicroCodeEvent {
        kind: MicroCodeEventKind.StartPage
    }

    const sensorTids = [
        Tid.TID_SENSOR_LED_LIGHT,
        // Tid.TID_SENSOR_MICROPHONE,
        Tid.TID_SENSOR_TEMP,
        Tid.TID_SENSOR_MAGNET,
    ]

    export class Interpreter {
        private hasErrors: boolean = false
        private running: boolean = false
        private currentPage: number = 0
        private ruleClosures: RuleClosure[] = []

        // state storage for variables and other temporary global state
        // (local per-rule state is kept in RuleClosure)
        public state: VariableMap = {}
        public newState: VariableMap = {}
        // state storage for sensor values
        public sensors: SensorMap = {}

        constructor(private program: ProgramDefn, private host: RuntimeHost) {
            this.host.emitClearScreen()
            this.host.registerOnSensorEvent((t, f) =>
                this.onSensorEvent(t, f, f)
            )
            for (const v of Object.keys(vars2tids)) this.state[v] = 0
            for (const tid of sensorTids)
                this.sensors[tid] = this.getSensorValue(tid)
            this.running = true
            // get ready to receive events
            this.setupEventQueue()
            this.switchPage(0)
        }

        private stopAllRules() {
            this.ruleClosures.forEach(r => r.kill())
            this.ruleClosures = []
        }

        private switchPage(page: number) {
            this.stopAllRules()
            // set up new rule closures
            this.currentPage = page
            this.program.pages[this.currentPage].rules.forEach((r, index) => {
                this.ruleClosures.push(new RuleClosure(index, r, this))
            })
            this.addEvent({
                kind: MicroCodeEventKind.StartPage,
            } as StartPageEvent)
            // on start of each page, we allow checking of variables
            this.addEvent({
                kind: MicroCodeEventKind.StateUpdate,
                updatedVars: Object.keys(vars2tids),
            } as StateUpdateEvent)
            // start up timer-based rules
            this.ruleClosures.forEach(rc => rc.start(true))
        }

        public runAction(ruleIndex: number, action: Tile, param: any) {
            switch (action) {
                case Tid.TID_ACTUATOR_SWITCH_PAGE:
                    if (param) {
                        // no switch if no param
                        this.addEvent({
                            kind: MicroCodeEventKind.SwitchPage,
                            index: param,
                        } as SwitchPageEvent)
                    }
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

        private updateState(ruleIndex: number, varName: string, v: number) {
            if (!this.newState) this.newState = {}
            this.newState[varName] = v
        }

        public processNewState() {
            const updatedVars = Object.keys(this.newState)
            if (updatedVars.length) {
                updatedVars.forEach(k => {
                    this.state[k] = this.newState[k]
                })
                this.addEvent({
                    kind: MicroCodeEventKind.StateUpdate,
                    updatedVars: updatedVars,
                } as StateUpdateEvent)
            }
            this.newState = {}
        }

        private processNewRules(newRules: RuleClosure[]) {
            if (newRules.length == 0) return
            // first new rule (in lexical order) on a resource wins
            const resourceWinner: { [resource: number]: number } = {}
            for (const rc of newRules) {
                const resource = rc.getOutputResource()
                const currentWinner = resourceWinner[resource]
                if (currentWinner === undefined || rc.index < currentWinner)
                    resourceWinner[resource] = rc.index
            }

            const liveIndices = Object.keys(resourceWinner).map(
                k => resourceWinner[parseInt(k)]
            )
            const live = newRules.filter(rc =>
                liveIndices.some(i => i === rc.index)
            )
            const dead = this.ruleClosures.filter(rc => {
                const resource = rc.getOutputResource()
                const res =
                    live.indexOf(rc) === -1 &&
                    rc.active() &&
                    resourceWinner[resource] != undefined
                return res
            })
            dead.forEach(rc => {
                rc.kill()
            })

            // partition the live into instant and sequence
            const instant = live.filter(
                rc => rc.getActionKind() === ActionKind.Instant
            )

            // execute the instant ones right now (guaranteed no conflict)
            instant.forEach(rc => {
                const resource = rc.getOutputResource()
                if (resource != OutputResource.PageCounter) {
                    rc.runInstant()
                }
            })
            this.processNewState()

            const switchPage = instant.find(
                rc => rc.getOutputResource() == OutputResource.PageCounter
            )
            if (switchPage) {
                switchPage.runInstant()
                return // others don't get chance to run
            }

            const sequence = live.filter(
                rc => rc.getActionKind() === ActionKind.Sequence
            )

            sequence.forEach(rc => {
                rc.kill()
                rc.start()
            })
        }

        private eventQueue: MicroCodeEvent[] = []
        public addEvent(event: MicroCodeEvent) {
            this.eventQueue.push(event)
        }

        private setupEventQueue() {
            const newRules = (sensor: number, filter: number) => {
                return this.ruleClosures.filter(rc =>
                    rc.matchWhen(sensor, filter)
                )
            }
            control.inBackground(() => {
                while (this.running) {
                    // TODO: drain entire queue
                    if (this.eventQueue.length) {
                        const ev = this.eventQueue[0]
                        this.eventQueue.removeAt(0)
                        switch (ev.kind) {
                            case MicroCodeEventKind.StateUpdate: {
                                control.waitMicros(ANTI_FREEZE_DELAY * 1000)
                                const event = ev as StateUpdateEvent
                                const rules = event.updatedVars.map(v => {
                                    const tid = vars2tids[v] as number
                                    return newRules(tid, -1)
                                })
                                // flatten into one list
                                let newOnes: RuleClosure[] = []
                                rules.forEach(l => {
                                    newOnes = newOnes.concat(l)
                                })
                                this.processNewRules(newOnes)
                                break
                            }
                            case MicroCodeEventKind.SensorUpdate: {
                                const event = ev as SensorUpdateEvent
                                // see if any rule matches
                                this.processNewRules(
                                    newRules(event.sensor, event.filter)
                                )
                                break
                            }
                            case MicroCodeEventKind.SwitchPage: {
                                control.waitMicros(ANTI_FREEZE_DELAY * 1000)
                                const event = ev as SwitchPageEvent
                                this.switchPage(event.index - 1)
                                break
                            }
                            case MicroCodeEventKind.StartPage: {
                                this.processNewRules(
                                    newRules(Tid.TID_SENSOR_START_PAGE, -1)
                                )
                                break
                            }
                            case MicroCodeEventKind.RestartTimer: {
                                const event = ev as TimerEvent
                                const rc = this.ruleClosures[event.ruleIndex]
                                rc.start()
                            }
                            case MicroCodeEventKind.TimerFire: {
                                const event = ev as TimerEvent
                                const rc = this.ruleClosures[event.ruleIndex]
                                // TODO: this isn't good enough, we need to
                                // TODO: kill rules that are conflicting
                                rc.releaseTimer()
                                break
                            }
                        }
                    }
                    basic.pause(10)
                }
            })
        }

        public onSensorEvent(tid: number, newVal: number, filter: number = -1) {
            this.state[tid] = newVal
            this.addEvent({
                kind: MicroCodeEventKind.SensorUpdate,
                sensor: tid,
                filter: filter,
            } as SensorUpdateEvent)
        }

        private microcodeClassic = false
        private getSensorValue(tid: number): number {
            const gen1to5 = (v: number) => Math.round(4 * v) + 1
            return this.microcodeClassic
                ? gen1to5(this.host.getSensorValue(tid, true))
                : this.host.getSensorValue(tid, false)
        }

        private startSensors() {
            control.inBackground(() => {
                while (this.running) {
                    // poll the sensors and check for change
                    sensorTids.forEach(tid => {
                        const oldReading = this.sensors[tid]
                        const newReading = this.getSensorValue(tid)
                        // note: normalized is for 1-5 scale
                        // note: for non-normalized, delta should be a function of range (min,max)
                        const delta = Math.abs(newReading - oldReading)
                        if (
                            (this.microcodeClassic &&
                                newReading != oldReading) ||
                            (!this.microcodeClassic && delta >= 1)
                        ) {
                            this.onSensorEvent(
                                tid,
                                newReading,
                                newReading > oldReading
                                    ? SensorChange.Up
                                    : SensorChange.Down
                            )
                        }
                    })
                    basic.pause(200)
                }
            })
        }

        stop() {
            this.stopAllRules()
            this.running = false
        }

        public error(msg: string) {
            this.hasErrors = true
            throw new Error("Error: " + msg)
        }

        private getExprValue(expr: Tile): string {
            const tid = getTid(expr)
            switch (tid) {
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
            const lookupVar = (v: string) => {
                return (this.state[v] as number).toString()
            }
            const lookupSensor = (tid: number) => {
                return (this.sensors[tid] as number).toString()
            }
            switch (kind) {
                case TileKind.Sensor:
                    return lookupSensor(tid)
                case TileKind.Literal:
                    return (param as number).toString()
                case TileKind.Variable:
                    return lookupVar(param)
                default:
                    this.error(`can't emit kind ${kind} for ${getTid(expr)}`)
                    return undefined
            }
        }

        public getValue(tiles: Tile[], defl: number): number | boolean {
            let tokens: string[] = []
            const rnd = (max: number) => Math.floor(Math.random() * max) + 1
            for (let i = 0; i < tiles.length; i++) {
                const m = tiles[i]
                if (getTid(m) == Tid.TID_MODIFIER_RANDOM_TOSS) {
                    const max =
                        i == tiles.length - 1
                            ? 2
                            : (this.getValue(tiles.slice(i + 1), 0) as number)
                    tokens.push(rnd(max).toString())
                    break
                } else {
                    tokens.push(this.getExprValue(m))
                }
            }
            const result = new parser.Parser(tokens).parse()
            return result
        }
    }
}
