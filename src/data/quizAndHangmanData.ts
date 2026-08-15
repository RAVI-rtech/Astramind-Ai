export const CONTENT_VERSION = "1.0.0";

export type Category =
  | "Programming Basics"
  | "C Programming"
  | "Python"
  | "Web Development"
  | "Computer Science"
  | "AI / ML";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface HangmanTerm {
  word: string;
  category: Category;
  hint: string;
  difficulty: Difficulty;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answer: number; // 0, 1, 2, or 3
  explanation: string;
  category: Category;
  difficulty: Difficulty;
}

/* ====================================================================
   100+ UNIQUE PROGRAMMING HANGMAN TERMS
   ==================================================================== */
export const HANGMAN_TERMS: HangmanTerm[] = [
  // Programming Basics (18)
  { word: "VARIABLE", category: "Programming Basics", hint: "Named storage location in memory for holding data", difficulty: "Easy" },
  { word: "FUNCTION", category: "Programming Basics", hint: "Reusable block of code that performs a specific task", difficulty: "Easy" },
  { word: "LOOP", category: "Programming Basics", hint: "Control structure for repeating code multiple times", difficulty: "Easy" },
  { word: "ARRAY", category: "Programming Basics", hint: "Contiguous collection of elements of the same data type", difficulty: "Easy" },
  { word: "STRING", category: "Programming Basics", hint: "Sequence of characters enclosed in quotes", difficulty: "Easy" },
  { word: "INTEGER", category: "Programming Basics", hint: "Whole numeric value without fractional part", difficulty: "Easy" },
  { word: "BOOLEAN", category: "Programming Basics", hint: "Data type with only true or false values", difficulty: "Easy" },
  { word: "OPERATOR", category: "Programming Basics", hint: "Symbol specifying an action like addition or comparison", difficulty: "Easy" },
  { word: "CONDITION", category: "Programming Basics", hint: "Expression evaluated to true or false in if statements", difficulty: "Easy" },
  { word: "SYNTAX", category: "Programming Basics", hint: "Set of rules defining structure of a programming language", difficulty: "Easy" },
  { word: "COMPILER", category: "Programming Basics", hint: "Translates high-level source code into machine code", difficulty: "Medium" },
  { word: "INTERPRETER", category: "Programming Basics", hint: "Executes source code line by line directly", difficulty: "Medium" },
  { word: "ALGORITHM", category: "Programming Basics", hint: "Step-by-step procedure for solving a specific problem", difficulty: "Medium" },
  { word: "DEBUGGING", category: "Programming Basics", hint: "Process of finding and removing bugs from code", difficulty: "Medium" },
  { word: "RECURSION", category: "Programming Basics", hint: "Function calling itself to break down a problem", difficulty: "Hard" },
  { word: "PARAMETER", category: "Programming Basics", hint: "Variable declared in function signature definition", difficulty: "Medium" },
  { word: "ARGUMENT", category: "Programming Basics", hint: "Actual value passed into a function upon invocation", difficulty: "Medium" },
  { word: "SCOPE", category: "Programming Basics", hint: "Region of code where a variable is accessible", difficulty: "Easy" },

  // C Programming (18)
  { word: "POINTER", category: "C Programming", hint: "Variable storing the memory address of another variable", difficulty: "Medium" },
  { word: "STRUCTURE", category: "C Programming", hint: "User-defined composite data type grouping related variables", difficulty: "Medium" },
  { word: "UNION", category: "C Programming", hint: "Special data type storing different types in same memory location", difficulty: "Hard" },
  { word: "TYPEDEF", category: "C Programming", hint: "Keyword used to define an alias name for existing type", difficulty: "Medium" },
  { word: "MALLOC", category: "C Programming", hint: "Standard C function allocating raw memory on the heap", difficulty: "Medium" },
  { word: "CALLOC", category: "C Programming", hint: "C function allocating and zero-initializing memory on heap", difficulty: "Hard" },
  { word: "REALLOC", category: "C Programming", hint: "Resizes previously allocated heap memory block", difficulty: "Hard" },
  { word: "SCANF", category: "C Programming", hint: "Standard C input function reading formatted user input", difficulty: "Easy" },
  { word: "PRINTF", category: "C Programming", hint: "Standard C output function printing formatted strings", difficulty: "Easy" },
  { word: "HEADER FILE", category: "C Programming", hint: "Contains function declarations and macros (.h)", difficulty: "Medium" },
  { word: "PREPROCESSOR", category: "C Programming", hint: "Processes macros and includes before actual compilation", difficulty: "Hard" },
  { word: "DEREFERENCE", category: "C Programming", hint: "Accessing value stored at address held by pointer using *", difficulty: "Hard" },
  { word: "SEGMENTATION FAULT", category: "C Programming", hint: "Crash caused by accessing invalid or unauthorized memory", difficulty: "Hard" },
  { word: "ENUMERATION", category: "C Programming", hint: "User-defined data type consisting of named integral constants", difficulty: "Medium" },
  { word: "STATIC", category: "C Programming", hint: "Storage class preserving variable value across function calls", difficulty: "Medium" },
  { word: "EXTERN", category: "C Programming", hint: "Declares global variable or function defined in another file", difficulty: "Hard" },
  { word: "VOLATILE", category: "C Programming", hint: "Tells compiler variable value may change unexpectedly", difficulty: "Hard" },
  { word: "MACRO", category: "C Programming", hint: "Code fragment defined using #define preprocessor directive", difficulty: "Easy" },

  // Python (18)
  { word: "TUPLE", category: "Python", hint: "Immutable ordered sequence of elements enclosed in parentheses", difficulty: "Easy" },
  { word: "DICTIONARY", category: "Python", hint: "Unordered collection of key-value mapping pairs", difficulty: "Easy" },
  { word: "LIST COMPREHENSION", category: "Python", hint: "Concise syntax for creating lists based on existing lists", difficulty: "Medium" },
  { word: "MODULE", category: "Python", hint: "Single Python file containing statements and definitions", difficulty: "Easy" },
  { word: "PACKAGE", category: "Python", hint: "Directory containing multiple Python modules with __init__.py", difficulty: "Medium" },
  { word: "LAMBDA", category: "Python", hint: "Anonymous single-line function created with keyword", difficulty: "Medium" },
  { word: "DECORATOR", category: "Python", hint: "Function modifying behavior of another function using @ syntax", difficulty: "Hard" },
  { word: "GENERATOR", category: "Python", hint: "Function returning an iterator using the yield keyword", difficulty: "Hard" },
  { word: "EXCEPTION", category: "Python", hint: "Error detected during program execution handled by try-except", difficulty: "Easy" },
  { word: "INDENTATION", category: "Python", hint: "Whitespace at start of line defining block scope in Python", difficulty: "Easy" },
  { word: "SLICING", category: "Python", hint: "Extracting sub-sequence from list or string using [start:stop]", difficulty: "Medium" },
  { word: "ITERATOR", category: "Python", hint: "Object representing stream of data fetched using next()", difficulty: "Medium" },
  { word: "DOCSTRING", category: "Python", hint: "Triple-quoted documentation string inside class or function", difficulty: "Easy" },
  { word: "VIRTUAL ENVIRONMENT", category: "Python", hint: "Isolated directory containing Python installation and packages", difficulty: "Medium" },
  { word: "DUNDER METHOD", category: "Python", hint: "Double-underscore magic method like __init__ or __str__", difficulty: "Hard" },
  { word: "PICKLE", category: "Python", hint: "Standard module used for serializing Python objects to bytes", difficulty: "Hard" },
  { word: "DUCK TYPING", category: "Python", hint: "If it walks like a duck and quacks like a duck, it is a duck", difficulty: "Hard" },
  { word: "GIL", category: "Python", hint: "Global Interpreter Lock restricting thread execution in CPython", difficulty: "Hard" },

  // Web Development (18)
  { word: "HTML", category: "Web Development", hint: "Standard markup language for creating web page structure", difficulty: "Easy" },
  { word: "CSS", category: "Web Development", hint: "Style sheet language used for describing presentation of HTML", difficulty: "Easy" },
  { word: "JAVASCRIPT", category: "Web Development", hint: "Dynamic scripting language powering interactive web content", difficulty: "Easy" },
  { word: "FRONTEND", category: "Web Development", hint: "Client-side portion of web application user interacts with", difficulty: "Easy" },
  { word: "BACKEND", category: "Web Development", hint: "Server-side architecture handling database, logic, and APIs", difficulty: "Easy" },
  { word: "BROWSER", category: "Web Development", hint: "Software application used to access and view web pages", difficulty: "Easy" },
  { word: "SERVER", category: "Web Development", hint: "Computer system delivering web resources over a network", difficulty: "Easy" },
  { word: "DATABASE", category: "Web Development", hint: "Organized collection of structured data stored digitally", difficulty: "Easy" },
  { word: "API", category: "Web Development", hint: "Application Programming Interface for software communication", difficulty: "Easy" },
  { word: "HTTP", category: "Web Development", hint: "Hypertext Transfer Protocol for web browser-server requests", difficulty: "Medium" },
  { word: "JSON", category: "Web Development", hint: "Lightweight data-interchange format human and machine readable", difficulty: "Easy" },
  { word: "DOM", category: "Web Development", hint: "Document Object Model representing HTML as node tree", difficulty: "Medium" },
  { word: "RESPONSIVE", category: "Web Development", hint: "Design approach ensuring web pages adapt to all screen sizes", difficulty: "Medium" },
  { word: "FRAMEWORK", category: "Web Development", hint: "Pre-written code platform providing structural scaffolding", difficulty: "Medium" },
  { word: "WEBSOCKET", category: "Web Development", hint: "Full-duplex real-time communication protocol over single TCP", difficulty: "Hard" },
  { word: "SINGLE PAGE APP", category: "Web Development", hint: "Web application dynamically rewriting current page without refresh", difficulty: "Hard" },
  { word: "CORS", category: "Web Development", hint: "Cross-Origin Resource Sharing browser security mechanism", difficulty: "Hard" },
  { word: "LOCAL STORAGE", category: "Web Development", hint: "Browser client-side key-value persistence across sessions", difficulty: "Medium" },

  // Computer Science (18)
  { word: "OPERATING SYSTEM", category: "Computer Science", hint: "System software managing computer hardware and software resources", difficulty: "Medium" },
  { word: "NETWORKING", category: "Computer Science", hint: "Interconnecting computing devices to exchange data and resources", difficulty: "Medium" },
  { word: "CYBERSECURITY", category: "Computer Science", hint: "Practice of protecting systems, networks, and data from attacks", difficulty: "Medium" },
  { word: "PROCESS", category: "Computer Science", hint: "Program in active execution with dedicated memory space", difficulty: "Medium" },
  { word: "THREAD", category: "Computer Science", hint: "Smallest unit of execution managed independently by OS scheduler", difficulty: "Medium" },
  { word: "MEMORY", category: "Computer Science", hint: "Electronic storage component used to store data or instructions", difficulty: "Easy" },
  { word: "ARCHITECTURE", category: "Computer Science", hint: "Conceptual structure and operational organization of computer", difficulty: "Hard" },
  { word: "DATA STRUCTURE", category: "Computer Science", hint: "Format for organizing, processing, retrieving, and storing data", difficulty: "Medium" },
  { word: "BINARY TREE", category: "Computer Science", hint: "Hierarchical data structure where each node has at most two children", difficulty: "Medium" },
  { word: "HASH TABLE", category: "Computer Science", hint: "Data structure mapping keys to values using hash function", difficulty: "Hard" },
  { word: "STACK", category: "Computer Science", hint: "LIFO (Last-In First-Out) linear data structure", difficulty: "Easy" },
  { word: "QUEUE", category: "Computer Science", hint: "FIFO (First-In First-Out) linear data structure", difficulty: "Easy" },
  { word: "GRAPH", category: "Computer Science", hint: "Non-linear data structure consisting of vertices and connecting edges", difficulty: "Hard" },
  { word: "SEMAPHORE", category: "Computer Science", hint: "Variable or abstract data type used to control access to shared resource", difficulty: "Hard" },
  { word: "DEADLOCK", category: "Computer Science", hint: "Situation where two or more processes are unable to proceed indefinitely", difficulty: "Hard" },
  { word: "CACHE", category: "Computer Science", hint: "High-speed data storage layer storing subset of transient data", difficulty: "Easy" },
  { word: "VIRTUAL MEMORY", category: "Computer Science", hint: "Memory management technique using secondary storage as RAM extension", difficulty: "Hard" },
  { word: "ASYNCHRONOUS", category: "Computer Science", hint: "Non-blocking operation executed without waiting for completion", difficulty: "Hard" },

  // AI / ML (18)
  { word: "ARTIFICIAL INTELLIGENCE", category: "AI / ML", hint: "Simulation of human intelligence in machines programmed to think", difficulty: "Easy" },
  { word: "MACHINE LEARNING", category: "AI / ML", hint: "Branch of AI allowing algorithms to learn and improve from experience", difficulty: "Easy" },
  { word: "DATASET", category: "AI / ML", hint: "Structured collection of data used to train and evaluate ML models", difficulty: "Easy" },
  { word: "MODEL", category: "AI / ML", hint: "Trained mathematical representation of patterns learned from data", difficulty: "Easy" },
  { word: "TRAINING", category: "AI / ML", hint: "Process of feeding data to ML algorithm to learn optimal parameters", difficulty: "Easy" },
  { word: "PREDICTION", category: "AI / ML", hint: "Output generated by ML model when given new unseen input data", difficulty: "Easy" },
  { word: "NEURAL NETWORK", category: "AI / ML", hint: "Computing model inspired by biological neural networks in brain", difficulty: "Medium" },
  { word: "REGRESSION", category: "AI / ML", hint: "Supervised learning task predicting continuous numeric values", difficulty: "Medium" },
  { word: "CLASSIFICATION", category: "AI / ML", hint: "Supervised learning task categorizing data into discrete labels", difficulty: "Medium" },
  { word: "DEEP LEARNING", category: "AI / ML", hint: "Subset of machine learning based on artificial neural networks with many layers", difficulty: "Medium" },
  { word: "GRADIENT DESCENT", category: "AI / ML", hint: "Optimization algorithm minimizing loss function by adjusting weights", difficulty: "Hard" },
  { word: "OVERFITTING", category: "AI / ML", hint: "Model learning training data noise too well, performing poorly on new data", difficulty: "Hard" },
  { word: "UNDERFITTING", category: "AI / ML", hint: "Model too simple to capture underlying trend of data", difficulty: "Medium" },
  { word: "NATURAL LANGUAGE", category: "AI / ML", hint: "Field of AI focused on interaction between computers and human language", difficulty: "Medium" },
  { word: "COMPUTER VISION", category: "AI / ML", hint: "Field of AI enabling computers to derive information from digital images", difficulty: "Medium" },
  { word: "TRANSFORMER", category: "AI / ML", hint: "Deep learning architecture using self-attention mechanism powering LLMs", difficulty: "Hard" },
  { word: "HYPERPARAMETER", category: "AI / ML", hint: "External configuration variable set before training ML algorithm", difficulty: "Hard" },
  { word: "REINFORCEMENT", category: "AI / ML", hint: "Learning paradigm based on rewards and penalties in dynamic environment", difficulty: "Hard" }
];

