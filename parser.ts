// adapted from

/**
 * Author: Zijing Zhang (Pluveto)
 * Date: 2023-01-11 15:28:00
 * Description: A Pratt Parser implemented in TypeScript.
 */

namespace parser {
    class Error {
        constructor(public msg: string) {
            console.log(msg)
        }
    }

    type OperatorInfo = {
        [key: string]: {
            fun: (a: any, b: any) => any
            prec: number
        }
    }

    const infixOps: OperatorInfo = {
        "+": { fun: (a, b) => a + b, prec: 10 },
        "-": { fun: (a, b) => a - b, prec: 10 },
        "*": { fun: (a, b) => a * b, prec: 20 },
        "/": { fun: (a, b) => a / b, prec: 20 },
        ">": { fun: (a, b) => a > b, prec: 30 },
        ">=": { fun: (a, b) => a >= b, prec: 30 },
        "<": { fun: (a, b) => a < b, prec: 30 },
        "<=": { fun: (a, b) => a <= b, prec: 30 },
        "==": { fun: (a, b) => a === b, prec: 30 },
        "!=": { fun: (a, b) => a !== b, prec: 30 },
    }

    type PrefixFn = (token: string) => any
    type InfixFn = (lhs: any, token: string) => any
    type PostfixFn = (lhs: any, token: string) => any

    export class Parser {
        private index = 0
        private next() {
            return this.tokens[this.index++]
        }
        private peek() {
            return this.tokens[this.index]
        }

        private prefixParser(t: string): PrefixFn {
            const num = parseFloat(t)
            if (!isNaN(num)) {
                return t => num
            } else if (t === "(") {
                return t => {
                    const expr = this.parse(0)
                    const next = this.next()
                    if (next !== ")") {
                        throw new Error("expected )")
                    }
                    return expr
                }
            }
            return undefined
        }

        private infixParser(t: string): InfixFn {
            if (infixOps[t]) {
                return (lhs: any, token: any) =>
                    infixOps[t].fun(lhs, this.parse(infixOps[t].prec))
            }
            return undefined
        }

        private postfixParser(t: string): PostfixFn {
            //         postfix: {
            //             [TokenType.Fac]: (lhs: ExprNode, token: Token) => {
            //                 return new PostfixOpNode("!", lhs)
            //             },
            //         } as { [k: number]: PostfixFn },
            return undefined
        }

        constructor(public tokens: string[]) {}

        precOf(token: string): number {
            return infixOps[token] ? infixOps[token].prec : 0
        }

        parse(prec: number = 0): any {
            let token = this.next()
            let prefixParser: PrefixFn = this.prefixParser(token)
            if (!prefixParser) {
                throw new Error(`Unexpected prefix token ${token}`)
            }
            let lhs: any = prefixParser(token)
            let precRight = this.precOf(this.peek())

            while (prec < precRight) {
                token = this.next()
                let infixParser: InfixFn | PostfixFn =
                    this.infixParser(token) || this.postfixParser(token)
                if (!infixParser) {
                    throw new Error(
                        `Unexpected infix or postfix token ${token}`
                    )
                }
                lhs = infixParser(lhs, token)
                precRight = this.precOf(this.peek())
            }

            return lhs
        }
    }
}
