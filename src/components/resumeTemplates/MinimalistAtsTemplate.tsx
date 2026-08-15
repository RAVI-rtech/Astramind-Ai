import React from "react";
import { ResumeData } from "../../types";

interface TemplateProps {
  resume: ResumeData;
  accentHex: string;
}

export default function MinimalistAtsTemplate({ resume, accentHex }: TemplateProps) {
  const { personalInfo, education, experience, projects, certifications, skills, achievements, languages, sectionTitles } = resume;

  return (
    <div 
      id="resume-printable-area"
      className={`bg-white text-slate-900 p-8 sm:p-12 shadow-2xl mx-auto w-full   text-[12.5px] leading-relaxed rounded-sm font-sans ${resume.isExtended ? 'is-extended' : 'is-standard'}`}
      style={{ fontFamily: "'Arial', 'Helvetica', sans-serif" }}
    >
      {/* Centered ATS Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide text-black">
          {personalInfo.fullName || "FIRSTNAME LASTNAME"}
        </h1>
        <p className="text-sm font-bold text-slate-700 mt-0.5 uppercase tracking-wider">
          {personalInfo.jobTitle || "PROFESSIONAL TITLE"}
        </p>

        <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-slate-700 mt-2 font-normal">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.location && personalInfo.phone && <span>•</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.phone && personalInfo.email && <span>•</span>}
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.linkedinUrl && <span>•</span>}
          {personalInfo.linkedinUrl && <span>{personalInfo.linkedinUrl}</span>}
          {personalInfo.githubUrl && <span>•</span>}
          {personalInfo.githubUrl && <span>{personalInfo.githubUrl}</span>}
          {personalInfo.portfolioUrl && <span>•</span>}
          {personalInfo.portfolioUrl && <span>{personalInfo.portfolioUrl}</span>}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-900 pb-0.5 mb-2">
            {sectionTitles?.summary || "PROFESSIONAL SUMMARY"}
          </h2>
          <p className="text-slate-800 text-[12px] leading-relaxed">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-900 pb-0.5 mb-2">
            {sectionTitles?.experience || "WORK EXPERIENCE"}
          </h2>
          <div className="space-y-3.5">
            {experience.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                  <span>{item.company} – {item.jobTitle}</span>
                  <span className="font-normal text-slate-700">
                    {item.startDate} – {item.isCurrent ? "Present" : item.endDate} | {item.location}
                  </span>
                </div>
                {item.bulletPoints && item.bulletPoints.length > 0 && (
                  <ul className="list-disc list-outside pl-4 mt-1 space-y-1 text-slate-800 text-[12px]">
                    {item.bulletPoints.map((bp, idx) => (
                      <li key={idx}>{bp}</li>
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
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-900 pb-0.5 mb-2">
            {sectionTitles?.projects || "PROJECTS"}
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-900 text-xs">
                  <span>{proj.title} ({proj.role})</span>
                  <span className="font-normal text-slate-700">
                    {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""} {proj.link ? `| ${proj.link}` : ""}
                  </span>
                </div>
                {proj.techStack && proj.techStack.length > 0 && (
                  <div className="text-xs text-slate-700 font-semibold my-0.5">
                    Technologies: {proj.techStack.join(", ")}
                  </div>
                )}
                {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-slate-800 text-[12px]">
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
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-900 pb-0.5 mb-2">
            {sectionTitles?.skills || "SKILLS & COMPETENCIES"}
          </h2>
          <div className="space-y-1 text-xs text-slate-800">
            {skills.map((cat, idx) => (
              <div key={idx}>
                <span className="font-bold text-black">{cat.category}: </span>
                <span>{cat.skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-900 pb-0.5 mb-2">
            {sectionTitles?.education || "EDUCATION"}
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{edu.school} – {edu.degree}</span>
                  <span className="font-normal text-slate-700">{edu.startDate} – {edu.endDate}</span>
                </div>
                {edu.gpa && <div className="text-slate-700">GPA: {edu.gpa}</div>}
                {edu.highlights && <div className="text-slate-700 italic">{edu.highlights}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certifications && certifications.length > 0 && (
          <section className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-900 pb-0.5 mb-2">
              {sectionTitles?.certifications || "CERTIFICATIONS"}
            </h2>
            <div className="space-y-1 text-xs text-slate-800">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <span className="font-bold">{cert.name}</span> – {cert.issuer} ({cert.date})
                </div>
              ))}
            </div>
          </section>
        )}

        {languages && languages.length > 0 && (
          <section className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-black border-b border-slate-900 pb-0.5 mb-2">
              {sectionTitles?.languages || "LANGUAGES"}
            </h2>
            <div className="text-xs text-slate-800">
              {languages.map((lang) => `${lang.name} (${lang.proficiency})`).join(" • ")}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
