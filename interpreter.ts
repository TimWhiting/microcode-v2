namespace microcode {
    // an interpreter for ProgramDefn

    // TODO:

    // Runtime:
    // - microphone: event -> number doesn't work - number doesn't appear
    //.   - note same behavior not present with temperature
    // - firefly: 1/4 timer not firing?
    //    - timer not getting restarted...
    // - round semantics

    // Editor: no change in operator to right of random-toss (used to work)?
    // - cursor reposition on delete/update rule...
    // - tooltips in picker

    // delay on sending stuff in pipes and changing pages
    const ANTI_FREEZE_DELAY = 50

    type ValueType = number | string | boolean | any[] | object
    type VariableMap = { [key: string]: ValueType }

    enum OutputResource {
        LEDScreen = 1000,
        Speaker,
        RadioGroup,
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
        private wakeTime: number = 0
        private actionRunning: boolean = false
        private modifierIndex: number = 0
        private loopIndex: number = 0
        constructor(
            public index: number,
            public rule: RuleDefn,
            private interp: Interpreter
        ) {}

        public start() {
            if (this.actionRunning) return
            const wakeTime = this.getWakeTime()
            if (wakeTime > 0) this.timerBasedRule()
        }

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
            if (
                sensor == Tid.TID_SENSOR_START_PAGE &&
                this.rule.filters.length == 0
            ) {
                // this rule immediately starts when we switch to its page
                return true
            } else if (getKind(sensor) == TileKind.Variable) {
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

        private timerBasedRule() {
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
                        this.interp.addEvent({
                            kind: MicroCodeEventKind.TimerFire,
                            ruleIndex: this.index,
                        } as TimerFireEvent)
                        // TODO: wait for notification to go ahead
                        // TODO: as the interp must kill conflicting rules
                    }
                    this.runAction()
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
            return getOutputResource(this.rule.actuators[0])
        }

        public getActionKind() {
            if (this.rule.actuators.length == 0) return undefined
            return getActionKind(this.rule.actuators[0])
        }

        private getParamInstant() {
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
            this.modifierIndex = this.rule.modifiers.length
            const resource = this.getOutputResource()
            this.interp.runAction(this.index, resource, actuator, param)
        }

        private runAction() {
            if (this.wakeTime > 0 || !this.actionRunning) return
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
                    default:
                        param = this.getParamInstant()
                }
            }
            if (this.getActionKind() === ActionKind.Sequence)
                this.modifierIndex++
            else this.modifierIndex = this.rule.modifiers.length

            const resource = this.getOutputResource()
            this.interp.runAction(this.index, resource, actuator, param)
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

    const vars = ["cup_x", "cup_y", "cup_z"]

    enum MicroCodeEventKind {
        StateUpdate,
        SensorUpdate,
        SwitchPage,
        StartPage,
        TimerFire,
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
        sensor: string | number
        filter: number
    }

    interface SwitchPageEvent extends MicroCodeEvent {
        kind: MicroCodeEventKind.SwitchPage
        index: number
    }

    interface TimerFireEvent extends MicroCodeEvent {
        kind: MicroCodeEventKind.TimerFire
        ruleIndex: number
    }

    interface StartPageEvent extends MicroCodeEvent {
        kind: MicroCodeEventKind.StartPage
    }

    export class Interpreter {
        private hasErrors: boolean = false
        private running: boolean = false
        private currentPage: number = 0
        private ruleClosures: RuleClosure[] = []
        private sensors: Sensor[] = []

        // state storage for variables and other temporary global state
        // (local per-rule state is kept in RuleClosure)
        public state: VariableMap = {}
        public newState: VariableMap = undefined

        constructor(private program: ProgramDefn, private host: RuntimeHost) {
            this.host.emitClearScreen()
            this.host.registerOnSensorEvent((t, f) => this.onSensorEvent(t, f))
            for (const v of vars) this.state[v] = 0
            for (const v of Object.keys(sensorInfo)) this.state[v] = 0
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
            this.addEvent({ kind: MicroCodeEventKind.StartPage })
        }

        public runAction(
            ruleIndex: number,
            resource: number,
            action: Tile,
            param: any
        ) {
            switch (action) {
                case Tid.TID_ACTUATOR_SWITCH_PAGE:
                    this.switchPage(param - 1)
                    return
                case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Z_ASSIGN:
                    const varName = getParam(action)
                    this.updateState(ruleIndex, varName, param)
                    // TODO: current state gets new state
                    return
                default:
                    this.host.execute(action as ActionTid, param)
            }
        }

        private updateState(ruleIndex: number, varName: string, v: number) {
            if (!this.newState) this.newState = {}
            this.newState[varName] = v
            control.waitMicros(ANTI_FREEZE_DELAY * 1000)
            const ev: StateUpdateEvent = this.eventQueue.find(
                ev => ev.kind == MicroCodeEventKind.StateUpdate
            ) as StateUpdateEvent
            if (ev) {
                ev.updatedVars.push(varName)
            } else
                this.addEvent({
                    kind: MicroCodeEventKind.StateUpdate,
                    updatedVars: [varName],
                } as StateUpdateEvent)
        }

        private processNewRules(newRules: RuleClosure[]) {
            // first new rule (in lexical order) on a resource wins
            const resourceWinner: { [resource: number]: number } = {}
            for (const rc of newRules) {
                const resource = rc.getOutputResource()
                const currentWinner = resourceWinner[resource]
                if (
                    !currentWinner ||
                    (currentWinner && rc.index < currentWinner)
                )
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
                return (
                    live.indexOf(rc) === -1 &&
                    resourceWinner[resource] != undefined
                )
            })
            dead.forEach(rc => rc.kill())

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

            const switchPage = instant.find(
                rc => rc.getOutputResource() == OutputResource.PageCounter
            )
            if (switchPage) {
                this.eventQueue.insertAt(0, {
                    kind: MicroCodeEventKind.SwitchPage,
                })
                // TODO: put on the head of the event queue
                return
            }

            // start up the others, but notice that they be active already, so kill first
            const takesTime = live.filter(
                rc => rc.getActionKind() === ActionKind.Sequence
            )
            takesTime.forEach(rc => {
                rc.kill()
                rc.start()
            })
        }

        private eventQueue: MicroCodeEvent[] = []
        public addEvent(event: MicroCodeEvent) {
            this.eventQueue.push(event)
        }

        private processEventQueue() {
            control.inBackground(() => {
                while (this.running) {
                    if (this.eventQueue.length) {
                        const event = this.eventQueue[0]
                        this.eventQueue.removeAt(0)
                        switch (event.kind) {
                            case MicroCodeEventKind.StateUpdate:
                            // map variables to tids
                            case MicroCodeEventKind.SensorUpdate:
                            case MicroCodeEventKind.PageChange:
                            case MicroCodeEventKind.StartPage:
                            case MicroCodeEventKind.TimerFire:
                            // awaken the rule at the given index
                        }
                    }
                    basic.pause(10)
                }
            })
        }

        // the following two methods could be unified
        public onSensorEvent(sensorTid: number, filter: number = -1) {
            if (!sensorTid || !this.running) return
            // see if any rule matches
            const newRules: RuleClosure[] = []
            this.ruleClosures.forEach(rc => {
                if (rc.matchWhen(sensorTid, filter)) newRules.push(rc)
            })
            this.processNewRules(newRules)
        }

        private notifySensorChange(
            tid: number,
            name: string,
            val: number,
            change: SensorChange
        ) {
            if (!this.running) return
            // see if any rule matches
            const newRules: RuleClosure[] = []
            this.ruleClosures.forEach(rc => {
                if (rc.matchWhen(name, change)) newRules.push(rc)
            })
            this.processNewRules(newRules)
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
            const lookupVar = (v: string) => {
                return (this.state[v] as number).toString()
            }
            switch (kind) {
                // TODO: get rid of special casing for Temperature and Radio
                case TileKind.Temperature:
                    return lookupVar("Temperature")
                case TileKind.Literal:
                    return (param as number).toString()
                case TileKind.Variable:
                    let name = param
                    if (!name) name = tidToSensor(getTid(expr))
                    return lookupVar(name)
                case TileKind.RadioValue:
                case TileKind.Radio:
                    return lookupVar(name)
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
            const rnd = (max: number) => Math.floor(Math.random() * max) + 1
            for (let i = 0; i < tiles.length; i++) {
                const m = tiles[i]
                if (getTid(m) == Tid.TID_MODIFIER_RANDOM_TOSS) {
                    const max =
                        i == tiles.length - 1
                            ? 2
                            : this.constantFold(tiles.slice(i + 1), 0)
                    tokens.push(rnd(max).toString())
                    break
                } else {
                    tokens.push(this.getExprValue(m))
                }
            }
            console.log(`tokens = ${tokens.join(" ")}`)
            const result = new parser.Parser(tokens).parse()
            console.log(`result = ${result}`)
            return result
        }
    }
}
