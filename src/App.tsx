import React, { useState, useEffect } from "react";
import { ResumeData, AnalysisResult, AIHistoryItem } from "./types";
import { ResumeForm } from "./components/ResumeForm";
import { AnalysisDisplay } from "./components/AnalysisDisplay";
import { A4ResumePreview } from "./components/A4ResumePreview";
import { DbService, supabase } from "./supabase";
import { Auth } from "./components/Auth";
import { GoogleSelectPopup } from "./components/GoogleSelectPopup";
import { 
  Upload, 
  Briefcase,
  FileText, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight, 
  TrendingUp, 
  History, 
  Loader2, 
  Compass, 
  AlertCircle,
  Database,
  Grid,
  Settings,
  CornerDownRight,
  RefreshCw,
  Trash2,
  LogOut
} from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL;


// Professional Sample Resume Data to let users play immediately
const SAMPLE_RESUME: ResumeData = {
  personalInfo: {
    name: "Alex Devlin",
    jobTitle: "Senior Full-Stack Engineer",
    email: "alex.devlin@icloud.com",
    phone: "+1 (555) 019-2834",
    location: "Austin, TX (Remote)",
    website: "https://devlin.codes",
    linkedin: "linkedin.com/in/alexdevlincodes",
    github: "github.com/alexdevlincodes"
  },
  summary: "Highly precise Senior Full-Stack Engineer offering 6+ years of specialized experience constructing microservice architectures and high-fidelity React/Vite frontends. Expert at optimizing server processing speeds, deploying real-time data sync adapters, and lead managing multidisciplinary developer assemblies.",
  skills: [
    "JavaScript (ES6+)", "TypeScript", "React", "Node.js", "Express.js", 
    "Vite", "PostgreSQL", "Tailwind CSS", "RESTful APIs", "Git", "CI/CD", "AWS"
  ],
  experience: [
    {
      id: "exp-1",
      company: "Stripe Inc.",
      position: "Senior Software Architect",
      startDate: "Jan 2022",
      endDate: "Present",
      location: "Austin, TX (Hybrid)",
      description: [
        "Led a squad of 5 engineers constructing stripe settlement layout routes, reducing load failures by 20% globally.",
        "Refactored heavy Express database middle-layers into light cache clusters, lowering memory consumption by 35% across production instances.",
        "Orchestrated the architectural migration of core customer ledger tables with zero cumulative downtime."
      ]
    },
    {
      id: "exp-2",
      company: "Innovate Labs",
      position: "Frontend Specialist",
      startDate: "Mar 2020",
      endDate: "Dec 2021",
      location: "San Francisco, CA",
      description: [
        "Spearheaded responsive layout design frameworks using Tailwind and React, boosting user session times by 15%.",
        "Configured robust Vite testing blocks that pruned hot bundle weights by 40k and cut deploy lifecycles in half."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "Real-Time Collaborative Schema Editor",
      role: "Creator & Architect",
      startDate: "Jun 2023",
      endDate: "Sep 2023",
      url: "https://github.com/alex/collab-schema",
      description: [
        "Constructed a canvas editor tool using WebSockets and React State synchronization allowing 50+ concurrent users to model databases.",
        "Configured transactional history pipelines permettant unlimited action undos and redos."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      school: "The University of Texas at Austin",
      degree: "B.S. Computer Science",
      fieldOfStudy: "Software Engineering & Database Systems",
      startDate: "2016",
      endDate: "2020",
      location: "Austin, TX",
      gpa: "3.85"
    }
  ],
  certifications: [
    "AWS Certified Solutions Architect – Professional",
    "Certified ScrumMaster (CSM)"
  ]
};

// Default Job Description to preload so they don't have to write one manually to test
const SAMPLE_JOB_DESCRIPTION = `
Position Name: Senior Full-Stack Developer
Company: Fintech Solutions Inc.

Your Core Mandate:
We are recruiting a Lead Full-Stack Engineer who thrives constructing robust web products with React and Express. You'll architect database systems using PostgreSQL, write elegant TypeScript adapters, and optimize bundle packaging using Vite.

Mandatory Requirements & Stack Keywords:
- Expert-level React, TypeScript, and Tailwind CSS.
- Extensive background writing high-output Node.js backend controllers and RESTful APIs.
- Experience with PostgreSQL query configuration and schema design.
- Deployment expertise on Web Services like AWS, Docker, and full CI/CD deployment logic.
- Excellent track record incorporating action metrics, performance diagnostics, and percentage-based speed increments.
- Strongly preferred: Experience with Supabase, Redis caching, and WebSockets.
`;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [workspaceStarted, setWorkspaceStarted] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  
  // Statuses
  const [uploadLoading, setUploadLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Results
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"edit" | "preview" | "ats" | "history">("edit");
  const [selectedTemplate, setSelectedTemplate] = useState<"minimalist" | "modern" | "executive">("modern");

  // Database Connection Indicator & Histories Log
  const [historyItems, setHistoryItems] = useState<AIHistoryItem[]>([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // Check session
    const checkSession = async () => {
      if (supabase) {
        try {
          const { data: { session: activeSession } } = await supabase.auth.getSession();
          setSession(activeSession);
        } catch (e) {
          console.error("Failed to get supabase session:", e);
        }
      } else {
        // Fallback local persistence if sandbox mode
        try {
          const cached = localStorage.getItem("optiresume_sandbox_session");
          if (cached) {
            setSession(JSON.parse(cached));
          }
        } catch {}
      }
      setAuthChecking(false);
    };

    checkSession();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    // Check API status & mode on mount
    const checkApiStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/api/status`);
        if (res.ok) {
          const data = await res.json();
          setIsDemoMode(!!data.isDemoMode);
        }
      } catch (err) {
        console.warn("Error querying API status:", err);
      }
    };
    checkApiStatus();
  }, []);

  // Handle popup window handshake and closing
  useEffect(() => {
    if (typeof window !== "undefined" && window.opener && window.location.pathname !== "/auth/google-select") {
      const handlePopupAuthentication = async () => {
        if (supabase) {
          try {
            const { data: { session: activeSession } } = await supabase.auth.getSession();
            if (activeSession) {
              window.opener.postMessage(
                { type: "OAUTH_AUTH_SUCCESS", session: activeSession },
                window.location.origin
              );
              setTimeout(() => {
                window.close();
              }, 1200);
              return;
            }
          } catch (e) {
            console.error("Popup session extraction error:", e);
          }

          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession) {
              window.opener.postMessage(
                { type: "OAUTH_AUTH_SUCCESS", session: newSession },
                window.location.origin
              );
              setTimeout(() => {
                window.close();
              }, 1200);
            }
          });
          return () => subscription.unsubscribe();
        }
      };

      handlePopupAuthentication();
    }
  }, []);

  useEffect(() => {
    // Load persisted configurations only if authenticated
    if (session) {
      setDbConnected(DbService.isCloudConnected());
      loadHistory();
    }
  }, [session]);

  const handleAuthSuccess = (newSession: any) => {
    setSession(newSession);
    if (!supabase) {
      localStorage.setItem("optiresume_sandbox_session", JSON.stringify(newSession));
    }
  };

  const handleSignOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error("Sign out error from Supabase:", e);
    }
    
    // Always clear fallback & session to guarantee complete UX signout state resetting
    localStorage.removeItem("optiresume_sandbox_session");
    setSession(null);
    setWorkspaceStarted(false);
    setResumeData(null);
    setAnalysisResult(null);
  };

  const loadHistory = async () => {
    try {
      const items = await DbService.getHistory();
      setHistoryItems(items);
    } catch (e) {
      console.error("Failed to fetch database index history:", e);
    }
  };

  // Launch workspace with sample code
  const handleLoadSample = () => {
    setResumeData(JSON.parse(JSON.stringify(SAMPLE_RESUME)));
    if (!jobDescription || jobDescription.trim() === "") {
      setJobDescription(SAMPLE_JOB_DESCRIPTION.trim());
    }
    setWorkspaceStarted(true);
    setActiveWorkspaceTab("edit");
  };

  // Launch workspace with blank form
  const handleLoadBlank = () => {
    setResumeData({
      personalInfo: { name: "", email: "", phone: "", location: "", jobTitle: "" },
      summary: "",
      skills: [],
      experience: [],
      projects: [],
      education: [],
      certifications: []
    });
    // Retain existing custom pasted description if any
    setWorkspaceStarted(true);
    setActiveWorkspaceTab("edit");
  };

  // File parsing API action
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const response = await fetch(`${API_URL}/api/parse-resume`, {
  method: "POST",
  body: formData,
});
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = "Failed to analyze resume file structure.";
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } else {
          const rawText = await response.text();
          const bodyMatch = rawText.match(/<pre>([\s\S]*?)<\/pre>/i) || rawText.match(/<h1>([\s\S]*?)<\/h1>/i);
          errorMessage = bodyMatch ? bodyMatch[1].trim() : `Server error (${response.status}). Please check API connectivity.`;
        }
        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await response.text();
        throw new Error(`Server returned non-JSON response: ${rawText.slice(0, 100)}`);
      }

      const data = await response.json();
      setResumeData(data.resumeData);
      if (data.isDemoMode !== undefined) {
        setIsDemoMode(!!data.isDemoMode);
      }
      setWorkspaceStarted(true);
      setActiveWorkspaceTab("edit");
    } catch (err: any) {
      setUploadError(err.message || "Something went wrong. Please check your document and retry.");
    } finally {
      setUploadLoading(false);
    }
  };

  // Perform full ATS scan
  const handlePerformAnalysis = async () => {
    if (!resumeData) return;
    if (!jobDescription || jobDescription.trim() === "") {
      setAnalysisError("Please paste a target Job Description to scan against.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const response = await fetch(`${API_URL}/api/analyze-ats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData, jobDescription }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = "ATS Scanning interface failed.";
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } else {
          const rawText = await response.text();
          const bodyMatch = rawText.match(/<pre>([\s\S]*?)<\/pre>/i) || rawText.match(/<h1>([\s\S]*?)<\/h1>/i);
          errorMessage = bodyMatch ? bodyMatch[1].trim() : `Server error (${response.status}). Please check ATS module.`;
        }
        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await response.text();
        throw new Error(`Server returned non-JSON response from analysis: ${rawText.slice(0, 100)}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      if (data.isDemoMode !== undefined) {
        setIsDemoMode(!!data.isDemoMode);
      }
      setActiveWorkspaceTab("ats");

      // Save item to database history (Supabase or LocalStorage fallback)
      await DbService.saveHistoryItem(
        resumeData.personalInfo.name || "Unnamed Resume",
        resumeData.personalInfo.jobTitle || "Custom Candidate Profile",
        data.matchScore,
        resumeData,
        data
      );
      loadHistory();
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to analyze candidate structure.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Enhance with AI (Summary, missing skills, bullet points with action rates and percentage indicators)
  const handleEnhanceWithAI = async () => {
    if (!resumeData || !jobDescription || jobDescription.trim() === "") return;

    setEnhanceLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/enhance-ats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeData, 
          jobDescription,
          analysisResult // Help guide key placements
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        let errorMessage = "AI Resume enhancement model error.";
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } else {
          const rawText = await response.text();
          const bodyMatch = rawText.match(/<pre>([\s\S]*?)<\/pre>/i) || rawText.match(/<h1>([\s\S]*?)<\/h1>/i);
          errorMessage = bodyMatch ? bodyMatch[1].trim() : `Server error (${response.status}). Please check Enhance module.`;
        }
        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const rawText = await response.text();
        throw new Error(`Server returned non-JSON response from enhancer: ${rawText.slice(0, 100)}`);
      }

      const data = await response.json();
      setResumeData(data.resumeData);
      if (data.isDemoMode !== undefined) {
        setIsDemoMode(!!data.isDemoMode);
      }
      
      // Update our ATS scores after the integration
     const updatedResponse = await fetch(`${API_URL}/api/analyze-ats`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    resumeData: data.resumeData,
    jobDescription,
  }),
});

      const updatedContentType = updatedResponse.headers.get("content-type");
      if (updatedResponse.ok && updatedContentType && updatedContentType.includes("application/json")) {
        const updatedAnalysis = await updatedResponse.json();
        setAnalysisResult(updatedAnalysis);
        // Persist history update
        await DbService.saveHistoryItem(
          data.resumeData.personalInfo.name || "Enhanced Resume",
          data.resumeData.personalInfo.jobTitle || "ATS Enhanced Resume",
          updatedAnalysis.matchScore,
          data.resumeData,
          updatedAnalysis
        );
        loadHistory();
      }

      setActiveWorkspaceTab("preview");
    } catch (err: any) {
      alert("Enhancement failed: " + err.message);
    } finally {
      setEnhanceLoading(false);
    }
  };

  const handleLoadHistoryItem = (item: AIHistoryItem) => {
    setResumeData(item.resumeData);
    setAnalysisResult(item.analysisResult);
    setWorkspaceStarted(true);
    setActiveWorkspaceTab("edit");
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this historical audit?")) {
      await DbService.deleteHistoryItem(id);
      loadHistory();
    }
  };

  if (typeof window !== "undefined" && window.location.pathname === "/auth/google-select") {
    return <GoogleSelectPopup />;
  }

  // Streamlined screen for popup window callback context to handle the parent postMessage and shut down smoothly
  if (typeof window !== "undefined" && window.opener && window.location.pathname !== "/auth/google-select") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="bg-slate-950/60 p-8 rounded-3xl border border-slate-800/80 max-w-md shadow-2xl flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
            <div className="relative bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-center">
              <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold font-display text-white mb-2">Google Sign-In Successful!</h2>
          <p className="text-sm text-slate-400 leading-relaxed font-sans">
            Transferring your secure session back to OptiResume AI securely. This window will close automatically in a moment.
          </p>
        </div>
      </div>
    );
  }

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="space-y-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display animate-pulse">
            Establishing Secure Auth Session...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* UPPER BRAND HEADER */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 z-40 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-800 font-display">OptiResume <span className="text-blue-600">AI</span></span>
            <span className="ml-2 text-[9px] bg-blue-50 text-blue-700 font-extrabold font-mono px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
              Sleek
            </span>
          </div>
        </div>

        {/* Database connectivity status-dot badge & user sign out */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">Candidate Account</span>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-44" title={session?.user?.email}>
              {session?.user?.email}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/50">
            <div className={`h-2 w-2 rounded-full ${dbConnected ? "bg-green-500" : "bg-sky-500"}`}></div>
            <span className="text-xs font-semibold text-slate-600">
              {dbConnected ? "Cloud Sync" : "Local Sync"}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold transition-all text-xs cursor-pointer"
            title="Sign Out of session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {isDemoMode && (
        <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-2 flex items-center justify-between text-amber-800 text-[11px] font-semibold select-none shrink-0 z-30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Developer Sandbox:</strong> Running with Sandbox Heuristic AI.
              Connect your <strong>OpenAI API Key</strong> in the <strong>Settings &gt; Secrets</strong> panel to activate live models.
            </span>
          </div>
        </div>
      )}

      {/* DASHBOARD OR ACTIVE WORKSPACE CONDITIONAL ROUTE */}
      {!workspaceStarted ? (
        <main className="flex-1 flex flex-col xl:flex-row items-center justify-center p-6 md:p-12 gap-8 max-w-7xl mx-auto w-full">
          {/* Welcome Intro panel */}
          <div className="max-w-xl space-y-6">
            <span className="text-xs font-bold text-blue-600 tracking-widest uppercase flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-blue-500 animate-pulse" />
              Advanced Resume Optimizer
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight font-display leading-tight">
              Optimize Resumes for <span className="text-blue-600 underline decoration-blue-200">ATS Scanners</span> and Impress Corporate Recruiters.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-sans">
              Don't get blocked by automated Applicant Tracking Systems. Review, rewrite and inject core metric statements dynamically. Generate templates fitting strict corporate scales and export pixel-perfect PDFs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Card 1: Parser card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-800 font-display">Method 1: File Parser</span>
                      <span className="text-[10px] text-slate-400">PDF, DOCX, TXT, JSON</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Import your current file. The parser extracts content, structure, and history immediately.
                  </p>
                </div>

                <label className="mt-5 w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-center text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-blue-100">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  Import Document
                </label>
              </div>

              {/* Card 2: Interactive Pasting card (replaces fast track sample) */}
              <div className="bg-white p-5 rounded-2xl border border-blue-100 bg-blue-50/10 shadow-sm flex flex-col justify-between hover:border-blue-300 hover:shadow-md transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800 font-display">Method 2: Paste Job</span>
                        <span className="text-[10px] text-blue-600 font-semibold">ATS Matching</span>
                      </div>
                    </div>
                    {jobDescription && (
                      <button 
                        onClick={() => setJobDescription("")}
                        className="text-[9px] text-rose-500 hover:underline font-bold transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    Paste standard job specifications or keywords directly inside to target matching indices.
                  </p>

                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={4}
                    placeholder="Paste standard job requirements, responsibilities or stack specifications..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[10px] text-slate-800 font-mono leading-normal resize-none bg-white shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-4 pt-2 border-t border-slate-100">
                  <button
                    onClick={handleLoadSample}
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-center text-[11px] font-bold transition-all cursor-pointer shadow-sm flex flex-col items-center justify-center leading-none"
                    title="Loads preloaded mock resume details to test alignment instantly"
                  >
                    <span>Load Pro Sample</span>
                    <span className="text-[8px] font-normal opacity-70 mt-0.5">Alex Rivera Profile</span>
                  </button>

                  <button
                    onClick={handleLoadBlank}
                    className="py-2.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 rounded-xl text-center text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center leading-none"
                  >
                    <span>Blank Canvas</span>
                    <span className="text-[8px] font-normal text-slate-400 mt-0.5">Start empty form</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Error notifications */}
            {uploadError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleLoadBlank}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer font-display"
              >
                Start with a blank workspace
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Database History log column */}
          <div className="w-full xl:w-[450px] shrink-0 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 font-display">
                <History className="w-4 h-4" />
                Historical Scanning Audits ({historyItems.length})
              </span>

              {historyItems.length === 0 ? (
                <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl space-y-1">
                  <p className="text-xs font-semibold text-slate-400">No previous resume records</p>
                  <p className="text-[10px] text-slate-400">Your scanned resumes and matching scores persist here.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadHistoryItem(item)}
                      className="p-3.5 bg-slate-50 hover:bg-blue-50/40 border border-slate-200/60 hover:border-blue-200 rounded-xl flex items-center justify-between cursor-pointer group transition-all"
                    >
                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-slate-800 truncate max-w-44 font-display">
                          {item.resumeName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                          <span>{item.jobTitle}</span>
                          <span>•</span>
                          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                          item.score < 50 ? "bg-rose-50 text-rose-600" : item.score < 75 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {item.score}%
                        </span>
                        <button
                          onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                          className="p-1 px-1.5 text-slate-300 hover:text-rose-500 rounded transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      ) : (
        /* WORKSPACE WORKSPACE */
        <main className="flex-1 flex flex-col lg:flex-row p-4 md:p-6 gap-6 max-h-[calc(100vh-70px)] overflow-hidden">
          {/* LEFT COLUMN: Input form & controls */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4 h-full overflow-hidden">
            {/* Control banner inside workspace */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Target Job Description</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadBlank}
                    className="text-[10px] bg-slate-50 text-slate-600 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 font-semibold cursor-pointer"
                  >
                    Reset Form
                  </button>
                  <button
                    onClick={() => setWorkspaceStarted(false)}
                    className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded border border-blue-100 font-bold cursor-pointer"
                  >
                    View All Runs Log
                  </button>
                </div>
              </div>

              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                placeholder="Paste the target Job Description context details here to perform complete ATS alignment scanner checks..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 transition-all font-mono leading-relaxed resize-none"
              />

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handlePerformAnalysis}
                  disabled={analysisLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all text-xs font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-50 font-display shadow-md shadow-blue-100"
                >
                  {analysisLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                  Scan Score & Run Complete Analysis
                </button>

                <button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={enhanceLoading || !jobDescription}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-95 text-white transition-all text-xs font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-50 font-display shadow-lg shadow-blue-100"
                  title="Uses AI to rewrite professional summary, skills, experience with percentage business impact, and keywords"
                >
                  {enhanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Optimize & Enhance with AI
                </button>
              </div>

              {analysisError && (
                <div className="text-red-500 text-xs flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {analysisError}
                </div>
              )}
            </div>

            {/* Resume Fields Workspace (Interactive lists table etc) */}
            <div className="flex-1 overflow-hidden min-h-0">
              <ResumeForm 
                resumeData={resumeData!} 
                onChange={(updated) => setResumeData(updated)} 
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Scored review sheet, PDF layouts */}
          <div className="w-full lg:w-1/2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
            {/* Header selection tabs */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex gap-1.5 overflow-x-auto">
                {([
                  { key: "preview", label: "Live Resume Preview", badge: null },
                  { key: "ats", label: "ATS Scanner Report", badge: analysisResult ? `${analysisResult.matchScore}%` : null },
                  { key: "history", label: "Restore Prior Audits", badge: historyItems.length || null }
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveWorkspaceTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative flex items-center gap-1.5 cursor-pointer whitespace-nowrap font-display ${
                      activeWorkspaceTab === tab.key
                        ? "bg-white text-blue-600 shadow-sm border border-slate-200/50"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                    }`}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        tab.key === "ats" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Template picker options */}
              {activeWorkspaceTab === "preview" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-bold font-display uppercase shrink-0">Layout:</span>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value as any)}
                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="minimalist">Minimalist Standard</option>
                    <option value="modern">Modern Tech-Forward</option>
                    <option value="executive">Executive Classic</option>
                  </select>
                </div>
              )}
            </div>

            {/* Contents Pane Scroll Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-100/50 max-h-[calc(100vh-200px)]">
              {/* RENDER TAB 1: Live sheet A4 templates */}
              {activeWorkspaceTab === "preview" && (
                <div className="flex flex-col items-center">
                  <div className="transform scale-[0.6] sm:scale-[0.8] md:scale-[0.9] lg:scale-[0.8] xl:scale-[0.95] origin-top my-4">
                    <A4ResumePreview 
                      resumeData={resumeData!} 
                      template={selectedTemplate} 
                    />
                  </div>
                </div>
              )}

              {/* RENDER TAB 2: Scanned results layout */}
              {activeWorkspaceTab === "ats" && (
                <div className="space-y-4">
                  {analysisResult ? (
                    <AnalysisDisplay analysis={analysisResult} />
                  ) : (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                        <TrendingUp className="w-6 h-6 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800 font-display">No ATS Scan Run Yet</h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Paste a targeted job description on the left pane and trigger a scan to evaluate keyword alignment indices.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* RENDER TAB 3: History restoration list */}
              {activeWorkspaceTab === "history" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 font-display uppercase tracking-wider">Scanned History Records</h3>
                      <p className="text-xs text-slate-400">Jump directly back to previous analyzed drafts instantly with prefilled details.</p>
                    </div>
                    {historyItems.length > 0 && (
                      <button
                        onClick={async () => {
                          if (confirm("Are you sure you want to purge all historical resume scanning runs?")) {
                            for (const item of historyItems) {
                              await DbService.deleteHistoryItem(item.id);
                            }
                            loadHistory();
                          }
                        }}
                        className="text-[10px] bg-red-50 text-red-600 font-bold border border-red-100 hover:bg-red-100 px-2 py-1 rounded cursor-pointer"
                      >
                        Clear History
                      </button>
                    )}
                  </div>

                  {historyItems.length === 0 ? (
                    <div className="p-8 bg-white text-center border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-xs font-semibold text-slate-500">No scanned historical entries</p>
                        <p className="text-[10px] text-slate-400 mt-1">Previous runs will gather here for restoration.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {historyItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleLoadHistoryItem(item)}
                          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 cursor-pointer shadow-sm group transition-all space-y-4 relative"
                        >
                          <div className="space-y-1">
                            <span className="block text-xs font-bold text-slate-800 truncate font-display group-hover:text-blue-600 transition-colors">
                              {item.resumeName}
                            </span>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {item.jobTitle}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono">
                              {new Date(item.createdAt).toLocaleString()}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg ${
                              item.score < 50 ? "bg-rose-50 text-rose-600" : item.score < 75 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                            }`}>
                              ATS: {item.score}%
                            </span>
                            <button
                              onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                              className="text-slate-300 hover:text-red-500 p-1"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
