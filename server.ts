import express from "express";
import path from "path";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { createRequire } from "module";

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  // 1. Try using the direct PDFParse class from mehmet-kozan's pdf-parse package (v2+)
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    if (result && typeof result.text === "string") {
      console.log(`[Parser] Successfully parsed PDF using PDFParse class. Extracted ${result.text.length} characters.`);
      return result.text;
    }
  } catch (err) {
    console.warn("[Parser] PDFParse class direct instantiation failed:", err);
  }

  // 2. Try ESM dynamic import fallback
  try {
    const dynamicModule = (await import("pdf-parse")) as any;
    const ParserClass = dynamicModule.PDFParse || dynamicModule.default?.PDFParse || dynamicModule.default;
    if (typeof ParserClass === "function") {
      try {
        const parserInstance = new ParserClass({ data: new Uint8Array(buffer) });
        const result = await parserInstance.getText();
        if (result && typeof result.text === "string") {
          return result.text;
        }
      } catch (ctorErr) {
        // Fallback for older functional pdf-parse versions just in case
        const result = await ParserClass(buffer);
        if (result && typeof result.text === "string") {
          return result.text;
        }
      }
    }
  } catch (err) {
    console.warn("[Parser] Dynamic import parsing failed:", err);
  }

  // 3. Try CommonJS createRequire fallback
  try {
    const requireCustom = createRequire(import.meta.url);
    const requiredModule = requireCustom("pdf-parse");
    const ParserClass = requiredModule.PDFParse || requiredModule.default?.PDFParse || requiredModule;
    if (typeof ParserClass === "function") {
      try {
        const parserInstance = new ParserClass({ data: new Uint8Array(buffer) });
        const result = await parserInstance.getText();
        if (result && typeof result.text === "string") {
          return result.text;
        }
      } catch (ctorErr) {
        const result = await ParserClass(buffer);
        if (result && typeof result.text === "string") {
          return result.text;
        }
      }
    }
  } catch (err) {
    console.error("[Parser] CommonJS require parsing failed:", err);
  }

  throw new Error("Unable to resolve a valid PDF parsing function or class on this platform.");
}
import mammoth from "mammoth";
import OpenAI from "openai";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Load environment variables if in local dev
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON payload size limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setup multer in-memory storage for resume document uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Lazy client initializations
let openaiClient: OpenAI | null = null;

function isValidApiKey(key: string | undefined): boolean {
  if (!key) return false;
  let clean = key.trim();
  // Remove wrapping quotes if present
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  if (!clean) return false;
  
  // Strip non-alphanumeric characters to thoroughly check against placeholders
  const superClean = clean.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (
    superClean === "undefined" ||
    superClean === "null" ||
    superClean === "" ||
    superClean.includes("placeholder") ||
    superClean.includes("myopenaiapi") ||
    superClean.includes("youropenaiapi") ||
    superClean.includes("yourapikey") ||
    superClean.includes("yourkey") ||
    superClean.includes("enterkey") ||
    superClean.includes("enterapi") ||
    superClean.includes("yourcredentials") ||
    superClean.includes("dummykey") ||
    superClean.includes("testkey")
  ) {
    return false;
  }
  
  // Real active keys should be at least 15 characters long
  if (clean.length < 15) return false;
  return true;
}

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!isValidApiKey(apiKey)) {
    return null;
  }
  let clean = apiKey!.trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: clean });
  }
  return openaiClient;
}

// Low-level helper to generate text using ONLY OpenAI with gpt-4o-mini
async function requestAICompletion(prompt: string, systemInstruction?: string, jsonMode: boolean = false): Promise<string> {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }

  console.log("[AI Service] Querying OpenAI (gpt-4o-mini)...");
  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    response_format: jsonMode ? { type: "json_object" } : undefined,
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || "";
}

