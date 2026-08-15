import React from "react";
import { ResumeData } from "../../types";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Linkedin, 
  Github, 
  Globe, 
  GraduationCap, 
  Briefcase, 
  FolderKanban, 
  Award, 
  Sparkles, 
  Languages, 
  CheckCircle2 
} from "lucide-react";

interface TemplateProps {
  resume: ResumeData;
  accentHex: string;
}

export default function ModernExecutiveTemplate({ resume, accentHex }: TemplateProps) {
  const { personalInfo, education, experience, projects, certifications, skills, achievements, languages, sectionTitles } = resume;

  return (
    <div 
      id="resume-printable-area"
      className={`bg-white text-slate-900 p-8 sm:p-10 shadow-2xl mx-auto w-full   text-[13px] leading-normal rounded-sm font-sans ${resume.isExtended ? 'is-extended' : 'is-standard'}`}
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      {/* Top Header */}
      <div 
        className="pb-6 mb-6 border-b-2" 
        style={{ borderColor: accentHex }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {personalInfo.fullName || "Your Full Name"}
            </h1>
            <p 
              className="text-base font-semibold mt-1 tracking-wide uppercase"
              style={{ color: accentHex }}
            >
              {personalInfo.jobTitle || "Professional Title"}
            </p>
          </div>

          {/* Contact Details Grid */}
          <div className="flex flex-wrap sm:flex-col sm:items-end gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {personalInfo.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{personalInfo.email}</span>
              </div>
            )}
            {personalInfo.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{personalInfo.phone}</span>
              </div>
            )}
            {personalInfo.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{personalInfo.location}</span>
              </div>
            )}
            {personalInfo.linkedinUrl && (
              <div className="flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5 text-slate-400" />
                <span>{personalInfo.linkedinUrl}</span>
              </div>
            )}
            {personalInfo.githubUrl && (
              <div className="flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>{personalInfo.githubUrl}</span>
              </div>
            )}
            {personalInfo.portfolioUrl && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{personalInfo.portfolioUrl}</span>
              </div>
            )}
          </div>
        </div>

        {/* Executive Summary */}
        {personalInfo.summary && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-slate-700 text-[12.5px] leading-relaxed">
            {personalInfo.summary}
          </div>
        )}
      </div>

      {/* Main Content Layout */}
      <div className="space-y-6">

        {/* Work Experience */}
        {experience && experience.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
              <div className="p-1 rounded text-white" style={{ backgroundColor: accentHex }}>
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {sectionTitles?.experience || "WORK EXPERIENCE"}
              </h2>
            </div>

            <div className="space-y-4">
              {experience.map((item) => (
                <div key={item.id} className="text-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between font-medium">
                    <span className="font-bold text-slate-900 text-sm">{item.jobTitle}</span>
                    <span className="text-xs text-slate-500 font-normal">
                      {item.startDate} – {item.isCurrent ? "Present" : item.endDate} | {item.location}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mb-1.5">
                    {item.company}
                  </div>
                  {item.bulletPoints && item.bulletPoints.length > 0 && (
                    <ul className="list-disc list-outside pl-4 space-y-1 text-slate-700 text-xs">
                      {item.bulletPoints.map((bp, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {bp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects && projects.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 pb-1 border-b border-slate-200">
              <div className="p-1 rounded text-white" style={{ backgroundColor: accentHex }}>
                <FolderKanban className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {sectionTitles?.projects || "PROJECTS"}
              </h2>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => (
                <div key={proj.id}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <span className="font-bold text-slate-900">
                      {proj.title} <span className="font-normal text-slate-500">({proj.role})</span>
                    </span>
                    <span className="text-xs text-slate-500">
                      {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""} {proj.link ? `| ${proj.link}` : ""}
                    </span>
                  </div>
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 my-1">
                      {proj.techStack.map((tech, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                          {tech}
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
          </section>
        )}

        {/* Skills */}
        {skills && skills.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
              <div className="p-1 rounded text-white" style={{ backgroundColor: accentHex }}>
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {sectionTitles?.skills || "SKILLS & COMPETENCIES"}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {skills.map((cat, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="font-bold text-slate-900 block mb-1" style={{ color: accentHex }}>
                    {cat.category}:
                  </span>
                  <div className="flex flex-wrap gap-1 text-slate-700">
                    {cat.skills.join(" • ")}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education & Certifications Side-by-Side or Stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Education */}
          {education && education.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                <div className="p-1 rounded text-white" style={{ backgroundColor: accentHex }}>
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {sectionTitles?.education || "EDUCATION"}
                </h2>
              </div>
              <div className="space-y-2">
                {education.map((edu) => (
                  <div key={edu.id} className="text-xs">
                    <div className="font-bold text-slate-900">{edu.degree}</div>
                    <div className="text-slate-600">{edu.school}, {edu.location}</div>
                    <div className="text-slate-400">{edu.startDate} – {edu.endDate} {edu.gpa ? `| GPA: ${edu.gpa}` : ""}</div>
                    {edu.highlights && <div className="text-slate-600 italic mt-0.5">{edu.highlights}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                <div className="p-1 rounded text-white" style={{ backgroundColor: accentHex }}>
                  <Award className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  {sectionTitles?.certifications || "CERTIFICATIONS"}
                </h2>
              </div>
              <div className="space-y-2">
                {certifications.map((cert) => (
                  <div key={cert.id} className="text-xs">
                    <div className="font-bold text-slate-900">{cert.name}</div>
                    <div className="text-slate-600">{cert.issuer} ({cert.date})</div>
                    {cert.credentialUrl && <div className="text-slate-400 text-[10px]">{cert.credentialUrl}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Achievements & Languages */}
        {(achievements?.length > 0 || languages?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {achievements && achievements.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                  <div className="p-1 rounded text-white" style={{ backgroundColor: accentHex }}>
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    {sectionTitles?.achievements || "HONORS & ACHIEVEMENTS"}
                  </h2>
                </div>
                <div className="space-y-2 text-xs">
                  {achievements.map((ach) => (
                    <div key={ach.id}>
                      <span className="font-bold text-slate-900">{ach.title}</span> – <span className="text-slate-600">{ach.organization} ({ach.date})</span>
                      {ach.description && <p className="text-slate-600">{ach.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {languages && languages.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-2 pb-1 border-b border-slate-200">
                  <div className="p-1 rounded text-white" style={{ backgroundColor: accentHex }}>
                    <Languages className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                    {sectionTitles?.languages || "LANGUAGES"}
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {languages.map((lang) => (
                    <div key={lang.id} className="bg-slate-100 px-2.5 py-1 rounded text-slate-800">
                      <span className="font-bold">{lang.name}</span> <span className="text-slate-500">({lang.proficiency})</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
