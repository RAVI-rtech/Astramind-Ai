import React from "react";
import { ResumeData } from "../../types";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Globe, 
  Code2, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages 
} from "lucide-react";

interface TemplateProps {
  resume: ResumeData;
  accentHex: string;
}

export default function TechLeadTemplate({ resume, accentHex }: TemplateProps) {
  const { personalInfo, education, experience, projects, certifications, skills, achievements, languages, sectionTitles } = resume;

  return (
    <div 
      id="resume-printable-area"
      className={`bg-white text-slate-900 shadow-2xl mx-auto w-full   text-[12.5px] leading-relaxed rounded-sm font-sans flex flex-col ${resume.isExtended ? 'is-extended' : 'is-standard'}`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Top Banner Accent */}
      <div 
        className="p-8 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        style={{ backgroundColor: accentHex }}
      >
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          <p className="text-sm font-medium tracking-wider uppercase opacity-90 mt-1">
            {personalInfo.jobTitle || "Tech Lead & Full Stack Engineer"}
          </p>
        </div>

        <div className="flex flex-col text-xs space-y-1 opacity-95 font-medium">
          {personalInfo.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{personalInfo.email}</div>}
          {personalInfo.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{personalInfo.phone}</div>}
          {personalInfo.location && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{personalInfo.location}</div>}
          {personalInfo.githubUrl && <div className="flex items-center gap-1.5"><Github className="w-3.5 h-3.5" />{personalInfo.githubUrl}</div>}
          {personalInfo.linkedinUrl && <div className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" />{personalInfo.linkedinUrl}</div>}
        </div>
      </div>

      {/* 2-Column Body */}
      <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
        {/* Left Sidebar (4 cols) */}
        <div className="md:col-span-4 space-y-6 pr-2 border-r border-slate-100">

          {/* Technical Skills */}
          {skills && skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b-2" style={{ borderColor: accentHex }}>
                {sectionTitles?.skills || "SKILLS & COMPETENCIES"}
              </h2>
              <div className="space-y-3">
                {skills.map((cat, idx) => (
                  <div key={idx}>
                    <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wide mb-1">
                      {cat.category}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.skills.map((sk, skIdx) => (
                        <span 
                          key={skIdx} 
                          className="px-2 py-0.5 text-[10.5px] rounded font-medium bg-slate-100 text-slate-800"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b-2" style={{ borderColor: accentHex }}>
                {sectionTitles?.education || "EDUCATION"}
              </h2>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="text-xs">
                    <div className="font-bold text-slate-900">{edu.degree}</div>
                    <div className="text-slate-700">{edu.school}</div>
                    <div className="text-slate-400 text-[11px]">{edu.startDate} – {edu.endDate} {edu.gpa ? `| GPA: ${edu.gpa}` : ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b-2" style={{ borderColor: accentHex }}>
                {sectionTitles?.certifications || "CERTIFICATIONS"}
              </h2>
              <div className="space-y-2 text-xs">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <div className="font-bold text-slate-900">{cert.name}</div>
                    <div className="text-slate-500 text-[11px]">{cert.issuer} ({cert.date})</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b-2" style={{ borderColor: accentHex }}>
                {sectionTitles?.languages || "LANGUAGES"}
              </h2>
              <div className="space-y-1 text-xs">
                {languages.map((lang) => (
                  <div key={lang.id} className="flex justify-between">
                    <span className="font-semibold text-slate-800">{lang.name}</span>
                    <span className="text-slate-500 text-[11px]">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Main Content (8 cols) */}
        <div className="md:col-span-8 space-y-6">

          {/* Summary */}
          {personalInfo.summary && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b-2" style={{ borderColor: accentHex }}>
                {sectionTitles?.summary || "PROFESSIONAL SUMMARY"}
              </h2>
              <p className="text-slate-700 text-xs leading-relaxed">
                {personalInfo.summary}
              </p>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-3 border-b-2" style={{ borderColor: accentHex }}>
                {sectionTitles?.experience || "WORK EXPERIENCE"}
              </h2>
              <div className="space-y-4">
                {experience.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-xs">{item.jobTitle}</span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {item.startDate} – {item.isCurrent ? "Present" : item.endDate}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-600 mb-1" style={{ color: accentHex }}>
                      {item.company} • {item.location}
                    </div>
                    {item.bulletPoints && item.bulletPoints.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-1 text-slate-700 text-xs">
                        {item.bulletPoints.map((bp, idx) => (
                          <li key={idx}>{bp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-3 border-b-2" style={{ borderColor: accentHex }}>
                {sectionTitles?.projects || "PROJECTS"}
              </h2>
              <div className="space-y-3.5">
                {projects.map((proj) => (
                  <div key={proj.id}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-xs">{proj.title}</span>
                      <span className="text-[11px] text-slate-500">{proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium mb-1">
                      Role: {proj.role} {proj.link ? `| ${proj.link}` : ""}
                    </div>
                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {proj.techStack.map((tech, idx) => (
                          <span key={idx} className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-slate-100 text-slate-700">
                            #{tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-700 text-xs">
                        {proj.bulletPoints.map((bp, idx) => (
                          <li key={idx}>{bp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {achievements && achievements.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b-2" style={{ borderColor: accentHex }}>
                {sectionTitles?.achievements || "HONORS & ACHIEVEMENTS"}
              </h2>
              <div className="space-y-2 text-xs">
                {achievements.map((ach) => (
                  <div key={ach.id}>
                    <span className="font-bold text-slate-900">{ach.title}</span> – <span className="text-slate-600">{ach.organization} ({ach.date})</span>
                    {ach.description && <p className="text-slate-600">{ach.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
