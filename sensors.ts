/**
 * Abstraction for all available sensors.
 * This class is extended by each of the concrete sensors which add on static methods for their name, getting their readings & optionally min/max readings
 */
class Sensor {
    /** Immutable: Forward facing name that is presented to the user in LiveDataViewer, Sensor Selection & TabularDataViewer */
    private name: string
    /** Immutable: Name used for Radio Communication, a unique shorthand, see distributedLogging.ts */
    private radioName: string
    /** Immutable: Minimum possible sensor reading, based on datasheet of peripheral. Some sensors transform their output (Analog pins transform 0->1023, into 0->3V volt range) */
    private minimum: number
    /** Immutable: Maximum possible sensor reading, based on datasheet of peripheral. Some sensors transform their output (Analog pins transform 0->1023, into 0->3V volt range) */
    private maximum: number
    /** Immutable: Abs(minimum) + Abs(maximum); calculated once at start since min & max can't change */
    private range: number
    /** Immutable: Wrapper around the sensors call, e.g: sensorFn = () => input.acceleration(Dimension.X) */
    private sensorFn: () => number
    /** Immutable: Need to know whether or not this sensor is on the microbit or is an external Jacdac one; see sensorSelection.ts */
    private isJacdacSensor: boolean

    constructor(opts: {
        name: string
        rName: string
        f: () => number
        min: number
        max: number
        isJacdacSensor: boolean
        setupFn?: () => void
    }) {
        // Data from opts:
        this.name = opts.name
        this.radioName = opts.rName
        this.minimum = opts.min
        this.maximum = opts.max
        this.range = Math.abs(this.minimum) + this.maximum
        this.sensorFn = opts.f
        this.isJacdacSensor = opts.isJacdacSensor

        // Could be additional functions required to set up the sensor (see Jacdac modules or Accelerometers):
        if (opts.setupFn != null) opts.setupFn()
    }

    //------------------
    // Factory Function:
    //------------------

    /**
     * Factory function used to generate a Sensor from that sensors: .getName(), sensorSelect name, or its radio name
     * This is a single factory within this abstract class to reduce binary size
     * @param name either sensor.getName(), sensor.getRadioName() or the ariaID the button that represents the sensor in SensorSelect uses.
     * @returns concrete sensor that the input name corresponds to.
     */
    public static getFromName(name: string): Sensor {
        if (name == "Accel. X" || name == "Accelerometer X" || name == "AX")
            return new Sensor({
                name: "Accel. X",
                rName: "AX",
                f: () => input.acceleration(Dimension.X),
                min: -2048,
                max: 2048,
                isJacdacSensor: false,
                setupFn: () =>
                    input.setAccelerometerRange(AcceleratorRange.OneG),
            })
        else if (
            name == "Accel. Y" ||
            name == "Accelerometer Y" ||
            name == "AY"
        )
            return new Sensor({
                name: "Accel. Y",
                rName: "AY",
                f: () => input.acceleration(Dimension.Y),
                min: -2048,
                max: 2048,
                isJacdacSensor: false,
                setupFn: () =>
                    input.setAccelerometerRange(AcceleratorRange.OneG),
            })
        else if (
            name == "Accel. Z" ||
            name == "Accelerometer Z" ||
            name == "AZ"
        )
            return new Sensor({
                name: "Accel. Z",
                rName: "AZ",
                f: () => input.acceleration(Dimension.Z),
                min: -2048,
                max: 2048,
                isJacdacSensor: false,
                setupFn: () =>
                    input.setAccelerometerRange(AcceleratorRange.OneG),
            })
        else if (name == "Pitch" || name == "P")
            return new Sensor({
                name: "Pitch",
                rName: "P",
                f: () => input.rotation(Rotation.Pitch),
                min: -180,
                max: 180,
                isJacdacSensor: false,
            })
        else if (name == "Roll" || name == "R")
            return new Sensor({
                name: "Roll",
                rName: "R",
                f: () => input.rotation(Rotation.Roll),
                min: -180,
                max: 180,
                isJacdacSensor: false,
            })
        else if (name == "A. Pin 0" || name == "Analog Pin 0" || name == "AP0")
            return new Sensor({
                name: "A. Pin 0",
                rName: "AP0",
                f: () => pins.analogReadPin(AnalogPin.P0) / 340,
                min: 0,
                max: 3,
                isJacdacSensor: false,
            })
        else if (name == "A. Pin 1" || name == "Analog Pin 1" || name == "AP1")
            return new Sensor({
                name: "A. Pin 1",
                rName: "AP1",
                f: () => pins.analogReadPin(AnalogPin.P1) / 340,
                min: 0,
                max: 3,
                isJacdacSensor: false,
            })
        else if (name == "A. Pin 2" || name == "Analog Pin 2" || name == "AP2")
            return new Sensor({
                name: "A. Pin 2",
                rName: "AP2",
                f: () => pins.analogReadPin(AnalogPin.P2) / 340,
                min: 0,
                max: 3,
                isJacdacSensor: false,
            })
        else if (name == "Light" || name == "L")
            return new Sensor({
                name: "Light",
                rName: "L",
                f: () => input.lightLevel(),
                min: 0,
                max: 255,
                isJacdacSensor: false,
            })
        else if (name == "Temp." || name == "Temperature" || name == "T")
            return new Sensor({
                name: "Temperature",
                rName: "T",
                f: () => input.temperature(),
                min: -40,
                max: 100,
                isJacdacSensor: false,
            })
        else if (name == "Magnet" || name == "M")
            return new Sensor({
                name: "Magnet",
                rName: "M",
                f: () => input.magneticForce(Dimension.Strength),
                min: -5000,
                max: 5000,
                isJacdacSensor: false,
            })
        else if (name == "Volume" || name == "Microphone" || name == "V")
            return new Sensor({
                name: "Microphone",
                rName: "V",
                f: () => input.soundLevel(),
                min: 0,
                max: 255,
                isJacdacSensor: false,
            })
        else if (name == "Compass" || name == "C")
            return new Sensor({
                name: "Compass",
                rName: "C",
                f: () => input.compassHeading(),
                min: 0,
                max: 360,
                isJacdacSensor: false,
            })
        else return undefined
    }

    //---------------------
    // Interface Functions:
    //---------------------

    getName(): string {
        return this.name
    }
    getRadioName(): string {
        return this.radioName
    }
    getReading(): number {
        return this.sensorFn()
    }
    getNormalisedReading(): number {
        return Math.abs(this.getReading()) / this.range
    }
    getMinimum(): number {
        return this.minimum
    }
    getMaximum(): number {
        return this.maximum
    }
    isJacdac(): boolean {
        return this.isJacdacSensor
    }
}
