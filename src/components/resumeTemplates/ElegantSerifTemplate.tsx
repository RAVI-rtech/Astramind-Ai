import React from "react";
import { ResumeData } from "../../types";

interface TemplateProps {
  resume: ResumeData;
  accentHex: string;
}

export default function ElegantSerifTemplate({ resume, accentHex }: TemplateProps) {
  const { personalInfo, education, experience, projects, certifications, skills, achievements, languages, sectionTitles } = resume;

  return (
    <div 
      id="resume-printable-area"
      className={`bg-white text-slate-900 p-8 sm:p-12 shadow-2xl mx-auto w-full   text-[13px] leading-relaxed rounded-sm font-serif ${resume.isExtended ? 'is-extended' : 'is-standard'}`}
      style={{ fontFamily: "'Georgia', 'Garamond', 'Times New Roman', serif" }}
    >
      {/* Top Header */}
      <div className="text-center pb-4 mb-5 border-b-2" style={{ borderColor: accentHex }}>
        <h1 className="text-3xl font-normal tracking-wide text-slate-900 font-serif">
          {personalInfo.fullName || "Your Full Name"}
        </h1>
        <p className="text-sm italic text-slate-600 mt-1 font-sans tracking-wide">
          {personalInfo.jobTitle || "Professional Title"}
        </p>

        <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-3 font-sans">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.location && personalInfo.phone && <span>•</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.phone && personalInfo.email && <span>•</span>}
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.linkedinUrl && <span>•</span>}
          {personalInfo.linkedinUrl && <span>{personalInfo.linkedinUrl}</span>}
          {personalInfo.githubUrl && <span>•</span>}
          {personalInfo.githubUrl && <span>{personalInfo.githubUrl}</span>}
        </div>
      </div>

      {/* Summary */}
      {personalInfo.summary && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentHex }}>
            {sectionTitles?.summary || "PROFESSIONAL SUMMARY"}
          </h2>
          <p className="text-slate-800 text-[12.5px] italic leading-relaxed">
            "{personalInfo.summary}"
          </p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2.5 font-sans" style={{ color: accentHex }}>
            {sectionTitles?.experience || "WORK EXPERIENCE"}
          </h2>
          <div className="space-y-4">
            {experience.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span className="text-sm font-semibold">{item.jobTitle}</span>
                  <span className="text-xs font-normal text-slate-500 font-sans">
                    {item.startDate} – {item.isCurrent ? "Present" : item.endDate}
                  </span>
                </div>
                <div className="text-xs italic text-slate-600 mb-1 font-sans">
                  {item.company} | {item.location}
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
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2.5 font-sans" style={{ color: accentHex }}>
            {sectionTitles?.projects || "PROJECTS"}
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{proj.title} <span className="font-normal italic text-slate-600">({proj.role})</span></span>
                  <span className="text-xs font-normal text-slate-500 font-sans">{proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""}</span>
                </div>
                {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                  <ul className="list-disc list-outside pl-4 mt-0.5 space-y-0.5 text-slate-700 text-xs">
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

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentHex }}>
            {sectionTitles?.education || "EDUCATION"}
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs">
                <div className="flex justify-between items-baseline font-bold text-slate-900">
                  <span>{edu.degree}</span>
                  <span className="font-normal text-slate-500 font-sans">{edu.startDate} – {edu.endDate}</span>
                </div>
                <div className="italic text-slate-600">{edu.school}, {edu.location} {edu.gpa ? `(GPA: ${edu.gpa})` : ""}</div>
                {edu.highlights && <div className="text-slate-600 text-[11px] font-sans mt-0.5">{edu.highlights}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills & Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {skills && skills.length > 0 && (
          <section className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentHex }}>
              {sectionTitles?.skills || "SKILLS & COMPETENCIES"}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-800 font-sans">
              {skills.map((cat, idx) => (
                <div key={idx}>
                  <span className="font-bold text-slate-900">{cat.category}: </span>
                  <span className="text-slate-700">{cat.skills.join(" • ")}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications && certifications.length > 0 && (
          <section className="mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2 font-sans" style={{ color: accentHex }}>
              {sectionTitles?.certifications || "CERTIFICATIONS"}
            </h2>
            <div className="space-y-1.5 text-xs text-slate-800 font-sans">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <span className="font-bold text-slate-900">{cert.name}</span> – <span className="text-slate-600">{cert.issuer} ({cert.date})</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