// Fixed JSON parsing safely: cleans markdown tags and extracts JSON bounded by braces
function cleanAndParseJSON(aiResponse: string): any {
  if (!aiResponse) {
    throw new Error("AI returned an empty response.");
  }
  
  // Clean markdown blocks
  let clean = aiResponse
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
    
  // Extract JSON object safely if there is extra/accidental conversation around it
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  
  try {
    return JSON.parse(clean);
  } catch (err: any) {
    console.error("[JSON Parser Error] Raw AI response:", aiResponse);
    console.error("[JSON Parser Error] Cleaned block:", clean);
    throw new Error(`Failed to safely parse AI JSON response: ${err.message}`);
  }
}

// Sandbox high-fidelity offline helpers
function fallbackResumeParse(extractedText: string): any {
  const emailMatch = extractedText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = extractedText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const lines = extractedText.split("\n").map(l => l.trim()).filter(Boolean);
  
  // Try to find a human name on early non-empty lines
  let name = "";
  for (const line of lines) {
    if (line.length > 3 && line.length < 35 && !line.includes("@") && !line.includes("http") && !/\d/.test(line)) {
      name = line;
      break;
    }
  }
  if (!name) name = "Candidate Name";

  // Build basic structure
  return {
    personalInfo: {
      name,
      email: emailMatch ? emailMatch[0] : "candidate@example.com",
      phone: phoneMatch ? phoneMatch[0] : "+1 (555) 019-2834",
      website: "",
      github: "github.com/profile",
      linkedin: "linkedin.com/in/profile",
      location: "San Francisco, CA",
      jobTitle: "Software Engineer"
    },
    summary: "Highly motivated Software Engineer specializing in scalable web interfaces and robust, high-performance web systems. Eager to align accomplishments with dynamic team settings and industry best practices.",
    skills: ["React", "TypeScript", "Node.js", "RESTful APIs", "Git & GitHub", "HTML5 & Tailwind CSS", "Jest", "CI/CD Orchestration"],
    experience: [
      {
        id: "exp_1",
        company: "TechSolutions Inc.",
        position: "Full-Stack Developer",
        startDate: "2023",
        endDate: "Present",
        location: "Oakland, CA",
        description: [
          "Developed high-throughput React context structures and integrated them with Restful endpoints, boosting response metrics of the core analytics panel.",
          "Collaborated with project leads to map layout design concepts into clean, maintainable Tailwind CSS grids.",
          "Sustained core localized coverages using Jest and testing tools to drive overall framework reliability."
        ]
      }
    ],
    projects: [
      {
        id: "proj_1",
        title: "Dynamic Cloud Ledger Engine",
        role: "Frontend Architect",
        startDate: "2024",
        endDate: "2024",
        url: "",
        description: [
          "Refactored resource components into dynamic split modules, accelerating package launch metrics.",
          "Constructed offline resilience routines ensuring reliable cache delivery across slow connections."
        ]
      }
    ],
    education: [
      {
        id: "edu_1",
        school: "State University",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        startDate: "2019",
        endDate: "2023",
        location: "USA",
        gpa: "3.7"
      }
    ],
    certifications: []
  };
}

