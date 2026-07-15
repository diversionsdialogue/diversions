import groq from "groq";

/**
 * GROQ queries for all content types
 * Generated from PROJECT_CONTENT_MODEL
 */

// Shared projection for the Portable Text `body` array. Dereferences image
// assets that live inside body blocks (inline images, CTA/video posters) so the
// renderer has resolved asset data. Kept in one place to stay in parity across
// post / service / workItem.
const bodyProjection = groq`
  body[] {
    ...,
    _type == "image" => { ..., asset-> },
    _type == "ctaBlock" => { ..., image { ..., asset-> } },
    _type == "quoteBlock" => { ..., image { ..., asset-> } },
    _type == "videoBlock" => { ..., poster { ..., asset-> } }
  }
`;

// Shared projection for the optional `seo` object. Dereferences the ogImage
// asset the same way the document image/thumbnail fields do (asset-> + alt),
// so transforms can build a URL via urlFor(). Optional everywhere: if the
// document has no `seo`, this projects to null and nothing breaks.
// Wired up in <head>/sitemap later by the seo-astro agent.
const seoProjection = groq`
  seo {
    metaDescription,
    noindex,
    canonicalUrl,
    ogImage {
      asset->,
      alt
    }
  }
`;

// Team Members
export const getAllTeamMembersQuery = groq`
  *[_type == "teamMember"] | order(_createdAt desc) {
    _id,
    name,
    "slug": slug.current,
    role,
    intro,
    education,
    experience,
    avatar {
      asset->,
      alt
    },
    body
  }
`;

export const getTeamMemberByIdQuery = groq`
  *[_type == "teamMember" && _id == $id][0] {
    _id,
    name,
    "slug": slug.current,
    role,
    intro,
    education,
    experience,
    avatar {
      asset->,
      alt
    },
    body
  }
`;

// Work Items
export const getAllWorkItemsQuery = groq`
  *[_type == "workItem"] | order(_createdAt desc) {
    _id,
    "slug": slug.current,
    link,
    company,
    year,
    client,
    work,
    bijschrift,
    statement,
    credits[] {
      name,
      role
    },
    thumbnail {
      asset->,
      alt
    },
    ${bodyProjection},
    ${seoProjection}
  }
`;

export const getWorkItemByIdQuery = groq`
  *[_type == "workItem" && _id == $id][0] {
    _id,
    "slug": slug.current,
    link,
    company,
    year,
    client,
    work,
    bijschrift,
    statement,
    credits[] {
      name,
      role
    },
    thumbnail {
      asset->,
      alt
    },
    ${bodyProjection},
    ${seoProjection}
  }
`;

// Services
export const getAllServicesQuery = groq`
  *[_type == "service"] | order(_createdAt desc) {
    _id,
    service,
    "slug": slug.current,
    description,
    overviewTitle,
    overviewIntro,
    thumbnail {
      asset->,
      alt
    },
    categories,
    ${bodyProjection},
    ${seoProjection}
  }
`;

export const getServiceByIdQuery = groq`
  *[_type == "service" && _id == $id][0] {
    _id,
    service,
    "slug": slug.current,
    description,
    overviewTitle,
    overviewIntro,
    thumbnail {
      asset->,
      alt
    },
    categories,
    ${bodyProjection},
    ${seoProjection}
  }
`;

// Posts
export const getAllPostsQuery = groq`
  *[_type == "post"] | order(pubDate desc) {
    _id,
    title,
    "slug": slug.current,
    pubDate,
    description,
    author,
    image {
      asset->,
      alt
    },
    tags,
    ${bodyProjection},
    ${seoProjection}
  }
`;

export const getPostByIdQuery = groq`
  *[_type == "post" && _id == $id][0] {
    _id,
    title,
    "slug": slug.current,
    pubDate,
    description,
    author,
    image {
      asset->,
      alt
    },
    tags,
    ${bodyProjection},
    ${seoProjection}
  }
`;

export const getPostsByTagQuery = groq`
  *[_type == "post" && $tag in tags] | order(pubDate desc) {
    _id,
    title,
    "slug": slug.current,
    pubDate,
    description,
    author,
    image {
      asset->,
      alt
    },
    tags,
    ${bodyProjection},
    ${seoProjection}
  }
`;

export const getAllTagsQuery = groq`
  array::unique(*[_type == "post"].tags[])
`;

// Legal Pages
export const getAllLegalPagesQuery = groq`
  *[_type == "legalPage"] | order(_createdAt desc) {
    _id,
    page,
    pubDate,
    ${bodyProjection},
    ${seoProjection}
  }
`;

export const getLegalPageByIdQuery = groq`
  *[_type == "legalPage" && _id == $id][0] {
    _id,
    page,
    pubDate,
    ${bodyProjection},
    ${seoProjection}
  }
`;

// Pages (losse, beheerbare pagina's zoals "Wij zijn Diversions")
export const getAllPagesQuery = groq`
  *[_type == "page"] | order(_createdAt desc) {
    _id,
    title,
    "slug": slug.current,
    eyebrow,
    image {
      asset->,
      alt
    },
    ${bodyProjection},
    ${seoProjection}
  }
`;