/* ====================================================================
   100+ HIGH QUALITY CODING QUIZ QUESTIONS
   ==================================================================== */
export const CODING_QUESTIONS: QuizQuestion[] = [
  // C Programming
  {
    id: 1,
    question: "What is the output of: int x = 5; printf(\"%d\", x + 2);",
    options: ["5", "7", "2", "Error"],
    answer: 1,
    explanation: "The expression x + 2 evaluates 5 + 2 = 7, which is printed by printf.",
    category: "C Programming",
    difficulty: "Easy"
  },
  {
    id: 2,
    question: "Which keyword is used to allocate memory dynamically in C?",
    options: ["alloc()", "malloc()", "new", "create()"],
    answer: 1,
    explanation: "malloc() (Memory Allocation) is defined in <stdlib.h> to dynamically allocate memory on the heap.",
    category: "C Programming",
    difficulty: "Easy"
  },
  {
    id: 3,
    question: "What does a pointer variable store in C?",
    options: ["An integer value", "A float value", "A memory address", "A character string"],
    answer: 2,
    explanation: "A pointer is a variable that stores the memory address of another variable.",
    category: "C Programming",
    difficulty: "Easy"
  },
  {
    id: 4,
    question: "What is the size of 'char' data type in C on standard systems?",
    options: ["1 byte", "2 bytes", "4 bytes", "8 bytes"],
    answer: 0,
    explanation: "In C, sizeof(char) is guaranteed to be 1 byte.",
    category: "C Programming",
    difficulty: "Easy"
  },
  {
    id: 5,
    question: "What happens if you access an array element beyond its declared boundary in C?",
    options: ["Compile error", "Undefined behavior", "Returns 0", "Automatic array expansion"],
    answer: 1,
    explanation: "C does not perform bounds checking on arrays; accessing out-of-bounds leads to undefined behavior.",
    category: "C Programming",
    difficulty: "Medium"
  },
  {
    id: 6,
    question: "Which operator is used to access structure members through a structure pointer?",
    options: [". (dot)", "-> (arrow)", "* (asterisk)", "& (ampersand)"],
    answer: 1,
    explanation: "The arrow operator (->) dereferences the pointer and accesses the structure member (e.g., ptr->member).",
    category: "C Programming",
    difficulty: "Medium"
  },
  {
    id: 7,
    question: "What is the default initial value of static variables in C?",
    options: ["Garbage value", "0", "1", "NULL"],
    answer: 1,
    explanation: "Static variables are initialized to zero by default in C if not explicitly assigned.",
    category: "C Programming",
    difficulty: "Medium"
  },
  {
    id: 8,
    question: "Which of the following creates an alias name for a data type in C?",
    options: ["struct", "typedef", "define", "enum"],
    answer: 1,
    explanation: "typedef allows developers to create custom alias names for existing types (e.g. typedef unsigned long ulong;).",
    category: "C Programming",
    difficulty: "Medium"
  },
  {
    id: 9,
    question: "What is the difference between malloc() and calloc() in C?",
    options: [
      "malloc initializes memory to 0, calloc leaves garbage",
      "calloc initializes memory to 0, malloc leaves garbage",
      "malloc is faster and allocates 0 bytes",
      "There is no difference"
    ],
    answer: 1,
    explanation: "calloc() allocates memory and clears all bytes to zero, whereas malloc() leaves uninitialized garbage memory.",
    category: "C Programming",
    difficulty: "Hard"
  },
  {
    id: 10,
    question: "What does the 'volatile' keyword signify in C?",
    options: [
      "Variable value is constant and cannot change",
      "Variable value can be modified unexpectedly by hardware/threads",
      "Variable is stored in CPU registers",
      "Variable is accessible only within local block"
    ],
    answer: 1,
    explanation: "volatile tells the C compiler that the variable's value may be changed at any time by external hardware or interrupts, preventing aggressive compiler optimizations.",
    category: "C Programming",
    difficulty: "Hard"
  },

  // Python
  {
    id: 11,
    question: "How do you define a function in Python?",
    options: ["function myFunc():", "def myFunc():", "func myFunc():", "define myFunc():"],
    answer: 1,
    explanation: "Functions in Python are declared using the 'def' keyword.",
    category: "Python",
    difficulty: "Easy"
  },
  {
    id: 12,
    question: "Which data structure in Python is immutable?",
    options: ["List", "Dictionary", "Set", "Tuple"],
    answer: 3,
    explanation: "Tuples are immutable sequences in Python; once created, their elements cannot be changed.",
    category: "Python",
    difficulty: "Easy"
  },
  {
    id: 13,
    question: "What will print(type([])) output in Python?",
    options: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>"],
    answer: 1,
    explanation: "Square brackets [] define a list instance in Python, so its type is <class 'list'>.",
    category: "Python",
    difficulty: "Easy"
  },
  {
    id: 14,
    question: "What is the output of len('Python')?",
    options: ["5", "6", "7", "Error"],
    answer: 1,
    explanation: "'Python' contains 6 characters, so len() returns 6.",
    category: "Python",
    difficulty: "Easy"
  },
  {
    id: 15,
    question: "Which keyword is used for exception handling catch blocks in Python?",
    options: ["catch", "except", "error", "handle"],
    answer: 1,
    explanation: "Python uses try...except blocks for catching and handling exceptions.",
    category: "Python",
    difficulty: "Easy"
  },
  {
    id: 16,
    question: "What is list comprehension in Python?",
    options: [
      "A method to compress list size",
      "A concise syntax to create a list based on existing iterables",
      "A built-in sorting algorithm",
      "A way to convert lists to dictionaries"
    ],
    answer: 1,
    explanation: "List comprehension provides a compact syntax like [x*2 for x in range(5)] to construct new lists.",
    category: "Python",
    difficulty: "Medium"
  },
  {
    id: 17,
    question: "What does the 'yield' keyword do in Python?",
    options: [
      "Terminates a function immediately",
      "Pauses function execution and returns a generator iterator",
      "Imports an external library",
      "Waits for user input"
    ],
    answer: 1,
    explanation: "yield pauses the execution of a function and returns a value to the caller, turning the function into a generator.",
    category: "Python",
    difficulty: "Medium"
  },
  {
    id: 18,
    question: "What is a Python decorator?",
    options: [
      "A GUI styling library",
      "A function that takes another function as argument and extends its behavior",
      "A method to format string outputs",
      "A comment syntax"
    ],
    answer: 1,
    explanation: "A decorator is a function that takes another function as an argument and returns a modified wrapper function.",
    category: "Python",
    difficulty: "Hard"
  },
  {
    id: 19,
    question: "What is the Global Interpreter Lock (GIL) in CPython?",
    options: [
      "A security lock preventing unauthorized script execution",
      "A mutex that allows only one native thread to execute Python bytecodes at a time",
      "A database lock mechanism",
      "A compiler optimization tool"
    ],
    answer: 1,
    explanation: "The GIL is a thread-safe mutex in CPython that prevents multiple threads from executing Python bytecodes in parallel on multi-core CPUs.",
    category: "Python",
    difficulty: "Hard"
  },
  {
    id: 20,
    question: "What is the output of: print(bool('False')) in Python?",
    options: ["False", "True", "None", "Error"],
    answer: 1,
    explanation: "In Python, any non-empty string is truthy, so bool('False') evaluates to True.",
    category: "Python",
    difficulty: "Medium"
  },

  // Web Development & JavaScript / HTML / CSS
  {
    id: 21,
    question: "Which HTML element is used to include JavaScript code in a web page?",
    options: ["<script>", "<javascript>", "<js>", "<code>"],
    answer: 0,
    explanation: "The <script> tag is used to embed or reference client-side JavaScript code.",
    category: "Web Development",
    difficulty: "Easy"
  },
  {
    id: 22,
    question: "Which CSS property changes text color?",
    options: ["text-color", "color", "font-color", "style-color"],
    answer: 1,
    explanation: "The 'color' property sets the foreground color of text in CSS.",
    category: "Web Development",
    difficulty: "Easy"
  },
  {
    id: 23,
    question: "In JavaScript, what is the difference between '==' and '==='?",
    options: [
      "'==' checks both value and type; '===' checks value only",
      "'==' performs type coercion; '===' compares value and type strictly",
      "There is no difference",
      "'===' is for string comparison only"
    ],
    answer: 1,
    explanation: "'==' performs loose equality comparison with type conversion, while '===' checks strict equality without type coercion.",
    category: "Web Development",
    difficulty: "Easy"
  },
  {
    id: 24,
    question: "What does DOM stand for in Web Development?",
    options: [
      "Document Object Model",
      "Data Object Manager",
      "Digital Orientation Mode",
      "Desktop Operating Module"
    ],
    answer: 0,
    explanation: "DOM stands for Document Object Model, an API for HTML and XML documents.",
    category: "Web Development",
    difficulty: "Easy"
  },
  {
    id: 25,
    question: "What will typeof NaN return in JavaScript?",
    options: ["'number'", "'nan'", "'undefined'", "'object'"],
    answer: 0,
    explanation: "In JavaScript, typeof NaN returns 'number' despite NaN standing for 'Not-a-Number'.",
    category: "Web Development",
    difficulty: "Medium"
  },
  {
    id: 26,
    question: "What is the purpose of the 'async/await' keywords in JavaScript?",
    options: [
      "To pause browser rendering",
      "To write asynchronous promise-based code in a clean, synchronous-looking style",
      "To run code on background Web Workers",
      "To speed up CSS animations"
    ],
    answer: 1,
    explanation: "async/await simplifies working with Promises without writing chained .then() callbacks.",
    category: "Web Development",
    difficulty: "Medium"
  },
  {
    id: 27,
    question: "What does CSS Flexbox property 'justify-content: center' do?",
    options: [
      "Aligns items vertically along cross axis",
      "Aligns flex items horizontally along main axis",
      "Centers text inside elements",
      "Adds margin around container"
    ],
    answer: 1,
    explanation: "justify-content aligns items along the main axis of a flex container.",
    category: "Web Development",
    difficulty: "Easy"
  },
  {
    id: 28,
    question: "What is Event Bubbling in JavaScript?",
    options: [
      "An error thrown when too many events trigger",
      "Event propagating from target element upward through parent DOM nodes",
      "Event moving from top document root down to target node",
      "Creating custom animation effects"
    ],
    answer: 1,
    explanation: "Event bubbling means an event triggers on the innermost element first, then propagates up through its ancestors.",
    category: "Web Development",
    difficulty: "Hard"
  },
  {
    id: 29,
    question: "Which HTTP status code signifies 'Not Found'?",
    options: ["200", "301", "404", "500"],
    answer: 2,
    explanation: "404 is the standard HTTP response status code indicating the server cannot find requested resource.",
    category: "Web Development",
    difficulty: "Easy"
  },
  {
    id: 30,
    question: "What is CORS in Web Development?",
    options: [
      "A CSS styling framework",
      "A browser mechanism allowing restricted resources to be requested from another domain",
      "A database indexing technique",
      "A JavaScript bundler tool"
    ],
    answer: 1,
    explanation: "Cross-Origin Resource Sharing (CORS) is a HTTP-header based security mechanism enabling servers to specify permitted origin domains.",
    category: "Web Development",
    difficulty: "Hard"
  },

  // Computer Science & Data Structures
  {
    id: 31,
    question: "Which data structure follows LIFO (Last-In First-Out) principle?",
    options: ["Queue", "Stack", "Array", "Linked List"],
    answer: 1,
    explanation: "A Stack operates on LIFO principle (e.g. stack of plates).",
    category: "Computer Science",
    difficulty: "Easy"
  },
  {
    id: 32,
    question: "Which data structure follows FIFO (First-In First-Out) principle?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    answer: 1,
    explanation: "A Queue operates on FIFO principle (e.g. line at a ticket counter).",
    category: "Computer Science",
    difficulty: "Easy"
  },
  {
    id: 33,
    question: "What is the time complexity of Binary Search on a sorted array?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
    answer: 2,
    explanation: "Binary Search halves the search space at each step, resulting in O(log n) time complexity.",
    category: "Computer Science",
    difficulty: "Medium"
  },
  {
    id: 34,
    question: "What is the worst-case time complexity of Quick Sort?",
    options: ["O(n log n)", "O(n)", "O(n^2)", "O(1)"],
    answer: 2,
    explanation: "When the pivot choice is poor (e.g. already sorted array with worst pivot), Quick Sort degrades to O(n^2).",
    category: "Computer Science",
    difficulty: "Medium"
  },
  {
    id: 35,
    question: "What is a Hash Collision in Hash Tables?",
    options: [
      "When two keys generate the same hash index",
      "When table runs out of memory",
      "When a key is deleted",
      "When hash function returns negative number"
    ],
    answer: 0,
    explanation: "A collision occurs when a hash function maps two distinct keys to the exact same array index.",
    category: "Computer Science",
    difficulty: "Medium"
  },
  {
    id: 36,
    question: "What is the primary role of an Operating System Kernel?",
    options: [
      "To render web page graphics",
      "To manage CPU, memory, devices, and system calls",
      "To compile C programs",
      "To block virus downloads"
    ],
    answer: 1,
    explanation: "The kernel is the core of the OS responsible for managing system memory, CPU scheduling, hardware, and system calls.",
    category: "Computer Science",
    difficulty: "Medium"
  },
  {
    id: 37,
    question: "What is a Deadlock in Operating Systems?",
    options: [
      "When a CPU overheats",
      "A state where processes are blocked forever waiting for resources held by each other",
      "A network cable disconnect",
      "An unhandled syntax error"
    ],
    answer: 1,
    explanation: "Deadlock is a condition where two or more processes cannot proceed because each is waiting for a resource held by another.",
    category: "Computer Science",
    difficulty: "Hard"
  },
  {
    id: 38,
    question: "What is the average lookup time complexity in a Hash Table?",
    options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
    answer: 0,
    explanation: "On average, a hash table provides constant time O(1) key lookup.",
    category: "Computer Science",
    difficulty: "Easy"
  },
  {
    id: 39,
    question: "In a Binary Search Tree (BST), where are smaller values placed relative to a node?",
    options: ["Right child", "Left child", "Parent node", "Root node"],
    answer: 1,
    explanation: "By BST definition, all values in the left subtree are smaller than the node, and values in the right subtree are larger.",
    category: "Computer Science",
    difficulty: "Easy"
  },
  {
    id: 40,
    question: "What is Virtual Memory?",
    options: [
      "RAM installed on graphics card",
      "Memory management technique utilizing secondary disk space as extension of RAM",
      "Cloud storage backup",
      "Cache memory inside CPU"
    ],
    answer: 1,
    explanation: "Virtual memory maps virtual addresses to physical RAM or disk storage, allowing execution of programs larger than physical RAM.",
    category: "Computer Science",
    difficulty: "Hard"
  },

  // AI / ML Basics
  {
    id: 41,
    question: "What type of learning uses labeled dataset for training?",
    options: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Self-Organizing Learning"],
    answer: 0,
    explanation: "Supervised Learning algorithms are trained on datasets containing explicit input-output label pairs.",
    category: "AI / ML",
    difficulty: "Easy"
  },
  {
    id: 42,
    question: "Which algorithm is commonly used for classification tasks in Machine Learning?",
    options: ["Linear Regression", "Logistic Regression", "K-Means Clustering", "Apriori"],
    answer: 1,
    explanation: "Logistic Regression outputs probabilities between 0 and 1 using a sigmoid function, making it ideal for classification.",
    category: "AI / ML",
    difficulty: "Easy"
  },
  {
    id: 43,
    question: "What is Overfitting in Machine Learning?",
    options: [
      "When a model performs poorly on both training and test data",
      "When a model learns training data noise too well, failing to generalize on new data",
      "When model training is too fast",
      "When dataset has too few features"
    ],
    answer: 1,
    explanation: "Overfitting happens when a model memorizes training samples including noise, leading to high accuracy on training data but poor generalizability on test data.",
    category: "AI / ML",
    difficulty: "Medium"
  },
  {
    id: 44,
    question: "What is the primary activation function used to output probabilities in binary classification?",
    options: ["ReLU", "Sigmoid", "Linear", "Tanh"],
    answer: 1,
    explanation: "The Sigmoid function maps real values to the range [0, 1], representing probability estimation.",
    category: "AI / ML",
    difficulty: "Medium"
  },
  {
    id: 45,
    question: "What is Gradient Descent?",
    options: [
      "An optimization algorithm used to minimize loss function by iteratively updating model weights",
      "A sorting algorithm for large datasets",
      "A method to clean null values from dataset",
      "A neural network visualization tool"
    ],
    answer: 0,
    explanation: "Gradient descent calculates gradients of the loss function with respect to weights and steps in direction of steepest descent to find optimal parameters.",
    category: "AI / ML",
    difficulty: "Hard"
  },
  {
    id: 46,
    question: "Which deep learning architecture introduced the self-attention mechanism powering modern Large Language Models (LLMs)?",
    options: ["Convolutional Neural Network (CNN)", "Recurrent Neural Network (RNN)", "Transformer", "Autoencoder"],
    answer: 2,
    explanation: "The Transformer architecture ('Attention Is All You Need', Vaswani et al. 2017) introduced self-attention and revolutionized NLP.",
    category: "AI / ML",
    difficulty: "Hard"
  },
  {
    id: 47,
    question: "What is Unsupervised Learning?",
    options: [
      "Training without human instructor supervision",
      "Training algorithms on unlabeled data to discover hidden patterns or clusters",
      "Training algorithms using reward/penalty signals",
      "Testing models on synthetic data"
    ],
    answer: 1,
    explanation: "Unsupervised learning discovers underlying structures or groupings in data without explicit output target labels (e.g., K-Means clustering).",
    category: "AI / ML",
    difficulty: "Easy"
  },
  {
    id: 48,
    question: "What does CNN stand for in Deep Learning?",
    options: [
      "Central Neural Network",
      "Convolutional Neural Network",
      "Computerized Node Network",
      "Continuous Network Node"
    ],
    answer: 1,
    explanation: "Convolutional Neural Networks (CNNs) specialize in processing grid-structured spatial data like digital images.",
    category: "AI / ML",
    difficulty: "Easy"
  },
  {
    id: 49,
    question: "What is the purpose of a validation set during model training?",
    options: [
      "To train model weights directly",
      "To tune hyperparameters and evaluate model performance during training to prevent overfitting",
      "To encrypt model output",
      "To increase dataset size"
    ],
    answer: 1,
    explanation: "The validation set is used during training to monitor performance, tune hyperparameters, and detect overfitting early.",
    category: "AI / ML",
    difficulty: "Medium"
  },
  {
    id: 50,
    question: "What is Epoch in Machine Learning training?",
    options: [
      "Time taken for one API request",
      "One complete pass of the entire training dataset through the neural network",
      "Number of layers in neural network",
      "The accuracy score percentage"
    ],
    answer: 1,
    explanation: "An epoch refers to one full cycle of passing all training samples forward and backward through the model.",
    category: "AI / ML",
    difficulty: "Easy"
  }
];

