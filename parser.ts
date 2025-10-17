/**
 * Author: Zijing Zhang (Pluveto)
 * Date: 2023-01-11 15:28:00
 * Description: A Pratt Parser implemented in TypeScript.
 */

namespace parser {
    class Error {
        constructor(public msg: string) {}
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

    // infix:
    // [TokenType.Add]: (lhs: ExprNode, token: Token) => {

    // public parsers() {
    //     return {
    //         prefix: {
    //             [TokenType.Num]: (token: Token) => {
    //                 return new ValueNode(parseInt(token.value))
    //             },
    //             [TokenType.LPa]: (token: Token) => {
    //                 const expr = this.parse(0)
    //                 const next = this.tokens.next()
    //                 if (next.type !== TokenType.RPa) {
    //                     throw new Error("Expected )")
    //                 }
    //                 return expr
    //             },
    //         } as { [k: number]: PrefixFn },
    //         postfix: {
    //             [TokenType.Fac]: (lhs: ExprNode, token: Token) => {
    //                 return new PostfixOpNode("!", lhs)
    //             },
    //         } as { [k: number]: PostfixFn },
    //     }

    class Parser {
        private index = 0
        private next() {
            return this.tokens[this.index++]
        }
        private peek() {
            return this.tokens[this.index]
        }

        private prefixParser(t: string): PrefixFn {
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
            return undefined
        }

        constructor(public tokens: string[]) {}

        precOf(token: string): number {
            return infixOps[token].prec || 0
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

    let tokens = [
        // - 1 + (2 - 3) * 6 / 3 ! - 2 ^ 3 ^ 4
        "-",
        "1",
        "+",
        "(",
        "2",
        "-",
        "3",
        ")",
        "*",
        "6",
        "/",
        "3",
        "!",
        "-",
        "2",
        "^",
        "3",
        "^",
        "4",
        "",
    ]

    let parser = new Parser(tokens)
    let ast = parser.parse()

    console.log(`Equivalent expression: ${ast.toString()}`)
}
