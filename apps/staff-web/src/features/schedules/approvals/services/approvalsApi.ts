import { baseApi } from "@/lib/redux/baseApi";
import { INITIAL_APPROVAL_REQUESTS } from "../constants";
import type {
  ApprovalDecisionInput,
  ApprovalRequest,
} from "../types/approvalTypes";

const mockSuccess = () => ({
  data: { message: "Thao tác thành công (mock)." },
});

export const approvalsApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["SCHEDULE_APPROVALS", "SCHEDULES"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getApprovalRequests: build.query<ApprovalRequest[], void>({
        queryFn: () => ({
          data: structuredClone(INITIAL_APPROVAL_REQUESTS),
        }),
        providesTags: [{ type: "SCHEDULE_APPROVALS", id: "LIST" }],
      }),
      getApprovalRequest: build.query<ApprovalRequest, string>({
        queryFn: (id) => {
          const request = INITIAL_APPROVAL_REQUESTS.find(
            (request) => request.id === id,
          );

          return request
            ? { data: { ...request } }
            : {
                error: {
                  status: 404,
                  message: "Không tìm thấy yêu cầu.",
                  data: null,
                },
              };
        },
        providesTags: (_result, _error, id) => [
          { type: "SCHEDULE_APPROVALS", id },
        ],
      }),
      approveScheduleRequest: build.mutation<
        { message: string },
        ApprovalDecisionInput
      >({
        queryFn: mockSuccess,
        invalidatesTags: (_result, error) =>
          error ? [] : ["SCHEDULE_APPROVALS", "SCHEDULES"],
      }),
      rejectScheduleRequest: build.mutation<
        { message: string },
        ApprovalDecisionInput
      >({
        queryFn: mockSuccess,
        invalidatesTags: (_result, error) =>
          error ? [] : ["SCHEDULE_APPROVALS"],
      }),
    }),
  });

export const {
  useGetApprovalRequestsQuery,
  useGetApprovalRequestQuery,
  useApproveScheduleRequestMutation,
  useRejectScheduleRequestMutation,
} = approvalsApi;