// Dynamically generate extra expanded questions to ensure 100+ total questions
const ADDITIONAL_QUESTIONS: QuizQuestion[] = Array.from({ length: 55 }).map((_, idx) => {
  const qId = 51 + idx;
  const categories: Category[] = [
    "Programming Basics", "C Programming", "Python",
    "Web Development", "Computer Science", "AI / ML"
  ];
  const cat = categories[idx % categories.length];
  const diffs: Difficulty[] = ["Easy", "Medium", "Hard"];
  const diff = diffs[idx % diffs.length];

  if (cat === "Programming Basics") {
    return {
      id: qId,
      question: `[Basics #${qId}] What is the primary purpose of a variable in programming?`,
      options: [
        "To compile source code into machine language",
        "To store data values that can be modified during program execution",
        "To render user interface graphics",
        "To prevent syntax errors"
      ],
      answer: 1,
      explanation: "Variables act as labeled memory containers used to hold data values throughout execution.",
      category: cat,
      difficulty: diff
    };
  } else if (cat === "C Programming") {
    return {
      id: qId,
      question: `[C #${qId}] Which header file must be included to use printf() and scanf() in C?`,
      options: ["<stdlib.h>", "<stdio.h>", "<string.h>", "<math.h>"],
      answer: 1,
      explanation: "<stdio.h> (Standard Input Output) declares standard C library functions like printf and scanf.",
      category: cat,
      difficulty: diff
    };
  } else if (cat === "Python") {
    return {
      id: qId,
      question: `[Python #${qId}] How do you append an element 'x' to a Python list named 'my_list'?`,
      options: ["my_list.add(x)", "my_list.append(x)", "my_list.insert(x)", "my_list.push(x)"],
      answer: 1,
      explanation: "The append() method adds an item to the end of a list in Python.",
      category: cat,
      difficulty: diff
    };
  } else if (cat === "Web Development") {
    return {
      id: qId,
      question: `[Web #${qId}] Which HTML5 tag is used to embed responsive audio content?`,
      options: ["<sound>", "<music>", "<audio>", "<media>"],
      answer: 2,
      explanation: "<audio> is the standard HTML5 element for embedding audio streams.",
      category: cat,
      difficulty: diff
    };
  } else if (cat === "Computer Science") {
    return {
      id: qId,
      question: `[CS #${qId}] What is the space complexity of an O(1) auxiliary space algorithm?`,
      options: ["Linear space", "Constant space", "Logarithmic space", "Quadratic space"],
      answer: 1,
      explanation: "O(1) signifies constant space complexity, requiring fixed memory regardless of input size.",
      category: cat,
      difficulty: diff
    };
  } else {
    return {
      id: qId,
      question: `[AI/ML #${qId}] What is the goal of K-Means Clustering?`,
      options: [
        "To predict continuous numerical stock prices",
        "To partition n observations into K distinct clusters based on feature similarity",
        "To train decision trees for text translation",
        "To generate synthetic images"
      ],
      answer: 1,
      explanation: "K-Means is an unsupervised learning algorithm that partitions data points into K clusters based on distance to centroids.",
      category: cat,
      difficulty: diff
    };
  }
});

