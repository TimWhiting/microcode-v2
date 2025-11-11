/**
 * Abstraction for all available sensors.
 * This class is extended by each of the concrete sensors which add on static methods for their name, getting their readings & optionally min/max readings
 */
class Sensor {
    /** Immutable: Abs(minimum) + Abs(maximum); calculated once at start since min & max can't change */
    private range: number

    constructor(
        private name: string,
        private radioName: string,
        private sensorFn: () => number,
        private minimum: number,
        private maximum: number,
        private isJacdacSensor: boolean,
        private setupFn?: () => void
    ) {
        // Data from opts:
        this.range = Math.abs(this.minimum) + this.maximum

        // Could be additional functions required to set up the sensor (see Jacdac modules or Accelerometers):
        if (this.setupFn != null) this.setupFn()
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
        if (name == "Light" || name == "L")
            return new Sensor(
                "Light",
                "L",
                () => input.lightLevel(),
                0,
                255,
                false
            )
        else if (name == "Temp." || name == "Temperature" || name == "T")
            return new Sensor(
                "Temperature",
                "T",
                () => input.temperature(),
                -40,
                100,
                false
            )
        else if (name == "Magnet" || name == "M")
            return new Sensor(
                "Magnet",
                "M",
                () => input.magneticForce(Dimension.Strength),
                -5000,
                5000,
                false
            )
        else if (name == "Volume" || name == "Microphone" || name == "V")
            return new Sensor(
                "Microphone",
                "V",
                () => input.soundLevel(),
                0,
                255,
                false
            )
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
