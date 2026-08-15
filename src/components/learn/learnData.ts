import { Course } from "./learnTypes";

export const COURSES_CATALOG: Course[] = [
  // ==========================================
  // PROGRAMMING CATEGORY
  // ==========================================
  {
    id: "python-mastery",
    title: "Python Programming",
    category: "Programming",
    subcategory: "Python",
    description: "Master Python from fundamental syntax to OOP, functional programming, data analysis, and automation.",
    iconName: "Code2",
    colorGradient: "from-amber-500 to-yellow-600",
    level: "Beginner",
    estimatedHours: 24,
    rating: 4.9,
    studentsEnrolled: 42800,
    tags: ["Python", "Automation", "OOP", "Data Structures", "Backend"],
    roadmaps: {
      beginner: [
        { title: "Variables & Data Types", description: "Understand strings, integers, floats, booleans, lists, tuples, and dictionaries.", topics: ["Syntax", "Variables", "Type Conversion"] },
        { title: "Control Flow & Functions", description: "Master if-else conditions, for/while loops, def statements, and lambda expressions.", topics: ["Conditionals", "Loops", "Functions", "Scope"] },
      ],
      intermediate: [
        { title: "Object-Oriented Programming", description: "Classes, inheritance, encapsulation, polymorphism, and magic methods.", topics: ["Classes", "Dunder Methods", "Inheritance"] },
        { title: "Modules & File I/O", description: "Reading/writing files, handling exceptions, and importing built-in modules.", topics: ["File Handling", "Exceptions", "Packages"] },
      ],
      advanced: [
        { title: "Decorators & Generators", description: "Advanced Python concepts including iterators, yield generators, and custom decorators.", topics: ["Decorators", "Generators", "Context Managers"] },
        { title: "AsyncIO & Concurrency", description: "Asynchronous programming using async/await and multiprocessing.", topics: ["AsyncIO", "Threads", "Multiprocessing"] },
      ],
    },
    lessons: [
      {
        id: "py-1",
        title: "1. Python Fundamentals & Dynamic Typing",
        duration: "15 min",
        description: "Learn how Python handles variables, dynamic typing, memory allocation, and basic arithmetic operations.",
        content: `### Introduction to Python Syntax
Python is a dynamically-typed, high-level programming language known for its clean readability.

\`\`\`python
# Declaring variables
name = "AstraMind Student"
age = 21
is_enrolled = True

# Formatted string literals (f-strings)
print(f"Welcome {name}, Age: {age}, Active: {is_enrolled}")
\`\`\`

#### Key Concepts:
1. **Dynamic Typing**: Variable types are determined automatically at runtime.
2. **Indentation**: Python uses whitespace indentation to define code blocks instead of curly braces.
3. **Data Types**: \`int\`, \`float\`, \`str\`, \`bool\`, \`list\`, \`dict\`, \`tuple\`, \`set\`.`,
        codeExample: `def calculate_learning_score(completed_tasks, total_tasks):\n    if total_tasks == 0:\n        return 0\n    percentage = (completed_tasks / total_tasks) * 100\n    return round(percentage, 2)\n\nscore = calculate_learning_score(8, 10)\nprint(f"Current Progress: {score}%")`,
        codeLanguage: "python",
        keyTakeaways: ["Python uses 4-space indentation for blocks.", "f-strings offer clean string interpolation.", "Variables do not require explicit type declarations."],
        practiceProblem: {
          title: "Temperature Converter",
          description: "Write a function `celsius_to_fahrenheit(c)` that returns the temperature converted to Fahrenheit.",
          starterCode: "def celsius_to_fahrenheit(c):\n    # Your code here\n    pass\n\nprint(celsius_to_fahrenheit(25))",
          solutionCode: "def celsius_to_fahrenheit(c):\n    return (c * 9/5) + 32\n\nprint(celsius_to_fahrenheit(25)) # Output: 77.0",
          hints: ["Formula is (Celsius * 9/5) + 32", "Return a float result"],
        },
      },
      {
        id: "py-2",
        title: "2. Data Structures: Lists, Dicts & Sets",
        duration: "20 min",
        description: "Explore core Python collections, list comprehensions, dictionary methods, and set operations.",
        content: `### Lists & Dictionary Comprehensions
List comprehensions provide a concise way to create lists in Python.

\`\`\`python
# Traditional loop
squares = []
for x in range(10):
    squares.append(x**2)

# List comprehension equivalent
squares_comp = [x**2 for x in range(10) if x % 2 == 0]
print(squares_comp) # [0, 4, 16, 36, 64]
\`\`\``,
        codeExample: `student_scores = {"Alice": 92, "Bob": 85, "Charlie": 98}\ntop_students = {name: score for name, score in student_scores.items() if score > 90}\nprint("Top Scorers:", top_students)`,
        codeLanguage: "python",
        keyTakeaways: ["List comprehensions simplify list operations.", "Dictionaries use hash keys for O(1) average lookup."],
      },
    ],
    practiceChallenges: [
      {
        id: "py-ch-1",
        title: "Palindrome Check",
        difficulty: "Easy",
        description: "Write a function that checks if a string is a palindrome (ignores case and non-alphanumeric characters).",
        starterCode: "def is_palindrome(s):\n    # Write logic here\n    pass",
        solutionHint: "Filter out non-alphanumeric chars using char.isalnum() and compare with reversed string s[::-1].",
      },
      {
        id: "py-ch-2",
        title: "Two Sum Problem",
        difficulty: "Medium",
        description: "Find indices of two numbers in an array that add up to a target sum.",
        starterCode: "def two_sum(nums, target):\n    # Use dictionary for O(n) lookup\n    pass",
        solutionHint: "Store required complements in a dictionary as you iterate.",
      },
    ],
    miniProjects: [
      {
        id: "py-proj-1",
        title: "AI Quiz & Flashcard CLI App",
        difficulty: "Medium",
        description: "Build an interactive CLI tool that tests users on Python concepts, keeps track of scores, and exports progress to JSON.",
        requirements: ["Use dicts/lists to store questions", "Calculate score percentage", "Export result to json file"],
      },
    ],
    quizzes: [
      {
        id: "py-q1",
        question: "What is the time complexity of looking up a key in a standard Python dictionary?",
        options: ["O(1) average time", "O(n) linear time", "O(log n) logarithmic time", "O(n²) quadratic time"],
        correctIndex: 0,
        explanation: "Python dictionaries use hash tables under the hood, providing average O(1) time complexity for key lookups.",
      },
      {
        id: "py-q2",
        question: "Which keyword is used to create a generator function in Python?",
        options: ["return", "yield", "generate", "async"],
        correctIndex: 1,
        explanation: "The 'yield' keyword pauses function execution and yields a value to the caller, creating an iterator generator.",
      },
    ],
    interviewQuestions: [
      {
        id: "py-iq-1",
        question: "What is the difference between deepcopy and shallow copy in Python?",
        difficulty: "Intermediate",
        answer: "A shallow copy creates a new object but populates it with references to child objects. A deepcopy recursively copies all child objects as well, so changes in the copy do not mutate the original.",
        keyConcepts: ["copy module", "Shallow vs Deep", "Object References"],
      },
    ],
    commonMistakes: [
      {
        title: "Mutable Default Arguments",
        mistake: "Using `def append_to(element, target_list=[])` leads to persistent list state across function calls.",
        solution: "Use `def append_to(element, target_list=None): if target_list is None: target_list = []`",
        whyItMatters: "Mutable default parameters are evaluated once when the function is defined, causing unexpected shared bugs.",
      },
    ],
    resources: [
      { name: "Official Python Documentation", url: "https://docs.python.org/3/", type: "Documentation" },
      { name: "Python Tricks: A Buffer of Awesome Code", url: "https://realpython.com", type: "Book" },
    ],
  },

  {
    id: "c-programming",
    title: "C Programming",
    category: "Programming",
    subcategory: "C",
    description: "Understand low-level memory, pointers, manual dynamic memory management (malloc/free), and system architecture.",
    iconName: "Binary",
    colorGradient: "from-blue-600 to-indigo-700",
    level: "Beginner",
    estimatedHours: 20,
    rating: 4.8,
    studentsEnrolled: 29500,
    tags: ["C", "Pointers", "Memory", "Low-Level", "Embedded"],
    roadmaps: {
      beginner: [
        { title: "C Fundamentals & Compilers", description: "Compilation pipeline (gcc), header files, main function, and primitives.", topics: ["GCC", "Main", "Data Types", "Printf"] },
        { title: "Pointers & Addresses", description: "Address-of operator (&), dereferencing (*), and stack memory.", topics: ["Pointers", "Memory Addresses", "Stack"] },
      ],
      intermediate: [
        { title: "Dynamic Memory Allocation", description: "malloc, calloc, realloc, free, and avoiding memory leaks.", topics: ["Heap", "malloc", "free", "Valgrind"] },
        { title: "Structs & Linked Lists", description: "Building custom data structures with structs and pointer links.", topics: ["Structs", "Typedef", "Linked Lists"] },
      ],
      advanced: [
        { title: "File Operations & Bitwise Ops", description: "Low-level bit manipulation and binary file I/O.", topics: ["Bitwise Operations", "FILE*", "Fread/Fwrite"] },
      ],
    },
    lessons: [
      {
        id: "c-1",
        title: "1. Pointers & Memory Dereferencing",
        duration: "20 min",
        description: "Demystify C pointers, stack allocation, address referencing, and pointer arithmetic.",
        content: `### Understanding Pointers in C
A pointer is a variable that stores the memory address of another variable.

\`\`\`c
#include <stdio.

int main() {
    int score = 95;
    int *ptr = &score; // ptr holds memory address of score

    printf("Value: %d\n", score);
    printf("Address: %p\n", (void*)ptr);
    printf("Dereferenced: %d\n", *ptr);

    *ptr = 100; // Modifies original 'score' variable
    printf("New Score: %d\n", score); // 100
    return 0;
}
\`\`\``,
        codeExample: `#include <stdio.h>\n#include <stdlib.h>\n\nvoid swap(int *a, int *b) {\n    int temp = *a;\n    *a = *b;\n    *b = temp;\n}\n\nint main() {\n    int x = 10, y = 20;\n    swap(&x, &y);\n    printf("x: %d, y: %d\\n", x, y); // x: 20, y: 10\n    return 0;\n}`,
        codeLanguage: "c",
        keyTakeaways: ["& obtains the memory address.", "* dereferences the pointer.", "Pass pointers to modify caller variables."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [
      {
        id: "c-q1",
        question: "What happens if you call free(ptr) twice on the same memory address in C?",
        options: ["Double free memory corruption error", "It safely ignores the second free", "It reallocates the memory", "It causes a compiler warning"],
        correctIndex: 0,
        explanation: "Double free is an undefined behavior vulnerability that can cause application crashes or security exploits.",
      },
    ],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "cpp-programming",
    title: "C++ Programming",
    category: "Programming",
    subcategory: "C++",
    description: "Master Modern C++ (C++17/C++20), Standard Template Library (STL), object lifetime, and smart pointers.",
    iconName: "Code",
    colorGradient: "from-sky-600 to-blue-800",
    level: "Intermediate",
    estimatedHours: 28,
    rating: 4.9,
    studentsEnrolled: 38100,
    tags: ["C++", "STL", "OOP", "Smart Pointers", "Algorithms"],
    roadmaps: {
      beginner: [
        { title: "C++ Syntax & References", description: "std::cout, references vs pointers, function overloading.", topics: ["Streams", "References", "Namespace"] },
      ],
      intermediate: [
        { title: "STL Containers & Vectors", description: "std::vector, std::map, std::set, iterators, and std::sort.", topics: ["STL", "Vectors", "Maps", "Iterators"] },
      ],
      advanced: [
        { title: "Smart Pointers & RAII", description: "std::unique_ptr, std::shared_ptr, MOVE semantics, and RAII pattern.", topics: ["Smart Pointers", "Move Semantics", "RAII"] },
      ],
    },
    lessons: [
      {
        id: "cpp-1",
        title: "1. Modern C++ & Standard Template Library (STL)",
        duration: "25 min",
        description: "Learn how to use std::vector, std::unordered_map, and auto keyword for efficient software engineering.",
        content: `### STL Vectors and Maps
STL containers handle dynamic memory management safely behind clean abstractions.

\`\`\`cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> numbers = {5, 2, 8, 1, 9};
    numbers.push_back(4);

    std::sort(numbers.begin(), numbers.end());

    for (auto num : numbers) {
        std::cout << num << " ";
    }
    return 0;
}
\`\`\``,
        codeExample: `#include <iostream>\n#include <memory>\n\nclass Sensor {\npublic:\n    Sensor() { std::cout << "Sensor Initialized\\n"; }\n    ~Sensor() { std::cout << "Sensor Destroyed (RAII Safe)\\n"; }\n};\n\nint main() {\n    auto s = std::make_unique<Sensor>(); // Automatic memory cleanup\n    return 0;\n}`,
        codeLanguage: "cpp",
        keyTakeaways: ["STL containers manage memory safely.", "Use std::make_unique over raw new/delete."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "java-mastery",
    title: "Java Programming",
    category: "Programming",
    subcategory: "Java",
    description: "Build scalable enterprise applications, master JVM internals, multithreading, and Spring Boot patterns.",
    iconName: "Coffee",
    colorGradient: "from-orange-600 to-amber-700",
    level: "Beginner",
    estimatedHours: 30,
    rating: 4.8,
    studentsEnrolled: 51200,
    tags: ["Java", "OOP", "JVM", "Multithreading", "Spring"],
    roadmaps: {
      beginner: [
        { title: "Java OOP Core", description: "Classes, encapsulation, abstraction, interfaces, and inheritance.", topics: ["Classes", "Interfaces", "Polymorphism"] },
      ],
      intermediate: [
        { title: "Java Collections & Streams API", description: "List, Set, Map, functional programming with Streams and Lambdas.", topics: ["Collections", "Streams API", "Lambdas"] },
      ],
      advanced: [
        { title: "JVM Memory & Multithreading", description: "Garbage collection, Heap/Stack, ExecutorService, and locks.", topics: ["JVM", "Threads", "Garbage Collection"] },
      ],
    },
    lessons: [
      {
        id: "java-1",
        title: "1. Java OOP Principles & Interface Contracts",
        duration: "20 min",
        description: "Learn how Java enforces strict object orientation, strong typing, and class structures.",
        content: `### Java Interface Contracts
Interfaces define strict method contracts implemented by concrete classes.

\`\`\`java
public interface PaymentGateway {
    boolean processPayment(double amount);
}

public class StripeService implements PaymentGateway {
    @Override
    public boolean processPayment(double amount) {
        System.out.println("Processing $" + amount + " via Stripe");
        return true;
    }
}
\`\`\``,
        codeExample: `import java.util.List;\nimport java.util.stream.Collectors;\n\npublic class StreamExample {\n    public static void main(String[] args) {\n        List<String> names = List.of("Astra", "Mind", "Learning", "Java");\n        List<String> filtered = names.stream()\n            .filter(n -> n.length() > 4)\n            .map(String::toUpperCase)\n            .collect(Collectors.toList());\n        System.out.println(filtered);\n    }\n}`,
        codeLanguage: "java",
        keyTakeaways: ["Interfaces promote loose coupling.", "Java Streams API simplifies data transformation."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "javascript-modern",
    title: "JavaScript & ES6+",
    category: "Programming",
    subcategory: "JavaScript",
    description: "Deep dive into event loop, closures, promises, async/await, DOM manipulation, and modern ES2024 features.",
    iconName: "FileCode",
    colorGradient: "from-yellow-500 to-amber-600",
    level: "Beginner",
    estimatedHours: 22,
    rating: 4.9,
    studentsEnrolled: 64100,
    tags: ["JavaScript", "ES6+", "Async", "Event Loop", "Web"],
    roadmaps: {
      beginner: [
        { title: "ES6 Syntax & Scoping", description: "let/const, arrow functions, template literals, destructuring.", topics: ["Let/Const", "Arrow Functions", "Destructuring"] },
      ],
      intermediate: [
        { title: "Asynchronous JavaScript", description: "Promises, async/await, fetch API, microtask queue.", topics: ["Promises", "Async/Await", "Fetch"] },
      ],
      advanced: [
        { title: "Event Loop & Closures", description: "Execution context, call stack, event loop, and lexical closures.", topics: ["Event Loop", "Closures", "Prototypes"] },
      ],
    },
    lessons: [
      {
        id: "js-1",
        title: "1. Closures & Lexical Scope",
        duration: "18 min",
        description: "Understand how inner functions retain access to outer scope variables even after execution.",
        content: `### Understanding Lexical Closures
A closure is the combination of a function bundled together with references to its surrounding state.

\`\`\`javascript
function createCounter(initialValue = 0) {
  let count = initialValue;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.getCount());  // 11
\`\`\``,
        codeExample: `async function fetchStudentData() {\n  try {\n    const response = await fetch('https://api.github.com/users/octocat');\n    const data = await response.json();\n    console.log("User Bio:", data.bio);\n  } catch (err) {\n    console.error("Fetch failed:", err);\n  }\n}\nfetchStudentData();`,
        codeLanguage: "javascript",
        keyTakeaways: ["Functions remember their outer lexical environment.", "Closures enable data privacy and state encapsulation."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "html-css-mastery",
    title: "HTML5 & CSS3 Modern UI",
    category: "Programming",
    subcategory: "HTML & CSS",
    description: "Learn semantic HTML5, Flexbox, Grid, CSS animations, responsive layouts, and Tailwind utility systems.",
    iconName: "Layout",
    colorGradient: "from-orange-500 to-rose-600",
    level: "Beginner",
    estimatedHours: 16,
    rating: 4.8,
    studentsEnrolled: 48900,
    tags: ["HTML", "CSS", "Flexbox", "Grid", "Responsive"],
    roadmaps: {
      beginner: [
        { title: "Semantic HTML5 Markup", description: "Header, nav, main, section, article, footer, and accessibility.", topics: ["Markup", "ARIA", "Forms"] },
      ],
      intermediate: [
        { title: "CSS Flexbox & Grid Layouts", description: "Mastering complex 2D and 1D responsive web grid systems.", topics: ["Flexbox", "CSS Grid", "Media Queries"] },
      ],
      advanced: [
        { title: "CSS Animations & Custom Variables", description: "Transitions, keyframes, hardware-accelerated animations, custom properties.", topics: ["Animations", "CSS Variables", "Performance"] },
      ],
    },
    lessons: [
      {
        id: "html-1",
        title: "1. Modern CSS Grid & Flexbox Patterns",
        duration: "15 min",
        description: "Build clean, responsive layouts using CSS Grid auto-fit and Flexbox align systems.",
        content: `### CSS Grid Auto-Fit Pattern
Create ultra-responsive grid cards without writing media queries!

\`\`\`css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
\`\`\``,
        codeExample: `/* Flexbox Centering */\n.hero-container {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n}`,
        codeLanguage: "css",
        keyTakeaways: ["auto-fit with minmax creates fluid grid layouts without breakpoints.", "Flexbox excels at 1D components; Grid excels at 2D page layouts."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "react-framework",
    title: "React 18 & Modern Web",
    category: "Programming",
    subcategory: "React",
    description: "Build dynamic client-side web apps with React 18, custom hooks, state management, and component architecture.",
    iconName: "Atom",
    colorGradient: "from-cyan-500 to-blue-600",
    level: "Intermediate",
    estimatedHours: 25,
    rating: 4.9,
    studentsEnrolled: 58200,
    tags: ["React", "Hooks", "JSX", "State", "Frontend"],
    roadmaps: {
      beginner: [
        { title: "JSX & Component State", description: "useState, props, event handling, and conditional rendering.", topics: ["JSX", "useState", "Props"] },
      ],
      intermediate: [
        { title: "Side Effects & Custom Hooks", description: "useEffect lifecycle, custom hooks, and context API.", topics: ["useEffect", "Custom Hooks", "Context"] },
      ],
      advanced: [
        { title: "Performance & Memoization", description: "useMemo, useCallback, React.memo, and code splitting.", topics: ["useMemo", "useCallback", "Code Splitting"] },
      ],
    },
    lessons: [
      {
        id: "react-1",
        title: "1. React Hooks & Custom Hook Abstractions",
        duration: "20 min",
        description: "Learn how to write reusable custom hooks to encapsulate stateful logic.",
        content: `### Custom Hook Pattern
Custom hooks let you extract component logic into reusable functions.

\`\`\`tsx
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}
\`\`\``,
        codeExample: `function CounterComponent() {\n  const [count, setCount] = useState(0);\n  return (\n    <button \n      onClick={() => setCount(c => c + 1)}\n      className="px-4 py-2 bg-indigo-600 text-white rounded-lg"\n    >\n      Count: {count}\n    </button>\n  );\n}`,
        codeLanguage: "tsx",
        keyTakeaways: ["Custom hooks start with 'use'.", "Keep hook dependency arrays accurate."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "sql-databases",
    title: "SQL & Relational Databases",
    category: "Programming",
    subcategory: "SQL",
    description: "Design relational database schemas, write complex JOINs, query indexing, and query optimization.",
    iconName: "Database",
    colorGradient: "from-teal-500 to-emerald-700",
    level: "Beginner",
    estimatedHours: 18,
    rating: 4.8,
    studentsEnrolled: 39400,
    tags: ["SQL", "PostgreSQL", "Database", "Joins", "Queries"],
    roadmaps: {
      beginner: [
        { title: "CRUD & Filtering", description: "SELECT, WHERE, INSERT, UPDATE, DELETE, ORDER BY, GROUP BY.", topics: ["Select", "Where", "Group By"] },
      ],
      intermediate: [
        { title: "Joins & Normalization", description: "INNER JOIN, LEFT JOIN, FULL OUTER JOIN, 1NF, 2NF, 3NF schema design.", topics: ["Joins", "Normalization", "Foreign Keys"] },
      ],
      advanced: [
        { title: "Indexes & Query Performance", description: "B-Tree indexes, EXPLAIN ANALYZE, transactions, ACID compliance.", topics: ["Indexing", "Transactions", "ACID"] },
      ],
    },
    lessons: [
      {
        id: "sql-1",
        title: "1. Mastering SQL Joins & Aggregations",
        duration: "18 min",
        description: "Combine multiple tables efficiently using INNER, LEFT, and RIGHT joins with aggregate functions.",
        content: `### SQL INNER & LEFT JOIN Syntax

\`\`\`sql
SELECT 
  u.id, 
  u.full_name, 
  COUNT(c.id) AS courses_enrolled,
  AVG(c.progress) AS avg_progress
FROM users u
LEFT JOIN course_enrollments c ON u.id = c.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.full_name
HAVING COUNT(c.id) > 2
ORDER BY avg_progress DESC;
\`\`\``,
        codeExample: `-- Create indexed query for high performance\nCREATE INDEX idx_user_enrollments ON course_enrollments(user_id, status);`,
        codeLanguage: "sql",
        keyTakeaways: ["LEFT JOIN keeps all records from the left table even if unmatched.", "HAVING filters aggregate values after GROUP BY."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "dsa-mastery",
    title: "Data Structures & Algorithms",
    category: "Programming",
    subcategory: "Data Structures & Algorithms",
    description: "Master Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, and Big-O Space/Time Analysis.",
    iconName: "GitMerge",
    colorGradient: "from-purple-600 to-indigo-800",
    level: "Intermediate",
    estimatedHours: 35,
    rating: 4.95,
    studentsEnrolled: 72000,
    tags: ["DSA", "Algorithms", "Interview", "Big-O", "LeetCode"],
    roadmaps: {
      beginner: [
        { title: "Big-O Notation & Arrays", description: "Time and space complexity analysis, sliding window, two pointers.", topics: ["Big-O", "Arrays", "Two Pointers"] },
      ],
      intermediate: [
        { title: "Trees & Binary Search", description: "BST traversals (Inorder, Preorder, Postorder, BFS, DFS).", topics: ["Trees", "BFS", "DFS", "Binary Search"] },
      ],
      advanced: [
        { title: "Graph Algorithms & DP", description: "Dijkstra's, Topological Sort, Memoization, Tabulation DP patterns.", topics: ["Graphs", "Dynamic Programming", "Dijkstra"] },
      ],
    },
    lessons: [
      {
        id: "dsa-1",
        title: "1. Two Pointer & Sliding Window Patterns",
        duration: "25 min",
        description: "Solve linear array problems in O(n) time using pointers instead of nested loops.",
        content: `### Sliding Window Pattern
Find maximum sum subarray of size K in O(n) time complexity.

\`\`\`python
def max_sub_array_of_size_k(k, arr):
    max_sum = 0
    window_sum = 0
    window_start = 0

    for window_end in range(len(arr)):
        window_sum += arr[window_end] # Add next element
        
        # Slide window if reached size K
        if window_end >= k - 1:
            max_sum = max(max_sum, window_sum)
            window_sum -= arr[window_start] # Subtract element going out
            window_start += 1 # Slide ahead

    return max_sum

print(max_sub_array_of_size_k(3, [2, 1, 5, 1, 3, 2])) # Output: 9
\`\`\``,
        codeExample: `def reverse_string_two_pointers(s_list):\n    left, right = 0, len(s_list) - 1\n    while left < right:\n        s_list[left], s_list[right] = s_list[right], s_list[left]\n        left += 1\n        right -= 1\n    return s_list`,
        codeLanguage: "python",
        keyTakeaways: ["Sliding window reduces O(n²) to O(n).", "Two pointers reduce space complexity to O(1)."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  // ==========================================
  // ARTIFICIAL INTELLIGENCE CATEGORY
  // ==========================================
  {
    id: "ai-prompt-engineering",
    title: "Prompt Engineering & AI Workflows",
    category: "Artificial Intelligence",
    subcategory: "Prompt Engineering",
    description: "Master zero-shot, few-shot, Chain-of-Thought (CoT), RAG, system instruction design, and AI agent prompt architectures.",
    iconName: "Sparkles",
    colorGradient: "from-emerald-500 to-teal-700",
    level: "Beginner",
    estimatedHours: 12,
    rating: 4.9,
    studentsEnrolled: 54300,
    tags: ["AI", "Prompt Engineering", "LLM", "GPT", "Gemini"],
    roadmaps: {
      beginner: [
        { title: "Prompt Fundamentals", description: "Role prompting, context framing, zero-shot vs few-shot techniques.", topics: ["Role Framing", "Few-Shot", "Formatting"] },
      ],
      intermediate: [
        { title: "Chain-of-Thought Reasoning", description: "Guiding LLMs to reason step-by-step for complex math and logic.", topics: ["Chain-of-Thought", "Tree-of-Thought", "Self-Consistency"] },
      ],
      advanced: [
        { title: "RAG & System Agent Architectures", description: "Combining vector search context with strict JSON function calling.", topics: ["System Prompts", "Function Calling", "RAG"] },
      ],
    },
    lessons: [
      {
        id: "pe-1",
        title: "1. Chain-of-Thought (CoT) Prompting",
        duration: "15 min",
        description: "Drastically reduce hallucinations and improve LLM reasoning accuracy on multi-step tasks.",
        content: `### Chain-of-Thought Strategy
By instructing the model to "think step by step before providing the final answer", reasoning accuracy jumps significantly.

#### Example System Instruction:
\`\`\`text
You are an expert software tutor.
When solving a problem:
1. Break down the user's requirement into clear logical steps.
2. Analyze edge cases.
3. Write clean code.
4. Explain your reasoning before the code block.
\`\`\``,
        codeExample: `// Few-shot example pattern\nconst prompt = \`\nQ: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?\nA: Roger started with 5 balls. 2 cans of 3 balls each is 6 balls. 5 + 6 = 11. The answer is 11.\n\nQ: The cafeteria had 23 apples. If they used 20 to make lunch and bought 6 more, how many apples do they have?\nA: \`;`,
        codeLanguage: "markdown",
        keyTakeaways: ["Encourage step-by-step reasoning.", "Provide explicit output schemas (JSON/Markdown)."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "machine-learning-core",
    title: "Machine Learning Fundamentals",
    category: "Artificial Intelligence",
    subcategory: "Machine Learning",
    description: "Learn supervised & unsupervised learning, regression, decision trees, random forests, and Scikit-Learn pipelines.",
    iconName: "BrainCircuit",
    colorGradient: "from-purple-500 to-pink-600",
    level: "Intermediate",
    estimatedHours: 26,
    rating: 4.85,
    studentsEnrolled: 41200,
    tags: ["Machine Learning", "Scikit-Learn", "Python", "Data Science"],
    roadmaps: {
      beginner: [
        { title: "Supervised Learning Fundamentals", description: "Linear regression, logistic regression, training vs testing split.", topics: ["Regression", "Classification", "Train-Test Split"] },
      ],
      intermediate: [
        { title: "Decision Trees & Ensemble Methods", description: "Random Forests, Gradient Boosting (XGBoost), hyperparameter tuning.", topics: ["Random Forest", "XGBoost", "GridSearch"] },
      ],
      advanced: [
        { title: "Unsupervised Learning & Clustering", description: "K-Means, PCA dimensionality reduction, anomaly detection.", topics: ["K-Means", "PCA", "Clustering"] },
      ],
    },
    lessons: [
      {
        id: "ml-1",
        title: "1. Linear Regression & Gradient Descent",
        duration: "22 min",
        description: "Understand the mathematical foundations of minimizing cost functions via gradient descent.",
        content: `### Linear Regression Cost Function
The Mean Squared Error (MSE) measures prediction error:

$$MSE = \\frac{1}{n} \\sum_{i=1}^n (y_i - \\hat{y}_i)^2$$

\`\`\`python
from sklearn.linear_model import LinearRegression
import numpy as np

X = np.array([[1], [2], [3], [4], [5]])
y = np.array([2, 4, 5, 4, 5])

model = LinearRegression()
model.fit(X, y)

print("Slope (Coefficient):", model.coef_[0])
print("Intercept:", model.intercept_)
\`\`\``,
        codeExample: `from sklearn.model_selection import train_test_split\nfrom sklearn.ensemble import RandomForestClassifier\n\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\nclf = RandomForestClassifier(n_estimators=100)\nclf.fit(X_train, y_train)\nprint("Accuracy:", clf.score(X_test, y_test))`,
        codeLanguage: "python",
        keyTakeaways: ["Gradient descent iteratively minimizes loss.", "Always split dataset into training and test sets to prevent overfitting."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "deep-learning-neural-nets",
    title: "Deep Learning & Neural Networks",
    category: "Artificial Intelligence",
    subcategory: "Deep Learning",
    description: "Build neural networks with PyTorch, understand activation functions, backpropagation, CNNs, and Transformers.",
    iconName: "Cpu",
    colorGradient: "from-indigo-600 to-purple-700",
    level: "Advanced",
    estimatedHours: 32,
    rating: 4.9,
    studentsEnrolled: 31000,
    tags: ["Deep Learning", "PyTorch", "Neural Networks", "CNN", "Transformers"],
    roadmaps: {
      beginner: [
        { title: "Perceptrons & Activation Functions", description: "Sigmoid, ReLU, Softmax, forward propagation.", topics: ["Perceptron", "ReLU", "Forward Pass"] },
      ],
      intermediate: [
        { title: "PyTorch Neural Networks", description: "nn.Module, loss functions, Adam optimizer, backpropagation.", topics: ["PyTorch", "Backprop", "Loss Functions"] },
      ],
      advanced: [
        { title: "CNNs & Transformer Architectures", description: "Convolutions, Self-Attention mechanism, Multi-Head Attention.", topics: ["CNN", "Self-Attention", "Transformers"] },
      ],
    },
    lessons: [
      {
        id: "dl-1",
        title: "1. PyTorch Neural Network Module",
        duration: "25 min",
        description: "Construct custom neural networks from scratch using PyTorch's nn.Module API.",
        content: `### PyTorch Neural Network Class
\`\`\`python
import torch
import torch.nn as nn

class SimpleMLP(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(SimpleMLP, self).__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_dim, output_dim)

    def forward(self, x):
        out = self.fc1(x)
        out = self.relu(out)
        out = self.fc2(out)
        return out

model = SimpleMLP(784, 128, 10)
print(model)
\`\`\``,
        codeExample: `optimizer = torch.optim.Adam(model.parameters(), lr=0.001)\ncriterion = nn.CrossEntropyLoss()\n\n# Standard training loop\nfor epoch in range(5):\n    optimizer.zero_grad()\n    outputs = model(inputs)\n    loss = criterion(outputs, targets)\n    loss.backward()\n    optimizer.step()`,
        codeLanguage: "python",
        keyTakeaways: ["Always call optimizer.zero_grad() before backward pass.", "PyTorch computes automatic differentiation dynamically."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "llms-generative-ai",
    title: "LLMs & Generative AI Architecture",
    category: "Artificial Intelligence",
    subcategory: "Generative AI",
    description: "Explore Large Language Models, Fine-tuning (LoRA/QLoRA), Embeddings, Vector Databases, and LangChain/LlamaIndex.",
    iconName: "Bot",
    colorGradient: "from-cyan-500 to-indigo-600",
    level: "Advanced",
    estimatedHours: 28,
    rating: 4.95,
    studentsEnrolled: 47800,
    tags: ["Generative AI", "LLM", "Embeddings", "Vector DB", "Fine-Tuning"],
    roadmaps: {
      beginner: [
        { title: "Tokenization & Vector Embeddings", description: "BPE tokenizers, cosine similarity, vector embeddings.", topics: ["Tokens", "Embeddings", "Cosine Similarity"] },
      ],
      intermediate: [
        { title: "Retrieval-Augmented Generation (RAG)", description: "Vector stores (Chroma, Pinecone), chunking strategies.", topics: ["RAG", "Chunking", "Vector Search"] },
      ],
      advanced: [
        { title: "PEFT & LoRA Fine-Tuning", description: "Parameter-efficient fine-tuning for custom model domains.", topics: ["LoRA", "Quantization", "Model Alignment"] },
      ],
    },
    lessons: [
      {
        id: "genai-1",
        title: "1. Vector Embeddings & Similarity Search",
        duration: "20 min",
        description: "Learn how text embeddings map semantic meaning into high-dimensional vector spaces.",
        content: `### Cosine Similarity for Vector Search
The cosine similarity between two vectors $A$ and $B$ is given by:

$$\\text{similarity} = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}$$

\`\`\`python
import numpy as np

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

v1 = np.array([0.2, 0.8, 0.5])
v2 = np.array([0.1, 0.9, 0.4])

print("Semantic Similarity:", cosine_similarity(v1, v2))
\`\`\``,
        codeExample: `// Using Gemini API for text embeddings\nimport { GoogleGenAI } from '@google/genai';\nconst ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });\n\nasync function getEmbedding(text) {\n  const response = await ai.models.embedContent({\n    model: 'text-embedding-004',\n    contents: text,\n  });\n  return response.embedding.values;\n}`,
        codeLanguage: "typescript",
        keyTakeaways: ["Embeddings capture semantic relationships beyond exact keyword matching.", "Cosine similarity measures vector angle closeness."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  // ==========================================
  // WEB DEVELOPMENT CATEGORY
  // ==========================================
  {
    id: "fullstack-node-express",
    title: "Full Stack Web & Node.js APIs",
    category: "Web Development",
    subcategory: "Full Stack",
    description: "Build production full-stack systems using Node.js, Express, RESTful APIs, JWT Auth, and PostgreSQL/MongoDB.",
    iconName: "Globe",
    colorGradient: "from-emerald-600 to-teal-800",
    level: "Intermediate",
    estimatedHours: 30,
    rating: 4.85,
    studentsEnrolled: 52400,
    tags: ["Node.js", "Express", "Full Stack", "REST API", "Auth"],
    roadmaps: {
      beginner: [
        { title: "Node.js & Express Basics", description: "Middleware, routing, HTTP verbs (GET, POST, PUT, DELETE).", topics: ["Node.js", "Express", "Middleware"] },
      ],
      intermediate: [
        { title: "REST APIs & JWT Authentication", description: "Bcrypt password hashing, JSON Web Tokens, protected routes.", topics: ["JWT", "Auth", "Security"] },
      ],
      advanced: [
        { title: "Database ORMs & Deployment", description: "Prisma/Drizzle ORM, CORS, rate limiting, Docker containerization.", topics: ["Prisma", "Docker", "Deployment"] },
      ],
    },
    lessons: [
      {
        id: "node-1",
        title: "1. Express Middleware & Error Handling",
        duration: "20 min",
        description: "Master Express middleware chains, request validation, and global error boundaries.",
        content: `### Express Middleware Architecture
Middleware functions execute in order before sending a client response.

\`\`\`typescript
import express, { Request, Response, NextFunction } from 'express';

const app = express();
app.use(express.json());

// Auth Middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized access" });
  }
  next(); // Pass to next handler
};

app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: "Welcome to AstraMind Secure Dashboard" });
});
\`\`\``,
        codeExample: `// Global error boundary middleware\napp.use((err: any, req: Request, res: Response, next: NextFunction) => {\n  console.error(err.stack);\n  res.status(500).json({ error: "Internal Server Error" });\n});`,
        codeLanguage: "typescript",
        keyTakeaways: ["Always call next() or send a response in middleware.", "Mount error handling middleware last."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  // ==========================================
  // CAREER CATEGORY
  // ==========================================
  {
    id: "career-resume-interview",
    title: "Career Hub & Interview Prep",
    category: "Career",
    subcategory: "Interview Preparation",
    description: "System design, behavioral STAR methods, ATS resume optimization, mock interviews, and tech career roadmaps.",
    iconName: "Briefcase",
    colorGradient: "from-blue-600 to-indigo-700",
    level: "Beginner",
    estimatedHours: 15,
    rating: 4.95,
    studentsEnrolled: 68000,
    tags: ["Career", "Interview", "Resume", "Behavioral", "System Design"],
    roadmaps: {
      beginner: [
        { title: "ATS Resume Building", description: "Formatting, action verbs, quantifying accomplishments.", topics: ["ATS", "Resume", "Keywords"] },
      ],
      intermediate: [
        { title: "Behavioral & STAR Method", description: "Situation, Task, Action, Result framework for top tech interviews.", topics: ["STAR Method", "Behavioral", "Leadership"] },
      ],
      advanced: [
        { title: "System Design Essentials", description: "Scalability, load balancers, caching, microservices, databases.", topics: ["System Design", "Caching", "Scale"] },
      ],
    },
    lessons: [
      {
        id: "car-1",
        title: "1. STAR Technique for Behavioral Interviews",
        duration: "15 min",
        description: "Structure compelling interview answers that demonstrate leadership, problem-solving, and impact.",
        content: `### The STAR Method
1. **Situation**: Set the scene and context.
2. **Task**: Describe your exact responsibility.
3. **Action**: Explain the steps YOU took (use "I" instead of "We").
4. **Result**: Quantify the positive outcome (e.g., "Reduced latency by 40%").

#### Sample Response Framework:
"When our team faced a 30% drop in query speed during peak traffic (Situation), I was tasked with identifying the database bottleneck (Task). I analyzed query execution plans, implemented B-Tree indexes, and refactored N+1 queries in Rails (Action). As a result, API response times improved by 45% and system uptime remained 99.99% (Result)."`,
        codeExample: `// Checklist for interview preparation\nconst prepChecklist = [\n  "Quantified achievements on resume",\n  "Prepared 5 core STAR stories",\n  "Reviewed Big-O & Data Structures",\n  "Practiced mock interview out loud"\n];`,
        codeLanguage: "javascript",
        keyTakeaways: ["Always quantify results with numbers/percentages.", "Focus heavily on the ACTION and RESULT sections."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  // ==========================================
  // STUDY ASSISTANT CATEGORY
  // ==========================================
  {
    id: "study-assistant-suite",
    title: "AI Study Assistant & Productivity Suite",
    category: "Study Assistant",
    subcategory: "Summarize Notes",
    description: "Upload PDFs, summarize lecture notes, generate interactive flashcards, create custom quizzes, and plan revision schedules.",
    iconName: "GraduationCap",
    colorGradient: "from-emerald-500 to-cyan-600",
    level: "Beginner",
    estimatedHours: 10,
    rating: 4.95,
    studentsEnrolled: 89000,
    tags: ["Study Assistant", "PDF Summarizer", "Flashcards", "Quiz", "Notes"],
    roadmaps: {
      beginner: [
        { title: "Document & PDF Analysis", description: "Extract key takeaways and definitions from uploaded PDFs.", topics: ["PDF Extract", "Summarize"] },
      ],
      intermediate: [
        { title: "Interactive Active Recall", description: "Using spaced repetition flashcards and AI auto-generated quizzes.", topics: ["Active Recall", "Flashcards"] },
      ],
      advanced: [
        { title: "Revision & Exam Planner", description: "Smart study schedule generation for final exam readiness.", topics: ["Planning", "Exam Prep"] },
      ],
    },
    lessons: [
      {
        id: "sa-1",
        title: "1. Science of Active Recall & Spaced Repetition",
        duration: "10 min",
        description: "Learn why active recall flashcards outperform passive reading by over 300% for long-term retention.",
        content: `### The Forgetting Curve & Spaced Repetition
Hermann Ebbinghaus discovered that memory retention drops exponentially over time without active review.

#### Key Strategies:
1. **Active Recall**: Test your memory repeatedly instead of re-reading highlighting.
2. **Spaced Intervals**: Review flashcards at intervals (1 day, 3 days, 7 days, 14 days, 30 days).
3. **Feynman Technique**: Explain complex concepts in simple plain English.`,
        codeExample: `// Ebbinghaus Spaced Repetition Schedule\nconst reviewIntervalsDays = [1, 3, 7, 14, 30];`,
        codeLanguage: "javascript",
        keyTakeaways: ["Active retrieval strengthens neural memory pathways.", "Review right before memory retention degrades."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "operating-systems-core",
    title: "Operating Systems & Kernels",
    category: "Computer Science",
    subcategory: "Operating Systems",
    description: "Processes, threads, CPU scheduling, deadlocks, memory management, virtual memory, and file systems.",
    iconName: "Cpu",
    colorGradient: "from-blue-600 to-indigo-800",
    level: "Intermediate",
    estimatedHours: 25,
    rating: 4.9,
    studentsEnrolled: 45000,
    tags: ["OS", "Kernel", "Processes", "Memory", "Concurrency"],
    roadmaps: {
      beginner: [
        { title: "Processes & Threads", description: "Process states, context switching, PCB, thread synchronization.", topics: ["Process", "Threads", "Fork"] },
      ],
      intermediate: [
        { title: "CPU Scheduling & Deadlocks", description: "Round Robin, SJF, Banker's Algorithm, semaphores, mutexes.", topics: ["Scheduling", "Deadlocks", "Semaphores"] },
      ],
      advanced: [
        { title: "Virtual Memory & Paging", description: "Page tables, TLB, page replacement algorithms, segmentation.", topics: ["Paging", "Virtual Memory", "TLB"] },
      ],
    },
    lessons: [
      {
        id: "os-1",
        title: "1. Processes, Context Switching & Forking",
        duration: "20 min",
        description: "Understand process creation, PID, process control blocks, and context switching overhead.",
        content: `### Process Control Block (PCB) & Context Switch
A process is an instance of a computer program being executed.
The OS stores process state in a Process Control Block (PCB).

\`\`\`c
#include <stdio.h>
#include <unistd.h>

int main() {
    pid_t pid = fork(); // Duplicate process
    if (pid == 0) {
        printf("Child Process PID: %d\n", getpid());
    } else {
        printf("Parent Process PID: %d, Child PID: %d\n", getpid(), pid);
    }
    return 0;
}
\`\`\``,
        codeExample: `#include <stdio.h>\n#include <unistd.h>\nint main() { fork(); fork(); printf("AstraMind OS\\n"); return 0; } // Prints 4 times`,
        codeLanguage: "c",
        keyTakeaways: ["fork() duplicates process memory.", "Context switching saves and restores registers."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "dbms-core",
    title: "Database Management Systems (DBMS)",
    category: "Computer Science",
    subcategory: "DBMS",
    description: "Relational database design, B-Tree indexes, ER diagrams, Normalization (1NF-3NF/BCNF), and ACID transactions.",
    iconName: "Database",
    colorGradient: "from-amber-600 to-orange-700",
    level: "Intermediate",
    estimatedHours: 24,
    rating: 4.9,
    studentsEnrolled: 49800,
    tags: ["DBMS", "SQL", "ACID", "Normalization", "Indexing"],
    roadmaps: {
      beginner: [
        { title: "Relational Model & ER Diagrams", description: "Entities, attributes, relationships, candidate keys, primary keys.", topics: ["ER Modeling", "Keys", "Relational Schema"] },
      ],
      intermediate: [
        { title: "Database Normalization", description: "Functional dependencies, 1NF, 2NF, 3NF, and BCNF decomposition.", topics: ["1NF", "2NF", "3NF", "BCNF"] },
      ],
      advanced: [
        { title: "ACID Transactions & Concurrency", description: "Serializability, 2PL, WAL logs, isolation levels.", topics: ["ACID", "2PL", "Isolation Levels"] },
      ],
    },
    lessons: [
      {
        id: "dbms-1",
        title: "1. ACID Properties & Transaction Control",
        duration: "20 min",
        description: "Atomicity, Consistency, Isolation, and Durability guarantees in modern DBMS engines.",
        content: `### ACID Guarantees
- **Atomicity**: All operations in a transaction succeed, or none do (All-or-Nothing).
- **Consistency**: Database transitions from one valid state to another valid state.
- **Isolation**: Concurrent transactions do not interfere with each other.
- **Durability**: Committed data is stored permanently even after system crashes.`,
        codeExample: `BEGIN TRANSACTION;\nUPDATE accounts SET balance = balance - 500 WHERE id = 1;\nUPDATE accounts SET balance = balance + 500 WHERE id = 2;\nCOMMIT;`,
        codeLanguage: "sql",
        keyTakeaways: ["Transactions preserve data consistency.", "WAL logs ensure durability after power loss."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "computer-networks",
    title: "Computer Networks & OSI Model",
    category: "Computer Science",
    subcategory: "Computer Networks",
    description: "OSI 7-Layer model, TCP/IP stack, IP addressing, subnetting, HTTP/HTTPS, DNS, and socket programming.",
    iconName: "Network",
    colorGradient: "from-cyan-600 to-blue-700",
    level: "Intermediate",
    estimatedHours: 22,
    rating: 4.85,
    studentsEnrolled: 41000,
    tags: ["Networking", "TCP/IP", "DNS", "HTTP", "Sockets"],
    roadmaps: {
      beginner: [
        { title: "OSI & TCP/IP Model Layers", description: "Physical, Data Link, Network, Transport, Application layers.", topics: ["OSI Model", "TCP/IP", "Ethernet"] },
      ],
      intermediate: [
        { title: "IP Addressing & Subnetting", description: "IPv4/IPv6, CIDR notation, subnet masks, ARP, ICMP.", topics: ["IPv4", "Subnetting", "CIDR"] },
      ],
      advanced: [
        { title: "TCP 3-Way Handshake & Protocols", description: "SYN, SYN-ACK, ACK, flow control, congestion control, TLS/SSL.", topics: ["TCP Handshake", "TLS", "DNS"] },
      ],
    },
    lessons: [
      {
        id: "cn-1",
        title: "1. TCP 3-Way Handshake & Reliable Transport",
        duration: "18 min",
        description: "How TCP establishes reliable, ordered, bi-directional socket connections over IP.",
        content: `### TCP 3-Way Handshake
1. **SYN**: Client sends SYN packet (Sequence = X) to Server.
2. **SYN-ACK**: Server responds with SYN-ACK packet (Sequence = Y, ACK = X+1).
3. **ACK**: Client replies with ACK packet (ACK = Y+1). Connection ESTABLISHED!`,
        codeExample: `// Client Socket Connection in Node.js\nimport net from 'net';\nconst client = net.createConnection({ port: 8080 }, () => {\n  console.log('Connected via TCP Handshake!');\n});`,
        codeLanguage: "typescript",
        keyTakeaways: ["TCP guarantees packet ordering and delivery.", "UDP is connectionless and lower latency."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "physics-fundamentals",
    title: "Physics: Mechanics & Electromagnetism",
    category: "Science & Math",
    subcategory: "Physics",
    description: "Classical mechanics, Kinematics, Newton's Laws, Work-Energy, Thermodynamics, Electromagnetism & Waves.",
    iconName: "Zap",
    colorGradient: "from-yellow-600 to-amber-700",
    level: "Beginner",
    estimatedHours: 28,
    rating: 4.8,
    studentsEnrolled: 32000,
    tags: ["Physics", "Mechanics", "Energy", "Electromagnetism", "Science"],
    roadmaps: {
      beginner: [
        { title: "Kinematics & Motion", description: "Displacement, velocity, acceleration, projectile motion.", topics: ["Motion", "Velocity", "Vectors"] },
      ],
      intermediate: [
        { title: "Newton's Laws & Work-Energy", description: "Force vectors, friction, conservation of energy and momentum.", topics: ["Newton Laws", "Energy", "Momentum"] },
      ],
      advanced: [
        { title: "Electromagnetism & Waves", description: "Electric fields, Coulomb's Law, magnetic induction, wave optics.", topics: ["Fields", "Magnetism", "Optics"] },
      ],
    },
    lessons: [
      {
        id: "phy-1",
        title: "1. Kinematics Equations of Motion",
        duration: "15 min",
        description: "Derive and solve constant acceleration motion equations in 1D and 2D space.",
        content: `### SUVAT Equations of Motion
1. $v = u + at$
2. $s = ut + \\frac{1}{2}at^2$
3. $v^2 = u^2 + 2as$
4. $s = \\frac{(u + v)}{2}t$`,
        codeExample: `# Python simulation of projectile motion\ndef projectile_height(initial_v, t, g=9.81):\n    return (initial_v * t) - (0.5 * g * (t**2))`,
        codeLanguage: "python",
        keyTakeaways: ["Velocity is derivative of displacement.", "Acceleration is derivative of velocity."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "chemistry-core",
    title: "Chemistry: Organic & Physical Principles",
    category: "Science & Math",
    subcategory: "Chemistry",
    description: "Atomic structure, chemical bonding, thermodynamics, kinetics, organic reaction mechanisms, and stoichiometry.",
    iconName: "Atom",
    colorGradient: "from-rose-600 to-pink-700",
    level: "Beginner",
    estimatedHours: 26,
    rating: 4.8,
    studentsEnrolled: 28000,
    tags: ["Chemistry", "Organic", "Reactions", "Molecules", "Science"],
    roadmaps: {
      beginner: [
        { title: "Atomic Structure & Periodic Table", description: "Orbitals, electron configurations, periodic trends.", topics: ["Atom", "Periodic Table", "Bonds"] },
      ],
      intermediate: [
        { title: "Stoichiometry & Chemical Kinetics", description: "Molar calculations, reaction rates, activation energy.", topics: ["Moles", "Kinetics", "Catalysts"] },
      ],
      advanced: [
        { title: "Organic Mechanisms (SN1/SN2)", description: "Nucleophilic substitution, elimination reactions, functional groups.", topics: ["SN1", "SN2", "Organic"] },
      ],
    },
    lessons: [
      {
        id: "chem-1",
        title: "1. SN1 vs SN2 Reaction Mechanisms",
        duration: "20 min",
        description: "Compare unimolecular vs bimolecular nucleophilic substitution reaction pathways.",
        content: `### SN1 vs SN2 Comparison
- **SN2**: 1-step concerted mechanism, inversion of stereochemistry, favored by primary alkyl halides.
- **SN1**: 2-step mechanism via carbocation intermediate, racemization, favored by tertiary alkyl halides.`,
        codeExample: `// Molar Mass Calculator\nconst calculateMoles = (massGrams: number, molarMass: number) => massGrams / molarMass;`,
        codeLanguage: "typescript",
        keyTakeaways: ["Steric hindrance slows SN2 reactions.", "Polar protic solvents stabilize SN1 carbocations."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },

  {
    id: "mathematics-advanced",
    title: "Mathematics: Calculus & Linear Algebra",
    category: "Science & Math",
    subcategory: "Mathematics",
    description: "Limits, derivatives, integrals, matrices, vector spaces, eigenvalues, and probability distribution.",
    iconName: "Compass",
    colorGradient: "from-emerald-600 to-teal-800",
    level: "Beginner",
    estimatedHours: 32,
    rating: 4.95,
    studentsEnrolled: 58000,
    tags: ["Math", "Calculus", "Linear Algebra", "Matrices", "Vectors"],
    roadmaps: {
      beginner: [
        { title: "Calculus & Derivatives", description: "Limits, derivative rules (power, product, quotient, chain rule).", topics: ["Limits", "Derivatives", "Chain Rule"] },
      ],
      intermediate: [
        { title: "Integration & Differential Equations", description: "Indefinite & definite integrals, substitution, integration by parts.", topics: ["Integrals", "Differential Equations"] },
      ],
      advanced: [
        { title: "Linear Algebra & Matrices", description: "Matrix multiplication, determinants, eigenvectors & eigenvalues for AI.", topics: ["Matrices", "Eigenvectors", "SVD"] },
      ],
    },
    lessons: [
      {
        id: "math-1",
        title: "1. Derivatives & The Chain Rule",
        duration: "18 min",
        description: "Master taking derivatives of composite functions for machine learning backpropagation.",
        content: `### Chain Rule Formula
If $y = f(g(x))$, then the derivative with respect to $x$ is:

$$\\frac{dy}{dx} = f'(g(x)) \\cdot g'(x)$$`,
        codeExample: `# Matrix multiplication using NumPy for linear algebra\nimport numpy as np\nA = np.array([[1, 2], [3, 4]])\nB = np.array([[5, 6], [7, 8]])\nprint("Dot Product:\\n", np.dot(A, B))`,
        codeLanguage: "python",
        keyTakeaways: ["Chain rule is foundational for neural network backpropagation.", "Matrix dot products power AI transformations."],
      },
    ],
    practiceChallenges: [],
    miniProjects: [],
    quizzes: [],
    interviewQuestions: [],
    commonMistakes: [],
    resources: [],
  },
];
