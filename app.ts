namespace microcode {
    import AppInterface = user_interface_base.AppInterface
    import Scene = user_interface_base.Scene
    import SceneManager = user_interface_base.SceneManager

    // Auto-save slot
    export const SAVESLOT_AUTO = "sa"

    export interface SavedState {
        progdef: any
        version?: string
    }

    export class App implements AppInterface {
        private sceneManager: SceneManager

        constructor() {
            // One interval delay to ensure all static constructors have executed.
            basic.pause(500)
            reportEvent("app.start")

            // Application configuration
            user_interface_base.getIcon = id => icons.get(id)
            user_interface_base.resolveTooltip = (ariaId: string) =>
                resolveTooltip(ariaId)

            const buf = this.load(SAVESLOT_AUTO)
            const prog = ProgramDefn.fromBuffer(new BufferReader(buf))
            runProgram(prog)

            controller.setRepeatDefault(250, 30)
            // keymap.setupKeys()

            this.sceneManager = new SceneManager()

            const home = new Home(this)
            this.pushScene(home)
        }

        public save(slot: string, buf: Buffer) {
            reportEvent("app.save", { slot: slot, size: buf.length })
            console.log(`save to ${slot}: ${buf.length}b`)
            profile()
            settings.writeBuffer(slot, buf)
            return true
        }

        public load(slot: string): Buffer {
            try {
                return settings.readBuffer(slot)
            } catch (e) {
                console.log(e)
            }
            return undefined
        }

        public pushScene(scene: Scene) {
            this.sceneManager.pushScene(scene)
        }

        public popScene() {
            this.sceneManager.popScene()
        }
    }

    let runtimeHost: RuntimeHost = undefined
    let theInterpreter: Interpreter = undefined

    export function runProgram(prog: ProgramDefn) {
        // if (theInterpreter) theInterpreter.stop()
        // if (!runtimeHost) runtimeHost = new MicrobitHost()
        // theInterpreter = new Interpreter(prog, runtimeHost)
    }

    export function stopProgram() {
        if (theInterpreter) theInterpreter.stop()
        theInterpreter = undefined
    }
}
