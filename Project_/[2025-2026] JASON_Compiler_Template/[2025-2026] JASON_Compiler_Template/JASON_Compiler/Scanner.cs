using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public enum Token_Class
{
    // JASON Reserved Words
    Begin, Call, Declare, End, Do, Else, EndIf, EndUntil, EndWhile, If, Integer,
    Parameters, Procedure, Program, Read, Real, Set, Then, Until, While, Write,

    // Rynix Keywords
    Var, Fun, Class, Init, New, For, In, Return, Break, Continue, Print, Input,
    TypeInt, TypeFloat, TypeString, TypeChar, TypeBool, TypeVoid, TypeArray,
    BoolLiteral, NullLiteral,

    // Delimiters & Punctuation
    Dot, Semicolon, Comma, LParanthesis, RParanthesis, LBrace, RBrace, LBracket, RBracket, Colon, DotDot,

    // Operators
    EqualOp, AssignmentOp, LessThanOp, GreaterThanOp, NotEqualOp,
    EqualEqualOp, LessOrEqualOp, GreaterOrEqualOp,
    PlusOp, MinusOp, MultiplyOp, DivideOp, ModuloOp,
    AndOp, OrOp, NotOp,

    // Literals & Identifiers
    Idenifier, Constant, FloatConstant, StringLiteral, CharLiteral,
    SingleLineComment, MultiLineComment, Unknown
}

namespace JASON_Compiler
{
    public class Token
    {
        public string lex;
        public Token_Class token_type;
        public int line = 1;
        public int column = 1;
    }

    public class Scanner
    {
        public List<Token> Tokens = new List<Token>();
        Dictionary<string, Token_Class> ReservedWords = new Dictionary<string, Token_Class>();
        Dictionary<string, Token_Class> Operators = new Dictionary<string, Token_Class>();

        public Scanner()
        {
            // JASON Reserved Words
            ReservedWords["IF"] = Token_Class.If;
            ReservedWords["BEGIN"] = Token_Class.Begin;
            ReservedWords["CALL"] = Token_Class.Call;
            ReservedWords["DECLARE"] = Token_Class.Declare;
            ReservedWords["END"] = Token_Class.End;
            ReservedWords["DO"] = Token_Class.Do;
            ReservedWords["ELSE"] = Token_Class.Else;
            ReservedWords["ENDIF"] = Token_Class.EndIf;
            ReservedWords["ENDUNTIL"] = Token_Class.EndUntil;
            ReservedWords["ENDWHILE"] = Token_Class.EndWhile;
            ReservedWords["INTEGER"] = Token_Class.Integer;
            ReservedWords["PARAMETERS"] = Token_Class.Parameters;
            ReservedWords["PROCEDURE"] = Token_Class.Procedure;
            ReservedWords["PROGRAM"] = Token_Class.Program;
            ReservedWords["READ"] = Token_Class.Read;
            ReservedWords["REAL"] = Token_Class.Real;
            ReservedWords["SET"] = Token_Class.Set;
            ReservedWords["THEN"] = Token_Class.Then;
            ReservedWords["UNTIL"] = Token_Class.Until;
            ReservedWords["WHILE"] = Token_Class.While;
            ReservedWords["WRITE"] = Token_Class.Write;

            // Rynix Reserved Words
            ReservedWords["var"] = Token_Class.Var;
            ReservedWords["fun"] = Token_Class.Fun;
            ReservedWords["class"] = Token_Class.Class;
            ReservedWords["init"] = Token_Class.Init;
            ReservedWords["new"] = Token_Class.New;
            ReservedWords["if"] = Token_Class.If;
            ReservedWords["else"] = Token_Class.Else;
            ReservedWords["while"] = Token_Class.While;
            ReservedWords["for"] = Token_Class.For;
            ReservedWords["in"] = Token_Class.In;
            ReservedWords["return"] = Token_Class.Return;
            ReservedWords["break"] = Token_Class.Break;
            ReservedWords["continue"] = Token_Class.Continue;
            ReservedWords["print"] = Token_Class.Print;
            ReservedWords["input"] = Token_Class.Input;
            ReservedWords["Int"] = Token_Class.TypeInt;
            ReservedWords["Float"] = Token_Class.TypeFloat;
            ReservedWords["String"] = Token_Class.TypeString;
            ReservedWords["Char"] = Token_Class.TypeChar;
            ReservedWords["Bool"] = Token_Class.TypeBool;
            ReservedWords["Void"] = Token_Class.TypeVoid;
            ReservedWords["Array"] = Token_Class.TypeArray;
            ReservedWords["true"] = Token_Class.BoolLiteral;
            ReservedWords["false"] = Token_Class.BoolLiteral;
            ReservedWords["null"] = Token_Class.NullLiteral;

            // Operators & Delimiters
            Operators["."] = Token_Class.Dot;
            Operators[".."] = Token_Class.DotDot;
            Operators[";"] = Token_Class.Semicolon;
            Operators[","] = Token_Class.Comma;
            Operators[":"] = Token_Class.Colon;
            Operators["("] = Token_Class.LParanthesis;
            Operators[")"] = Token_Class.RParanthesis;
            Operators["{"] = Token_Class.LBrace;
            Operators["}"] = Token_Class.RBrace;
            Operators["["] = Token_Class.LBracket;
            Operators["]"] = Token_Class.RBracket;
            Operators["="] = Token_Class.AssignmentOp;
            Operators[":="] = Token_Class.AssignmentOp;
            Operators["=="] = Token_Class.EqualEqualOp;
            Operators["<"] = Token_Class.LessThanOp;
            Operators[">"] = Token_Class.GreaterThanOp;
            Operators["<="] = Token_Class.LessOrEqualOp;
            Operators[">="] = Token_Class.GreaterOrEqualOp;
            Operators["!"] = Token_Class.NotOp;
            Operators["!="] = Token_Class.NotEqualOp;
            Operators["<>"] = Token_Class.NotEqualOp;
            Operators["+"] = Token_Class.PlusOp;
            Operators["-"] = Token_Class.MinusOp;
            Operators["*"] = Token_Class.MultiplyOp;
            Operators["/"] = Token_Class.DivideOp;
            Operators["%"] = Token_Class.ModuloOp;
            Operators["&&"] = Token_Class.AndOp;
            Operators["||"] = Token_Class.OrOp;
        }

