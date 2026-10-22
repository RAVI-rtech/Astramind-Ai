import { VitsBranch, AcademicYear, AcademicSemester } from "../types/academicQuiz";

export const VITS_COLLEGE_NAME = "Vignan Institute of Technology and Science";
// Verified official VITS syllabus page (the live site currently serves it from this subdomain).
export const VITS_OFFICIAL_WEBSITE_URL = "https://vignanits.ac.in/";
export const VITS_SYLLABUS_URL = "https://mail.vignanits.ac.in/academics/syllabus.php";

export const VITS_BRANCHES: VitsBranch[] = [
  "Computer Science and Engineering (CSE)",
  "CSE (Artificial Intelligence & Machine Learning)",
  "CSE (Data Science)",
  "Information Technology",
  "Artificial Intelligence & Machine Learning (AI&ML)",
  "Artificial Intelligence & Data Science (AI&DS)",
  "Electronics and Communication Engineering (ECE)",
  "Electronics and Instrumentation Engineering (EIE)",
  "Electrical and Electronics Engineering (EEE)",
  "Mechanical Engineering (ME)",
  "Civil Engineering (CE)",
];

export const VITS_YEARS: AcademicYear[] = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
];

export const VITS_SEMESTERS: AcademicSemester[] = [
  "Semester I",
  "Semester II",
];

// Common 1st Year subjects across engineering streams
const FIRST_YEAR_SUBJECTS: Record<AcademicSemester, string[]> = {
  "Semester I": [
    "Linear Algebra & Calculus (Mathematics-I)",
    "Applied Physics",
    "Programming for Problem Solving (C Language)",
    "Basic Electrical Engineering",
    "Engineering Graphics & Computer Aided Drafting",
    "Environmental Science",
  ],
  "Semester II": [
    "Advanced Calculus & Numerical Methods (Mathematics-II)",
    "Engineering Chemistry",
    "Data Structures through C",
    "Basic Electronics Engineering",
    "English for Skill Enhancement",
    "Python Programming Fundamentals",
  ],
};

// Curriculum mapped by Branch -> Year -> Semester
type BranchCurriculum = Record<
  AcademicYear,
  Record<AcademicSemester, string[]>
>;

