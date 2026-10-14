import { Token, Token_Class, CompilerError, ASTNode, SymbolEntry } from './jasonTypes';

export class JASONParser {
  private tokens: Token[] = [];
  private current = 0;
  private errors: CompilerError[] = [];
  private symbolTable: Map<string, SymbolEntry> = new Map();
  private nodeIdCounter = 0;
  private currentScope = 'global';

  private nextNodeId(): string {
    return `node-${++this.nodeIdCounter}`;
  }

  public parse(tokens: Token[]): {
    ast: ASTNode | null;
    symbolTable: SymbolEntry[];
    errors: CompilerError[];
  } {
    this.tokens = tokens;
    this.current = 0;
    this.errors = [];
    this.symbolTable.clear();
    this.nodeIdCounter = 0;
    this.currentScope = 'global';

    if (tokens.length === 0) {
      return { ast: null, symbolTable: [], errors: [] };
    }

    const programNode = this.parseProgram();
    return {
      ast: programNode,
      symbolTable: Array.from(this.symbolTable.values()),
      errors: this.errors,
    };
  }

  private peek(): Token | undefined {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private check(type: Token_Class): boolean {
    if (this.isAtEnd()) return false;
    return this.peek()?.token_type === type;
  }

  private match(...types: Token_Class[]): boolean {
    for (const t of types) {
      if (this.check(t)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private consume(type: Token_Class, message: string): Token | null {
    if (this.check(type)) return this.advance();
    const token = this.peek();
    this.addError(message, token?.line || 1, token?.col || 1);
    return null;
  }

  private addError(message: string, line: number, col: number) {
    this.errors.push({
      id: `err-parser-${this.errors.length + 1}`,
      line,
      col,
      message,
      phase: 'Parser',
      severity: 'error',
    });
  }

  // Program Rule
  private parseProgram(): ASTNode {
    const root: ASTNode = {
      id: this.nextNodeId(),
      name: 'Program',
      type: 'rule',
      children: [],
    };

    // Optional Procedure definitions before PROGRAM or after
    while (this.check(Token_Class.Procedure)) {
      root.children!.push(this.parseProcedure());
    }

    // PROGRAM header: PROGRAM <id> ;
    if (this.check(Token_Class.Program)) {
      const progTok = this.advance();
      const headerNode: ASTNode = {
        id: this.nextNodeId(),
        name: 'Program_Header',
        type: 'rule',
        children: [
          { id: this.nextNodeId(), name: progTok.lex, type: 'terminal', token: progTok },
        ],
      };

      const nameTok = this.consume(Token_Class.Identifier, "Expected identifier after 'PROGRAM'");
      if (nameTok) {
        headerNode.children!.push({
          id: this.nextNodeId(),
          name: nameTok.lex,
          type: 'terminal',
          token: nameTok,
        });
        this.symbolTable.set(nameTok.lex, {
          name: nameTok.lex,
          tokenClass: Token_Class.Program,
          dataType: 'Program',
          scope: 'global',
          line: nameTok.line,
        });
      }

      if (this.check(Token_Class.Semicolon)) {
        const semi = this.advance();
        headerNode.children!.push({ id: this.nextNodeId(), name: ';', type: 'terminal', token: semi });
      }

      root.children!.push(headerNode);
    }

    // Optional DECLARE block
    if (this.check(Token_Class.Declare)) {
      root.children!.push(this.parseDeclarations());
    }

    // Optional Procedure definitions inside
    while (this.check(Token_Class.Procedure)) {
      root.children!.push(this.parseProcedure());
    }

    // Main Body: BEGIN ... END
    if (this.check(Token_Class.Begin)) {
      root.children!.push(this.parseBlock());
    } else if (!this.isAtEnd()) {
      // Freeform statements allowed if BEGIN is omitted
      root.children!.push(this.parseStatementsList());
    }

    // Semicolon or Dot at end of program
    if (this.check(Token_Class.Dot) || this.check(Token_Class.Semicolon)) {
      const termTok = this.advance();
      root.children!.push({ id: this.nextNodeId(), name: termTok.lex, type: 'terminal', token: termTok });
    }

    return root;
  }

  // Procedure Rule
  private parseProcedure(): ASTNode {
    const procTok = this.advance(); // PROCEDURE
    const procNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Procedure_Decl',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: procTok.lex, type: 'terminal', token: procTok }],
    };

    const nameTok = this.consume(Token_Class.Identifier, 'Expected procedure name');
    if (nameTok) {
      this.currentScope = nameTok.lex;
      procNode.children!.push({
        id: this.nextNodeId(),
        name: nameTok.lex,
        type: 'terminal',
        token: nameTok,
      });
      this.symbolTable.set(nameTok.lex, {
        name: nameTok.lex,
        tokenClass: Token_Class.Procedure,
        dataType: 'Void',
        scope: 'global',
        line: nameTok.line,
      });
    }

    // Parameters block
    if (this.check(Token_Class.Parameters) || this.check(Token_Class.LParanthesis)) {
      procNode.children!.push(this.parseParameters());
    }

    // Declarations in procedure
    if (this.check(Token_Class.Declare)) {
      procNode.children!.push(this.parseDeclarations());
    }

    // Procedure Body: BEGIN ... END
    if (this.check(Token_Class.Begin)) {
      procNode.children!.push(this.parseBlock());
    }

    this.currentScope = 'global';
    return procNode;
  }

  private parseParameters(): ASTNode {
    const paramNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Parameters',
      type: 'rule',
      children: [],
    };

    if (this.check(Token_Class.Parameters)) {
      const pTok = this.advance();
      paramNode.children!.push({ id: this.nextNodeId(), name: pTok.lex, type: 'terminal', token: pTok });
    }

    if (this.check(Token_Class.LParanthesis)) {
      const lp = this.advance();
      paramNode.children!.push({ id: this.nextNodeId(), name: '(', type: 'terminal', token: lp });

      while (!this.check(Token_Class.RParanthesis) && !this.isAtEnd()) {
        let pType = 'Integer';
        if (this.check(Token_Class.Integer) || this.check(Token_Class.Real)) {
          const tTok = this.advance();
          pType = tTok.lex;
          paramNode.children!.push({ id: this.nextNodeId(), name: tTok.lex, type: 'terminal', token: tTok });
        }

        const idTok = this.consume(Token_Class.Identifier, 'Expected parameter identifier');
        if (idTok) {
          paramNode.children!.push({ id: this.nextNodeId(), name: idTok.lex, type: 'terminal', token: idTok });
          this.symbolTable.set(`${this.currentScope}.${idTok.lex}`, {
            name: idTok.lex,
            tokenClass: Token_Class.Identifier,
            dataType: pType,
            scope: this.currentScope,
            line: idTok.line,
            attributes: 'Parameter',
          });
        }

        if (this.check(Token_Class.Comma)) {
          const cTok = this.advance();
          paramNode.children!.push({ id: this.nextNodeId(), name: ',', type: 'terminal', token: cTok });
        } else {
          break;
        }
      }

      const rp = this.consume(Token_Class.RParanthesis, "Expected ')' after parameters");
      if (rp) {
        paramNode.children!.push({ id: this.nextNodeId(), name: ')', type: 'terminal', token: rp });
      }
    }

    return paramNode;
  }

  // Declarations Rule
  private parseDeclarations(): ASTNode {
    const declTok = this.advance(); // DECLARE
    const declNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Declarations',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: declTok.lex, type: 'terminal', token: declTok }],
    };

    while (
      (this.check(Token_Class.Integer) || this.check(Token_Class.Real) || this.check(Token_Class.Identifier)) &&
      !this.check(Token_Class.Begin) &&
      !this.isAtEnd()
    ) {
      let dType = 'Integer';
      if (this.check(Token_Class.Integer) || this.check(Token_Class.Real)) {
        const typeTok = this.advance();
        dType = typeTok.lex;
        declNode.children!.push({ id: this.nextNodeId(), name: typeTok.lex, type: 'terminal', token: typeTok });
      }

      // Variable names list: x, y := 5, z
      while (!this.isAtEnd()) {
        const idTok = this.consume(Token_Class.Identifier, 'Expected variable name');
        if (!idTok) break;

        let initVal: string | undefined = undefined;
        declNode.children!.push({ id: this.nextNodeId(), name: idTok.lex, type: 'terminal', token: idTok });

        // Optional initialization: := 10 or = 10
        if (this.check(Token_Class.AssignmentOp) || this.check(Token_Class.EqualOp)) {
          const assignTok = this.advance();
          declNode.children!.push({ id: this.nextNodeId(), name: assignTok.lex, type: 'terminal', token: assignTok });
          const exprNode = this.parseExpression();
          initVal = exprNode.value || exprNode.name;
          declNode.children!.push(exprNode);
        }

        this.symbolTable.set(`${this.currentScope === 'global' ? '' : this.currentScope + '.'}${idTok.lex}`, {
          name: idTok.lex,
          tokenClass: Token_Class.Identifier,
          dataType: dType,
          scope: this.currentScope,
          line: idTok.line,
          value: initVal,
        });

        if (this.check(Token_Class.Comma)) {
          const comma = this.advance();
          declNode.children!.push({ id: this.nextNodeId(), name: ',', type: 'terminal', token: comma });
        } else {
          break;
        }
      }

      if (this.check(Token_Class.Semicolon)) {
        const semi = this.advance();
        declNode.children!.push({ id: this.nextNodeId(), name: ';', type: 'terminal', token: semi });
      } else {
        break;
      }
    }

    return declNode;
  }

  // Block Rule
  private parseBlock(): ASTNode {
    const beginTok = this.advance(); // BEGIN
    const blockNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Block',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: beginTok.lex, type: 'terminal', token: beginTok }],
    };

    blockNode.children!.push(this.parseStatementsList());

    const endTok = this.consume(Token_Class.End, "Expected 'END' to close block");
    if (endTok) {
      blockNode.children!.push({ id: this.nextNodeId(), name: endTok.lex, type: 'terminal', token: endTok });
    }

    return blockNode;
  }

