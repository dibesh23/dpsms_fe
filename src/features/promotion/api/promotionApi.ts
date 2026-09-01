import { apiClient } from "@/shared/lib/apiClient";
import type {
  RunBatchResponse,
  ReviewResponse,
  ListResult,
  PromotionRecordRow,
  PromotionBatchRow,
  BatchDetail,
  StudentPromotionHistory,
  ReviewDecision,
} from "../types";

export interface RunBatchPayload {
  academicYearFromId: string;
  academicYearToId: string;
  marksThreshold?: number;
  attendanceThreshold?: number;
}

export interface ReviewPayload {
  decision: ReviewDecision;
  reviewReason?: string;
  newClassId?: string;
}

export const promotionApi = {
  async runBatch(payload: RunBatchPayload): Promise<RunBatchResponse> {
    const { data } = await apiClient.post<{ data: RunBatchResponse }>("/promotions/batch", payload);
    return data.data;
  },

  async review(promotionRecordId: string, payload: ReviewPayload): Promise<ReviewResponse> {
    const { data } = await apiClient.post<{ data: ReviewResponse }>(
      `/promotions/review/${promotionRecordId}`,
      payload,
    );
    return data.data;
  },

  async listPromotions(params?: {
    batchId?: string;
    sourceAcademicYearId?: string;
    targetAcademicYearId?: string;
    outcome?: string;
    reviewed?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<ListResult<PromotionRecordRow>> {
    const { data } = await apiClient.get<{ data: ListResult<PromotionRecordRow> }>(
      "/promotions",
      { params },
    );
    return data.data;
  },

  async listPromotionBatches(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<ListResult<PromotionBatchRow>> {
    const { data } = await apiClient.get<{ data: ListResult<PromotionBatchRow> }>(
      "/promotions/batches",
      { params },
    );
    return data.data;
  },

  async getBatchDetails(batchId: string): Promise<BatchDetail> {
    const { data } = await apiClient.get<{ data: BatchDetail }>(
      `/promotions/batches/${batchId}`,
    );
    return data.data;
  },

  async getStudentPromotionHistory(studentId: string): Promise<{
    studentId: string;
    promotions: StudentPromotionHistory[];
  }> {
    const { data } = await apiClient.get<{ data: { studentId: string; promotions: StudentPromotionHistory[] } }>(
      `/promotions/student/${studentId}/history`,
    );
    return data.data;
  },
};

export default promotionApi;