function fallbackATSAnalysis(resumeData: any, jobDescription: string): any {
  const jdLower = jobDescription.toLowerCase();
  
  // Basic heuristic keyword check against high-demand keywords
  const targetKeywords = [
    "react", "typescript", "node", "aws", "docker", "kubernetes", "python", "golang", 
    "redux", "graphql", "sql", "nosql", "ci/cd", "agile", "scrum", "tailwind", 
    "next.js", "vue", "testing", "security", "ci/cd orchestration"
  ];
  
  const matched: string[] = [];
  const missing: string[] = [];
  
  const resumeStr = JSON.stringify(resumeData).toLowerCase();
  
  targetKeywords.forEach(keyword => {
    if (jdLower.includes(keyword)) {
      if (resumeStr.includes(keyword)) {
        matched.push(keyword.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
      } else {
        missing.push(keyword.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "));
      }
    }
  });

  const missingKeywords = missing.length > 0 ? missing : ["CI/CD Deliveries", "Cloud Infrastructure"];
  const matchedKeywords = matched.length > 0 ? matched : ["Web Design Fundamentals", "Modern Scripting"];
  const suggestedKeywords = missingKeywords.map(k => `${k} Best Practices`);
  
  const score = Math.max(55, Math.min(92, 62 + matchedKeywords.length * 6 - missingKeywords.length * 3));
  
  return {
    matchScore: score,
    matchingPercentage: score,
    missingKeywords,
    suggestedKeywords,
    matchedKeywords,
    weakSections: [
      {
        section: "Professional Summary",
        findings: "The professional summary lacks specific objective quantifiers and keywords matching descriptions.",
        correction: "Rewrite the summary to highlight core technical elements and targeted impact statement."
      },
      {
        section: "Experience Section",
        findings: "Bullet points are task-focused rather than stating business or engineering metrics.",
        correction: "Insert realistic measurable percentage markers or latency improvements under existing list accomplishments."
      }
    ],
    recommendations: [
      "Detail your integration methods with frameworks such as " + missingKeywords.slice(0, 3).join(", ") + " directly in your Experience description.",
      "Expand lists with metric impact tags such as processing delay dropoffs or load time improvements.",
      "Consolidate engineering skills in high-contrast scannable tags."
    ],
    jobTitleMatch: jdLower.includes((resumeData?.personalInfo?.jobTitle || "").toLowerCase()) || matchedKeywords.length > 2,
    overallSummary: "Your resume represents strong fundamental alignment. However, integrating exact recruiter terms matching the job posting keywords will considerably improve your ATS score."
  };
}

function fallbackATSEnhancement(resumeData: any, jobDescription: string, analysisResult: any): any {
  const enhanced = JSON.parse(JSON.stringify(resumeData));
  
  // Append missing keywords from analysisResult to skills
  const missing = analysisResult?.missingKeywords || [];
  if (missing.length > 0) {
    if (!enhanced.skills) enhanced.skills = [];
    missing.forEach((m: string) => {
      const canonical = m.trim();
      if (canonical && !enhanced.skills.some((s: string) => s.toLowerCase() === canonical.toLowerCase())) {
        enhanced.skills.push(canonical);
      }
    });
  }
  
  // Integrate standard percentage improvements to Experience bullet points
  if (enhanced.experience && Array.isArray(enhanced.experience)) {
    enhanced.experience = enhanced.experience.map((exp: any, index: number) => {
      const bullets = exp.description || [];
      const upgradedBullets = bullets.map((bullet: string, bIndex: number) => {
        if (bIndex === 0 && !bullet.includes("%") && !bullet.includes("latency")) {
          return `${bullet.replace(/\.$/, "")}, enhancing application load responsiveness by 24% and streamlining overall framework rendering flow.`;
        }
        if (bIndex === 1 && !bullet.includes("%") && !bullet.includes("$")) {
          return `${bullet.replace(/\.$/, "")}, optimizing developer resource consumption by over 18% in high-frequency states.`;
        }
        return bullet;
      });
      return {
        ...exp,
        description: upgradedBullets && upgradedBullets.length > 0 ? upgradedBullets : ["Engineered modular and highly responsive full-stack features, optimizing rendering metrics by 20%."]
      };
    });
  }
  
  // Professionalize summary
  const currentTitle = enhanced.personalInfo?.jobTitle || "Software Engineer";
  enhanced.summary = `Results-oriented ${currentTitle} with verified technical expertise in implementing highly performant systems and responsive application frameworks. Proven record of utilizing optimal patterns to streamline rendering velocities and boost infrastructure performance by up to 30%. Highly proficient in ${enhanced.skills.slice(0, 6).join(", ")}.`;
  
  return enhanced;
}

// API Routes

// Health check and provider status
app.get("/api/status", (req, res) => {
  const hasOpenAI = !!getOpenAI();
  res.json({
    hasOpenAI,
    hasGemini: false,
    isDemoMode: !hasOpenAI,
    activeProvider: hasOpenAI ? "OpenAI" : "Sandbox Heuristic AI",
  });
});

// 1. Upload & Parse document
app.post("/api/parse-resume", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file was uploaded." });
      return;
    }

    const file = req.file;
    const extension = path.extname(file.originalname).toLowerCase();
    let extractedText = "";

    console.log(`[Parser] Processing file: ${file.originalname} (${file.size} bytes)`);

    if (extension === ".pdf") {
      extractedText = await parsePdfBuffer(file.buffer);
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else if (extension === ".txt" || extension === ".json") {
      extractedText = file.buffer.toString("utf-8");
    } else {
      res.status(400).json({ error: "Unsupported file format. Please upload PDF, DOCX, TXT, or JSON." });
      return;
    }

    if (!extractedText || extractedText.trim() === "") {
      res.status(400).json({ error: "We couldn't extract any readable text from this document. Please ensure it is not scanned or empty." });
      return;
    }

    const hasOpenAI = !!getOpenAI();
    let resumeData = {};
    let isDemoMode = !hasOpenAI;

    if (isDemoMode) {
      console.log("[Parser API] Running in Demo Sandbox fallback mode");
      resumeData = fallbackResumeParse(extractedText);
    } else {
      try {
        const systemInstruction = 
          "You are a professional resume parsing engine. Your job is to extract resume text under headings and structure it into clean JSON matching the following schema precisely. Avoid inventing things, only restructure what is mentioned in the text. Return proper empty arrays/objects if not found instead of placeholders.";

        const prompt = `
        Extract and parse the following resume plain text into a structured JSON object.

        ### SCHEMA EXPECTED:
        {
          "personalInfo": {
            "name": "full name or \"\"",
            "email": "email or \"\"",
            "phone": "phone number or \"\"",
            "website": "website link or \"\"",
            "github": "github link or \"\"",
            "linkedin": "linkedin profile url or \"\"",
            "location": "city, state or address or \"\"",
            "jobTitle": "current or headline job title"
          },
          "summary": "professional summary or profile statement",
          "skills": ["Array of extracted skills naturally split"],
          "experience": [
            {
              "id": "exp_unique_id",
              "company": "company name",
              "position": "job title",
              "startDate": "start date/year",
              "endDate": "end date/year or Present",
              "location": "location of company or \"\"",
              "description": ["bullet point 1 describing achievements", "bullet point 2"]
            }
          ],
          "projects": [
            {
              "id": "proj_unique_id",
              "title": "project title",
              "role": "role on project or \"\"",
              "startDate": "dates",
              "endDate": "dates",
              "url": "link or \"\"",
              "description": ["bullet point 1", "bullet point 2"]
            }
          ],
          "education": [
            {
              "id": "edu_unique_id",
              "school": "school name",
              "degree": "degree, e.g. B.S.",
              "fieldOfStudy": "field / major",
              "startDate": "start year/date",
              "endDate": "end year/date",
              "location": "location of school or \"\"",
              "gpa": "gpa if mentioned or \"\""
            }
          ],
          "certifications": ["list of certificates if specified or empty array"]
        }

        ### RAW RESUME TEXT TO PARSE:
        ${extractedText}
        `;

        const aiResponse = await requestAICompletion(prompt, systemInstruction, true);
        resumeData = cleanAndParseJSON(aiResponse);
      } catch (err: any) {
        console.warn("[Parser API Error] LLM parsing execution failed. Gracefully falling back to Sandbox:", err.message);
        isDemoMode = true;
        resumeData = fallbackResumeParse(extractedText);
      }
    }

    res.json({
      fileName: file.originalname,
      rawText: extractedText,
      resumeData,
      isDemoMode,
    });

  } catch (error: any) {
    console.error("[Parser Error]", error);
    res.status(500).json({ error: error.message || "Failed to parse document text" });
  }
});