        public void StartScanning(string SourceCode)
        {
            Tokens.Clear();
            Errors.Error_List.Clear();

            int i = 0;
            int line = 1;
            int col = 1;
            int length = SourceCode.Length;

            while (i < length)
            {
                char CurrentChar = SourceCode[i];

                // Newlines
                if (CurrentChar == '\n')
                {
                    line++;
                    col = 1;
                    i++;
                    continue;
                }
                if (CurrentChar == '\r')
                {
                    i++;
                    continue;
                }

                // Whitespace
                if (CurrentChar == ' ' || CurrentChar == '\t')
                {
                    col++;
                    i++;
                    continue;
                }

                // Comments: // or /* ... */ or { ... }
                if (CurrentChar == '/' && i + 1 < length)
                {
                    if (SourceCode[i + 1] == '/')
                    {
                        string cText = "//";
                        int sCol = col;
                        i += 2; col += 2;
                        while (i < length && SourceCode[i] != '\n' && SourceCode[i] != '\r')
                        {
                            cText += SourceCode[i];
                            i++; col++;
                        }
                        Tokens.Add(new Token { lex = cText, token_type = Token_Class.SingleLineComment, line = line, column = sCol });
                        continue;
                    }
                    if (SourceCode[i + 1] == '*')
                    {
                        string cText = "/*";
                        int sCol = col; int sLine = line;
                        i += 2; col += 2;
                        bool closed = false;
                        while (i < length)
                        {
                            if (SourceCode[i] == '*' && i + 1 < length && SourceCode[i + 1] == '/')
                            {
                                cText += "*/";
                                i += 2; col += 2;
                                closed = true;
                                break;
                            }
                            if (SourceCode[i] == '\n') { line++; col = 1; } else { col++; }
                            cText += SourceCode[i];
                            i++;
                        }
                        if (!closed)
                            Errors.Error_List.Add($"[Line {sLine}, Col {sCol}] Unterminated comment block: {cText}");
                        else
                            Tokens.Add(new Token { lex = cText, token_type = Token_Class.MultiLineComment, line = sLine, column = sCol });
                        continue;
                    }
                }

                // JASON comments: { ... }
                if (CurrentChar == '{')
                {
                    int sLine = line; int sCol = col;
                    string cText = "{";
                    i++; col++;
                    bool closed = false;
                    while (i < length)
                    {
                        if (SourceCode[i] == '}')
                        {
                            cText += "}";
                            i++; col++;
                            closed = true;
                            break;
                        }
                        if (SourceCode[i] == '\n') { line++; col = 1; } else { col++; }
                        cText += SourceCode[i];
                        i++;
                    }
                    if (!closed)
                        Errors.Error_List.Add($"[Line {sLine}, Col {sCol}] Unterminated curly comment: {cText}");
                    continue;
                }

                // String Literals: "..."
                if (CurrentChar == '"')
                {
                    int sLine = line; int sCol = col;
                    string strVal = "";
                    i++; col++;
                    bool closed = false;
                    while (i < length)
                    {
                        if (SourceCode[i] == '"')
                        {
                            i++; col++;
                            closed = true;
                            break;
                        }
                        if (SourceCode[i] == '\n') break;
                        if (SourceCode[i] == '\\' && i + 1 < length)
                        {
                            strVal += SourceCode[i].ToString() + SourceCode[i + 1].ToString();
                            i += 2; col += 2;
                            continue;
                        }
                        strVal += SourceCode[i];
                        i++; col++;
                    }
                    if (!closed)
                        Errors.Error_List.Add($"[Line {sLine}, Col {sCol}] Unterminated string literal: \"{strVal}");
                    else
                        Tokens.Add(new Token { lex = "\"" + strVal + "\"", token_type = Token_Class.StringLiteral, line = sLine, column = sCol });
                    continue;
                }

                // Character Literals: '...'
                if (CurrentChar == '\'')
                {
                    int sLine = line; int sCol = col;
                    string charVal = "";
                    i++; col++;
                    bool closed = false;
                    while (i < length)
                    {
                        if (SourceCode[i] == '\'')
                        {
                            i++; col++;
                            closed = true;
                            break;
                        }
                        if (SourceCode[i] == '\n') break;
                        charVal += SourceCode[i];
                        i++; col++;
                    }
                    if (!closed)
                        Errors.Error_List.Add($"[Line {sLine}, Col {sCol}] Unterminated character literal: '{charVal}");
                    else
                        Tokens.Add(new Token { lex = "'" + charVal + "'", token_type = Token_Class.CharLiteral, line = sLine, column = sCol });
                    continue;
                }

                // Range operator ..
                if (CurrentChar == '.' && i + 1 < length && SourceCode[i + 1] == '.')
                {
                    Tokens.Add(new Token { lex = "..", token_type = Token_Class.DotDot, line = line, column = col });
                    i += 2; col += 2;
                    continue;
                }

                // Check two-char operators
                if (i + 1 < length)
                {
                    string two = SourceCode.Substring(i, 2);
                    if (Operators.ContainsKey(two))
                    {
                        Tokens.Add(new Token { lex = two, token_type = Operators[two], line = line, column = col });
                        i += 2; col += 2;
                        continue;
                    }
                }

                // Check single-char operators
                string one = CurrentChar.ToString();
                if (Operators.ContainsKey(one))
                {
                    Tokens.Add(new Token { lex = one, token_type = Operators[one], line = line, column = col });
                    i++; col++;
                    continue;
                }

                // Numbers: Constant (Integer) or FloatConstant
                if (char.IsDigit(CurrentChar))
                {
                    int sCol = col;
                    string num = "";
                    bool isFloat = false;
                    while (i < length && (char.IsDigit(SourceCode[i]) || SourceCode[i] == '.'))
                    {
                        if (SourceCode[i] == '.')
                        {
                            if (i + 1 < length && SourceCode[i + 1] == '.') break; // range ..
                            isFloat = true;
                        }
                        num += SourceCode[i];
                        i++; col++;
                    }

                    // Check for invalid trailing characters: 123abc
                    string trailing = "";
                    while (i < length && (char.IsLetter(SourceCode[i]) || SourceCode[i] == '_'))
                    {
                        trailing += SourceCode[i];
                        i++; col++;
                    }

                    if (trailing.Length > 0)
                    {
                        Errors.Error_List.Add($"[Line {line}, Col {sCol}] Invalid identifier '{num + trailing}': Identifiers cannot begin with digits");
                        Tokens.Add(new Token { lex = num + trailing, token_type = Token_Class.Unknown, line = line, column = sCol });
                    }
                    else
                    {
                        Tokens.Add(new Token { lex = num, token_type = isFloat ? Token_Class.FloatConstant : Token_Class.Constant, line = line, column = sCol });
                    }
                    continue;
                }

                // Identifiers & Reserved Words
                if (char.IsLetter(CurrentChar) || CurrentChar == '_')
                {
                    int sCol = col;
                    string ident = "";
                    while (i < length && (char.IsLetterOrDigit(SourceCode[i]) || SourceCode[i] == '_'))
                    {
                        ident += SourceCode[i];
                        i++; col++;
                    }

                    // Check exact case or uppercase for JASON
                    if (ReservedWords.ContainsKey(ident))
                        Tokens.Add(new Token { lex = ident, token_type = ReservedWords[ident], line = line, column = sCol });
                    else if (ReservedWords.ContainsKey(ident.ToUpper()))
                        Tokens.Add(new Token { lex = ident, token_type = ReservedWords[ident.ToUpper()], line = line, column = sCol });
                    else
                        Tokens.Add(new Token { lex = ident, token_type = Token_Class.Idenifier, line = line, column = sCol });

                    continue;
                }

                // Unrecognized character
                Errors.Error_List.Add($"[Line {line}, Col {col}] Unrecognized character: '{CurrentChar}'");
                Tokens.Add(new Token { lex = CurrentChar.ToString(), token_type = Token_Class.Unknown, line = line, column = col });
                i++; col++;
            }

            JASON_Compiler.TokenStream = Tokens;
        }

        public bool isIdentifier(string lex)
        {
            if (string.IsNullOrEmpty(lex)) return false;
            if (!char.IsLetter(lex[0]) && lex[0] != '_') return false;
            for (int i = 1; i < lex.Length; i++)
            {
                if (!char.IsLetterOrDigit(lex[i]) && lex[i] != '_') return false;
            }
            return !ReservedWords.ContainsKey(lex) && !ReservedWords.ContainsKey(lex.ToUpper());
        }

        public bool isConstant(string lex)
        {
            double d;
            return double.TryParse(lex, out d);
        }
    }
}
