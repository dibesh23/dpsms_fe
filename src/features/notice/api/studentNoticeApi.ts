import { apiClient } from "@/shared/lib/apiClient";


export type NoticeScope = "SCHOOL_WIDE" | "CLASS" | "SECTION";

export interface NoticeAttachmentSummary {
  id: string; // Attachment.id
  label: string; // display filename
  url: string; // Attachment.url
  mimeType: string; // Attachment.mimeType
  sizeBytes: number; // Attachment.sizeBytes
}

export interface NoticeSummary {
  id: string; // Notice.id
  title: string; // Notice.title
  body: string; // Notice.body
  isUrgent: boolean; // Notice.isUrgent
  publishedByName: string; // Notice.publishedByUser -> User.fullName
  publishedAt: string; // Notice.publishedAt
  scope: NoticeScope;
  scopeLabel: string; // e.g. "All Students", "Grade 10", "Grade 10 - A"
  attachments: NoticeAttachmentSummary[]; // Notice.noticeAttachments -> Attachment
}

export interface StudentNoticeSummary {
  notices: NoticeSummary[];
}

export const studentNoticeApi = {
  async getNotices(): Promise<StudentNoticeSummary> {
    const { data } = await apiClient.get<{ data: StudentNoticeSummary }>("/students/me/notices");
    return data.data;
  },
};

export default studentNoticeApi;