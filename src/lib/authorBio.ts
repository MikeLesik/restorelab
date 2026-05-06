// Author bio data for academy articles.
// v1 = anonymous team byline. Switch to named author at 3-month milestone.
// Used by: ServiceCTA, RelatedGuides, ArticleSchema (BlogPosting/HowTo).

export interface AuthorBio {
  name: string;
  role: string;
  city: string;
  url: string;
  imageUrl?: string;
}

export const defaultAuthor: AuthorBio = {
  name: 'restoreLab Team',
  role: 'Mobile detailing & restoration specialists',
  city: 'Sant Cugat del Vallès',
  url: '/about',
  // imageUrl left undefined for anonymous v1; will be populated when switching to named author
};

// When switching to named author at 3-month milestone, replace defaultAuthor
// with a real Person object and update BlogPosting schema in [slug].astro
// from "Organization" to "Person".
