// Author bio data for academy articles.
// Used by: ServiceCTA, RelatedGuides, BlogPosting schema in academy/[slug].astro.

export interface AuthorBio {
  name: string;
  role: string;
  city: string;
  url: string;
  imageUrl?: string;
}

// Must match the founder identity on /about and the `legalName` in the
// site-wide schema — a byline that names a different person than the entity
// it links to reads as fake authorship to both Google and AI engines.
export const defaultAuthor: AuthorBio = {
  name: 'Mikhail Lesik',
  role: 'Founder & Lead Technician',
  city: 'Sant Cugat del Vallès',
  url: '/about',
  // imageUrl: populate once a real founder photo lands in /images/team/founder.jpg
};
