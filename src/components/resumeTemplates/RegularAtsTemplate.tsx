import React from "react";
import { ResumeData } from "../../types";

interface TemplateProps {
  resume: ResumeData;
  accentHex?: string;
}

export default function RegularAtsTemplate({ resume }: TemplateProps) {
  const {
    personalInfo,
    education,
    experience,
    projects,
    certifications,
    skills,
    achievements,
    languages,
    sectionTitles,
  } = resume;

  // Filter skills to only non-empty categories
  const validSkills = (skills || []).filter(
    (cat) => cat && cat.category && cat.skills && cat.skills.filter((s) => s.trim()).length > 0
  );

  return (
    <div
      id="resume-printable-area"
      className={`bg-white text-black p-8 sm:p-10 shadow-2xl mx-auto w-full max-w-[210mm] min-h-[297mm] text-[12px] leading-normal font-sans box-border ${resume.isExtended ? 'is-extended' : 'is-standard'}`}
      style={{
        fontFamily: "'Inter', 'Helvetica Neue', 'Arial', sans-serif",
        color: "#111827",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Full Name & 2. Professional Title & 3. Contact Information */}
      <div className="text-center mb-4 pb-2 border-b border-gray-400">
        {personalInfo.fullName && (
          <h1 className="text-2xl font-bold tracking-tight text-black uppercase mb-0.5">
            {personalInfo.fullName}
          </h1>
        )}
        {personalInfo.jobTitle && (
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            {personalInfo.jobTitle}
          </p>
        )}

        {/* Contact Information */}
        <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-[11px] text-gray-700 font-normal">
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.phone && personalInfo.email && <span className="text-gray-400">•</span>}
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.email && personalInfo.location && <span className="text-gray-400">•</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.linkedinUrl && (
            <>
              <span className="text-gray-400">•</span>
              <span>{personalInfo.linkedinUrl}</span>
            </>
          )}
          {personalInfo.githubUrl && (
            <>
              <span className="text-gray-400">•</span>
              <span>{personalInfo.githubUrl}</span>
            </>
          )}
          {personalInfo.portfolioUrl && (
            <>
              <span className="text-gray-400">•</span>
              <span>{personalInfo.portfolioUrl}</span>
            </>
          )}
        </div>
      </div>

      {/* 4. Professional Summary (2-4 lines) */}
      {personalInfo.summary && personalInfo.summary.trim() !== "" && (
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-gray-800 pb-0.5 mb-1.5">
            {sectionTitles?.summary || "PROFESSIONAL SUMMARY"}
          </h2>
          <p className="text-[11.5px] leading-relaxed text-gray-800">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* 5. Education */}
      {education && education.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-gray-800 pb-0.5 mb-1.5">
            {sectionTitles?.education || "EDUCATION"}
          </h2>
          <div className="space-y-2">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline font-bold text-black text-[12px]">
                  <span>{edu.school}</span>
                  <span className="font-semibold text-gray-700 text-[11px]">
                    {edu.startDate} – {edu.endDate} {edu.location ? `| ${edu.location}` : ""}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-[11.5px] text-gray-800">
                  <span className="italic">{edu.degree}</span>
                  {edu.gpa && <span className="font-semibold text-gray-700">GPA / Score: {edu.gpa}</span>}
                </div>
                {edu.highlights && (
                  <p className="text-[11px] text-gray-700 mt-0.5">{edu.highlights}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Technical Skills */}
      {validSkills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-gray-800 pb-0.5 mb-1.5">
            {sectionTitles?.skills || "TECHNICAL SKILLS"}
          </h2>
          <div className="space-y-1 text-[11.5px] text-gray-800">
            {validSkills.map((cat, idx) => (
              <div key={idx} className="flex items-start">
                <span className="font-bold text-black min-w-[170px] shrink-0">{cat.category}:</span>
                <span className="text-gray-800">{cat.skills.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-gray-800 pb-0.5 mb-1.5">
            {sectionTitles?.projects || "PROJECTS"}
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex justify-between items-baseline font-bold text-black text-[12px]">
                  <span>
                    {proj.title} {proj.role ? `(${proj.role})` : ""}
                  </span>
                  <span className="font-semibold text-gray-700 text-[11px]">
                    {proj.startDate} {proj.endDate ? `– ${proj.endDate}` : ""} {proj.link ? `| ${proj.link}` : ""}
                  </span>
                </div>
                {proj.techStack && proj.techStack.length > 0 && (
                  <div className="text-[11px] text-gray-700 font-semibold my-0.5">
                    Technologies: {proj.techStack.join(", ")}
                  </div>
                )}
                {proj.bulletPoints && proj.bulletPoints.length > 0 && (
                  <ul className="list-disc list-outside pl-4 space-y-0.5 text-[11.5px] text-gray-800">
                    {proj.bulletPoints.map((bp, idx) => (
                      <li key={idx} className="leading-snug">{bp}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Experience (if available) */}
      {experience && experience.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-gray-800 pb-0.5 mb-1.5">
            {sectionTitles?.experience || "EXPERIENCE"}
          </h2>
          <div className="space-y-3">
            {experience.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between items-baseline font-bold text-black text-[12px]">
                  <span>
                    {item.company} – <span className="font-semibold italic">{item.jobTitle}</span>
                  </span>
                  <span className="font-semibold text-gray-700 text-[11px]">
                    {item.startDate} – {item.isCurrent ? "Present" : item.endDate} {item.location ? `| ${item.location}` : ""}
                  </span>
                </div>
                {item.bulletPoints && item.bulletPoints.length > 0 && (
                  <ul className="list-disc list-outside pl-4 mt-1 space-y-0.5 text-[11.5px] text-gray-800">
                    {item.bulletPoints.map((bp, idx) => (
                      <li key={idx} className="leading-snug">{bp}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 9. Certifications */}
      {certifications && certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-gray-800 pb-0.5 mb-1.5">
            {sectionTitles?.certifications || "CERTIFICATIONS"}
          </h2>
          <div className="space-y-1 text-[11.5px]">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex justify-between items-baseline">
                <div className="text-gray-800">
                  <span className="font-bold text-black">{cert.name}</span> – {cert.issuer}
                  {cert.credentialUrl && <span className="text-gray-600 text-[10.5px]"> ({cert.credentialUrl})</span>}
                </div>
                <span className="font-semibold text-gray-700 text-[11px]">{cert.date}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 10. Achievements */}
      {achievements && achievements.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-gray-800 pb-0.5 mb-1.5">
            {sectionTitles?.achievements || "ACHIEVEMENTS"}
          </h2>
          <div className="space-y-1.5">
            {achievements.map((ach) => (
              <div key={ach.id} className="text-[11.5px]">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-black">{ach.title}</span>
                  <span className="font-semibold text-gray-700 text-[11px]">
                    {ach.organization} | {ach.date}
                  </span>
                </div>
                {ach.description && <p className="text-gray-700 mt-0.5 text-[11px]">{ach.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 11. Languages */}
      {languages && languages.length > 0 && (
        <section className="mb-2">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-black border-b border-gray-800 pb-0.5 mb-1.5">
            {sectionTitles?.languages || "LANGUAGES"}
          </h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-gray-800">
            {languages.map((lang) => (
              <div key={lang.id}>
                <span className="font-bold text-black">{lang.name}:</span> {lang.proficiency}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
