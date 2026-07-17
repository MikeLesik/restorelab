// Author bio data for academy articles.
// Used by: ServiceCTA, RelatedGuides, BlogPosting schema in academy/[slug].astro.

export interface AuthorBio {
  name: string;
  role: string;
  city: string;
  url: string;
  imageUrl?: string;
}

export const defaultAuthor: AuthorBio = {
  name: 'Miguel',
  role: 'Founder & Lead Technician',
  city: 'Sant Cugat del Vallès',
  url: '/about',
  // imageUrl: populate once a real founder photo lands in /images/team/founder.jpg
};
