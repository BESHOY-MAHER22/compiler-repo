import { Token, Token_Class, CompilerError } from './jasonTypes';

export class JASONScanner {
  public tokens: Token[] = [];
  public errors: CompilerError[] = [];
  private reservedWords: Map<string, Token_Class> = new Map();
  private operators: Map<string, Token_Class> = new Map();

  constructor() {
    // Ported directly from JASON_Compiler/Scanner.cs
    this.reservedWords.set('IF', Token_Class.If);
    this.reservedWords.set('BEGIN', Token_Class.Begin);
    this.reservedWords.set('CALL', Token_Class.Call);
    this.reservedWords.set('DECLARE', Token_Class.Declare);
    this.reservedWords.set('END', Token_Class.End);
    this.reservedWords.set('DO', Token_Class.Do);
    this.reservedWords.set('ELSE', Token_Class.Else);
    this.reservedWords.set('ENDIF', Token_Class.EndIf);
    this.reservedWords.set('ENDUNTIL', Token_Class.EndUntil);
    this.reservedWords.set('ENDWHILE', Token_Class.EndWhile);
    this.reservedWords.set('INTEGER', Token_Class.Integer);
    this.reservedWords.set('PARAMETERS', Token_Class.Parameters);
    this.reservedWords.set('PROCEDURE', Token_Class.Procedure);
    this.reservedWords.set('PROGRAM', Token_Class.Program);
    this.reservedWords.set('READ', Token_Class.Read);
    this.reservedWords.set('REAL', Token_Class.Real);
    this.reservedWords.set('SET', Token_Class.Set);
    this.reservedWords.set('THEN', Token_Class.Then);
    this.reservedWords.set('UNTIL', Token_Class.Until);
    this.reservedWords.set('WHILE', Token_Class.While);
    this.reservedWords.set('WRITE', Token_Class.Write);

    // Operators & Delimiters
    this.operators.set('.', Token_Class.Dot);
    this.operators.set(';', Token_Class.Semicolon);
    this.operators.set(',', Token_Class.Comma);
    this.operators.set('(', Token_Class.LParanthesis);
    this.operators.set(')', Token_Class.RParanthesis);
    this.operators.set('=', Token_Class.EqualOp);
    this.operators.set(':=', Token_Class.AssignmentOp);
    this.operators.set('<', Token_Class.LessThanOp);
    this.operators.set('>', Token_Class.GreaterThanOp);
    this.operators.set('!', Token_Class.NotEqualOp);
    this.operators.set('<>', Token_Class.NotEqualOp);
    this.operators.set('!=', Token_Class.NotEqualOp);
    this.operators.set('<=', Token_Class.LessOrEqualOp);
    this.operators.set('>=', Token_Class.GreaterOrEqualOp);
    this.operators.set('+', Token_Class.PlusOp);
    this.operators.set('-', Token_Class.MinusOp);
    this.operators.set('*', Token_Class.MultiplyOp);
    this.operators.set('/', Token_Class.DivideOp);
    this.operators.set('&&', Token_Class.AndOp);
    this.operators.set('||', Token_Class.OrOp);
  }

