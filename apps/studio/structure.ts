import type { StructureBuilder } from "sanity/structure";
import {
  UsersIcon,
  CaseIcon,
  RocketIcon,
  DocumentIcon,
  DocumentTextIcon,
  DocumentsIcon
} from "@sanity/icons";

export const structure = (S: StructureBuilder) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Team Members")
        .icon(UsersIcon)
        .schemaType("teamMember")
        .child(S.documentTypeList("teamMember").title("Team Members")),

      S.listItem()
        .title("Work Items")
        .icon(CaseIcon)
        .schemaType("workItem")
        .child(S.documentTypeList("workItem").title("Work Items")),

      S.listItem()
        .title("Services")
        .icon(RocketIcon)
        .schemaType("service")
        .child(S.documentTypeList("service").title("Services")),

      S.listItem()
        .title("Posts")
        .icon(DocumentIcon)
        .schemaType("post")
        .child(S.documentTypeList("post").title("Posts")),

      S.listItem()
        .title("Legal Pages")
        .icon(DocumentTextIcon)
        .schemaType("legalPage")
        .child(S.documentTypeList("legalPage").title("Legal Pages")),

      S.listItem()
        .title("Pages")
        .icon(DocumentsIcon)
        .schemaType("page")
        .child(S.documentTypeList("page").title("Pages")),
    ]);
