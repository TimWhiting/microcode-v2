/**
 * Author: Zijing Zhang (Pluveto)
 * Date: 2023-01-11 15:28:00
 * Description: A Pratt Parser implemented in TypeScript.
 */

namespace parser {
    class Error {
        constructor(public msg: string) {}
    }

    type InfixOp = "+" | "-" | "*" | "/" | "^"
    type PrefixOp = "-" | "+"
    type PostfixOp = "!"

    class ExprNode {
        constructor() {}
        toString(): string {
            throw new Error("not implemented")
        }
    }

    class ValueNode extends ExprNode {
        constructor(public val: number) {
            super()
        }
        toString() {
            return this.val.toString()
        }
    }

    class PrefixOpNode extends ExprNode {
        constructor(public op: PrefixOp, public rhs: ExprNode) {
            super()
        }
        toString() {
            return `(${this.op}${this.rhs})`
        }
    }
    class InfixOpNode extends ExprNode {
        constructor(
            public op: InfixOp,
            public lhs: ExprNode,
            public rhs: ExprNode
        ) {
            super()
        }
        toString() {
            return `(${this.lhs}${this.op}${this.rhs})`
        }
    }
    class PostfixOpNode extends ExprNode {
        constructor(public op: PostfixOp, public lhs: ExprNode) {
            super()
        }
        toString() {
            return `(${this.lhs}${this.op})`
        }
    }

    class Iterator<T> {
        private pos: number
        constructor(private inner: Array<T> = []) {
            this.pos = 0
        }
        next(): T | undefined {
            const peek = this.peek()
            this.pos++
            return peek
        }
        peek(): T | undefined {
            return this.inner[this.pos] || undefined
        }
    }

    enum TokenType {
        None,
        Num,
        Add,
        Sub,
        Mul,
        Div,
        Fac,
        Pow,
        LPa,
        RPa,
        Eoi,
    }

    class Token {
        constructor(
            public type: TokenType = TokenType.None,
            public value: string
        ) {}
    }

    type PrefixFn = (token: Token) => ExprNode
    type InfixFn = (lhs: ExprNode, token: Token) => ExprNode
    type PostfixFn = (lhs: ExprNode, token: Token) => ExprNode

    class Parser {
        constructor(public tokens: Iterator<Token>) {}
        public parsers() {
            return {
                prefix: {
                    [TokenType.Num]: (token: Token) => {
                        return new ValueNode(parseInt(token.value))
                    },
                    [TokenType.Add]: (token: Token) => {
                        return new PrefixOpNode(
                            "+",
                            this.parse(this.precOf("+"))
                        )
                    },
                    [TokenType.Sub]: (token: Token) => {
                        return new PrefixOpNode(
                            "-",
                            this.parse(this.precOf("-"))
                        )
                    },
                    [TokenType.LPa]: (token: Token) => {
                        const expr = this.parse(0)
                        const next = this.tokens.next()
                        if (next.type !== TokenType.RPa) {
                            throw new Error("Expected )")
                        }
                        return expr
                    },
                } as { [k: number]: PrefixFn },
                infix: {
                    [TokenType.Add]: (lhs: ExprNode, token: Token) => {
                        return new InfixOpNode(
                            "+",
                            lhs,
                            this.parse(this.precOf("+"))
                        )
                    },
                    [TokenType.Sub]: (lhs: ExprNode, token: Token) => {
                        return new InfixOpNode(
                            "-",
                            lhs,
                            this.parse(this.precOf("-"))
                        )
                    },
                    [TokenType.Mul]: (lhs: ExprNode, token: Token) => {
                        return new InfixOpNode(
                            "*",
                            lhs,
                            this.parse(this.precOf("*"))
                        )
                    },
                    [TokenType.Div]: (lhs: ExprNode, token: Token) => {
                        return new InfixOpNode(
                            "/",
                            lhs,
                            this.parse(this.precOf("/"))
                        )
                    },
                    [TokenType.Pow]: (lhs: ExprNode, token: Token) => {
                        return new InfixOpNode(
                            "^",
                            lhs,
                            this.parse(this.precOf("^") - 1)
                        ) // Right associative
                    },
                } as { [k: number]: InfixFn },
                postfix: {
                    [TokenType.Fac]: (lhs: ExprNode, token: Token) => {
                        return new PostfixOpNode("!", lhs)
                    },
                } as { [k: number]: PostfixFn },
            }
        }
        precOf(token: string): number {
            const precs: { [index: string]: number } = {
                "+": 10,
                "-": 10,
                "*": 20,
                "/": 20,
                "^": 30,
                "!": 40,
            }

            return precs[token] || 0
        }
        parse(prec: number = 0): ExprNode {
            let token = this.tokens.next()
            let parsers = this.parsers()
            let prefixParser: PrefixFn = parsers.prefix[token.type]
            if (!prefixParser) {
                throw new Error(`Unexpected prefix token ${token.type}`)
            }
            let lhs: ExprNode = prefixParser(token)
            let precRight = this.precOf(this.tokens.peek().value)

            while (prec < precRight) {
                token = this.tokens.next()
                let infixParser: InfixFn | PostfixFn =
                    parsers.infix[token.type] || parsers.postfix[token.type]
                if (!infixParser) {
                    throw new Error(
                        `Unexpected infix or postfix token ${token.value}`
                    )
                }
                lhs = infixParser(lhs, token)
                precRight = this.precOf(this.tokens.peek().value)
            }

            return lhs
        }
    }

    let tokens = new Iterator<Token>([
        // - 1 + (2 - 3) * 6 / 3 ! - 2 ^ 3 ^ 4
        new Token(TokenType.Sub, "-"),
        new Token(TokenType.Num, "1"),
        new Token(TokenType.Add, "+"),
        new Token(TokenType.LPa, "("),
        new Token(TokenType.Num, "2"),
        new Token(TokenType.Sub, "-"),
        new Token(TokenType.Num, "3"),
        new Token(TokenType.RPa, ")"),
        new Token(TokenType.Mul, "*"),
        new Token(TokenType.Num, "6"),
        new Token(TokenType.Div, "/"),
        new Token(TokenType.Num, "3"),
        new Token(TokenType.Fac, "!"),
        new Token(TokenType.Sub, "-"),
        new Token(TokenType.Num, "2"),
        new Token(TokenType.Pow, "^"),
        new Token(TokenType.Num, "3"),
        new Token(TokenType.Pow, "^"),
        new Token(TokenType.Num, "4"),
        new Token(TokenType.Eoi, ""),
    ])

    let parser = new Parser(tokens)
    let ast = parser.parse()

    console.log(`Equivalent expression: ${ast.toString()}`)
}