const CURRICULUM_DATABASE: Record<string, BranchCurriculum> = {
  // CSE / IT / Computing Streams
  CSE: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Data Structures & Algorithms (DSA)",
        "Discrete Mathematics",
        "Digital Logic Design & Computer Organization",
        "Object Oriented Programming through Java",
        "Python Programming",
      ],
      "Semester II": [
        "Database Management Systems (DBMS)",
        "Operating Systems (OS)",
        "Software Engineering",
        "Design and Analysis of Algorithms (DAA)",
        "Formal Languages & Automata Theory (FLAT)",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Computer Networks (CN)",
        "Compiler Design",
        "Web Technologies",
        "Artificial Intelligence (AI)",
        "Data Warehousing and Data Mining",
      ],
      "Semester II": [
        "Machine Learning (ML)",
        "Cryptography & Network Security (CNS)",
        "Cloud Computing",
        "Software Testing Methodologies",
        "Full Stack Web Development",
      ],
    },
    "4th Year": {
      "Semester I": [
        "Deep Learning & Neural Networks",
        "DevOps & Continuous Integration",
        "Internet of Things (IoT)",
        "Information Security & Cyber Laws",
        "Mobile Application Development",
      ],
      "Semester II": [
        "Distributed Systems & Cloud Architecture",
        "Blockchain Technology",
        "Industrial Management & Entrepreneurship",
        "Technical Seminar & Comprehensive Viva",
      ],
    },
  },

  // CSE (AI & ML) and AI&ML
  AIML: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Mathematical Foundations for Data Science & AI",
        "Data Structures & Algorithms",
        "Object Oriented Programming through Python",
        "Digital Logic & Computer Architecture",
        "Applied Probability and Statistics",
      ],
      "Semester II": [
        "Database Management Systems (DBMS)",
        "Operating Systems",
        "Design and Analysis of Algorithms",
        "Introduction to Artificial Intelligence",
        "Software Engineering Principles",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Machine Learning Fundamentals",
        "Computer Networks",
        "Optimization Techniques for AI",
        "Knowledge Representation and Reasoning",
        "Data Mining & Feature Engineering",
      ],
      "Semester II": [
        "Deep Learning Architectures",
        "Natural Language Processing (NLP)",
        "Computer Vision",
        "Reinforcement Learning",
        "Cloud Infrastructure for AI",
      ],
    },
    "4th Year": {
      "Semester I": [
        "Generative AI & LLM Architectures",
        "AI Ethics, Explainability & Governance",
        "Edge AI & IoT Systems",
        "Big Data Systems for Machine Learning",
      ],
      "Semester II": [
        "Autonomous Systems & Robotics",
        "MLOps & Scalable Model Deployment",
        "Capstone Project Technical Viva",
      ],
    },
  },

  // CSE (Data Science) and AI&DS
  DS: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Statistical Methods & Linear Algebra for Data Science",
        "Data Structures & Algorithms",
        "Python for Data Analysis & Visualization",
        "Discrete Mathematics",
        "Computer Organization",
      ],
      "Semester II": [
        "Database Management Systems & SQL",
        "Operating Systems",
        "Exploratory Data Analysis (EDA)",
        "Design and Analysis of Algorithms",
        "R Programming for Data Analytics",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Data Warehousing & Business Intelligence",
        "Computer Networks",
        "Statistical Machine Learning",
        "Big Data Analytics (Hadoop & Spark)",
        "Data Mining Techniques",
      ],
      "Semester II": [
        "Deep Learning for Analytics",
        "Time Series Analysis & Forecasting",
        "Cloud Data Engineering (GCP / AWS)",
        "Data Privacy, Security & Ethics",
        "Predictive Modeling",
      ],
    },
    "4th Year": {
      "Semester I": [
        "Data Visualization & Storytelling (PowerBI / Tableau)",
        "Natural Language Processing for Analytics",
        "High Performance Computing for Data Science",
        "Cyber Analytics",
      ],
      "Semester II": [
        "Data Science in Business & FinTech",
        "Data Engineering Pipelines & Kafka",
        "Capstone Analytics Project Viva",
      ],
    },
  },

  // Information Technology
  IT: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Data Structures & Algorithms",
        "Discrete Mathematics",
        "Digital Electronics & Microprocessors",
        "Object Oriented Programming through Java",
        "Python Programming",
      ],
      "Semester II": [
        "Database Management Systems",
        "Operating Systems",
        "Design and Analysis of Algorithms",
        "Computer Organization & Architecture",
        "Software Engineering",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Computer Networks",
        "Web Technologies",
        "Information Security",
        "Automata and Compiler Design",
        "Data Mining",
      ],
      "Semester II": [
        "Cloud Computing",
        "Mobile Application Development",
        "Software Testing & Quality Assurance",
        "Machine Learning",
        "E-Commerce & Digital Marketing",
      ],
    },
    "4th Year": {
      "Semester I": [
        "DevOps & Virtualization",
        "Internet of Things (IoT)",
        "Cyber Forensics & Incident Response",
        "Human Computer Interaction (HCI)",
      ],
      "Semester II": [
        "Distributed Systems",
        "Enterprise Architecture",
        "Technical Seminar & Project Viva",
      ],
    },
  },

  // Electronics and Communication Engineering (ECE)
  ECE: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Electronic Devices and Circuits (EDC)",
        "Signals and Systems",
        "Network Analysis and Synthesis",
        "Digital System Design (DSD)",
        "Probability Theory and Stochastic Processes",
      ],
      "Semester II": [
        "Analog and Pulse Circuits",
        "Electromagnetic Waves and Transmission Lines (EMTL)",
        "Analog Communications",
        "Linear and Digital IC Applications (LDIC)",
        "Control Systems",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Digital Signal Processing (DSP)",
        "Microprocessors and Microcontrollers (MPMC)",
        "Digital Communications",
        "Antennas and Wave Propagation",
        "Electronic Measurements and Instrumentation",
      ],
      "Semester II": [
        "VLSI Design",
        "Microwave Engineering",
        "Optical Fiber Communications",
        "Embedded Systems and RTOS",
        "Digital Image Processing",
      ],
    },
    "4th Year": {
      "Semester I": [
        "Cellular and Mobile Communications",
        "Radar Systems and Satellite Communications",
        "Wireless Sensor Networks",
        "IoT & Industrial Automation",
      ],
      "Semester II": [
        "Low Power VLSI Design",
        "Bio-Medical Instrumentation",
        "Technical Seminar & Project Viva",
      ],
    },
  },

  // Electronics and Instrumentation Engineering (EIE)
  EIE: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Electronic Devices and Circuits",
        "Transducers and Sensors",
        "Network Theory",
        "Signals and Systems",
        "Electrical Measurements",
      ],
      "Semester II": [
        "Linear Integrated Circuits & Applications",
        "Industrial Instrumentation",
        "Control Systems",
        "Digital System Design",
        "Principles of Communication",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Microprocessors and Microcontrollers",
        "Process Control Instrumentation",
        "Digital Signal Processing",
        "Optoelectronic Instrumentation",
        "Biomedical Instrumentation",
      ],
      "Semester II": [
        "PLC and SCADA Systems",
        "VLSI Design",
        "Analytical Instrumentation",
        "Power Plant Instrumentation",
        "Virtual Instrumentation (LabVIEW)",
      ],
    },
    "4th Year": {
      "Semester I": [
        "Robotics and Automation",
        "Industrial Data Networks & Fieldbus",
        "MEMS and Nanotechnology",
        "Smart Sensors & IoT",
      ],
      "Semester II": [
        "Safety Instrumented Systems",
        "Instrumentation in Petrochemical Industries",
        "Technical Seminar & Project Viva",
      ],
    },
  },

  // Electrical and Electronics Engineering (EEE)
  EEE: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Electrical Circuit Analysis",
        "DC Machines and Transformers",
        "Electromagnetic Fields (EMF)",
        "Electrical and Electronics Measurements",
        "Analog Electronics",
      ],
      "Semester II": [
        "AC Machines (Induction & Synchronous)",
        "Power Systems - I (Generation & Transmission)",
        "Control Systems",
        "Digital Electronics",
        "Power Electronics",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Power Systems - II (Analysis & Stability)",
        "Microprocessors and Interfacing",
        "Power Semiconductor Drives",
        "High Voltage Engineering",
        "Signals and Systems",
      ],
      "Semester II": [
        "Power System Protection",
        "Power System Operation and Control",
        "Renewable Energy Sources & Grid Integration",
        "Digital Signal Controllers",
        "Electric Vehicle Technology",
      ],
    },
    "4th Year": {
      "Semester I": [
        "Smart Grid Technologies",
        "Flexible AC Transmission Systems (FACTS)",
        "Power Quality and Harmonics",
        "Electrical Distribution Systems",
      ],
      "Semester II": [
        "Utilization of Electrical Energy",
        "Energy Management and Auditing",
        "Technical Seminar & Comprehensive Viva",
      ],
    },
  },

  // Mechanical Engineering (ME)
  ME: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Mechanics of Solids (Strength of Materials)",
        "Engineering Thermodynamics",
        "Fluid Mechanics and Hydraulic Machines",
        "Metallurgy and Material Science",
        "Manufacturing Processes",
      ],
      "Semester II": [
        "Kinematics of Machinery (KOM)",
        "Thermal Engineering - I",
        "Machine Drawing & GD&T",
        "Applied Thermodynamics",
        "Instrumentation and Control Systems",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Dynamics of Machinery (DOM)",
        "Design of Machine Elements - I",
        "Metrology and Machine Tools",
        "Thermal Engineering - II",
        "Computer Aided Design and Manufacturing (CAD/CAM)",
      ],
      "Semester II": [
        "Design of Machine Elements - II",
        "Heat Transfer",
        "Finite Element Methods (FEM)",
        "Refrigeration and Air Conditioning (RAC)",
        "Operations Research",
      ],
    },
    "4th Year": {
      "Semester I": [
        "Automobile Engineering",
        "Computational Fluid Dynamics (CFD)",
        "Robotics and Industrial Automation",
        "Power Plant Engineering",
        "Total Quality Management (TQM)",
      ],
      "Semester II": [
        "Additive Manufacturing (3D Printing)",
        "Renewable Energy Systems",
        "Technical Seminar & Project Viva",
      ],
    },
  },

  // Civil Engineering (CE)
  CE: {
    "1st Year": FIRST_YEAR_SUBJECTS,
    "2nd Year": {
      "Semester I": [
        "Surveying and Geomatics",
        "Strength of Materials - I",
        "Fluid Mechanics",
        "Building Materials and Construction",
        "Engineering Geology",
      ],
      "Semester II": [
        "Strength of Materials - II",
        "Hydraulics and Hydraulic Machinery",
        "Structural Analysis - I",
        "Concrete Technology",
        "Environmental Engineering - I",
      ],
    },
    "3rd Year": {
      "Semester I": [
        "Structural Analysis - II",
        "Design of Reinforced Concrete Structures (RCC)",
        "Geotechnical Engineering (Soil Mechanics)",
        "Transportation Engineering - I",
        "Water Resources Engineering - I",
      ],
      "Semester II": [
        "Design of Steel Structures",
        "Foundation Engineering",
        "Environmental Engineering - II",
        "Estimation, Costing and Project Management",
        "Remote Sensing and GIS",
      ],
    },
    "4th Year": {
      "Semester I": [
        "Advanced Structural Design",
        "Earthquake Resistant Design of Structures",
        "Traffic Engineering and Road Safety",
        "Pavement Design and Maintenance",
        "Ground Improvement Techniques",
      ],
      "Semester II": [
        "Prestressed Concrete Structures",
        "Urban Planning and Smart Cities",
        "Technical Seminar & Project Viva",
      ],
    },
  },
};

export function getVitsSubjects(
  branch: VitsBranch,
  year: AcademicYear,
  semester: AcademicSemester
): string[] {
  let key = "CSE";

  if (branch.includes("Artificial Intelligence & Machine Learning") || branch.includes("AI&ML")) {
    key = "AIML";
  } else if (branch.includes("Data Science") || branch.includes("AI&DS")) {
    key = "DS";
  } else if (branch.includes("Information Technology")) {
    key = "IT";
  } else if (branch.includes("Electronics and Communication Engineering")) {
    key = "ECE";
  } else if (branch.includes("Electronics and Instrumentation")) {
    key = "EIE";
  } else if (branch.includes("Electrical and Electronics")) {
    key = "EEE";
  } else if (branch.includes("Mechanical")) {
    key = "ME";
  } else if (branch.includes("Civil")) {
    key = "CE";
  }

  const branchData = CURRICULUM_DATABASE[key] || CURRICULUM_DATABASE["CSE"];
  const yearData = branchData[year] || branchData["1st Year"];
  return yearData[semester] || FIRST_YEAR_SUBJECTS[semester];
}
