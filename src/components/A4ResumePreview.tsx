import React, { useRef } from "react";
import { ResumeData } from "../types";
import { Mail, Phone, MapPin, Link as LinkIcon, Github, Linkedin, Printer } from "lucide-react";

interface A4ResumePreviewProps {
  resumeData: ResumeData;
  template: "minimalist" | "modern" | "executive";
}

export const A4ResumePreview: React.FC<A4ResumePreviewProps> = ({
  resumeData,
  template,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { personalInfo, summary, skills = [], experience = [], projects = [], education = [], certifications = [] } = resumeData;

  const handlePrint = () => {
    window.print();
  };

  // Styles map based on templates
  const templateConfig = {
    minimalist: {
      container: "font-sans text-slate-800",
      headerAlign: "text-left",
      headingClass: "text-sm font-semibold tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3 uppercase font-display",
      subHeadingClass: "font-semibold text-slate-800 text-[14px]",
      metaClass: "text-xs text-slate-500 font-mono",
      bodyClass: "text-[13px] text-slate-600 space-y-1.5 leading-relaxed",
      nameClass: "text-2xl font-bold tracking-tight text-slate-900 font-display",
      titleClass: "text-xs font-mono font-medium tracking-widest text-blue-600 uppercase mt-1",
      iconClass: "w-3.5 h-3.5 text-slate-400 mr-1 inline-block",
    },
    modern: {
      container: "font-sans text-slate-800 bg-white",
      headerAlign: "text-center bg-slate-50 p-6 -mx-8 -mt-8 mb-6 border-b border-slate-100",
      headingClass: "text-sm font-bold tracking-widest text-blue-900 border-l-4 border-blue-600 pl-3.5 py-0.5 mb-3 uppercase font-display",
      subHeadingClass: "font-bold text-slate-900 text-[14px]",
      metaClass: "text-xs text-slate-500 italic",
      bodyClass: "text-[13px] text-slate-600 space-y-1.5 leading-relaxed",
      nameClass: "text-3xl font-extrabold tracking-tight text-slate-900 font-display",
      titleClass: "text-sm font-medium tracking-wide text-blue-700 uppercase mt-1",
      iconClass: "w-3.5 h-3.5 text-blue-500 mr-1 inline-block",
    },
    executive: {
      container: "font-serif text-slate-900",
      headerAlign: "text-center",
      headingClass: "text-[13px] font-bold tracking-widest text-slate-800 border-b-2 border-slate-800 pb-0.5 mb-3 uppercase text-center",
      subHeadingClass: "font-bold font-serif text-slate-900 text-[14px]",
      metaClass: "text-xs text-slate-600 italic font-sans",
      bodyClass: "text-[13px] text-slate-700 space-y-1 leading-relaxed font-serif",
      nameClass: "text-3xl font-normal font-serif text-slate-900 tracking-wide",
      titleClass: "text-xs font-sans tracking-widest text-slate-600 uppercase mt-1.5",
      iconClass: "w-3.5 h-3.5 text-slate-500 mr-1 inline-block",
    },
  };

  const style = templateConfig[template];

  return (
    <div className="flex flex-col items-center">
      {/* Action panel */}
      <div className="w-full max-w-[210mm] no-print mb-4 flex items-center justify-between bg-white px-6 py-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-sm text-slate-500 font-medium">
          Template: <span className="text-slate-900 capitalize font-bold">{template}</span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 active:scale-95 transition-all text-xs font-bold px-4 py-2 rounded-lg cursor-pointer font-display shadow-md shadow-blue-100"
        >
          <Printer className="w-4 h-4" />
          Export / Download PDF
        </button>
      </div>

      {/* A4 Container Sheet */}
      <div 
        ref={printRef}
        id="a4-resume-sheet" 
        className={`a4-page ${style.container} shadow-lg transition-all duration-300 print:shadow-none`}
      >
        {/* Personal Details Header */}
        <header className={`${style.headerAlign} mb-6`}>
          <h1 className={style.nameClass}>
            {personalInfo.name || "Full Name"}
          </h1>
          {personalInfo.jobTitle && (
            <div className={style.titleClass}>
              {personalInfo.jobTitle}
            </div>
          )}

          {/* Social Links Sub-Bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500 no-print">
            {personalInfo.email && (
              <span className="flex items-center">
                <Mail className="w-3.5 h-3.5 mr-1" />
                {personalInfo.email}
              </span>
            )}
            {personalInfo.phone && (
              <span className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-1" />
                {personalInfo.phone}
              </span>
            )}
            {personalInfo.location && (
              <span className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                {personalInfo.location}
              </span>
            )}
            {personalInfo.website && (
              <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-indigo-600 text-slate-500 transition-colors">
                <LinkIcon className="w-3.5 h-3.5 mr-1" />
                Portfolio
              </a>
            )}
            {personalInfo.linkedin && (
              <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-indigo-600 text-slate-500 transition-colors">
                <Linkedin className="w-3.5 h-3.5 mr-1" />
                LinkedIn
              </a>
            )}
            {personalInfo.github && (
              <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-indigo-600 text-slate-500 transition-colors">
                <Github className="w-3.5 h-3.5 mr-1" />
                GitHub
              </a>
            )}
          </div>

          {/* Printable flat text (without interactive icons) for standard PDF readers */}
          <div className="hidden print:flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-600 border-t border-slate-100 pt-2">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>• {personalInfo.phone}</span>}
            {personalInfo.location && <span>• {personalInfo.location}</span>}
            {personalInfo.website && <span>• {personalInfo.website}</span>}
            {personalInfo.linkedin && <span>• {personalInfo.linkedin}</span>}
            {personalInfo.github && <span>• {personalInfo.github}</span>}
          </div>
        </header>

        {/* Executive Summary Section */}
        {summary && (
          <section className="mb-6">
            <h2 className={style.headingClass}>Professional Profile</h2>
            <p className={`${style.bodyClass} leading-relaxed`}>
              {summary}
            </p>
          </section>
        )}

        {/* Skills Section */}
        {skills.length > 0 && (
          <section className="mb-6">
            <h2 className={style.headingClass}>Core Competencies</h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, index) => (
                <span 
                  key={index} 
                  className={`px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 ${template === "executive" ? "font-serif bg-transparent border border-slate-200" : "font-mono"}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Professional Experience Section */}
        {experience.length > 0 && (
          <section className="mb-6">
            <h2 className={style.headingClass}>Professional Experience</h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className="group">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className={style.subHeadingClass}>{exp.position}</span>
                      <span className="text-slate-400 mx-1.5">•</span>
                      <span className="text-slate-700 text-[13px] font-medium">{exp.company}</span>
                    </div>
                    <div className={style.metaClass}>
                      {exp.startDate} – {exp.endDate}
                      {exp.location && ` | ${exp.location}`}
                    </div>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 mt-1.5">
                    {exp.description.filter(bullet => bullet.trim() !== "").map((bullet, idx) => (
                      <li key={idx} className={style.bodyClass}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <section className="mb-6">
            <h2 className={style.headingClass}>Select Projects & Initiatives</h2>
            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className={style.subHeadingClass}>{proj.title}</span>
                      {proj.role && (
                        <>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="text-slate-600 text-[13px] italic">{proj.role}</span>
                        </>
                      )}
                    </div>
                    <div className={style.metaClass}>
                      {proj.startDate && `${proj.startDate} – ${proj.endDate}`}
                    </div>
                  </div>
                  {proj.url && (
                    <div className="text-[11px] text-indigo-600 hover:underline mb-1 font-mono">
                      {proj.url}
                    </div>
                  )}
                  <ul className="list-disc pl-4 space-y-0.5 mt-1">
                    {proj.description.filter(bullet => bullet.trim() !== "").map((bullet, idx) => (
                      <li key={idx} className={style.bodyClass}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <section className="mb-6">
            <h2 className={style.headingClass}>Education</h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="flex items-start justify-between">
                  <div>
                    <span className={style.subHeadingClass}>
                      {edu.degree} in {edu.fieldOfStudy}
                    </span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-700 text-[13px] font-medium">{edu.school}</span>
                    {edu.location && (
                      <span className="text-slate-400 text-[12px] italic"> - {edu.location}</span>
                    )}
                  </div>
                  <div className={`text-right ${style.metaClass}`}>
                    <div>{edu.startDate} – {edu.endDate}</div>
                    {edu.gpa && <div className="text-[11px] font-bold text-slate-500">GPA: {edu.gpa}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <section>
            <h2 className={style.headingClass}>Certifications & Awards</h2>
            <div className="flex flex-wrap gap-2 text-xs">
              {certifications.filter(cert => cert.trim() !== "").map((cert, index) => (
                <span 
                  key={index} 
                  className="bg-slate-50 text-slate-700 px-2.5 py-1 rounded border border-slate-100 italic"
                >
                  {cert}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