// 2. Perform ATS Score and Complete Keyword Match Analysis
app.post("/api/analyze-ats", async (req, res) => {
  try {
    const { resumeData, jobDescription } = req.body;

    if (!resumeData) {
      res.status(400).json({ error: "Missing resumeData in request body." });
      return;
    }
    if (!jobDescription || jobDescription.trim() === "") {
      res.status(400).json({ error: "Please enter a Job Description to perform ATS analysis." });
      return;
    }

    const hasOpenAI = !!getOpenAI();
    let analysisResult = {};
    let isDemoMode = !hasOpenAI;

    if (isDemoMode) {
      console.log("[ATS Analyst] Running in Demo Sandbox fallback mode");
      analysisResult = fallbackATSAnalysis(resumeData, jobDescription);
    } else {
      try {
        const systemInstruction = 
          "You are an advanced Professional Recruiter-quality ATS (Applicant Tracking System) Scanner. You evaluate resumes against Job Descriptions strictly, identify alignment, calculate exact match score percentage, find critical missing keywords from the job description, suggest recommended skills, and audit weak sections of the resume. Your response MUST be valid JSON matching the specified schema exactly.";

        const prompt = `
        Perform a complete ATS scan on this Resume against the provided Job Description.

        ### RESUME DESIGN OBJECT:
        ${JSON.stringify(resumeData, null, 2)}

        ### JOB DESCRIPTION:
        ${jobDescription}

        ### ANALYSIS SCHEMA REQUIRED (Your entire response must be this JSON object only):
        {
          "matchScore": 75, // Exact integer evaluation from 0 to 100 based on core match parameters
          "matchingPercentage": 75, // Matches the score
          "missingKeywords": ["keyword1", "keyword2"], // Important search terms, technical terms, frameworks, tools from the job description missing or under-described in resume
          "suggestedKeywords": ["suggested1", "suggested2"], // Highly relevant keywords to add to increase ranking
          "matchedKeywords": ["matched1", "matched2"], // Keywords from job description already successfully in resume
          "weakSections": [
            {
              "section": "Experience", // Section name
              "findings": "Detail why this section falls short in ATS terms (e.g., lacks metrics, action verbs)",
              "correction": "Actionable way to fix this section"
            }
          ],
          "recommendations": [
            "First major strategic layout/content recommendation",
            "Second major recommendation",
            "Third alignment tip"
          ],
          "jobTitleMatch": true, // Whether current jobTitle aligns with job description role
          "overallSummary": "An executive summary of how well the candidate aligns with the role, highlighting main strengths and red flags."
        }
        `;

        const aiResponse = await requestAICompletion(prompt, systemInstruction, true);
        analysisResult = cleanAndParseJSON(aiResponse);
      } catch (err: any) {
        console.warn("[ATS Analyst API Error] LLM analysis execution failed. Gracefully falling back to Sandbox:", err.message);
        isDemoMode = true;
        analysisResult = fallbackATSAnalysis(resumeData, jobDescription);
      }
    }

    res.json({
      ...analysisResult,
      isDemoMode,
    });

  } catch (error: any) {
    console.error("[Analyze Error]", error);
    res.status(500).json({ error: error.message || "Failed to scan resume" });
  }
});

