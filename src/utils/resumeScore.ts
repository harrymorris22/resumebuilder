import type { Resume } from '../types/resume';

export interface ScoreBreakdown {
  total: number;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    tip: string;
  }[];
}

export function calculateResumeScore(resume: Resume): ScoreBreakdown {
  const categories: ScoreBreakdown['categories'] = [];

  // 1. Contact completeness (15 points)
  const contact = resume.sections.find((s) => s.content.type === 'contact');
  let contactScore = 0;
  if (contact?.content.type === 'contact') {
    const d = contact.content.data;
    if (d.fullName) contactScore += 3;
    if (d.email) contactScore += 3;
    if (d.phone) contactScore += 3;
    if (d.location) contactScore += 3;
    if (d.linkedin || d.github || d.website) contactScore += 3;
  }
  categories.push({
    name: 'Contact Info',
    score: contactScore,
    maxScore: 15,
    tip: contactScore < 15 ? 'Add missing contact details or a LinkedIn/GitHub link' : 'Complete',
  });

  // 2. Summary quality (15 points)
  const summary = resume.sections.find((s) => s.content.type === 'summary');
  let summaryScore = 0;
  if (summary?.content.type === 'summary') {
    const text = summary.content.data.text;
    if (text.length > 0) summaryScore += 5;
    if (text.length > 50) summaryScore += 5;
    if (text.length > 100) summaryScore += 5;
  }
  categories.push({
    name: 'Summary',
    score: summaryScore,
    maxScore: 15,
    tip: summaryScore === 0 ? 'Add a professional summary' : summaryScore < 15 ? 'Expand your summary with more detail' : 'Complete',
  });

  // 3. Experience depth (30 points)
  const experience = resume.sections.find((s) => s.content.type === 'experience');
  let expScore = 0;
  if (experience?.content.type === 'experience') {
    const items = experience.content.data.items;
    // Has at least one role (10 points)
    if (items.length > 0) expScore += 10;
    // Bullets quality: check for metrics (numbers, %, $)
    const allBullets = items.flatMap((item) => item.bullets);
    const bulletsWithMetrics = allBullets.filter((b) => /\d/.test(b));
    if (allBullets.length > 0) {
      // At least 3 bullets total (5 points)
      if (allBullets.length >= 3) expScore += 5;
      // At least 50% have metrics (10 points)
      const metricRatio = bulletsWithMetrics.length / allBullets.length;
      expScore += Math.min(10, Math.round(metricRatio * 10));
      // Strong action verbs at start (5 points)
      const actionVerbs = ['led', 'developed', 'implemented', 'increased', 'reduced', 'managed', 'designed', 'built', 'launched', 'created', 'optimized', 'improved', 'delivered', 'achieved', 'drove', 'established'];
      const bulletsWithVerbs = allBullets.filter((b) =>
        actionVerbs.some((v) => b.toLowerCase().startsWith(v))
      );
      if (bulletsWithVerbs.length > 0) expScore += Math.min(5, Math.round((bulletsWithVerbs.length / allBullets.length) * 5));
    }
  }
  categories.push({
    name: 'Experience',
    score: Math.min(30, expScore),
    maxScore: 30,
    tip: expScore === 0 ? 'Add work experience' : expScore < 20 ? 'Add metrics and strong action verbs to bullets' : 'Strong',
  });

  // 4. Education (10 points)
  const education = resume.sections.find((s) => s.content.type === 'education');
  let eduScore = 0;
  if (education?.content.type === 'education') {
    if (education.content.data.items.length > 0) eduScore += 10;
  }
  categories.push({
    name: 'Education',
    score: eduScore,
    maxScore: 10,
    tip: eduScore === 0 ? 'Add your education' : 'Complete',
  });

  // 5. Skills (15 points)
  const skills = resume.sections.find((s) => s.content.type === 'skills');
  let skillScore = 0;
  if (skills?.content.type === 'skills') {
    const cats = skills.content.data.categories;
    if (cats.length > 0) skillScore += 5;
    if (cats.length >= 2) skillScore += 5;
    const totalSkills = cats.reduce((sum, c) => sum + c.skills.length, 0);
    if (totalSkills >= 5) skillScore += 5;
  }
  categories.push({
    name: 'Skills',
    score: skillScore,
    maxScore: 15,
    tip: skillScore === 0 ? 'Add your skills' : skillScore < 15 ? 'Add more skill categories' : 'Complete',
  });

  // 6. Section completeness bonus (15 points)
  const hasProjects = resume.sections.some((s) => s.content.type === 'projects' && s.content.data.items.length > 0);
  const hasCerts = resume.sections.some((s) => s.content.type === 'certifications' && s.content.data.items.length > 0);
  let bonusScore = 0;
  if (hasProjects) bonusScore += 8;
  if (hasCerts) bonusScore += 7;
  categories.push({
    name: 'Extras',
    score: bonusScore,
    maxScore: 15,
    tip: bonusScore === 0 ? 'Add projects or certifications' : bonusScore < 15 ? 'Add projects or certifications for a stronger profile' : 'Complete',
  });

  const total = categories.reduce((sum, c) => sum + c.score, 0);

  return { total, categories };
}
