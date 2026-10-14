// Preloaded Rynix code samples directly from the language specification

export interface RynixSample {
  id: string;
  name: string;
  description: string;
  code: string;
}

export const RYNIX_SAMPLES: RynixSample[] = [
  {
    id: 'calculator',
    name: '1. Calculator Program',
    description: 'Functions with typed parameters, return values, arithmetic, and conditionals',
    code: `// Rynix Programming Language - Example 1: Calculator Program
fun add(a: Int, b: Int): Int {
    return a + b
}

fun subtract(a: Int, b: Int): Int {
    return a - b
}

fun main(): Void {
    var x: Int = 12
    var y: Int = 5
    var sum: Int = add(x, y)
    var difference: Int = subtract(x, y)

    print(sum)
    print(difference)

    if sum > difference {
        print("Addition is larger")
    } else {
        print("Subtraction is larger")
    }
}
`,
  },
  {
    id: 'student_system',
    name: '2. Student Management (OOP)',
    description: 'Classes, fields, constructor init, methods, and array collections',
    code: `// Rynix Programming Language - Example 2: Student Management System
class Student {
    var name: String
    var grade: Int

    init(n: String, g: Int) {
        name = n
        grade = g
    }

    fun display(): Void {
        print(name)
        print(grade)
    }
}

fun main(): Void {
    var s1: Student = new Student("Ali", 90)
    var s2: Student = new Student("Sara", 85)

    s1.display()
    s2.display()

    if s1.grade > s2.grade {
        print("Ali has higher grade")
    } else {
        print("Sara has higher grade")
    }
}
`,
  },
  {
    id: 'bank_account',
    name: '3. Complete Bank Account (OOP & Loops)',
    description: 'Class with state encapsulation, deposit/withdraw methods, for-in loop, while loop',
    code: `// Rynix Programming Language - Example 3: Complete Bank Account
class BankAccount {
    var owner: String
    var balance: Float

    init(name: String, amount: Float) {
        owner = name
        balance = amount
    }

    fun deposit(value: Float): Void {
        balance = balance + value
    }

    fun withdraw(value: Float): Bool {
        if value <= balance {
            balance = balance - value
            return true
        }
        return false
    }
}

fun main(): Void {
    print("Enter your name: ")
    var name: String = input()
    var account: BankAccount = new BankAccount(name, 1000.0)

    // Deposit using for loop
    for i in 1..5 {
        account.deposit(100.0)
    }

    var success: Bool = account.withdraw(250.0)
    if success {
        print("Transaction Completed")
    } else {
        print("Not enough balance")
    }

    while account.balance < 2000.0 {
        account.deposit(500.0)
    }

    print(account.balance)
}
`,
  },
  {
    id: 'arrays_and_loops',
    name: '4. Arrays & Loops',
    description: 'Array indexing, length property, while loop, break and continue',
    code: `// Rynix Programming Language - Example 4: Arrays & Iteration
fun main(): Void {
    var numbers: Array<Int> = [10, 20, 30, 40, 50]
    var total: Int = 0

    // Loop through array elements
    for item in numbers {
        if item == 30 {
            continue
        }
        print(item)
    }

    var count: Int = 0
    while count < numbers.length {
        total = total + numbers[count]
        count = count + 1
        if total > 60 {
            break
        }
    }

    print("Total computed:")
    print(total)
}
`,
  },
  {
    id: 'lexical_errors_test',
    name: '5. Lexical Errors Test Suite',
    description: 'Tests lexical error detection: identifiers starting with digits, unclosed strings, invalid symbols',
    code: `// Rynix Programming Language - Example 5: Scanner Error Testing
fun main(): Void {
    var 99invalidId: Int = 50       // Error: identifier starts with digit
    var validId: Int = 25
    var price: Float = 14.75.99     // Error: multiple decimal points
    var badFloat: Float = 12.       // Error: missing decimal digits
    
    var text: String = "Hello Rynix // Error: unclosed string literal
    
    var symbol: Char = 'AB'         // Error: multi-character in char literal
    var weird: Int = validId @ 2    // Error: unrecognized character '@'
    
    /* Unterminated comment test below
    while true {
        print("Testing...")
    
}
`,
  },
];
