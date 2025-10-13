// MIT License

// Copyright (c) [2023] [Adi Fatkhurozi]

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

namespace expr {
    interface ParserState {
        tokens: string[]
        currentTokenIndex: number
        currentToken: string
        nextToken: () => void
        variables: VariableMap
    }

    type ValueType = number | string | boolean | any[] | object
    type VariableMap = { [key: string]: ValueType }
    type FunctionMap = {
        [key: string]: (state: ParserState, args: any[]) => any
    }
    type OperatorMap = { [key: string]: (a: any, b: any) => any }
    type ExpressionParserConstructor = {
        variables?: VariableMap
        regex?: RegExp
    }

    // const comparisonOperatorRegex = /([<>]=|==|!=)/;
    // const specialCharacterRegex = /([-+*/():,<>!=%^\[\]\{\}])/;
    // const numberRegex = /\b(?:\d+(\.\d+)?)/;
    // const stringRegex = /(?:"[^"]*")|(?:'[^']*')/;
    // const identifierRegex = /(?:\w+(?:\.\w+)*(?:\[\d+\])*|(?:\.\.\.\w+))/

    class Error {
        constructor(message: string) {
            this.message = message
        }
        message: string
    }

    function startsWith(src: string, str: string): boolean {
        return src.indexOf(str) === 0
    }

    function endsWith(src: string, str: string): boolean {
        const lastIndex = src.length - str.length
        return lastIndex >= 0 && src.indexOf(str, lastIndex) === lastIndex
    }

    class ExpressionParser {
        variables: VariableMap = {}
        functions: FunctionMap = {}
        operators: OperatorMap = {}
        regex: RegExp

        constructor({ variables, regex }: ExpressionParserConstructor = {}) {
            this.variables = variables || {}
        }

        private parseNumber(state: ParserState): number {
            const token = state.currentToken
            if (token === undefined || isNaN(parseFloat(token))) {
                throw new Error("Invalid expression")
            }

            state.nextToken()
            return parseFloat(token)
        }

        private parseString(state: ParserState, tickType: string): string {
            const token = state.currentToken
            if (
                token === undefined ||
                !startsWith(token, tickType) ||
                !endsWith(token, tickType)
            ) {
                throw new Error("Invalid expression")
            }

            state.nextToken()
            return token.slice(1, -1)
        }

        private parseBoolean(state: ParserState): boolean {
            const token = state.currentToken
            if (
                token === undefined ||
                (token !== "true" && token !== "false")
            ) {
                throw new Error("Invalid expression")
            }

            state.nextToken()
            return token === "true"
        }

        private parseArray(state: ParserState): any[] {
            state.nextToken()
            const array: any[] = []

            while (state.currentToken !== "]") {
                array.push(this.parseExpression(state))

                if (state.currentToken === ",") {
                    state.nextToken()
                }
            }

            if (state.currentToken !== "]") {
                throw new Error("Invalid expression")
            }

            state.nextToken()
            return array
        }

        private parseUnaryFactor(state: ParserState): any {
            const token = state.currentToken

            if (token === "!") {
                state.nextToken()
                const factor = this.parseUnaryFactor(state)
                return !factor
            }

            return this.parseFactor(state)
        }

        private parseObject(state: ParserState): object {
            const obj: { [key: string]: any } = {}
            while (true) {
                const key = state.currentToken
                if (typeof key !== "string") {
                    throw new Error("Invalid object literal")
                }

                if (key.includes("...")) {
                    state.currentToken = state.currentToken.replace("...", "")
                    // TODO (don't think we need this): Object.assign(obj, this.parseExpression(state))
                } else {
                    state.nextToken()
                    if (state.currentToken !== ":") {
                        throw new Error("Invalid object literal")
                    }

                    state.nextToken()

                    const value = this.parseExpression(state)
                    obj[key] = value
                }
                if ((state.currentToken as any) === "}") {
                    break
                }

                if ((state.currentToken as any) !== ",") {
                    throw new Error("Invalid object literal")
                }

                state.nextToken()
            }

            if ((state.currentToken as any) !== "}") {
                throw new Error("Invalid object literal")
            }

            state.nextToken()

            return obj
        }

        private parseFunction(state: ParserState): any {
            const token = state.currentToken
            const func = this.functions[token]
            state.nextToken()

            if (state.currentToken !== "(") {
                throw new Error("Invalid expression")
            }

            state.nextToken()

            const args: any[] = []
            while ((state.currentToken as any) !== ")") {
                args.push(this.parseExpression(state))

                if ((state.currentToken as any) === ",") {
                    state.nextToken()
                }
            }

            if ((state.currentToken as any) !== ")") {
                throw new Error("Invalid expression")
            }

            state.nextToken()

            return func(state, args)
        }

