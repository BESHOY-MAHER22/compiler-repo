# دليل مناقشة مشروع المترجمات (Compiler Discussion Guide)
## كلية الحاسبات والمعلومات — جامعة عين شمس (Ain Shams University - FCIS)
### قسم علوم الحاسب (Computer Science Department)
### مادة نظرية المترجمات (Compilers Theory) — العام الجامعي 2025 / 2026

---

## 👥 بيانات الفريق (Team 36)

| # | اسم الطالب (Student Name) | رقم القيد (Student ID) | الدور في المشروع |
|---|---|---|---|
| 1 | **أحمد رفاعي أنور أحمد** | `20241700029` | Lexical Rules & Regular Expressions |
| 2 | **أحمد سعد عبدالعزيز السيد حامد** | `20241700033` | DFA & State Transition Design |
| 3 | **إيوان عصام الدين عبد الفضيل محمد الجوهري** | `20241700167` | C# Scanner Implementation & Windows Forms |
| 4 | **بيشوى ماهر جورجى ساروفيم** | `20241700198` | Team Lead & Compiler Architecture |
| 5 | **احمد حسام الدين جودة عبد المغني** | `20241700023` | Error Trapping, Diagnostics & Test Cases |
| 6 | **احمد حاتم نبيل عبدالمنعم** | `20241700021` | Documentation, Grammar & Web Studio |

---

## 🎯 ملخص ما تم إنجازه في المشروع (What Was Done)

1. **بناء محلل معجمي متكامل (Full Scanner) للغة Rynix**:
   - التعرف على **24 كلمة محجوزة** ونوع بيانات أساسي.
   - التعرف على المعرفات (`Identifiers`)، الأعداد الصحيحة (`IntConstant`)، الأعداد العشرية (`FloatConstant`).
   - التعرف على النصوص (`StringLiteral`) والرموز الحرفية (`CharLiteral`) مع دعم الـ Escape Sequences.
   - التعرف على التعليقات أحادية السطر `//` ومتعددة الأسطر `/* ... */`.
   - كشف كافة المعاملات الحسابية، والمنطقية، والمقارنة (`==`, `!=`, `<=`, `>=`, `&&`, `||`, `..`).
2. **معالجة متقدمة للأخطاء المعجمية (Lexical Errors & Recovery)**:
   - رصد المعرفات التي تبدأ بأرقام (مثل `123name`) وحصرها كخطأ وتصنيفها.
   - رصد النصوص والتعليقات غير المغلقة وتحديد رقم السطر والعمود بدقة.
   - استمرار الـ Scanner في العمل دون انهيار (Graceful Recovery).
3. **تحديث كود C# في مشروع Visual Studio Windows Forms (`Scanner.cs`, `Form1.cs`, `Form2.cs`)**.
4. **توثيق أكاديمي شامل (Milestone 1 Documentation)** جاهز للطباعة على ورق مقاس A4 يتضمن الـ Regular Expressions والـ NFAs والـ DFAs ورسوم الـ State Transitions المتجهة (SVG).

---

## 💻 شرح تفصيلي لكود الـ C# المعدل (`Scanner.cs`)

تم تعديل وتكملة ملف `Scanner.cs` ليقوم بعملية الـ Lexical Analysis وفقاً لمعايير الآلات المنتهية المحددة (DFA). إليكم تفصيل كل جزء في الكود:

### 1. الـ Enum: `Token_Class`
```csharp
public enum Token_Class
{
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
```
* **الشرح**: يمثل الـ Tokens التي يمكن للـ Scanner إرجاعها. أضفنا أنواع لغة Rynix مع الحفاظ على التوافق مع قالب المشروع الأصلي.

---

### 2. كلاس `Token` وكلاس `Scanner`
```csharp
public class Token
{
    public string lex;             // النص الأصلي في كود المصدر
    public Token_Class token_type; // صنف التوكن الناتج
    public int line = 1;           // رقم السطر
    public int column = 1;         // رقم العمود
}
```
* في كلاس `Scanner`، لدينا قاموسان سريعان للبحث بزمن $O(1)$:
  1. `ReservedWords`: لتخزين الكلمات المحجوزة.
  2. `Operators`: لتخزين العمليات الحسابية والمنطقية والرموز.

---

### 3. خوارزمية الـ Scanning الرئيسية: `StartScanning(string SourceCode)`
تعتمد الدالة على **Single-Pass Loop** يمر على حروف الكود حرفاً بحرف:

