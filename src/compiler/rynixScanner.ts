import { RynixToken, RynixTokenClass, RynixScannerError, RynixScanResult } from './rynixTypes';

export class RynixScanner {
  public tokens: RynixToken[] = [];
  public errors: RynixScannerError[] = [];

  private keywords: Map<string, RynixTokenClass> = new Map([
    ['var', RynixTokenClass.Var],
    ['fun', RynixTokenClass.Fun],
    ['class', RynixTokenClass.Class],
    ['init', RynixTokenClass.Init],
    ['new', RynixTokenClass.New],
    ['if', RynixTokenClass.If],
    ['else', RynixTokenClass.Else],
    ['while', RynixTokenClass.While],
    ['for', RynixTokenClass.For],
    ['in', RynixTokenClass.In],
    ['return', RynixTokenClass.Return],
    ['break', RynixTokenClass.Break],
    ['continue', RynixTokenClass.Continue],
    ['print', RynixTokenClass.Print],
    ['input', RynixTokenClass.Input],
    
    // Type Keywords
    ['Int', RynixTokenClass.TypeInt],
    ['Float', RynixTokenClass.TypeFloat],
    ['String', RynixTokenClass.TypeString],
    ['Char', RynixTokenClass.TypeChar],
    ['Bool', RynixTokenClass.TypeBool],
    ['Void', RynixTokenClass.TypeVoid],
    ['Array', RynixTokenClass.TypeArray],

    // Literal Keywords
    ['true', RynixTokenClass.BoolLiteral],
    ['false', RynixTokenClass.BoolLiteral],
    ['null', RynixTokenClass.NullLiteral],
  ]);

