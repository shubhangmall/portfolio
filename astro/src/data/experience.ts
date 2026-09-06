import type { ExperienceRecord } from "../lib/portfolio/types";

export interface ExperienceEntry extends ExperienceRecord {
  id: string;
  companyUrl: string;
}

export const experience: ExperienceEntry[] = [
  {
    id: "cotality-senior-software-engineer",
    employer: "Cotality",
    role: "Senior Software Engineer",
    dateRange: "July 2024 - Present",
    companyUrl: "https://www.cotality.com/",
    details: [
      "Led cross-functional teams of seven engineers, made critical architectural decisions for scalable API design using Ruby on Rails, and drove the modernization of legacy systems while managing complex integrations with microservices for mortgage platform components.",
      "Spearheaded major UI/UX redesigns that directly impacted business metrics, achieving 33% increase in user satisfaction and 25% growth in client acquisitions, while collaborating with stakeholders to align technical solutions with strategic business objectives.",
      "Championed the implementation of robust testing frameworks that eliminated 100% of known bugs, established best practices that improved deployment efficiency by 20%, and fostered a culture of continuous improvement across development teams.",
    ],
    technologies: ["Ruby on Rails", "microservices", "API design"],
  },
  {
    id: "cotality-software-engineer",
    employer: "Cotality",
    role: "Software Engineer",
    dateRange: "March 2023 - June 2024",
    companyUrl: "https://www.cotality.com/",
    details: [
      "Developed new React components using Material-UI framework and built API endpoints with Ruby on Rails, contributing to the redesign of the Lender Portal and mortgage pricing tools while working closely with senior team members and product designers.",
      "Participated in Agile development processes, working with cross-functional teams including QA, DevOps, and product managers to deliver features and enhancements, while utilizing tools like Postman, Splunk, and automated testing frameworks.",
      "Implemented TypeScript-based testing solutions and contributed to improving test coverage and code reusability, while collaborating on bug fixes and performance optimizations that supported increased user capacity and improved application reliability.",
    ],
    technologies: ["React", "Material-UI", "Ruby on Rails", "Postman", "Splunk", "TypeScript"],
  },
  {
    id: "roostify-software-engineer-support",
    employer: "Roostify [acquired by Cotality]",
    role: "Software Engineer IV, Technical Support",
    dateRange: "July 2021 - February 2023",
    companyUrl: "https://www.businesswire.com/news/home/20230222005850/en/CoreLogic-Acquires-Roostify-Expanding-Digital-Mortgage-Capabilities",
    details: [
      "Led resolution of high-priority client escalations and complex technical issues by conducting comprehensive root cause analysis through code and server log investigation, ensuring 100% customer satisfaction while managing strategic support cases that directly impacted client relationships and business outcomes.",
      "Collaborated with DevOps, QA, and product teams to troubleshoot, fix, and deploy solutions across Ruby on Rails and Java environments, while contributing to new feature development and maintaining legacy applications using React, JavaScript, and TypeScript in fast-paced, deadline-driven scenarios.",
      "Developed comprehensive knowledge base resources and training programs that enhanced team capabilities, while streamlining support processes through Jira and Zendesk management, ultimately reducing escalation times and improving overall technical support efficiency across the organization.",
    ],
    technologies: ["Ruby on Rails", "Java", "React", "JavaScript", "TypeScript", "Jira", "Zendesk"],
  },
  {
    id: "robocart-developer",
    employer: "Robocart.ai",
    role: "Developer",
    dateRange: "January 2021 - June 2021",
    companyUrl: "https://www.meditab.com/",
    details: [
      "Delivered end-to-end website solutions by collaborating directly with clients to design and develop custom web applications using HTML, CSS, JavaScript, Python, and C++, while creating high-fidelity prototypes and conducting comprehensive quality assurance testing that ensured optimal user experience, performance, and cross-functional team alignment on tight project timelines.",
    ],
    technologies: ["HTML", "CSS", "JavaScript", "Python", "C++"],
  },
  {
    id: "longan-vision-software-developer",
    employer: "Longan Vision",
    role: "Software Developer",
    dateRange: "September 2019 - December 2020",
    companyUrl: "https://www.longanvision.com/",
    details: [
      "Built functional web applications using Python, JavaScript, HTML/CSS with PostgreSQL/AWS S3 integration, while effectively communicating technical concepts to C-level executives and securing $2,000 in grant funding by presenting solutions to industry investors and stakeholders.",
    ],
    technologies: ["Python", "JavaScript", "HTML/CSS", "PostgreSQL", "AWS S3"],
  },
  {
    id: "loblaw-it-analyst-intern",
    employer: "Loblaw Companies Limited",
    role: "Information Technology Consumer Solutions Delivery Analyst Intern",
    dateRange: "May 2018 - August 2019",
    companyUrl: "https://www.loblaw.ca/",
    details: [
      "Led comprehensive cybersecurity operations by configuring security software, implementing enterprise-wide security standards, and executing incident response protocols while managing vulnerability assessments through SIEM monitoring and ServiceNow IT Service Management, successfully coordinating cross-functional teams with major consulting partners (Accenture, Cognizant, Deloitte) and translating complex technical security matters to C-level executives in Agile environments.",
    ],
    technologies: ["SIEM", "ServiceNow", "Agile", "cybersecurity"],
  },
];