#### أ) تتبع السطور والأعمدة وتجاهل المسافات:
```csharp
if (CurrentChar == '\n') { line++; col = 1; i++; continue; }
if (CurrentChar == '\r') { i++; continue; }
if (CurrentChar == ' ' || CurrentChar == '\t') { col++; i++; continue; }
```
* عند رؤية `\n` نقوم بزيادة عداد السطور وتصفير عداد الأعمدة. المسافات والتابات تُتجاهل لأنها لا تمثل توكنز بذاتها بل فواصل (Delimiters).

#### ب) التعليقات أحادية السطر ومتعددة الأسطر:
```csharp
if (CurrentChar == '/' && i + 1 < length)
{
    if (SourceCode[i + 1] == '/') { /* سحب الحروف حتى نهاية السطر */ }
    if (SourceCode[i + 1] == '*') { /* سحب الحروف حتى مصادفة */ }
}
```
* إذا صادف المحلل الرمز `/`، يقوم بفحص الحرف التالي (`Lookahead of 1 char`):
  * إذا كان `/`، يدخل حالة التعليق الفردي ويقرأ حتى يصادف `\n`.
  * إذا كان `*`، يدخل حالة التعليق المتعدد ويقرأ حتى يصادف `*/`، وفي حال انتهاء الملف دون إغلاقه يسجل خطأ `Unterminated comment block` في `Errors.Error_List`.

#### ج) النصوص `StringLiteral` وعلامات الاقتباس:
```csharp
if (CurrentChar == '"')
{
    // يقرأ الحروف حتى علامة الاقتباس المغلقة مع دعم الـ escape character '\'
    // إذا انتهى السطر أو الملف دون إغلاق يسجل خطأ "Unterminated string literal"
}
```

#### د) الأعداد الصحيحة والعشرية ومعامل النطاق (`..`):
```csharp
if (char.IsDigit(CurrentChar))
{
    // تجميع الأرقام
    // فحص النقطة: إذا جاء بعدها نقطة أخرى (..) نتوقف لأنها عملية نطاق وليست عدداً عشرياً
    // فحص الرموز الملصقة بالأرقام مثل 123abc لاكتشاف الأخطاء
}
```
* **نقطة جوهرية للمناقشة**: إذا وجد الـ Scanner رقماً مثل `1..5`، يقف عند `1` كـ `Constant`، ثم يعتبر `..` كـ `DotDot`، أما إذا وجد `1.5` فيعتبره `FloatConstant`. وإذا وجد حروفاً متصلة بالرقم مثل `99name`، يسجل خطأ فوري بأن المعرف لا يمكن أن يبدأ برقم!

#### هـ) المعرفات والكلمات المحجوزة (Identifiers vs Keywords):
```csharp
if (char.IsLetter(CurrentChar) || CurrentChar == '_')
{
    // تجميع الحروف والأرقام والـ underscore
    if (ReservedWords.ContainsKey(ident))
        Tokens.Add(new Token { lex = ident, token_type = ReservedWords[ident] });
    else
        Tokens.Add(new Token { lex = ident, token_type = Token_Class.Idenifier });
}
```
* **أهم نقطة في المناقشة**: وفقاً لقواعد كتب الـ Compilers، لا نقوم ببناء DFA ضخم لكل كلمة محجوزة، بل يقوم الـ DFA بتمييز الـ Identifier كـ Token عام، وبعد قبوله نبحث في جدول الكلمات المحجوزة (`Lookup Table / Hash Table`)؛ فإن وُجد فهو Keyword وإلا فهو Identifier!

#### و) صيد الحروف غير المعرفة (Unknown Characters):
* أي حرف غريب (مثل `@`, `$`, `~`) لا ينتمي لأي صنف يتم إضافته إلى قائمة الأخطاء `Errors.Error_List` مع رقم السطر والعمود، ويُضاف كـ `Token_Class.Unknown`، ثم يتابع الـ Scanner دون أن يتوقف البرنامج.

---

## ❓ أهم أسئلة المناقشة المتوقعة وإجاباتها النموذجية (Viva Q&A)

### س1: ما وظيفة الـ Lexical Analyzer (Scanner) في بنية المترجم؟
* **الإجابة النموذجية**:
  هو المرحلة الأولى (Front-End) من المترجم، وظيفته قراءة كود المصدر (Stream of Characters)، وتجاهل المسافات والتعليقات، ثم تحويله إلى سلسلة من الوحدات اللغوية ذات المعنى تُسمى (Stream of Tokens)، مع اكتشاف الأخطاء اللغوية وتزويد المراحل اللاحقة (Parser) بموقع كل توكن وسطر حدوثه.

