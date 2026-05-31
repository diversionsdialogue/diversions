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
    _type == "videoBlock" => { ..., poster { ..., asset-> } }
  }
`;

// Team Members
export const getAllTeamMembersQuery = groq`
  *[_type == "teamMember"] | order(_createdAt desc) {
    _id,
    name,
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
    credits[] {
      name,
      role
    },
    thumbnail {
      asset->,
      alt
    },
    ${bodyProjection}
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
    credits[] {
      name,
      role
    },
    thumbnail {
      asset->,
      alt
    },
    ${bodyProjection}
  }
`;

// Services
export const getAllServicesQuery = groq`
  *[_type == "service"] | order(_createdAt desc) {
    _id,
    service,
    "slug": slug.current,
    description,
    ${bodyProjection}
  }
`;

export const getServiceByIdQuery = groq`
  *[_type == "service" && _id == $id][0] {
    _id,
    service,
    "slug": slug.current,
    description,
    ${bodyProjection}
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
    ${bodyProjection}
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
    ${bodyProjection}
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
    ${bodyProjection}
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
    body
  }
`;

export const getLegalPageByIdQuery = groq`
  *[_type == "legalPage" && _id == $id][0] {
    _id,
    page,
    pubDate,
    body
  }
`;