  public startScanning(sourceCode: string): { tokens: Token[]; errors: CompilerError[] } {
    this.tokens = [];
    this.errors = [];

    let i = 0;
    let line = 1;
    let col = 1;
    let tokenId = 1;

    while (i < sourceCode.length) {
      const char = sourceCode[i];

      // Handle newlines
      if (char === '\n') {
        line++;
        col = 1;
        i++;
        continue;
      }
      if (char === '\r') {
        i++;
        continue;
      }

      // Handle whitespace
      if (char === ' ' || char === '\t') {
        col++;
        i++;
        continue;
      }

      // Handle comments: { comment } or /* comment */
      if (char === '{') {
        const startCol = col;
        const startLine = line;
        let commentText = '{';
        i++;
        col++;
        let closed = false;
        while (i < sourceCode.length) {
          if (sourceCode[i] === '}') {
            commentText += '}';
            i++;
            col++;
            closed = true;
            break;
          }
          if (sourceCode[i] === '\n') {
            line++;
            col = 1;
          } else {
            col++;
          }
          commentText += sourceCode[i];
          i++;
        }
        if (!closed) {
          this.errors.push({
            id: `err-${this.errors.length + 1}`,
            line: startLine,
            col: startCol,
            message: `Unclosed comment block starting at line ${startLine}, col ${startCol}`,
            phase: 'Scanner',
            severity: 'error',
            snippet: commentText.slice(0, 30),
          });
        }
        continue;
      }

      // Handle C-style multi-line or single-line comments
      if (char === '/' && i + 1 < sourceCode.length) {
        if (sourceCode[i + 1] === '/') {
          while (i < sourceCode.length && sourceCode[i] !== '\n') {
            i++;
          }
          continue;
        }
        if (sourceCode[i + 1] === '*') {
          const startCol = col;
          const startLine = line;
          i += 2;
          col += 2;
          let closed = false;
          while (i + 1 < sourceCode.length) {
            if (sourceCode[i] === '*' && sourceCode[i + 1] === '/') {
              i += 2;
              col += 2;
              closed = true;
              break;
            }
            if (sourceCode[i] === '\n') {
              line++;
              col = 1;
            } else {
              col++;
            }
            i++;
          }
          if (!closed) {
            this.errors.push({
              id: `err-${this.errors.length + 1}`,
              line: startLine,
              col: startCol,
              message: `Unclosed comment /* ... */ at line ${startLine}`,
              phase: 'Scanner',
              severity: 'error',
            });
          }
          continue;
        }
      }

      // Handle String Literals: "..." or '...'
      if (char === '"' || char === "'") {
        const quoteChar = char;
        const startCol = col;
        const startLine = line;
        let strVal = '';
        i++;
        col++;
        let closed = false;
        while (i < sourceCode.length) {
          if (sourceCode[i] === quoteChar) {
            i++;
            col++;
            closed = true;
            break;
          }
          if (sourceCode[i] === '\n') {
            break; // String literals cannot span newlines in JASON
          }
          strVal += sourceCode[i];
          i++;
          col++;
        }

        if (!closed) {
          this.errors.push({
            id: `err-${this.errors.length + 1}`,
            line: startLine,
            col: startCol,
            message: `Unterminated string literal starting at line ${startLine}, col ${startCol}`,
            phase: 'Scanner',
            severity: 'error',
            snippet: strVal,
          });
        } else {
          this.tokens.push({
            id: tokenId++,
            lex: `"${strVal}"`,
            token_type: Token_Class.StringLiteral,
            line: startLine,
            col: startCol,
          });
        }
        continue;
      }

      // Check for multi-character operators: :=, <>, <=, >=, !=, &&, ||
      const twoChars = sourceCode.slice(i, i + 2);
      if (this.operators.has(twoChars)) {
        this.tokens.push({
          id: tokenId++,
          lex: twoChars,
          token_type: this.operators.get(twoChars)!,
          line,
          col,
        });
        i += 2;
        col += 2;
        continue;
      }

      // Check for single-character operator or delimiter
      if (this.operators.has(char)) {
        this.tokens.push({
          id: tokenId++,
          lex: char,
          token_type: this.operators.get(char)!,
          line,
          col,
        });
        i++;
        col++;
        continue;
      }

      // Check for Identifiers or Reserved Words (starts with letter)
      if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_') {
        const startCol = col;
        let lexeme = '';
        while (
          i < sourceCode.length &&
          ((sourceCode[i] >= 'a' && sourceCode[i] <= 'z') ||
            (sourceCode[i] >= 'A' && sourceCode[i] <= 'Z') ||
            (sourceCode[i] >= '0' && sourceCode[i] <= '9') ||
            sourceCode[i] === '_')
        ) {
          lexeme += sourceCode[i];
          i++;
          col++;
        }

        const upper = lexeme.toUpperCase();
        if (this.reservedWords.has(upper)) {
          this.tokens.push({
            id: tokenId++,
            lex: lexeme,
            token_type: this.reservedWords.get(upper)!,
            line,
            col: startCol,
          });
        } else {
          this.tokens.push({
            id: tokenId++,
            lex: lexeme,
            token_type: Token_Class.Identifier,
            line,
            col: startCol,
          });
        }
        continue;
      }

      // Check for Numbers (Constants: integer or real)
      if (char >= '0' && char <= '9') {
        const startCol = col;
        let numLexeme = '';
        let dotCount = 0;
        let hasTrailingLetters = false;

        while (
          i < sourceCode.length &&
          ((sourceCode[i] >= '0' && sourceCode[i] <= '9') || sourceCode[i] === '.')
        ) {
          if (sourceCode[i] === '.') {
            if (dotCount >= 1) break; // Don't absorb multiple dots
            // Check if next char is digit
            if (i + 1 < sourceCode.length && sourceCode[i + 1] >= '0' && sourceCode[i + 1] <= '9') {
              dotCount++;
            } else {
              break; // standalone dot operator
            }
          }
          numLexeme += sourceCode[i];
          i++;
          col++;
        }

        // Check if there are illegal identifier characters glued to number (e.g. 123abc)
        let invalidSuffix = '';
        while (
          i < sourceCode.length &&
          ((sourceCode[i] >= 'a' && sourceCode[i] <= 'z') ||
            (sourceCode[i] >= 'A' && sourceCode[i] <= 'Z') ||
            sourceCode[i] === '_')
        ) {
          invalidSuffix += sourceCode[i];
          i++;
          col++;
          hasTrailingLetters = true;
        }

        if (hasTrailingLetters) {
          const fullLex = numLexeme + invalidSuffix;
          this.errors.push({
            id: `err-${this.errors.length + 1}`,
            line,
            col: startCol,
            message: `Invalid identifier/constant '${fullLex}': Identifiers cannot begin with digits`,
            phase: 'Scanner',
            severity: 'error',
            snippet: fullLex,
          });
          this.tokens.push({
            id: tokenId++,
            lex: fullLex,
            token_type: Token_Class.Unknown,
            line,
            col: startCol,
          });
        } else {
          this.tokens.push({
            id: tokenId++,
            lex: numLexeme,
            token_type: Token_Class.Constant,
            line,
            col: startCol,
          });
        }
        continue;
      }

      // Unknown character / Lexical error
      this.errors.push({
        id: `err-${this.errors.length + 1}`,
        line,
        col,
        message: `Unrecognized character '${char}' (ASCII ${char.charCodeAt(0)})`,
        phase: 'Scanner',
        severity: 'error',
        snippet: char,
      });

      this.tokens.push({
        id: tokenId++,
        lex: char,
        token_type: Token_Class.Unknown,
        line,
        col,
      });

      i++;
      col++;
    }

    return { tokens: this.tokens, errors: this.errors };
  }
}