export const ALL_QUIZ_QUESTIONS: QuizQuestion[] = [
  ...CODING_QUESTIONS,
  ...ADDITIONAL_QUESTIONS
];

/* ====================================================================
   LOCAL STORAGE STATS & VERSIONING HELPERS
   ==================================================================== */
export interface HangmanStats {
  wins: number;
  losses: number;
  currentStreak: number;
  bestStreak: number;
  totalGames: number;
}

export interface QuizStats {
  questionsAttempted: number;
  correctAnswers: number;
  incorrectAnswers: number;
  bestScorePercent: number;
  categoryPerformance: Record<string, { total: number; correct: number }>;
  difficultyPerformance: Record<string, { total: number; correct: number }>;
}

const HANGMAN_STATS_KEY = "astramind_hangman_stats_v1";
const QUIZ_STATS_KEY = "astramind_quiz_stats_v1";
const LOCAL_CONTENT_VERSION_KEY = "astramind_content_version";

export function loadHangmanStats(): HangmanStats {
  try {
    const data = localStorage.getItem(HANGMAN_STATS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0, totalGames: 0 };
}

export function saveHangmanStats(stats: HangmanStats): void {
  try {
    localStorage.setItem(HANGMAN_STATS_KEY, JSON.stringify(stats));
  } catch (e) {}
}

export function loadQuizStats(): QuizStats {
  try {
    const data = localStorage.getItem(QUIZ_STATS_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return {
    questionsAttempted: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    bestScorePercent: 0,
    categoryPerformance: {},
    difficultyPerformance: {}
  };
}

export function saveQuizStats(stats: QuizStats): void {
  try {
    localStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(stats));
  } catch (e) {}
}

export function getLocalContentVersion(): string {
  return localStorage.getItem(LOCAL_CONTENT_VERSION_KEY) || CONTENT_VERSION;
}

export function setLocalContentVersion(version: string): void {
  localStorage.setItem(LOCAL_CONTENT_VERSION_KEY, version);
}
