/**
 * Shared Type Definitions for the ATS Resume Builder
 */

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  website?: string;
  github?: string;
  linkedin?: string;
  location?: string;
  jobTitle?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  location?: string;
  description: string[]; // List of bullet points
}

export interface Project {
  id: string;
  title: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  description: string[]; // List of bullet points
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  location?: string;
  gpa?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  skills: string[];
  experience: WorkExperience[];
  projects: Project[];
  education: Education[];
  certifications?: string[];
}

export interface WeakSection {
  section: string;
  findings: string;
  correction: string;
}

export interface AnalysisResult {
  matchScore: number;
  matchingPercentage: number;
  missingKeywords: string[];
  suggestedKeywords: string[];
  matchedKeywords: string[];
  weakSections: WeakSection[];
  recommendations: string[];
  jobTitleMatch?: boolean;
  overallSummary?: string;
}

export interface AIHistoryItem {
  id: string;
  createdAt: string;
  resumeName: string;
  jobTitle: string;
  score: number;
  resumeData: ResumeData;
  analysisResult: AnalysisResult;
}
