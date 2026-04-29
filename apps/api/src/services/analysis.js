import fs from 'fs';
import path from 'path';

const normalizeText = (value = '') => value.toLowerCase();

const loadTaxonomies = () => {
  try {
    const file = path.join(new URL(import.meta.url).pathname, '..', 'data', 'taxonomies.json');
    const raw = fs.readFileSync(file, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
};

const taxonomies = loadTaxonomies();

export const analyzeCvText = (inputText = '', domain = 'technology') => {
  const text = normalizeText(inputText);
  const detectedSkills = [];

  const domainMap = taxonomies[domain] || {};

  for (const [skill, keywords] of Object.entries(domainMap)) {
    const matched = keywords.some((keyword) => text.includes(keyword));
    if (matched) detectedSkills.push(skill);
  }

  const fallbackSkills = detectedSkills.length > 0 ? detectedSkills : ['general skills', 'communication'];

  // Generic gaps can be refined per-domain later; keep safe defaults
  const defaultGaps = ['advanced knowledge', 'domain-specific certification', 'deployment'];
  const gaps = defaultGaps.filter((gap) => !text.includes(gap));

  return {
    extractedSkills: fallbackSkills,
    skillGap: gaps,
    recommendation: [
      `Study core topics for ${domain}`,
      'Do at least one hands-on project',
      'Document and publish your work (portfolio)'
    ],
    confidence: detectedSkills.length > 0 ? 0.85 : 0.45,
    domain
  };
};