// 3. Enhance with AI (Summary rewrite, naturally append missing skills, recruiter-quality experience statements, percentage impact)
app.post("/api/enhance-ats", async (req, res) => {
  try {
    const { resumeData, jobDescription, analysisResult } = req.body;

    if (!resumeData) {
      res.status(400).json({ error: "Missing resumeData in request body." });
      return;
    }
    if (!jobDescription || jobDescription.trim() === "") {
      res.status(400).json({ error: "Please paste a job description to optimize the resume against." });
      return;
    }

    const hasOpenAI = !!getOpenAI();
    let enhancedResume = {};
    let isDemoMode = !hasOpenAI;

    if (isDemoMode) {
      console.log("[ATS Enhancer] Running in Demo Sandbox fallback mode");
      enhancedResume = fallbackATSEnhancement(resumeData, jobDescription, analysisResult);
    } else {
      try {
        const systemInstruction = 
          "You are a stellar executive Resume Writer and ATS Optimization expert. Your goal is to improve the provided resume so it receives a high score, without inventing fictitious job titles, employers, schools, or credentials. Reword existing descriptions to have greater business impact, higher professional tone, recruiter terminology, and keywords naturally integrated. Return ONLY valid JSON containing the updated resumeData object.";

        const prompt = `
        Improve and rewrite specific sections of this candidate resume to match the Job Description.

        ### RULES FOR ENHANCEMENT:
        1. Professional Summary: Re-write completely to address core qualifications of the job description. Highlight experience, key skills, and passion for the specific field. Make it extremely compelling.
        2. Skills: Naturally insert missing skills from the Job Description / Analysis without duplicate keywords or chaotic stuffing. Create a comprehensive, clean array.
        3. Experience Bullet Points: Improve descriptions using recruiter-quality language. Add action verbs (e.g., spearheaded, engineered, optimized, orchestrated), and insert realistic, contextually valid, percentage-based or metric impact statements (e.g., "improving page loads by 25%", "reducing server lag by 30%", "boosting user acquisition by 15%") where it makes real sense under their existing accomplishments. Do NOT alter companies, roles, or dates.
        4. Projects Section: Professionalize and rewrite project summaries with technical keywords integrated naturally. 
        5. Avoid keyword-stuffing block-paragraphs. Weave words natively into bullet sentences. Avoid duplicates. Avoid placeholder optimization text (never print "optimized for XYZ ATS keyword"). Keep original content meaning intact.

        ### RESUME TO OPTIMIZE:
        ${JSON.stringify(resumeData, null, 2)}

        ### JOB DESCRIPTION:
        ${jobDescription}

        ### CURRENT ATS ANALYSIS (Use keyword hints here):
        ${JSON.stringify(analysisResult || {}, null, 2)}

        ### OUTPUT FORMAT REQUIRED:
        Return ONLY a fully structured JSON object representing the enhanced resume under the exact key "resumeData".
        Ensure there is no extra wrapper markdown or conversational text. Your response should parse directly as:
        {
          "resumeData": {
             // Full resumeData object fully optimized according to standard structure
          }
        }
        `;

        const aiResponse = await requestAICompletion(prompt, systemInstruction, true);

        console.log("RAW AI RESPONSE:", aiResponse); // debugging

        const responseObj = cleanAndParseJSON(aiResponse);
        enhancedResume = responseObj.resumeData || responseObj;
      } catch (err: any) {
        console.warn("[ATS Enhancer API Error] LLM enhancement execution failed. Gracefully falling back to Sandbox:", err.message);
        isDemoMode = true;
        enhancedResume = fallbackATSEnhancement(resumeData, jobDescription, analysisResult);
      }
    }

    res.json({ 
      resumeData: enhancedResume,
      isDemoMode,
    });

  } catch (error: any) {
    console.error("[Enhance Error]", error);
    res.status(500).json({ error: error.message || "Failed to enhance resume" });
  }
});


// Serve static/compiled frontend under Vite dev configuration or Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // In dev, Vite handles the main compiler entry points and index.html rendering
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Server] Vite Dev Middleware mounted.");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    
    // Check if dist exists, if not we fall back gracefully to a message or standard serving
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("[Server] 'dist' folder not found. Running static fallback route.");
      app.get("*", (req, res) => {
        res.status(200).send("<h1>Application is building... Please refresh in a moment.</h1>");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] ATS Resume Builder Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server Error on Boot]", err);
});
