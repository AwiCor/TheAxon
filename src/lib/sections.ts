export interface Section {
  title: string;
  /** One-line dek shown under the section name. */
  description: string;
  /** Longer introduction for the section landing page. */
  intro: string;
  /** CSS custom-property name (without --) for this section's signature hue. */
  color: string;
}

export const SECTIONS = {
  neurology: {
    title: 'Neurology',
    description: 'Mapping the architecture of the mind',
    intro:
      'Papers on the nervous system — how circuits form, adapt, and fail; ' +
      'how signals become memory, perception, and thought.',
    color: 'synapse-blue',
  },
  endocrinology: {
    title: 'Endocrinology',
    description: 'The chemical language of the body',
    intro:
      'Papers on hormones and the systems they govern — the slow signalling ' +
      'that sets rhythm, growth, metabolism, and mood.',
    color: 'hormonal-amber',
  },
} as const satisfies Record<string, Section>;

export type SectionId = keyof typeof SECTIONS;

export const SECTION_IDS = Object.keys(SECTIONS) as [SectionId, ...SectionId[]];
