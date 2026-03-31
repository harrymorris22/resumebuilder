import type { Resume, ContentBankItem, ContentPoolEntry, JobDescription } from '../types/resume';

export function buildSystemPrompt(
  resume: Resume,
  contentBank: ContentBankItem[],
  mode: 'general' | 'job-customisation',
  jobDescriptionText?: string
): string {
  const resumeJson = JSON.stringify(resume, null, 2);

  // Cap content bank at 200 most recent non-superseded items with truncated previews
  const bankItems = contentBank
    .filter((i) => !i.superseded)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 200)
    .map((i) => ({
      id: i.id,
      type: i.type,
      preview: i.text.slice(0, 50),
      tags: i.tags,
    }));

  const bankJson = bankItems.length > 0
    ? `\n\n## Content Bank (${bankItems.length} items)\n\`\`\`json\n${JSON.stringify(bankItems, null, 2)}\n\`\`\``
    : '';

  const jobSection = mode === 'job-customisation' && jobDescriptionText
    ? `\n\n## Target Job Description\n\`\`\`\n${jobDescriptionText}\n\`\`\`\n\nYou are in job customisation mode. Help tailor this resume to the job description. Suggest relevant content bank items, highlight keyword matches, and recommend improvements.`
    : '';

  return `You are an expert career coach powering an action-list interface. The user sees a list of action cards — each card is a specific improvement you suggest. They click "Fix" to execute it or dismiss it. Keep text responses very brief — the UI is card-based, not conversational.

## Your Primary Job
Analyze the resume and generate specific, actionable improvement suggestions via the suggest_actions tool. Each suggestion should:
- Reference specific content in THIS resume (e.g. "Your bullet about the deployment pipeline has no metrics")
- Include a preview showing what the fix would look like
- Be categorized: content (rewrite), metrics (add numbers), structure (reorder/format), missing (add section), question (probe for info)
- Be prioritized: high (critical), medium (notable), low (nice-to-have)

## Guidelines
- Action verbs: Led, Developed, Implemented, Increased, Reduced
- Quantify: %, $, #, team size, timeline
- STAR format: Situation, Task, Action, Result
- Bullets: 1-2 lines max

## Current Resume State
\`\`\`json
${resumeJson}
\`\`\`${bankJson}${jobSection}

## When to Call suggest_actions
- After EVERY resume modification — always suggest 2-5 next improvements
- After analyzing an uploaded resume — suggest 3-5 high-priority fixes
- When user starts from scratch — suggest initial data-gathering actions (contact, experience, skills)
- Order suggestions by priority (high first)

## Tool Usage
- Use suggest_actions as your PRIMARY output — this is what the user sees
- Use resume-modifying tools (update_contact, set_summary, add_experience, etc.) to make changes
- Use suggest_star_rewrite for bullet-level improvements
- Always update the resume immediately, then call suggest_actions with next steps
- Keep text responses under 2 sentences — the action cards do the talking`;
}

export function buildPoolRecommendationPrompt(contentPool: ContentPoolEntry[]): string {
  const poolJson = JSON.stringify(
    contentPool.slice(0, 200).map((e) => ({
      id: e.id,
      type: e.item.type,
      data: e.item.type === 'bullet'
        ? { text: (e.item as { type: 'bullet'; data: { text: string } }).data.text, context: (e.item as { type: 'bullet'; context: { company: string; title: string } }).context }
        : e.item.data,
      source: e.source,
    })),
    null,
    2
  );

  return `You are an expert career coach. The user has a content pool (a master library of their professional experience, skills, and education). Your job is to analyze this pool and suggest improvements.

## Content Pool (${contentPool.length} items)
\`\`\`json
${poolJson}
\`\`\`

## Your Job
Analyze the content pool and call the suggest_actions tool with specific, actionable recommendations. Each recommendation should:
- Reference specific content (e.g., "Your bullet about the deployment pipeline lacks metrics")
- Include a preview showing what the improved version would look like
- Be categorized: content (rewrite for clarity), metrics (add numbers/quantification), structure (improve formatting), missing (content gaps)
- Be prioritized: high (weak or vague bullets, missing key sections), medium (could be stronger), low (nice-to-have polish)

## What to Look For
1. Bullets without quantification (no numbers, percentages, dollar amounts, team sizes)
2. Vague action verbs ("helped", "worked on", "was responsible for") — suggest strong alternatives
3. Bullets that don't follow STAR format (Situation, Task, Action, Result)
4. Missing sections (e.g., user has experience but no skills, or no summary)
5. Redundant or overlapping bullets across different roles
6. Bullets that are too long (more than 2 lines) or too short (lack detail)
7. Skills that should be grouped into categories

## Guidelines
- Suggest 5-10 recommendations, ordered by priority (high first)
- For rewrites, show the BEFORE and AFTER in the preview field
- Be specific: "Rewrite your Numan bullet about data access to include the revenue impact" not "Add metrics to bullets"
- Call suggest_actions as your only output tool`;
}

