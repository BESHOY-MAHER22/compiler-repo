// Rynix Programming Language Token Classes & Types
// Milestone 1 - Lexical Analyzer / Scanner

export enum RynixTokenClass {
  // Keywords
  Var = 'Var',
  Fun = 'Fun',
  Class = 'Class',
  Init = 'Init',
  New = 'New',
  If = 'If',
  Else = 'Else',
  While = 'While',
  For = 'For',
  In = 'In',
  Return = 'Return',
  Break = 'Break',
  Continue = 'Continue',
  Print = 'Print',
  Input = 'Input',

  // Type Names
  TypeInt = 'TypeInt',
  TypeFloat = 'TypeFloat',
  TypeString = 'TypeString',
  TypeChar = 'TypeChar',
  TypeBool = 'TypeBool',
  TypeVoid = 'TypeVoid',
  TypeArray = 'TypeArray',

  // Boolean & Special Literals
  BoolLiteral = 'BoolLiteral', // true, false
  NullLiteral = 'NullLiteral', // null

  // Identifiers & Literals
  Identifier = 'Identifier',
  IntConstant = 'IntConstant',
  FloatConstant = 'FloatConstant',
  StringLiteral = 'StringLiteral',
  CharLiteral = 'CharLiteral',

  // Arithmetic Operators
  PlusOp = 'PlusOp',           // +
  MinusOp = 'MinusOp',         // -
  MultiplyOp = 'MultiplyOp',   // *
  DivideOp = 'DivideOp',       // /
  ModuloOp = 'ModuloOp',       // %

  // Relational Operators
  EqualEqualOp = 'EqualEqualOp',       // ==
  NotEqualOp = 'NotEqualOp',           // !=
  LessThanOp = 'LessThanOp',           // <
  LessOrEqualOp = 'LessOrEqualOp',     // <=
  GreaterThanOp = 'GreaterThanOp',     // >
  GreaterOrEqualOp = 'GreaterOrEqualOp', // >=

  // Logical Operators
  AndOp = 'AndOp',             // &&
  OrOp = 'OrOp',               // ||
  NotOp = 'NotOp',             // !

  // Assignment
  AssignmentOp = 'AssignmentOp', // =

  // Punctuation & Delimiters
  LParanthesis = 'LParanthesis', // (
  RParanthesis = 'RParanthesis', // )
  LBrace = 'LBrace',             // {
  RBrace = 'RBrace',             // }
  LBracket = 'LBracket',         // [
  RBracket = 'RBracket',         // ]
  Colon = 'Colon',               // :
  Semicolon = 'Semicolon',       // ;
  Comma = 'Comma',               // ,
  Dot = 'Dot',                   // .
  DotDot = 'DotDot',             // .. (range operator)

  // Comments & Unknown
  SingleLineComment = 'SingleLineComment',
  MultiLineComment = 'MultiLineComment',
  Unknown = 'Unknown'
}

export interface RynixToken {
  id: number;
  lex: string;
  token_type: RynixTokenClass;
  line: number;
  col: number;
  description: string;
}

export interface RynixScannerError {
  id: string;
  line: number;
  col: number;
  lexeme: string;
  message: string;
  category: 'Lexical Error' | 'Unterminated String' | 'Unterminated Comment' | 'Malformed Number' | 'Invalid Identifier';
  suggestion?: string;
}

export interface RynixScanResult {
  tokens: RynixToken[];
  errors: RynixScannerError[];
  scanDurationMs: number;
  totalLines: number;
  totalCharacters: number;
}
