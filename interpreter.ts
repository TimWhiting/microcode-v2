namespace microcode {
    // an interpreter for ProgramDefn

    control.singleSimulator()

    // make sure we have V2 simulator
    input.onLogoEvent(TouchButtonEvent.Pressed, function () {})
    // also enable accelerometer in sim
    input.onGesture(Gesture.Shake, () => {})

    // delay on sending stuff in pipes and changing pages
    const ANTI_FREEZE_DELAY = 50

    type StateMap = { [id: string]: number }

    // 0-max inclusive
    function randomInt(max: number) {
        if (max <= 0) return 0
        return Math.floor(Math.random() * (max + 1))
    }

    function emitClearScreen() {
        const anim = hex`
                0001000000
                0000010000
                0000000100
                0000000002
                0000000004
                0000000008
                0000001000
                0000100000
                0010000000
                0800000000
                0400000000
                0200000000
                0000000000
            `
        let pos = 0
        while (pos < anim.length) {
            for (let col = 0; col < 5; col++) {
                for (let row = 0; row < 5; row++) {
                    const onOff =
                        anim[pos + col + (row >> 3)] & (1 << (row & 7))
                    if (onOff) led.plot(col, row)
                    else led.unplot(col, row)
                }
            }
            control.waitMicros(20000)
            pos = pos + 5
        }
    }

    /*
        JACDAC

    function scToName(sc: ServiceClass) {
        if (sc == ServiceClass.Button) return "but"
        if (sc == ServiceClass.DotMatrix) return "dot"
        if (sc == ServiceClass.SoundLevel) return "snd"
        if (sc == ServiceClass.Temperature) return "tmp"
        if (sc == ServiceClass.SoundPlayer) return "mus"
        if (sc == ServiceClass.Buzzer) return "buz"
        if (sc == ServiceClass.Accelerometer) return "acc"
        if (sc == ServiceClass.Radio) return "rad"
        if (sc == ServiceClass.Potentiometer) return "pot"
        if (sc == ServiceClass.LightLevel) return "lit"
        if (sc == ServiceClass.MagneticFieldLevel) return "mag"
        if (sc == ServiceClass.RotaryEncoder) return "rot"
        if (sc == ServiceClass.Led) return "led"
        if (sc == ServiceClass.Servo) return "srv"
        if (sc == ServiceClass.Distance) return "dst"
        if (sc == ServiceClass.Reflected) return "ref"
        if (sc == ServiceClass.Moisture) return "moi"
        if (sc == ServiceClass.Relay) return "rel"
        return "unknown"
    }
    */

    enum OutputResource {
        LEDScreen,
        Speaker,
        RadioSend,
        RadioGroup,
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
                if (pipeId == sensorName)
                    return this.filterValueIn(this.interp.state[pipeId])
            } else if (getKind(sensor) == TileKind.Radio) {
                const radioVal = this.getRadioVal()
                if (
                    sensor == Tid.TID_SENSOR_CAR_WALL ||
                    sensor == Tid.TID_SENSOR_LINE
                ) {
                    // this hack separates radio ranges used to communicate with robot car
                    if (
                        robot.robots.RobotCompactCommand.ObstacleState <
                        radioVal
                    )
                        if (sensor == Tid.TID_SENSOR_CAR_WALL)
                            return this.filterValueIn(
                                radioVal -
                                    robot.robots.RobotCompactCommand
                                        .ObstacleState
                            )
                        else if (
                            robot.robots.RobotCompactCommand.LineState <=
                            radioVal
                        )
                            return this.filterValueIn(radioVal)
                } else if (
                    radioVal < robot.robots.RobotCompactCommand.ObstacleState
                )
                    return this.filterValueIn(radioVal)
            } else if (typeof sensorName == "string") {
                const thisSensorName = tidToSensor(sensor)
                if (sensorName == thisSensorName) {
                    const eventCode = this.lookupEventCode()
                    if (eventCode) {
                        return event == eventCode
                    } else {
                        return this.filterValueIn(this.interp.state[sensorName])
                    }
                }
            } else if (typeof sensorName == "number") {
                if (sensorName == sensor) {
                    const eventCode = this.lookupEventCode()
                    console.log(`match ${sensor} ${event} ${eventCode}`)
                    if (eventCode) {
                        return eventCode == -1 || event == eventCode
                    } else {
                        return this.filterValueIn(event)
                    }
                }
            }
            return false
        }

        private getRadioVal() {
            return this.interp.state["Radio"]
        }

        private filterValueIn(f: number) {
            if (this.rule.filters.length) {
                return f == this.interp.getValue(this.rule.filters, 0)
            } else return true
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
            return null
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
                        const loopBound = this.interp.getValue(
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

        private displayLEDImage() {
            // extract the LED grid for the current modifier
            if (this.rule.modifiers.length == 0) {
                basic.showIcon(IconNames.Happy)
            } else {
                const mod = this.rule.modifiers[this.modifierIndex]
                const fieldEditor = getFieldEditor(mod) as IconFieldEditor
                const modEditor = mod as ModifierEditor
                fieldEditor.toMicroBit(modEditor.getField())
            }
            basic.pause(200)
        }

        private runAction() {
            if (this.wakeTime > 0 || !this.actionRunning) return
            // execute one step
            const action = this.rule.actuators[0]
            switch (action) {
                case Tid.TID_ACTUATOR_PAINT: {
                    this.interp.updateResource(
                        OutputResource.LEDScreen,
                        this.index,
                        () => this.displayLEDImage()
                    )
                    break
                }
                case Tid.TID_ACTUATOR_SHOW_NUMBER: {
                    const v = this.interp.getValue(this.rule.modifiers, 0)
                    this.interp.updateResource(
                        OutputResource.LEDScreen,
                        this.index,
                        () => basic.showNumber(v)
                    )
                    this.actionRunning = false
                    return
                }
                case Tid.TID_ACTUATOR_CUP_X_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Y_ASSIGN:
                case Tid.TID_ACTUATOR_CUP_Z_ASSIGN: {
                    control.waitMicros(ANTI_FREEZE_DELAY * 1000)
                    const pipe = getParam(action)
                    const v = this.interp.getValue(this.rule.modifiers, 0)
                    this.interp.updateState(this.index, pipe, v)
                    this.actionRunning = false
                }
                case Tid.TID_ACTUATOR_RADIO_SEND: {
                    const v = this.interp.getValue(this.rule.modifiers, 0)
                    this.interp.updateResource(
                        OutputResource.RadioSend,
                        this.index,
                        // TODO: need to put this stuff in RuntimeHost
                        () => radio.sendNumber(v)
                    )
                    this.actionRunning = false
                    return
                }
                case Tid.TID_ACTUATOR_RADIO_SET_GROUP: {
                    const v = this.interp.getValue(this.rule.modifiers, 1)
                    this.interp.updateResource(
                        OutputResource.RadioSend,
                        this.index,
                        () => radio.setGroup(v)
                    )
                    this.actionRunning = false
                    return
                }
                case Tid.TID_ACTUATOR_MUSIC: {
                    // if no music, don't play anything
                    // translate notes to scale names
                    // music.play(music.stringPlayable("C D E F G F E D ", 120), music.PlaybackMode.UntilDone)
                    break
                }
                case Tid.TID_ACTUATOR_SPEAKER: {
                    if (this.rule.modifiers.length == 0) {
                        music.play(
                            music.builtinPlayableSoundEffect(
                                soundExpression.giggle
                            ),
                            music.PlaybackMode.UntilDone
                        )
                        this.actionRunning = false
                        return
                    } else {
                        const mod = this.rule.modifiers[this.modifierIndex]
                        let sound = getParam(mod)
                        music.play(
                            music.builtinPlayableSoundEffect(sound),
                            music.PlaybackMode.UntilDone
                        )
                        break
                    }
                }
                case Tid.TID_ACTUATOR_SWITCH_PAGE: {
                    let targetPage = 1
                    for (const m of this.rule.modifiers)
                        if (getKind(m) == TileKind.Page)
                            targetPage = getParam(m)
                    this.interp.switchPage(targetPage - 1)
                    break
                }
                case Tid.TID_ACTUATOR_SERVO_SET_ANGLE: {
                    break
                }
            }
            this.modifierIndex++
        }

        /*
private emitRoleCommand(rule: microcode.RuleDefn) {
            const actuator = rule.actuators.length ? rule.actuators[0] : null
            const wr = this.writer
            const currValue = () => this.currValue().read(wr)
            if (actuator == null) return // do nothing
            const aKind = microcode.jdKind(actuator)
            const aJdparam = microcode.jdParam(actuator)

            
            } else if (aKind == microcode.JdKind.NumFmt) {
                const role = this.lookupActuatorRole(rule)
                this.emitValueOut(rule, 1) // why 1?
                const fmt: NumFmt = aJdparam
                const sz = bitSize(fmt) >> 3
                wr.emitStmt(Op.STMT1_SETUP_PKT_BUFFER, [literal(sz)])
                if (actuator == microcode.Tid.TID_ACTUATOR_SERVO_SET_ANGLE) {
                    // TODO no modulo yet in Jacs
                    // if (curr >= 12) { curr -= 12 }
                    wr.emitIf(
                        wr.emitExpr(Op.EXPR2_LE, [literal(12), currValue()]),
                        () => {
                            this.currValue().write(
                                wr,
                                wr.emitExpr(Op.EXPR2_SUB, [
                                    currValue(),
                                    literal(12),
                                ])
                            )
                        }
                    )
                    // curr = curr * ((360/12) << 16)
                    this.currValue().write(
                        wr,
                        wr.emitExpr(Op.EXPR2_MUL, [
                            currValue(),
                            literal((360 / 12) << 16),
                        ])
                    )
                }
                wr.emitBufStore(currValue(), fmt, 0)
                this.emitSendCmd(role, microcode.serviceCommand(actuator))

            TODO: what do these refer to? jacdac services, for the most part

            } else if (aKind == microcode.JdKind.Sequence) {
                this.emitSequence(rule, 400)

        */

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

    type IdMap = { [id: number]: number }

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

    class Interpreter {
        private hasErrors: boolean = false
        private running: boolean = false
        private currentPage: number = 0
        private ruleClosures: RuleClosure[] = []
        private activeRuleStepped: number = 0
        private activeRuleCount: number = 0
        private sensors: Sensor[] = []

        // state storage for variables and other temporary global state
        // (local per-rule state is kept in RuleClosure)
        public state: StateMap = {}

        constructor(private program: ProgramDefn) {
            emitClearScreen()
            this.running = true
            this.switchPage(0)
            this.startSensors()
        }

        private stopAllRules() {
            this.ruleClosures.forEach(r => r.kill())
            this.ruleClosures = []
        }

        public switchPage(page: number) {
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

        // TODO: we need to have the notion of a round in which the various
        // TODO: active rules tell us what they want to update and then at the end
        // TODO: of the round, we decide what updates to actually do

        public updateResource(
            resource: OutputResource,
            index: number,
            handler: () => void
        ) {
            this.checkForStepCompleted()
            handler()
            // earliest in lexical order wins for a resource
        }

        public updateState(ruleIndex: number, pipe: string, v: number) {
            this.checkForStepCompleted()
            // earliest in lexical order wins for a resource
            this.state[pipe] = v
            console.log(`pipe ${pipe} = ${v}`)
            if (!this.running) return
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
        public onMicrobitEvent(sensorTid: number, filter: number = -1) {
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
            console.log(`sensor ${name} = ${val}`)
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
                        const oldReading = this.state[s.getName()]
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

        private constantFold(mods: Tile[], defl = 0) {
            if (mods.length == 0) return defl
            let v = 0
            for (const m of mods) {
                if (getKind(m) != TileKind.Literal) return undefined
                v += getParam(m)
            }
            return v
        }

        private error(msg: string) {
            this.hasErrors = true
            console.error("Error: " + msg)
        }

        private getExprValue(expr: Tile): number {
            const mKind = getKind(expr)
            const mJdpararm = getParam(expr)
            switch (mKind) {
                case TileKind.Temperature:
                    return this.state["Temperature"] || 0
                case TileKind.Literal:
                    return mJdpararm
                case TileKind.Variable:
                    return this.state[mJdpararm] || 0
                case TileKind.RadioValue:
                    return this.state["Radio"] || 0
                default:
                    this.error("can't emit kind: " + mKind)
                    return 0
            }
        }

        private getAddSeq(
            current: number,
            mods: Tile[],
            defl: number = 0,
            clear = true
        ): number {
            // make this functional
            let result: number = current

            const addOrSet = (vv: number) => {
                if (clear) result = vv
                else {
                    result += vv
                }
                clear = false
            }

            if (mods.length == 0) return defl
            else {
                if (getKind(mods[0]) == TileKind.RandomToss) {
                    let rndBnd = this.getAddSeq(0, mods.slice(1), 5)
                    if (!rndBnd || rndBnd <= 2) rndBnd = 2
                    addOrSet(Math.floor(Math.random() * rndBnd))
                } else {
                    const folded = this.constantFold(mods, defl)
                    if (folded != undefined) {
                        addOrSet(folded)
                    } else {
                        for (let i = 0; i < mods.length; ++i)
                            addOrSet(this.getExprValue(mods[i]))
                    }
                }
            }
            return result
        }

        private breaksValSeq(mod: Tile) {
            switch (getKind(mod)) {
                case TileKind.RandomToss:
                    return true
                default:
                    return false
            }
        }

        // do we need to take initial value into account?
        public getValue(modifiers: Tile[], defl: number): number {
            let currSeq: Tile[] = []
            let first = true
            let result: number = 0

            for (const m of modifiers) {
                const cat = getCategory(m)
                // TODO: make the following a function
                if (
                    cat == "value_in" ||
                    cat == "value_out" ||
                    cat == "constant" ||
                    cat == "line" ||
                    cat == "on_off"
                ) {
                    if (this.breaksValSeq(m) && currSeq.length) {
                        result = this.getAddSeq(result, currSeq, 0, first)
                        currSeq = []
                        first = false
                    }
                    currSeq.push(m)
                }
            }

            if (currSeq.length) {
                result = this.getAddSeq(result, currSeq, 0, first)
                first = false
            }

            if (first) result = defl
            return result
        }

        private baseModifiers(rule: RuleDefn) {
            let modifiers = rule.modifiers
            if (modifiers.length == 0) {
                const actuator = rule.actuators[0]
                const defl = defaultModifier(actuator)
                if (defl != undefined) return [defl]
            } else {
                for (let i = 0; i < modifiers.length; ++i)
                    if (modifiers[i] == Tid.TID_MODIFIER_LOOP)
                        return modifiers.slice(0, i)
            }
            return modifiers
        }

        public getValueOut(rule: RuleDefn, defl: number) {
            return this.getValue(this.baseModifiers(rule), defl)
        }
    }

    let theInterpreter: Interpreter = undefined
    export function runProgram(prog: ProgramDefn) {
        if (theInterpreter) theInterpreter.stop()
        theInterpreter = new Interpreter(prog)
    }

    export function stopProgram() {
        if (theInterpreter) theInterpreter.stop()
        theInterpreter = undefined
    }

    // ----------------------------------------------------------------
    // TODO: Runtime Host
    // - we will want to have a Host interface for the runtime
    // - which will make it easier to do unit tests with a mock runtime
    // ----------------------------------------------------------------

    // mapping of micro:bit and DAL namespace into MicroCode tiles

    // see DAL for these values
    const matchPressReleaseTable: IdMap = {
        1: Tid.TID_FILTER_BUTTON_A, // DAL.DEVICE_ID_BUTTON_A
        2: Tid.TID_FILTER_BUTTON_B, // DAL.DEVICE_ID_BUTTON_B
        121: Tid.TID_FILTER_LOGO, // DAL.MICROBIT_ID_LOGO
        100: Tid.TID_FILTER_PIN_0, // DAL.ID_PIN_P0
        101: Tid.TID_FILTER_PIN_1, // DAL.ID_PIN_P1
        102: Tid.TID_FILTER_PIN_2, // DAL.ID_PIN_P2
    }

    const matchAccelerometerTable: IdMap = {
        11: Tid.TID_FILTER_ACCEL_SHAKE,
        1: Tid.TID_FILTER_ACCEL_TILT_UP,
        2: Tid.TID_FILTER_ACCEL_TILT_DOWN,
        3: Tid.TID_FILTER_ACCEL_TILT_LEFT,
        4: Tid.TID_FILTER_ACCEL_TILT_RIGHT,
        5: Tid.TID_FILTER_ACCEL_FACE_UP,
        6: Tid.TID_FILTER_ACCEL_FACE_DOWN,
    }

    const buttons = [
        DAL.DEVICE_ID_BUTTON_A,
        DAL.DEVICE_ID_BUTTON_B,
        DAL.MICROBIT_ID_LOGO,
        DAL.ID_PIN_P0,
        DAL.ID_PIN_P1,
        DAL.ID_PIN_P2,
    ]

    // wire up the micro:bit to the interpreter, outside to
    // prevent accumulation of event handlers

    buttons.forEach(b => {
        control.onEvent(b, DAL.DEVICE_EVT_ANY, () => {
            const ev = control.eventValue()
            if (theInterpreter)
                theInterpreter.onMicrobitEvent(
                    ev == DAL.DEVICE_BUTTON_EVT_DOWN
                        ? Tid.TID_SENSOR_PRESS
                        : ev == DAL.DEVICE_BUTTON_EVT_UP
                        ? Tid.TID_SENSOR_RELEASE
                        : undefined,
                    matchPressReleaseTable[b]
                )
        })
    })

    // need this only for the simulator
    input.onGesture(Gesture.Shake, () => {
        if (theInterpreter)
            theInterpreter.onMicrobitEvent(
                Tid.TID_SENSOR_ACCELEROMETER,
                Tid.TID_FILTER_ACCEL_SHAKE
            )
    })

    // handle all other accelerometer events
    control.onEvent(DAL.DEVICE_ID_ACCELEROMETER, DAL.DEVICE_EVT_ANY, () => {
        if (theInterpreter && control.eventValue() != Gesture.Shake)
            theInterpreter.onMicrobitEvent(
                Tid.TID_SENSOR_ACCELEROMETER,
                matchAccelerometerTable[control.eventValue()]
            )
    })

    // microphone events
    // TODO: move logic out of Interpreter
    control.onEvent(
        DAL.DEVICE_ID_SYSTEM_LEVEL_DETECTOR,
        DAL.DEVICE_EVT_ANY,
        () => {
            if (theInterpreter) {
                const ev = control.eventValue()
                theInterpreter.onMicrobitEvent(
                    Tid.TID_SENSOR_MICROPHONE,
                    ev == DAL.LEVEL_THRESHOLD_HIGH
                        ? Tid.TID_FILTER_LOUD
                        : ev == DAL.LEVEL_THRESHOLD_LOW
                        ? Tid.TID_FILTER_QUIET
                        : undefined
                )
            }
        }
    )

    radio.onReceivedNumber(radioNum => {
        if (theInterpreter) {
            theInterpreter.state["Radio"] = radioNum
            theInterpreter.onMicrobitEvent(
                Tid.TID_SENSOR_RADIO_RECEIVE,
                radioNum
            )
        }
    })
}
