import React, { useState } from "react";
import { ResumeData, PersonalInfo, WorkExperience, Project, Education } from "../types";
import { Plus, Trash2, ArrowRight, Save, User, FileText, Briefcase, Code, GraduationCap, Award, HelpCircle } from "lucide-react";

interface ResumeFormProps {
  resumeData: ResumeData;
  onChange: (updated: ResumeData) => void;
}

export const ResumeForm: React.FC<ResumeFormProps> = ({ resumeData, onChange }) => {
  const [activeTab, setActiveTab] = useState<"personal" | "summary" | "skills" | "experience" | "projects" | "education" | "certifications">("personal");

  // Specific nested field updaters to keep it simple and ultra performant
  const updatePersonalInfo = (fields: Partial<PersonalInfo>) => {
    onChange({
      ...resumeData,
      personalInfo: {
        ...resumeData.personalInfo,
        ...fields,
      },
    });
  };

  const updateSummary = (newSummary: string) => {
    onChange({
      ...resumeData,
      summary: newSummary,
    });
  };

  const updateSkills = (skillsString: string) => {
    const list = skillsString
      .split(",")
      .map((sku) => sku.trim())
      .filter((sku) => sku !== "");
    onChange({
      ...resumeData,
      skills: list,
    });
  };

  // ---------------- EXPERIENCE ITEMS CONTROL ----------------
  const addExperience = () => {
    const record: WorkExperience = {
      id: Math.random().toString(36).substring(2, 9),
      company: "",
      position: "",
      startDate: "",
      endDate: "Present",
      location: "",
      description: [""],
    };
    onChange({
      ...resumeData,
      experience: [...(resumeData.experience || []), record],
    });
  };

  const updateExperience = (id: string, fields: Partial<WorkExperience>) => {
    const list = (resumeData.experience || []).map((exp) => {
      if (exp.id === id) {
        return { ...exp, ...fields };
      }
      return exp;
    });
    onChange({ ...resumeData, experience: list });
  };

  const deleteExperience = (id: string) => {
    onChange({
      ...resumeData,
      experience: (resumeData.experience || []).filter((exp) => exp.id !== id),
    });
  };

  const addExperienceBullet = (expId: string) => {
    const list = (resumeData.experience || []).map((exp) => {
      if (exp.id === expId) {
        return {
          ...exp,
          description: [...(exp.description || []), ""],
        };
      }
      return exp;
    });
    onChange({ ...resumeData, experience: list });
  };

  const updateExperienceBullet = (expId: string, bulletIndex: number, text: string) => {
    const list = (resumeData.experience || []).map((exp) => {
      if (exp.id === expId) {
        const copy = [...(exp.description || [])];
        copy[bulletIndex] = text;
        return { ...exp, description: copy };
      }
      return exp;
    });
    onChange({ ...resumeData, experience: list });
  };

  const deleteExperienceBullet = (expId: string, bulletIndex: number) => {
    const list = (resumeData.experience || []).map((exp) => {
      if (exp.id === expId) {
        const copy = (exp.description || []).filter((_, idx) => idx !== bulletIndex);
        return { ...exp, description: copy.length > 0 ? copy : [""] };
      }
      return exp;
    });
    onChange({ ...resumeData, experience: list });
  };

  // ---------------- PROJECTS ITEMS CONTROL ----------------
  const addProject = () => {
    const item: Project = {
      id: Math.random().toString(36).substring(2, 9),
      title: "",
      role: "",
      startDate: "",
      endDate: "",
      url: "",
      description: [""],
    };
    onChange({
      ...resumeData,
      projects: [...(resumeData.projects || []), item],
    });
  };

  const updateProject = (id: string, fields: Partial<Project>) => {
    const list = (resumeData.projects || []).map((proj) => {
      if (proj.id === id) {
        return { ...proj, ...fields };
      }
      return proj;
    });
    onChange({ ...resumeData, projects: list });
  };

  const deleteProject = (id: string) => {
    onChange({
      ...resumeData,
      projects: (resumeData.projects || []).filter((p) => p.id !== id),
    });
  };

  const addProjectBullet = (projId: string) => {
    const list = (resumeData.projects || []).map((proj) => {
      if (proj.id === projId) {
        return {
          ...proj,
          description: [...(proj.description || []), ""],
        };
      }
      return proj;
    });
    onChange({ ...resumeData, projects: list });
  };

  const updateProjectBullet = (projId: string, bulletIndex: number, text: string) => {
    const list = (resumeData.projects || []).map((proj) => {
      if (proj.id === projId) {
        const copy = [...(proj.description || [])];
        copy[bulletIndex] = text;
        return { ...proj, description: copy };
      }
      return proj;
    });
    onChange({ ...resumeData, projects: list });
  };

  const deleteProjectBullet = (projId: string, bulletIndex: number) => {
    const list = (resumeData.projects || []).map((proj) => {
      if (proj.id === projId) {
        const copy = (proj.description || []).filter((_, idx) => idx !== bulletIndex);
        return { ...proj, description: copy.length > 0 ? copy : [""] };
      }
      return proj;
    });
    onChange({ ...resumeData, projects: list });
  };

  // ---------------- EDUCATION ITEMS CONTROL ----------------
  const addEducation = () => {
    const item: Education = {
      id: Math.random().toString(36).substring(2, 9),
      school: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      location: "",
      gpa: "",
    };
    onChange({
      ...resumeData,
      education: [...(resumeData.education || []), item],
    });
  };

  const updateEducation = (id: string, fields: Partial<Education>) => {
    const list = (resumeData.education || []).map((edu) => {
      if (edu.id === id) {
        return { ...edu, ...fields };
      }
      return edu;
    });
    onChange({ ...resumeData, education: list });
  };

  const deleteEducation = (id: string) => {
    onChange({
      ...resumeData,
      education: (resumeData.education || []).filter((edu) => edu.id !== id),
    });
  };

  // ---------------- CERTIFICATIONS ITEMS CONTROL ----------------
  const addCertification = () => {
    onChange({
      ...resumeData,
      certifications: [...(resumeData.certifications || []), ""],
    });
  };

  const updateCertification = (index: number, value: string) => {
    const copy = [...(resumeData.certifications || [])];
    copy[index] = value;
    onChange({ ...resumeData, certifications: copy });
  };

  const deleteCertification = (index: number) => {
    onChange({
      ...resumeData,
      certifications: (resumeData.certifications || []).filter((_, idx) => idx !== index),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-full">
      {/* Sidebar Navigation inside Form */}
      <nav className="w-full md:w-60 bg-slate-50 border-r border-slate-200 p-4 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
        {([
          { key: "personal", label: "Contact Details", icon: User },
          { key: "summary", label: "Executive Summary", icon: FileText },
          { key: "skills", label: "Skill Competencies", icon: Code },
          { key: "experience", label: "Work Experience", icon: Briefcase },
          { key: "projects", label: "Select Projects", icon: Code },
          { key: "education", label: "Education History", icon: GraduationCap },
          { key: "certifications", label: "Certifications", icon: Award },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Form Fields Segment */}
      <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[600px] md:max-h-[calc(100vh-250px)]">
        {/* PERSONAL DETAILS WORKSPACE */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Candidate Identity</h3>
              <p className="text-xs text-slate-500">Provide full contact links for recruiters to locate you.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Full Candidate Name</label>
                <input
                  type="text"
                  value={resumeData.personalInfo?.name || ""}
                  onChange={(e) => updatePersonalInfo({ name: e.target.value })}
                  placeholder="e.g. Johnathan Doe"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Target Professional Title</label>
                <input
                  type="text"
                  value={resumeData.personalInfo?.jobTitle || ""}
                  onChange={(e) => updatePersonalInfo({ jobTitle: e.target.value })}
                  placeholder="e.g. Senior Frontend Architect"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Professional Email</label>
                <input
                  type="email"
                  value={resumeData.personalInfo?.email || ""}
                  onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                  placeholder="e.g. john.doe@icloud.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Phone Connection</label>
                <input
                  type="tel"
                  value={resumeData.personalInfo?.phone || ""}
                  onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location / Residence</label>
                <input
                  type="text"
                  value={resumeData.personalInfo?.location || ""}
                  onChange={(e) => updatePersonalInfo({ location: e.target.value })}
                  placeholder="e.g. Austin, TX"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Personal Website / Portfolio Portfolio</label>
                <input
                  type="url"
                  value={resumeData.personalInfo?.website || ""}
                  onChange={(e) => updatePersonalInfo({ website: e.target.value })}
                  placeholder="e.g. https://doe.design"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">LinkedIn Profile Url</label>
                <input
                  type="url"
                  value={resumeData.personalInfo?.linkedin || ""}
                  onChange={(e) => updatePersonalInfo({ linkedin: e.target.value })}
                  placeholder="e.g. linkedin.com/in/johndoe"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">GitHub Profile Url</label>
                <input
                  type="url"
                  value={resumeData.personalInfo?.github || ""}
                  onChange={(e) => updatePersonalInfo({ github: e.target.value })}
                  placeholder="e.g. github.com/johndoe"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans"
                />
              </div>
            </div>
          </div>
        )}

        {/* WORK SUMMARY AREA */}
        {activeTab === "summary" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Executive Highlight</h3>
              <p className="text-xs text-slate-500">Focus summary on technical skills and alignment to job descriptions. AI can rewrite this dynamically.</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Professional Summary</label>
              <textarea
                value={resumeData.summary || ""}
                onChange={(e) => updateSummary(e.target.value)}
                rows={7}
                placeholder="Highly motivated and results-driven Software Engineer with 5+ years of experience constructing high-traffic web layouts and optimizing data pipelines..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans leading-relaxed resize-y"
              />
            </div>
          </div>
        )}

        {/* SKILLS MULTI-SELECT DISPLAY */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 font-display">Core Industry Skills</h3>
              <p className="text-xs text-slate-500">Keywords here directly hit ATS scanners. Separate multiple items with commas.</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Technical Skills (Comma Separated)</label>
              <textarea
                value={(resumeData.skills || []).join(", ")}
                onChange={(e) => updateSkills(e.target.value)}
                rows={4}
                placeholder="React, TypeScript, Node.js, Next.js, Webpack, PostgreSQL, GraphQL, Docker, AWS, CI/CD"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 transition-all font-sans leading-relaxed resize-y"
              />
            </div>
            {/* Visual breakdown bubble view */}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Previewing parsed keywords</span>
                <div className="flex flex-wrap gap-1.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 max-h-40 overflow-y-auto">
                  {resumeData.skills.map((sku, index) => (
                    <span key={index} className="px-2.5 py-1 text-[11px] font-semibold font-mono bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                      {sku}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXPERIENCE BLOCK EDITORS */}
        {activeTab === "experience" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Professional Record</h3>
                <p className="text-xs text-slate-500">Provide structured experience. AI will professionalize statements with impact percentages.</p>
              </div>
              <button
                onClick={addExperience}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer font-display"
              >
                <Plus className="w-4 h-4" />
                Add Experience
              </button>
            </div>

            <div className="space-y-6">
              {(resumeData.experience || []).map((exp, expIdx) => (
                <div key={exp.id} className="p-5 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/50 relative group">
                  <button
                    onClick={() => deleteExperience(exp.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove position"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-xs font-bold text-slate-400 font-display">POSITION #{expIdx + 1}</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Company / Organization</label>
                      <input
                        type="text"
                        value={exp.company || ""}
                        onChange={(e) => updateExperience(exp.id, { company: e.target.value })}
                        placeholder="e.g. Stripe Inc."
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Your Role / Job Title</label>
                      <input
                        type="text"
                        value={exp.position || ""}
                        onChange={(e) => updateExperience(exp.id, { position: e.target.value })}
                        placeholder="e.g. Lead Software Engineer"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Start Date / Year</label>
                      <input
                        type="text"
                        value={exp.startDate || ""}
                        onChange={(e) => updateExperience(exp.id, { startDate: e.target.value })}
                        placeholder="e.g. Jan 2021"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">End Date / Present</label>
                      <input
                        type="text"
                        value={exp.endDate || ""}
                        onChange={(e) => updateExperience(exp.id, { endDate: e.target.value })}
                        placeholder="e.g. Present"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Physical/Remote Location</label>
                      <input
                        type="text"
                        value={exp.location || ""}
                        onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                        placeholder="e.g. San Francisco, CA (Hybrid)"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                  </div>

                  {/* Bullet accomplishments grid inside Experience */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Key Accomplishments (One per line)</span>
                      <button
                        onClick={() => addExperienceBullet(exp.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Bullet Point
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(exp.description || []).map((bullet, bulkIdx) => (
                        <div key={bulkIdx} className="flex gap-2.5 items-center">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateExperienceBullet(exp.id, bulkIdx, e.target.value)}
                            placeholder="e.g. Engineered distributed message broker backend reducing API lag by 35% across 2M global endpoints."
                            className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                          />
                          <button
                            onClick={() => deleteExperienceBullet(exp.id, bulkIdx)}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="Delete bullet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROJECTS SECTION INTERACTIVE RECORD */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Special Initiatives & Side Projects</h3>
                <p className="text-xs text-slate-500">Provide details on key architectural models you built.</p>
              </div>
              <button
                onClick={addProject}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer font-display"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>

            <div className="space-y-6">
              {(resumeData.projects || []).map((proj, projIdx) => (
                <div key={proj.id} className="p-5 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/50 relative group">
                  <button
                    onClick={() => deleteProject(proj.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Remove project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-xs font-bold text-slate-400 font-display">PROJECT #{projIdx + 1}</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Project Name</label>
                      <input
                        type="text"
                        value={proj.title || ""}
                        onChange={(e) => updateProject(proj.id, { title: e.target.value })}
                        placeholder="e.g. Decentralized Multi-Token Swap Contract"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Your Role</label>
                      <input
                        type="text"
                        value={proj.role || ""}
                        onChange={(e) => updateProject(proj.id, { role: e.target.value })}
                        placeholder="e.g. Creator / Principal Architect"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Reference URL / Repo link</label>
                      <input
                        type="url"
                        value={proj.url || ""}
                        onChange={(e) => updateProject(proj.id, { url: e.target.value })}
                        placeholder="e.g. https://github.com/doe/swap-contract"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Start Date/Year</label>
                        <input
                          type="text"
                          value={proj.startDate || ""}
                          onChange={(e) => updateProject(proj.id, { startDate: e.target.value })}
                          placeholder="e.g. Sep 2023"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">End Date/Year</label>
                        <input
                          type="text"
                          value={proj.endDate || ""}
                          onChange={(e) => updateProject(proj.id, { endDate: e.target.value })}
                          placeholder="e.g. Dec 2023"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bullet points for Projects */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Key Features Built</span>
                      <button
                        onClick={() => addProjectBullet(proj.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Bullet Point
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(proj.description || []).map((bullet, bulkIdx) => (
                        <div key={bulkIdx} className="flex gap-2.5 items-center">
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => updateProjectBullet(proj.id, bulkIdx, e.target.value)}
                            placeholder="e.g. Developed secure, auditable Solidity smart contracts managing over $240K total TVL in sandbox tests."
                            className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
                          />
                          <button
                            onClick={() => deleteProjectBullet(proj.id, bulkIdx)}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="Delete bullet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDUCATION SECTION */}
        {activeTab === "education" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Academic Qualifications</h3>
                <p className="text-xs text-slate-500">Add institutions, degrees, and dates studied.</p>
              </div>
              <button
                onClick={addEducation}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer font-display"
              >
                <Plus className="w-4 h-4" />
                Add Education
              </button>
            </div>

            <div className="space-y-6">
              {(resumeData.education || []).map((edu, eduIdx) => (
                <div key={edu.id} className="p-5 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/50 relative">
                  <button
                    onClick={() => deleteEducation(edu.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors p-1 font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-xs font-bold text-slate-400 font-display">INSTITUTION #{eduIdx + 1}</div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">School / University</label>
                      <input
                        type="text"
                        value={edu.school || ""}
                        onChange={(e) => updateEducation(edu.id, { school: e.target.value })}
                        placeholder="e.g. Stanford University"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Degree Achieved</label>
                      <input
                        type="text"
                        value={edu.degree || ""}
                        onChange={(e) => updateEducation(edu.id, { degree: e.target.value })}
                        placeholder="e.g. Master of Science (M.S.)"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Field of Study / Major</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy || ""}
                        onChange={(e) => updateEducation(edu.id, { fieldOfStudy: e.target.value })}
                        placeholder="e.g. Computer Science"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">GPA</label>
                        <input
                          type="text"
                          value={edu.gpa || ""}
                          onChange={(e) => updateEducation(edu.id, { gpa: e.target.value })}
                          placeholder="e.g. 3.9"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                        <input
                          type="text"
                          value={edu.startDate || ""}
                          onChange={(e) => updateEducation(edu.id, { startDate: e.target.value })}
                          placeholder="2018"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">End Date</label>
                        <input
                          type="text"
                          value={edu.endDate || ""}
                          onChange={(e) => updateEducation(edu.id, { endDate: e.target.value })}
                          placeholder="2020"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 text-[11px]">Location of School</label>
                      <input
                        type="text"
                        value={edu.location || ""}
                        onChange={(e) => updateEducation(edu.id, { location: e.target.value })}
                        placeholder="e.g. Stanford, CA"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CERTIFICATIONS & SPECIAL MERITS */}
        {activeTab === "certifications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-display">Certifications & Special Credentials</h3>
                <p className="text-xs text-slate-500">Provide names of external standard accolades (e.g. AWS Core Solutions Architect).</p>
              </div>
              <button
                onClick={addCertification}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer font-display"
              >
                <Plus className="w-4 h-4" />
                Add cert
              </button>
            </div>

            <div className="space-y-2.5">
              {(resumeData.certifications || []).map((cert, index) => (
                <div key={index} className="flex gap-2.5 items-center">
                  <input
                    type="text"
                    value={cert}
                    onChange={(e) => updateCertification(index, e.target.value)}
                    placeholder="e.g. Certified ScrumMaster (CSM) - Scrum Alliance"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-sans"
                  />
                  <button
                    onClick={() => deleteCertification(index)}
                    className="text-slate-400 hover:text-red-500 p-1"
                    title="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