### س2: كيف يُفرق الـ Scanner بين الـ Keyword والـ Identifier في الكود؟
* **الإجابة النموذجية**:
  كلاهما يطابق نفس التعبير المنتظم `[a-zA-Z_][a-zA-Z0-9_]*`. لتجنب تضخم عدد حالات الـ DFA، يقوم الـ DFA بتجميع الكلمة كـ Identifier، وبمجرد اكتمال قراءتها نقوم بعمل `Lookup` داخل جدول تجزئة (Hash Table / Dictionary) للكلمات المحجوزة. إذا وُجدت الكلمة في الجدول يُحدد صنفها الخاص (مثل `Token_Class.While` أو `Token_Class.Var`)، وإذا لم توجد تُعتبر `Identifier`.

### س3: ما الفرق بين الـ NFA والـ DFA ولماذا نستخدم الـ DFA في الـ Scanner؟
* **الإجابة النموذجية**:
  - الـ **NFA** (Non-deterministic Finite Automaton): يمكن أن تحتوي على انتقالات فارغة ($\epsilon$-transitions) ويمكن لحالة واحدة أن تنتقل لأكثر من حالة لنفس الحرف المُدخل. بناء الـ NFA من الـ Regular Expression سهل ومباشر (باستخدام خوارزمية Thompson's Construction).
  - الـ **DFA** (Deterministic Finite Automaton): لكل حالة ومدخل يوجد انتقال واحد محدد فقط، ولا توجد $\epsilon$-transitions.
  - **سبب الاستخدام**: الـ DFA أسرع بكثير في التنفيذ الفعلي البرمجي، حيث يتم الانتقال بزمن ثابت $O(1)$ لكل حرف دون الحاجة لأي تراجع (Backtracking)، مما يجعل فحص الكود بالكامل يكتمل في زمن خطي $O(n)$.

### س4: كيف عالجتم الغموض (Ambiguity) بين النقطة في الأعداد العشرية `15.75` ومعامل النطاق `1..5` في Rynix؟
* **الإجابة النموذجية**:
  استخدمنا خاصية الـ **Lookahead**:
  عندما يقرأ الـ Scanner الرقم ويصادف النقطة `.`، يقوم بفحص الحرف الذي يليها فوراً (`sourceCode[i + 1]`):
  - إذا وجد نقطة ثانية `.`، يعلم أن هذا المعامل هو معامل النطاق `..` فيتوقف عن قراءة الرقم الحالي ويصدره كـ `IntConstant` ثم يقرأ `..` كتوكن منفصل.
  - إذا وجد رقماً، يكمل قراءة الرقم ويصدره كـ `FloatConstant`.

### س5: كيف تم التعامل مع أخطاء الـ Lexical Errors وهل ينهار البرنامج؟
* **الإجابة النموذجية**:
  تم تطبيق تقنية **Error Recovery**:
  المحلل لا يتوقف عند أول خطأ (Crash)، بل يُسجل الخطأ في قائمة `Errors.Error_List` مع ذكر تفاصيل السطر والعمود وطبيعة الخطأ (مثل معرف يبدأ برقم، أو نص غير مغلق، أو رمز مجهول)، ويُدرج التوكن كـ `Unknown` ثم يستمر في مسح باقي الكود البرمجي لتقديم تقرير كامل للمستخدم بجميع الأخطاء في الكود دفعة واحدة.

### س6: ما هو التعقيد الحسابي (Time & Space Complexity) لكود الـ Scanner؟
* **الإجابة النموذجية**:
  - **Time Complexity**: $O(N)$ حيث $N$ هو عدد حروف كود المصدر (Single Pass)، لأن كل حرف يتم معالجته والانتقال عبر حالات الآلة في زمن ثابت $O(1)$.
  - **Space Complexity**: $O(T)$ حيث $T$ هو عدد الـ Tokens الناتجة المحفوظة في الذاكرة.

---

## 📋 تشغيل المشروع في Visual Studio
1. افتح الملف `JASON_Compiler.sln` داخل مجلد `Project_/[2025-2026] JASON_Compiler_Template/.../` في Visual Studio.
2. اضغط `F5` أو زر `Start` للتشغيل.
3. ستفتح شاشة Windows Forms:
   - ضع الكود في `textBox1`.
   - اضغط زر **Compile !**.
   - ستظهر التوكنز في جدول `dataGridView1` وتظهر الأخطاء مفصلة في `textBox2`.
