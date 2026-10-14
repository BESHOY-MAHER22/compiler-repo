// JASON & Rynix Compiler Types

export enum Token_Class {
  // Reserved Words
  Begin = 'Begin',
  Call = 'Call',
  Declare = 'Declare',
  End = 'End',
  Do = 'Do',
  Else = 'Else',
  EndIf = 'EndIf',
  EndUntil = 'EndUntil',
  EndWhile = 'EndWhile',
  If = 'If',
  Integer = 'Integer',
  Parameters = 'Parameters',
  Procedure = 'Procedure',
  Program = 'Program',
  Read = 'Read',
  Real = 'Real',
  Set = 'Set',
  Then = 'Then',
  Until = 'Until',
  While = 'While',
  Write = 'Write',

  // Delimiters & Punctuation
  Dot = 'Dot',
  Semicolon = 'Semicolon',
  Comma = 'Comma',
  LParanthesis = 'LParanthesis',
  RParanthesis = 'RParanthesis',
  LBrace = 'LBrace',
  RBrace = 'RBrace',
  LBracket = 'LBracket',
  RBracket = 'RBracket',
  Colon = 'Colon',

  // Operators
  EqualOp = 'EqualOp',
  AssignmentOp = 'AssignmentOp',
  LessThanOp = 'LessThanOp',
  GreaterThanOp = 'GreaterThanOp',
  NotEqualOp = 'NotEqualOp',
  LessOrEqualOp = 'LessOrEqualOp',
  GreaterOrEqualOp = 'GreaterOrEqualOp',
  PlusOp = 'PlusOp',
  MinusOp = 'MinusOp',
  MultiplyOp = 'MultiplyOp',
  DivideOp = 'DivideOp',
  AndOp = 'AndOp',
  OrOp = 'OrOp',
  NotOp = 'NotOp',

  // Literals & Identifiers
  Identifier = 'Identifier',
  Constant = 'Constant',
  StringLiteral = 'StringLiteral',
  BooleanLiteral = 'BooleanLiteral',
  Comment = 'Comment',
  Unknown = 'Unknown',

  // Rynix Keywords
  Var = 'Var',
  Fun = 'Fun',
  Class = 'Class',
  Init = 'Init',
  New = 'New',
  For = 'For',
  In = 'In',
  Return = 'Return',
  Break = 'Break',
  Continue = 'Continue',
  Print = 'Print',
  Input = 'Input',
  Null = 'Null',
  String = 'String',
  Float = 'Float',
  Bool = 'Bool',
  Array = 'Array',
}

export interface Token {
  id: number;
  lex: string;
  token_type: Token_Class;
  line: number;
  col: number;
}

export interface CompilerError {
  id: string;
  line: number;
  col: number;
  message: string;
  phase: 'Scanner' | 'Parser' | 'Semantic' | 'Runtime';
  severity: 'error' | 'warning' | 'info';
  snippet?: string;
}

export interface SymbolEntry {
  name: string;
  tokenClass: Token_Class | string;
  dataType: string;
  scope: string;
  line: number;
  value?: string | number | boolean | null;
  attributes?: string;
}

export interface ASTNode {
  id: string;
  name: string;
  type: 'rule' | 'terminal';
  value?: string;
  token?: Token;
  children?: ASTNode[];
  isExpanded?: boolean;
}

export interface CompilationResult {
  success: boolean;
  tokens: Token[];
  symbolTable: SymbolEntry[];
  errors: CompilerError[];
  ast: ASTNode | null;
  output: string[];
}