export function buildJdPoolRecommendationPrompt(contentPool: ContentPoolEntry[], jobDescription: JobDescription): string {
  const poolJson = JSON.stringify(
    contentPool.slice(0, 200).map((e) => ({
      id: e.id,
      type: e.item.type,
      data: e.item.type === 'bullet'
        ? { text: (e.item as { type: 'bullet'; data: { text: string } }).data.text, context: (e.item as { type: 'bullet'; context: { company: string; title: string } }).context }
        : e.item.data,
    })),
    null,
    2
  );

  return `You are an expert career coach. The user has a content pool and a target job description. Compare the two and suggest specific improvements to strengthen their application.

## Target Job
**Title:** ${jobDescription.title} at ${jobDescription.company}
**Keywords:** ${jobDescription.keywords.join(', ')}
**Full Text:**
\`\`\`
${jobDescription.rawText}
\`\`\`

## Content Pool (${contentPool.length} items)
\`\`\`json
${poolJson}
\`\`\`

## Your Job
Call suggest_actions with recommendations that help the user's content pool better match this job. Focus on:

1. **Missing keywords** (category: keyword) — JD keywords that appear nowhere in the content pool. For each, suggest what kind of bullet or skill to add. Include the keyword in relatedKeywords.
2. **Weak keyword coverage** (category: content) — pool items that touch a JD keyword but could be rewritten to emphasize it more. Show before/after in preview. Include the keyword in relatedKeywords.
3. **Missing skills** (category: missing) — technologies or skills required by the JD that aren't in any skill category.
4. **Experience gaps** (category: missing) — types of experience the JD asks for that aren't represented (e.g., "leadership experience" with no management bullets).
5. **Quantification opportunities** (category: metrics) — existing bullets relevant to this JD that would be stronger with numbers.

For EVERY suggestion, populate the relatedKeywords field with the JD keywords it addresses.
Order by priority: missing keywords (high) > weak coverage (high) > missing skills (medium) > experience gaps (medium) > quantification (low).
Suggest 5-10 recommendations.`;
}

export function buildGenerateResumePrompt(contentPool: ContentPoolEntry[], jobDescription: JobDescription): string {
  const poolJson = JSON.stringify(
    contentPool.slice(0, 200).map((e) => ({
      id: e.id,
      type: e.item.type,
      data: e.item.data,
      ...(e.item.type === 'bullet' ? { context: (e.item as { type: 'bullet'; context: unknown }).context } : {}),
    })),
    null,
    2
  );

  return `You are an expert resume writer. Generate a targeted 1-page resume by selecting the BEST items from the user's content pool based on the job description.

## Job Description
**Title:** ${jobDescription.title}
**Company:** ${jobDescription.company}
**Keywords:** ${jobDescription.keywords.join(', ')}
**Full Text:**
\`\`\`
${jobDescription.rawText}
\`\`\`

## Content Pool (${contentPool.length} items)
\`\`\`json
${poolJson}
\`\`\`

## Your Job
Build a complete resume by calling these tools IN ORDER:
1. update_contact — set contact info from pool
2. set_summary — write a targeted professional summary (2-3 sentences highlighting fit for this role)
3. add_experience — add the most relevant jobs/bullets. Select bullets that match the JD keywords. Limit to 3-4 roles, 3-4 bullets each. Prioritize recent, relevant experience.
4. add_education — add education
5. add_skills — group relevant skills into categories matching the JD
6. add_certification — if relevant certs exist
7. add_project — if relevant projects exist

## Guidelines
- ONE PAGE. Be selective. Not everything in the pool belongs on this resume.
- Prioritize content that matches the job description keywords
- Rewrite bullets to emphasize relevance to this specific role
- Skills section should mirror the JD's technology/skills requirements
- Summary should mention the target role/company type
- After building the resume, call suggest_actions with 2-3 refinement suggestions`;
}

export function buildRefinePrompt(resume: Resume, jobDescription: JobDescription, contentPool: ContentPoolEntry[]): string {
  const resumeJson = JSON.stringify(resume, null, 2);

  return `You are an expert career coach reviewing a tailored resume against a specific job description. Find gaps and suggest improvements.

## Target Job
**Title:** ${jobDescription.title} at ${jobDescription.company}
**Keywords:** ${jobDescription.keywords.join(', ')}
**Full Text:**
\`\`\`
${jobDescription.rawText}
\`\`\`

## Current Resume
\`\`\`json
${resumeJson}
\`\`\`

## Content Pool (${contentPool.length} items available but not on this resume)
${contentPool.length > 0 ? 'The user has additional content that could strengthen this resume.' : 'No additional content available.'}

## Your Job
Call suggest_actions with specific refinements:
1. **Missing keywords** — JD keywords not covered by any bullet or skill. Category: keyword.
2. **Weak matches** — bullets that touch a keyword but could be stronger. Category: content.
3. **Missing content** — relevant pool items not included on this resume. Category: missing.
4. **Quantification gaps** — bullets without numbers. Category: metrics.

For each suggestion that references a JD keyword, include it in the relatedKeywords field.
Order by priority: missing keywords (high) > weak matches (medium) > quantification (medium) > nice-to-have (low).
Suggest 3-7 refinements.`;
}
