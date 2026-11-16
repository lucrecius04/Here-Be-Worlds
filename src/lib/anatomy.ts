export type AnatomyTocItem = {
  id: string;
  title: string;
};

export type AnatomyDoc = {
  title: string;
  byline: string;
  lead: string;
  markdown: string;
  toc: AnatomyTocItem[];
};

export function loadAnatomy(): AnatomyDoc {
  return {
    title: 'Anatomie herního lore',
    byline: '',
    lead: '',
    markdown: '',
    toc: [],
  };
}
