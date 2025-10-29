namespace microgui {
    export interface IGraphableFunction {
        draw(fromX: number, color: number): void
    }

    /** How many times should a line be duplicated when drawn? */
    const PLOT_SMOOTHING_CONSTANT: number = 4

    export class GraphableFunction {
        maxBufferSize: number
        totalMeasurements: number
        numberOfReadings: number
        isInEventMode: boolean
        lastLoggedEventDescription: string
        dataBuffer: number[]
        lastLoggedReading: number
        screenHeight: number
        heightNormalisedDataBuffer: number[]

        fnToSample: (x: number) => number

        constructor(fnToSample: (x: number) => number, screenHeight?: number) {
            this.maxBufferSize = 80
            this.totalMeasurements = 0
            this.numberOfReadings = 0
            this.isInEventMode = false

            this.lastLoggedEventDescription = ""
            this.dataBuffer = []
            this.lastLoggedReading = 0
            this.screenHeight = screenHeight
            this.heightNormalisedDataBuffer = []

            this.fnToSample = fnToSample
        }

        getName(): string {
            return "name"
        }
        getReading(): number {
            return 0
        }
        getValueAt(x: number): number {
            return this.fnToSample(x)
        }
        getNormalisedReading(): number {
            return (
                Math.abs(this.getReading()) /
                (Math.abs(this.getMinimum()) + this.getMaximum())
            )
        }
        getMinimum(): number {
            return 0
        }
        getMaximum(): number {
            return 100
        }

        getMaxBufferSize(): number {
            return this.maxBufferSize
        }
        getNthReading(n: number): number {
            return this.dataBuffer[n]
        }
        getNthHeightNormalisedReading(n: number): number {
            return this.heightNormalisedDataBuffer[n]
        }
        getBufferLength(): number {
            return this.dataBuffer.length
        }
        getHeightNormalisedBufferLength(): number {
            return this.heightNormalisedDataBuffer.length
        }
        // getPeriod(): number {return this.config.period;}
        // getMeasurements(): number {return this.config.measurements}
        // hasMeasurements(): boolean {return this.config.measurements > 0;}

        /**
         * Change the size of the buffer used for this.dataBuffer & this.normalisedBuffer
         * Will shift out old this.dataBuffer & this.normalisedBuffer values from the front.
         * @param newBufferSize absolute new value for both this.dataBuffer & this.normalisedBuffer
         */
        setBufferSize(newBufferSize: number): void {
            // Remove additional values if neccessary:
            if (this.dataBuffer.length > newBufferSize) {
                const difference = this.dataBuffer.length - newBufferSize
                this.dataBuffer.splice(0, difference)
                this.heightNormalisedDataBuffer.splice(0, difference)
            }
            this.maxBufferSize = newBufferSize
        }

        /**
         * Add one value to this.dataBuffer, add that value normalised into this.normalisedBuffer too.
         * No value is added if the reading is undefined (such as from a disconnected Jacdac sensor).
         * If the (this.dataBuffer.length >= this.maxBufferSize) then then the oldest values are removed.
         * @param fromY the offset by which the reading should be raised before adding to this.normalisedBuffer
         * @returns
         */
        readIntoBufferOnce(fromY: number, height: number): void {
            this.screenHeight = height
            const reading = this.getValueAt(this.numberOfReadings)

            if (
                this.dataBuffer.length >= this.maxBufferSize ||
                reading === undefined
            ) {
                this.dataBuffer.shift()
                this.heightNormalisedDataBuffer.shift()
            }

            if (reading === undefined) return

            this.numberOfReadings += 1
            const range: number =
                Math.abs(this.getMinimum()) + this.getMaximum()
            this.dataBuffer.push(reading)
            this.heightNormalisedDataBuffer.push(
                Math.round(
                    this.screenHeight -
                        this.screenHeight *
                            ((reading - this.getMinimum()) / range)
                ) + fromY
            )
        }

        /**
         * Populates this.normalisedBuffer with the Y position for each element in this.dataBuffer.
         * Uses BUFFERED_SCREEN_HEIGHT.
         * Invoked upon scrolling in the live-data-viewer.
         * @param fromY The y value that each element should be offset by.
         */
        normaliseDataBuffer(fromY: number) {
            const min = this.getMinimum()
            const range: number = Math.abs(min) + this.getMaximum()

            this.heightNormalisedDataBuffer = []
            for (let i = 0; i < this.dataBuffer.length; i++) {
                this.heightNormalisedDataBuffer.push(
                    Math.round(
                        this.screenHeight -
                            ((this.dataBuffer[i] - min) / range) *
                                this.screenHeight
                    ) + fromY
                )
            }
        }

        /**
         * Default draw mode: may be overriden to accommodate multiple draw modes
         * Each value in the data buffer is normalised and scaled to screen size per frame.
         *      This is inefficient since only one value is added per frame
         * @param fromX starting x coordinate
         * @param color
         */
        draw(fromX: number, color: number): void {
            for (
                let i = 0;
                i < this.heightNormalisedDataBuffer.length - 1;
                i++
            ) {
                for (
                    let j = -(PLOT_SMOOTHING_CONSTANT / 2);
                    j < PLOT_SMOOTHING_CONSTANT / 2;
                    j++
                ) {
                    screen().drawLine(
                        fromX + i - 1,
                        this.heightNormalisedDataBuffer[i] + j, //+ (screen().height / 2),
                        fromX + i,
                        this.heightNormalisedDataBuffer[i + 1] + j, //+ (screen().height / 2),
                        color
                    )
                }
            }
        }
    }
}