        private parseFactor(state: ParserState): ValueType {
            let value: ValueType = 0
            const token = state.currentToken

            if (token === undefined) {
                throw new Error("Invalid expression")
            }
            if (token === "(") {
                state.nextToken()
                value = this.parseExpression(state)

                if (state.currentToken !== ")") {
                    throw new Error("Invalid expression")
                }

                state.nextToken()
            } else if (!isNaN(parseFloat(token))) {
                value = this.parseNumber(state)
            } else if (startsWith(token, '"') && endsWith(token, '"')) {
                value = this.parseString(state, '"')
            } else if (startsWith(token, "'") && endsWith(token, "'")) {
                value = this.parseString(state, "'")
            } else if (token === "true" || token === "false") {
                value = this.parseBoolean(state)
            } else if (token === "[") {
                value = this.parseArray(state)
            } else if (token === "{") {
                state.nextToken()
                value = this.parseObject(state)
            } else if (token.includes(".")) {
                const objectPath = token.split(".")
                let objectValue = state.variables as any
                for (const path of objectPath) {
                    if (
                        typeof objectValue !== "object" ||
                        objectValue === null ||
                        !objectValue[path]
                    ) {
                        objectValue = null as any
                        break
                    } else {
                        objectValue = objectValue[path]
                    }
                }

                value = objectValue
                state.nextToken()
            } else if (this.functions[token]) {
                value = this.parseFunction(state)
            } else if (this.operators[token]) {
                const operator = this.operators[token]
                state.nextToken()

                const factor = this.parseFactor(state)
                value = operator(0, factor)
            } else {
                // } else if (state.variables.hasOwnProperty(token)) {
                value = state.variables[token]
                state.nextToken()
            }

            return value
        }

        private parseTerm(state: ParserState): number {
            let value = this.parseUnaryFactor(state) as any
            while (true) {
                const token = state.currentToken
                if (token === "*" || token === "/") {
                    const operator = token
                    state.nextToken()
                    const factor = this.parseUnaryFactor(state)
                    if (operator === "*") {
                        value *= factor as number
                    } else {
                        value /= factor as number
                    }
                } else {
                    break
                }
            }

            return value
        }

        private parseExpression(state: ParserState): any {
            let value = this.parseTerm(state)

            while (true) {
                const token = state.currentToken
                if (this.operators[token]) {
                    const operator = token
                    state.nextToken()
                    const term = this.parseTerm(state)
                    value = this.operators[operator](value, term)
                } else {
                    break
                }
            }

            return value
        }

        public evaluate(tokens: string[], variables?: VariableMap): any {
            const tempVariables = this.variables
            // if (variables) {
            //     for (const key in variables) {
            //         tempVariables[key] = variables[key]
            //     }
            // }
            const state: ParserState = {
                tokens,
                currentTokenIndex: 0,
                get currentToken() {
                    return this.tokens[this.currentTokenIndex]
                },
                set currentToken(value) {
                    this.tokens[this.currentTokenIndex] = value
                },
                nextToken() {
                    this.currentTokenIndex++
                },
                variables: tempVariables,
            }
            const result = this.parseExpression(state)

            if (state.currentToken !== undefined) {
                throw new Error("Invalid expression")
            }

            return result
        }

        public setFunctions(functions: FunctionMap): void {
            this.functions = functions
        }

        public setOperators(operators: OperatorMap): void {
            this.operators = operators
        }
    }

    export function createParser(props: ExpressionParserConstructor) {
        const parser = new ExpressionParser({
            variables: props.variables || { pi: 3.141592653589793 },
        })
        const operators: OperatorMap = {
            "+": (a, b) => a + b,
            "-": (a, b) => a - b,
            "*": (a, b) => a * b,
            "/": (a, b) => a / b,
            // "%": (a, b) => a % b,
            // and: (a, b) => a && b,
            // or: (a, b) => a || b,
            ">": (a, b) => a > b,
            ">=": (a, b) => a >= b,
            "<": (a, b) => a < b,
            "<=": (a, b) => a <= b,
            "==": (a, b) => a === b,
            "!=": (a, b) => a !== b,
            // "^": (a, b) => Math.pow(a, b),
        }
        const functions: FunctionMap = {}
        parser.setFunctions(functions)
        parser.setOperators(operators)
        return parser
    }
}