  public scan(sourceCode: string): RynixScanResult {
    const startTime = performance.now();
    this.tokens = [];
    this.errors = [];

    let i = 0;
    let line = 1;
    let col = 1;
    let tokenId = 1;
    const len = sourceCode.length;

    while (i < len) {
      const char = sourceCode[i];

      // Newlines
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

      // Whitespace
      if (char === ' ' || char === '\t') {
        col++;
        i++;
        continue;
      }

      // Comments: Single-line (//) or Multi-line (/* ... */)
      if (char === '/' && i + 1 < len) {
        if (sourceCode[i + 1] === '/') {
          // Single-line comment
          let commentText = '//';
          const startCol = col;
          const startLine = line;
          i += 2;
          col += 2;
          while (i < len && sourceCode[i] !== '\n' && sourceCode[i] !== '\r') {
            commentText += sourceCode[i];
            i++;
            col++;
          }
          // Comments can be emitted as tokens or skipped. We emit as token for clarity.
          this.tokens.push({
            id: tokenId++,
            lex: commentText,
            token_type: RynixTokenClass.SingleLineComment,
            line: startLine,
            col: startCol,
            description: 'Single-line Comment',
          });
          continue;
        }

        if (sourceCode[i + 1] === '*') {
          // Multi-line comment
          let commentText = '/*';
          const startCol = col;
          const startLine = line;
          i += 2;
          col += 2;
          let closed = false;

          while (i < len) {
            if (sourceCode[i] === '*' && i + 1 < len && sourceCode[i + 1] === '/') {
              commentText += '*/';
              i += 2;
              col += 2;
              closed = true;
              break;
            }
            if (sourceCode[i] === '\n') {
              commentText += '\n';
              line++;
              col = 1;
              i++;
            } else {
              commentText += sourceCode[i];
              col++;
              i++;
            }
          }

          if (!closed) {
            this.errors.push({
              id: `err-${this.errors.length + 1}`,
              line: startLine,
              col: startCol,
              lexeme: commentText.slice(0, 20) + '...',
              message: `Unterminated multi-line comment starting at line ${startLine}, column ${startCol}`,
              category: 'Unterminated Comment',
              suggestion: "Add '*/' to close the comment block.",
            });
          } else {
            this.tokens.push({
              id: tokenId++,
              lex: commentText,
              token_type: RynixTokenClass.MultiLineComment,
              line: startLine,
              col: startCol,
              description: 'Multi-line Comment Block',
            });
          }
          continue;
        }
      }

      // String Literals: "..."
      if (char === '"') {
        const startLine = line;
        const startCol = col;
        let strVal = '';
        i++;
        col++;
        let closed = false;

        while (i < len) {
          if (sourceCode[i] === '"') {
            i++;
            col++;
            closed = true;
            break;
          }
          if (sourceCode[i] === '\n') {
            // Newline inside unclosed string literal
            break;
          }
          if (sourceCode[i] === '\\' && i + 1 < len) {
            // Escape sequences
            strVal += sourceCode[i] + sourceCode[i + 1];
            i += 2;
            col += 2;
            continue;
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
            lexeme: `"${strVal}`,
            message: `Unterminated string literal at line ${startLine}, column ${startCol}`,
            category: 'Unterminated String',
            suggestion: 'Make sure string literals are enclosed in matching double quotes (").',
          });
        } else {
          this.tokens.push({
            id: tokenId++,
            lex: `"${strVal}"`,
            token_type: RynixTokenClass.StringLiteral,
            line: startLine,
            col: startCol,
            description: `String Literal ("${strVal}")`,
          });
        }
        continue;
      }

      // Character Literals: '...'
      if (char === "'") {
        const startLine = line;
        const startCol = col;
        let charVal = '';
        i++;
        col++;
        let closed = false;

        while (i < len) {
          if (sourceCode[i] === "'") {
            i++;
            col++;
            closed = true;
            break;
          }
          if (sourceCode[i] === '\n') {
            break;
          }
          if (sourceCode[i] === '\\' && i + 1 < len) {
            charVal += sourceCode[i] + sourceCode[i + 1];
            i += 2;
            col += 2;
            continue;
          }
          charVal += sourceCode[i];
          i++;
          col++;
        }

        if (!closed) {
          this.errors.push({
            id: `err-${this.errors.length + 1}`,
            line: startLine,
            col: startCol,
            lexeme: `'${charVal}`,
            message: `Unterminated character literal at line ${startLine}, col ${startCol}`,
            category: 'Unterminated String',
            suggestion: "Close the character literal with single quote (').",
          });
        } else if (charVal.length > 2 || (charVal.length > 1 && !charVal.startsWith('\\'))) {
          this.errors.push({
            id: `err-${this.errors.length + 1}`,
            line: startLine,
            col: startCol,
            lexeme: `'${charVal}'`,
            message: `Character literal cannot contain multiple characters '${charVal}'`,
            category: 'Lexical Error',
            suggestion: 'Use double quotes (") for multi-character strings.',
          });
          this.tokens.push({
            id: tokenId++,
            lex: `'${charVal}'`,
            token_type: RynixTokenClass.Unknown,
            line: startLine,
            col: startCol,
            description: 'Invalid Character Literal',
          });
        } else {
          this.tokens.push({
            id: tokenId++,
            lex: `'${charVal}'`,
            token_type: RynixTokenClass.CharLiteral,
            line: startLine,
            col: startCol,
            description: `Character Literal ('${charVal}')`,
          });
        }
        continue;
      }

      // Range operator: ..
      if (char === '.' && i + 1 < len && sourceCode[i + 1] === '.') {
        this.tokens.push({
          id: tokenId++,
          lex: '..',
          token_type: RynixTokenClass.DotDot,
          line,
          col,
          description: 'Range Operator (..)',
        });
        i += 2;
        col += 2;
        continue;
      }

      // Two-character operators: ==, !=, <=, >=, &&, ||
      const twoChar = sourceCode.slice(i, i + 2);
      if (twoChar === '==') {
        this.tokens.push({ id: tokenId++, lex: '==', token_type: RynixTokenClass.EqualEqualOp, line, col, description: 'Equal-To Operator' });
        i += 2; col += 2; continue;
      }
      if (twoChar === '!=') {
        this.tokens.push({ id: tokenId++, lex: '!=', token_type: RynixTokenClass.NotEqualOp, line, col, description: 'Not-Equal Operator' });
        i += 2; col += 2; continue;
      }
      if (twoChar === '<=') {
        this.tokens.push({ id: tokenId++, lex: '<=', token_type: RynixTokenClass.LessOrEqualOp, line, col, description: 'Less-Than-or-Equal Operator' });
        i += 2; col += 2; continue;
      }
      if (twoChar === '>=') {
        this.tokens.push({ id: tokenId++, lex: '>=', token_type: RynixTokenClass.GreaterOrEqualOp, line, col, description: 'Greater-Than-or-Equal Operator' });
        i += 2; col += 2; continue;
      }
      if (twoChar === '&&') {
        this.tokens.push({ id: tokenId++, lex: '&&', token_type: RynixTokenClass.AndOp, line, col, description: 'Logical AND Operator' });
        i += 2; col += 2; continue;
      }
      if (twoChar === '||') {
        this.tokens.push({ id: tokenId++, lex: '||', token_type: RynixTokenClass.OrOp, line, col, description: 'Logical OR Operator' });
        i += 2; col += 2; continue;
      }

      // Single-character operators & delimiters
      switch (char) {
        case '+':
          this.tokens.push({ id: tokenId++, lex: '+', token_type: RynixTokenClass.PlusOp, line, col, description: 'Addition Operator' });
          i++; col++; continue;
        case '-':
          this.tokens.push({ id: tokenId++, lex: '-', token_type: RynixTokenClass.MinusOp, line, col, description: 'Subtraction Operator' });
          i++; col++; continue;
        case '*':
          this.tokens.push({ id: tokenId++, lex: '*', token_type: RynixTokenClass.MultiplyOp, line, col, description: 'Multiplication Operator' });
          i++; col++; continue;
        case '/':
          this.tokens.push({ id: tokenId++, lex: '/', token_type: RynixTokenClass.DivideOp, line, col, description: 'Division Operator' });
          i++; col++; continue;
        case '%':
          this.tokens.push({ id: tokenId++, lex: '%', token_type: RynixTokenClass.ModuloOp, line, col, description: 'Modulo Operator' });
          i++; col++; continue;
        case '=':
          this.tokens.push({ id: tokenId++, lex: '=', token_type: RynixTokenClass.AssignmentOp, line, col, description: 'Assignment Operator' });
          i++; col++; continue;
        case '<':
          this.tokens.push({ id: tokenId++, lex: '<', token_type: RynixTokenClass.LessThanOp, line, col, description: 'Less-Than Operator' });
          i++; col++; continue;
        case '>':
          this.tokens.push({ id: tokenId++, lex: '>', token_type: RynixTokenClass.GreaterThanOp, line, col, description: 'Greater-Than Operator' });
          i++; col++; continue;
        case '!':
          this.tokens.push({ id: tokenId++, lex: '!', token_type: RynixTokenClass.NotOp, line, col, description: 'Logical NOT Operator' });
          i++; col++; continue;
        case '(':
          this.tokens.push({ id: tokenId++, lex: '(', token_type: RynixTokenClass.LParanthesis, line, col, description: 'Left Parenthesis' });
          i++; col++; continue;
        case ')':
          this.tokens.push({ id: tokenId++, lex: ')', token_type: RynixTokenClass.RParanthesis, line, col, description: 'Right Parenthesis' });
          i++; col++; continue;
        case '{':
          this.tokens.push({ id: tokenId++, lex: '{', token_type: RynixTokenClass.LBrace, line, col, description: 'Left Curly Brace' });
          i++; col++; continue;
        case '}':
          this.tokens.push({ id: tokenId++, lex: '}', token_type: RynixTokenClass.RBrace, line, col, description: 'Right Curly Brace' });
          i++; col++; continue;
        case '[':
          this.tokens.push({ id: tokenId++, lex: '[', token_type: RynixTokenClass.LBracket, line, col, description: 'Left Square Bracket' });
          i++; col++; continue;
        case ']':
          this.tokens.push({ id: tokenId++, lex: ']', token_type: RynixTokenClass.RBracket, line, col, description: 'Right Square Bracket' });
          i++; col++; continue;
        case ':':
          this.tokens.push({ id: tokenId++, lex: ':', token_type: RynixTokenClass.Colon, line, col, description: 'Type Colon' });
          i++; col++; continue;
        case ';':
          this.tokens.push({ id: tokenId++, lex: ';', token_type: RynixTokenClass.Semicolon, line, col, description: 'Semicolon Delimiter' });
          i++; col++; continue;
        case ',':
          this.tokens.push({ id: tokenId++, lex: ',', token_type: RynixTokenClass.Comma, line, col, description: 'Comma Separator' });
          i++; col++; continue;
        case '.':
          this.tokens.push({ id: tokenId++, lex: '.', token_type: RynixTokenClass.Dot, line, col, description: 'Member Access Dot' });
          i++; col++; continue;
      }

      // Numbers: IntConstant or FloatConstant
      if (char >= '0' && char <= '9') {
        const startLine = line;
        const startCol = col;
        let numStr = '';
        let isFloat = false;
        let dotCount = 0;

        while (i < len && ((sourceCode[i] >= '0' && sourceCode[i] <= '9') || sourceCode[i] === '.')) {
          // If we see a dot, check if it's a range operator '..' or decimal point
          if (sourceCode[i] === '.') {
            if (i + 1 < len && sourceCode[i + 1] === '.') {
              // Range operator follows! E.g. 1..10
              break;
            }
            if (dotCount > 0) {
              // multiple dots e.g. 1.2.3
              break;
            }
            dotCount++;
            isFloat = true;
          }
          numStr += sourceCode[i];
          i++;
          col++;
        }

        // Check if identifier letters follow immediately without space: 123abc
        let invalidLetters = '';
        while (
          i < len &&
          ((sourceCode[i] >= 'a' && sourceCode[i] <= 'z') ||
            (sourceCode[i] >= 'A' && sourceCode[i] <= 'Z') ||
            sourceCode[i] === '_')
        ) {
          invalidLetters += sourceCode[i];
          i++;
          col++;
        }

        if (invalidLetters.length > 0) {
          const badLex = numStr + invalidLetters;
          this.errors.push({
            id: `err-${this.errors.length + 1}`,
            line: startLine,
            col: startCol,
            lexeme: badLex,
            message: `Invalid token '${badLex}': Identifiers cannot begin with digits`,
            category: 'Invalid Identifier',
            suggestion: 'Separate digits and identifiers or rename identifier.',
          });
          this.tokens.push({
            id: tokenId++,
            lex: badLex,
            token_type: RynixTokenClass.Unknown,
            line: startLine,
            col: startCol,
            description: 'Malformed Identifier Starting With Digit',
          });
        } else if (numStr.endsWith('.')) {
          // Trailing decimal without digits: e.g. 12.
          this.errors.push({
            id: `err-${this.errors.length + 1}`,
            line: startLine,
            col: startCol,
            lexeme: numStr,
            message: `Malformed float constant '${numStr}': Missing fractional digits after decimal point`,
            category: 'Malformed Number',
            suggestion: "Add fractional digits (e.g. '" + numStr + "0') or remove the trailing dot.",
          });
          this.tokens.push({
            id: tokenId++,
            lex: numStr,
            token_type: RynixTokenClass.Unknown,
            line: startLine,
            col: startCol,
            description: 'Malformed Float',
          });
        } else {
          this.tokens.push({
            id: tokenId++,
            lex: numStr,
            token_type: isFloat ? RynixTokenClass.FloatConstant : RynixTokenClass.IntConstant,
            line: startLine,
            col: startCol,
            description: isFloat ? `Float Constant (${numStr})` : `Integer Constant (${numStr})`,
          });
        }
        continue;
      }

      // Identifiers & Keywords
      if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_') {
        const startLine = line;
        const startCol = col;
        let idStr = '';

        while (
          i < len &&
          ((sourceCode[i] >= 'a' && sourceCode[i] <= 'z') ||
            (sourceCode[i] >= 'A' && sourceCode[i] <= 'Z') ||
            (sourceCode[i] >= '0' && sourceCode[i] <= '9') ||
            sourceCode[i] === '_')
        ) {
          idStr += sourceCode[i];
          i++;
          col++;
        }

        // Check if keyword
        if (this.keywords.has(idStr)) {
          const kwType = this.keywords.get(idStr)!;
          this.tokens.push({
            id: tokenId++,
            lex: idStr,
            token_type: kwType,
            line: startLine,
            col: startCol,
            description: `Keyword '${idStr}'`,
          });
        } else {
          this.tokens.push({
            id: tokenId++,
            lex: idStr,
            token_type: RynixTokenClass.Identifier,
            line: startLine,
            col: startCol,
            description: `Identifier (${idStr})`,
          });
        }
        continue;
      }

      // Unrecognized character
      this.errors.push({
        id: `err-${this.errors.length + 1}`,
        line,
        col,
        lexeme: char,
        message: `Unrecognized character '${char}' (ASCII: ${char.charCodeAt(0)})`,
        category: 'Lexical Error',
        suggestion: 'Remove or replace this character with valid Rynix syntax.',
      });

      this.tokens.push({
        id: tokenId++,
        lex: char,
        token_type: RynixTokenClass.Unknown,
        line,
        col,
        description: `Unrecognized Character (${char})`,
      });

      i++;
      col++;
    }

    const duration = performance.now() - startTime;
    return {
      tokens: this.tokens,
      errors: this.errors,
      scanDurationMs: Number(duration.toFixed(2)),
      totalLines: line,
      totalCharacters: len,
    };
  }
}