  // Statements List
  private parseStatementsList(): ASTNode {
    const listNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Statements_List',
      type: 'rule',
      children: [],
    };

    while (!this.check(Token_Class.End) && !this.check(Token_Class.EndIf) && !this.check(Token_Class.Else) && !this.check(Token_Class.EndWhile) && !this.check(Token_Class.EndUntil) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        listNode.children!.push(stmt);
      } else {
        // Skip token to recover from error
        this.advance();
      }

      // Consume optional semicolon between statements
      while (this.check(Token_Class.Semicolon)) {
        const semi = this.advance();
        listNode.children!.push({ id: this.nextNodeId(), name: ';', type: 'terminal', token: semi });
      }
    }

    return listNode;
  }

  // Statement Rule
  private parseStatement(): ASTNode | null {
    if (this.check(Token_Class.Set)) {
      return this.parseAssignment();
    }
    if (this.check(Token_Class.If)) {
      return this.parseIf();
    }
    if (this.check(Token_Class.While)) {
      return this.parseWhile();
    }
    if (this.check(Token_Class.Do)) {
      return this.parseDoUntil();
    }
    if (this.check(Token_Class.Read)) {
      return this.parseRead();
    }
    if (this.check(Token_Class.Write)) {
      return this.parseWrite();
    }
    if (this.check(Token_Class.Call)) {
      return this.parseCall();
    }
    if (this.check(Token_Class.Identifier)) {
      // Could be assignment like: x := 5; or x = 5;
      return this.parseAssignmentOrCall();
    }

    return null;
  }

  // Assignment: SET x = expr; or x := expr;
  private parseAssignment(): ASTNode {
    const setTok = this.advance(); // SET
    const assignNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Assignment_Statement',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: setTok.lex, type: 'terminal', token: setTok }],
    };

    const idTok = this.consume(Token_Class.Identifier, "Expected identifier after 'SET'");
    if (idTok) {
      assignNode.children!.push({ id: this.nextNodeId(), name: idTok.lex, type: 'terminal', token: idTok });
      // Record in symbol table if not present
      const key = `${this.currentScope === 'global' ? '' : this.currentScope + '.'}${idTok.lex}`;
      if (!this.symbolTable.has(key)) {
        this.symbolTable.set(key, {
          name: idTok.lex,
          tokenClass: Token_Class.Identifier,
          dataType: 'Integer',
          scope: this.currentScope,
          line: idTok.line,
        });
      }
    }

    const eqTok = this.consume(Token_Class.EqualOp, "Expected '=' in SET statement") ||
                  this.consume(Token_Class.AssignmentOp, "Expected ':=' or '=' in SET statement");
    if (eqTok) {
      assignNode.children!.push({ id: this.nextNodeId(), name: eqTok.lex, type: 'terminal', token: eqTok });
    }

    const expr = this.parseExpression();
    assignNode.children!.push(expr);

    return assignNode;
  }

  private parseAssignmentOrCall(): ASTNode {
    const idTok = this.advance(); // Identifier
    const node: ASTNode = {
      id: this.nextNodeId(),
      name: 'Statement',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: idTok.lex, type: 'terminal', token: idTok }],
    };

    if (this.check(Token_Class.AssignmentOp) || this.check(Token_Class.EqualOp)) {
      node.name = 'Assignment_Statement';
      const eqTok = this.advance();
      node.children!.push({ id: this.nextNodeId(), name: eqTok.lex, type: 'terminal', token: eqTok });
      node.children!.push(this.parseExpression());
    } else if (this.check(Token_Class.LParanthesis)) {
      node.name = 'Procedure_Call';
      const lp = this.advance();
      node.children!.push({ id: this.nextNodeId(), name: '(', type: 'terminal', token: lp });
      // Arguments
      while (!this.check(Token_Class.RParanthesis) && !this.isAtEnd()) {
        node.children!.push(this.parseExpression());
        if (this.check(Token_Class.Comma)) {
          const comma = this.advance();
          node.children!.push({ id: this.nextNodeId(), name: ',', type: 'terminal', token: comma });
        } else {
          break;
        }
      }
      const rp = this.consume(Token_Class.RParanthesis, "Expected ')' after call arguments");
      if (rp) {
        node.children!.push({ id: this.nextNodeId(), name: ')', type: 'terminal', token: rp });
      }
    }

    return node;
  }

  // IF Statement: IF <condition> THEN <statements> [ELSE <statements>] ENDIF
  private parseIf(): ASTNode {
    const ifTok = this.advance();
    const ifNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'If_Statement',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: ifTok.lex, type: 'terminal', token: ifTok }],
    };

    const cond = this.parseCondition();
    ifNode.children!.push(cond);

    const thenTok = this.consume(Token_Class.Then, "Expected 'THEN' after condition");
    if (thenTok) {
      ifNode.children!.push({ id: this.nextNodeId(), name: thenTok.lex, type: 'terminal', token: thenTok });
    }

    const thenStmts = this.parseStatementsList();
    ifNode.children!.push(thenStmts);

    if (this.check(Token_Class.Else)) {
      const elseTok = this.advance();
      ifNode.children!.push({ id: this.nextNodeId(), name: elseTok.lex, type: 'terminal', token: elseTok });
      const elseStmts = this.parseStatementsList();
      ifNode.children!.push(elseStmts);
    }

    const endIfTok = this.consume(Token_Class.EndIf, "Expected 'ENDIF' to close IF statement");
    if (endIfTok) {
      ifNode.children!.push({ id: this.nextNodeId(), name: endIfTok.lex, type: 'terminal', token: endIfTok });
    }

    return ifNode;
  }

  // WHILE Statement: WHILE <condition> DO <statements> ENDWHILE
  private parseWhile(): ASTNode {
    const whileTok = this.advance();
    const whileNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'While_Statement',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: whileTok.lex, type: 'terminal', token: whileTok }],
    };

    const cond = this.parseCondition();
    whileNode.children!.push(cond);

    const doTok = this.consume(Token_Class.Do, "Expected 'DO' after WHILE condition");
    if (doTok) {
      whileNode.children!.push({ id: this.nextNodeId(), name: doTok.lex, type: 'terminal', token: doTok });
    }

    const stmts = this.parseStatementsList();
    whileNode.children!.push(stmts);

    const endWhileTok = this.consume(Token_Class.EndWhile, "Expected 'ENDWHILE' to close WHILE loop");
    if (endWhileTok) {
      whileNode.children!.push({ id: this.nextNodeId(), name: endWhileTok.lex, type: 'terminal', token: endWhileTok });
    }

    return whileNode;
  }

  // DO ... UNTIL Statement: DO <statements> UNTIL <condition> ENDUNTIL
  private parseDoUntil(): ASTNode {
    const doTok = this.advance();
    const doNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Repeat_Until_Statement',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: doTok.lex, type: 'terminal', token: doTok }],
    };

    const stmts = this.parseStatementsList();
    doNode.children!.push(stmts);

    const untilTok = this.consume(Token_Class.Until, "Expected 'UNTIL' in DO-UNTIL loop");
    if (untilTok) {
      doNode.children!.push({ id: this.nextNodeId(), name: untilTok.lex, type: 'terminal', token: untilTok });
    }

    const cond = this.parseCondition();
    doNode.children!.push(cond);

    if (this.check(Token_Class.EndUntil)) {
      const endTok = this.advance();
      doNode.children!.push({ id: this.nextNodeId(), name: endTok.lex, type: 'terminal', token: endTok });
    }

    return doNode;
  }

  // READ Statement: READ <id>
  private parseRead(): ASTNode {
    const readTok = this.advance();
    const readNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Read_Statement',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: readTok.lex, type: 'terminal', token: readTok }],
    };

    const idTok = this.consume(Token_Class.Identifier, "Expected identifier after 'READ'");
    if (idTok) {
      readNode.children!.push({ id: this.nextNodeId(), name: idTok.lex, type: 'terminal', token: idTok });
    }

    return readNode;
  }

  // WRITE Statement: WRITE ( <expr> | <string> )
  private parseWrite(): ASTNode {
    const writeTok = this.advance();
    const writeNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Write_Statement',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: writeTok.lex, type: 'terminal', token: writeTok }],
    };

    if (this.check(Token_Class.StringLiteral)) {
      const strTok = this.advance();
      writeNode.children!.push({
        id: this.nextNodeId(),
        name: strTok.lex,
        type: 'terminal',
        token: strTok,
      });
    } else {
      writeNode.children!.push(this.parseExpression());
    }

    return writeNode;
  }

  // CALL Statement: CALL <id> ( [args] )
  private parseCall(): ASTNode {
    const callTok = this.advance();
    const callNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Call_Statement',
      type: 'rule',
      children: [{ id: this.nextNodeId(), name: callTok.lex, type: 'terminal', token: callTok }],
    };

    const idTok = this.consume(Token_Class.Identifier, "Expected procedure name after 'CALL'");
    if (idTok) {
      callNode.children!.push({ id: this.nextNodeId(), name: idTok.lex, type: 'terminal', token: idTok });
    }

    if (this.check(Token_Class.LParanthesis)) {
      const lp = this.advance();
      callNode.children!.push({ id: this.nextNodeId(), name: '(', type: 'terminal', token: lp });

      while (!this.check(Token_Class.RParanthesis) && !this.isAtEnd()) {
        callNode.children!.push(this.parseExpression());
        if (this.check(Token_Class.Comma)) {
          const comma = this.advance();
          callNode.children!.push({ id: this.nextNodeId(), name: ',', type: 'terminal', token: comma });
        } else {
          break;
        }
      }

      const rp = this.consume(Token_Class.RParanthesis, "Expected ')' after call arguments");
      if (rp) {
        callNode.children!.push({ id: this.nextNodeId(), name: ')', type: 'terminal', token: rp });
      }
    }

    return callNode;
  }

  // Condition Rule: Expression RelOp Expression
  private parseCondition(): ASTNode {
    const condNode: ASTNode = {
      id: this.nextNodeId(),
      name: 'Condition',
      type: 'rule',
      children: [],
    };

    const left = this.parseExpression();
    condNode.children!.push(left);

    if (
      this.check(Token_Class.EqualOp) ||
      this.check(Token_Class.LessThanOp) ||
      this.check(Token_Class.GreaterThanOp) ||
      this.check(Token_Class.NotEqualOp) ||
      this.check(Token_Class.LessOrEqualOp) ||
      this.check(Token_Class.GreaterOrEqualOp)
    ) {
      const opTok = this.advance();
      condNode.children!.push({ id: this.nextNodeId(), name: opTok.lex, type: 'terminal', token: opTok });
      const right = this.parseExpression();
      condNode.children!.push(right);
    }

    // Support compound boolean: AND / OR
    if (this.check(Token_Class.AndOp) || this.check(Token_Class.OrOp)) {
      const logOp = this.advance();
      condNode.children!.push({ id: this.nextNodeId(), name: logOp.lex, type: 'terminal', token: logOp });
      condNode.children!.push(this.parseCondition());
    }

    return condNode;
  }

  // Expression Rule: Term ( ( + | - ) Term )*
  private parseExpression(): ASTNode {
    let left = this.parseTerm();

    while (this.check(Token_Class.PlusOp) || this.check(Token_Class.MinusOp)) {
      const opTok = this.advance();
      const right = this.parseTerm();
      const exprNode: ASTNode = {
        id: this.nextNodeId(),
        name: 'Arith_Expression',
        type: 'rule',
        children: [
          left,
          { id: this.nextNodeId(), name: opTok.lex, type: 'terminal', token: opTok },
          right,
        ],
      };
      left = exprNode;
    }

    return left;
  }

  // Term Rule: Factor ( ( * | / ) Factor )*
  private parseTerm(): ASTNode {
    let left = this.parseFactor();

    while (this.check(Token_Class.MultiplyOp) || this.check(Token_Class.DivideOp)) {
      const opTok = this.advance();
      const right = this.parseFactor();
      const termNode: ASTNode = {
        id: this.nextNodeId(),
        name: 'Term',
        type: 'rule',
        children: [
          left,
          { id: this.nextNodeId(), name: opTok.lex, type: 'terminal', token: opTok },
          right,
        ],
      };
      left = termNode;
    }

    return left;
  }

  // Factor Rule: Constant | Identifier | ( Expression ) | StringLiteral
  private parseFactor(): ASTNode {
    if (this.check(Token_Class.Constant)) {
      const cTok = this.advance();
      return {
        id: this.nextNodeId(),
        name: 'Constant',
        value: cTok.lex,
        type: 'terminal',
        token: cTok,
      };
    }

    if (this.check(Token_Class.StringLiteral)) {
      const sTok = this.advance();
      return {
        id: this.nextNodeId(),
        name: 'StringLiteral',
        value: sTok.lex,
        type: 'terminal',
        token: sTok,
      };
    }

    if (this.check(Token_Class.Identifier)) {
      const idTok = this.advance();
      const factorNode: ASTNode = {
        id: this.nextNodeId(),
        name: 'Identifier',
        value: idTok.lex,
        type: 'terminal',
        token: idTok,
      };

      // Check if this is a function call in expression: id(arg1, arg2)
      if (this.check(Token_Class.LParanthesis)) {
        const callNode: ASTNode = {
          id: this.nextNodeId(),
          name: 'Function_Call',
          type: 'rule',
          children: [factorNode],
        };
        const lp = this.advance();
        callNode.children!.push({ id: this.nextNodeId(), name: '(', type: 'terminal', token: lp });
        while (!this.check(Token_Class.RParanthesis) && !this.isAtEnd()) {
          callNode.children!.push(this.parseExpression());
          if (this.check(Token_Class.Comma)) {
            const c = this.advance();
            callNode.children!.push({ id: this.nextNodeId(), name: ',', type: 'terminal', token: c });
          } else {
            break;
          }
        }
        const rp = this.consume(Token_Class.RParanthesis, "Expected ')' after function arguments");
        if (rp) {
          callNode.children!.push({ id: this.nextNodeId(), name: ')', type: 'terminal', token: rp });
        }
        return callNode;
      }

      return factorNode;
    }

    if (this.check(Token_Class.LParanthesis)) {
      const lp = this.advance();
      const expr = this.parseExpression();
      const rp = this.consume(Token_Class.RParanthesis, "Expected ')' to close expression");

      return {
        id: this.nextNodeId(),
        name: 'Sub_Expression',
        type: 'rule',
        children: [
          { id: this.nextNodeId(), name: '(', type: 'terminal', token: lp },
          expr,
          ...(rp ? [{ id: this.nextNodeId(), name: ')', type: 'terminal' as const, token: rp }] : []),
        ],
      };
    }

    // Fallback for unexpected token
    const unexpected = this.peek();
    const line = unexpected?.line || 1;
    const col = unexpected?.col || 1;
    this.addError(`Unexpected token '${unexpected?.lex || 'EOF'}' in expression`, line, col);

    if (unexpected) this.advance();
    return {
      id: this.nextNodeId(),
      name: 'Error_Node',
      type: 'terminal',
      value: unexpected?.lex || '<?>',
    };
  }
}
