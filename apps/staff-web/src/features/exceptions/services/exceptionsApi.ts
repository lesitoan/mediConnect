import { baseApi } from "@/lib/redux/baseApi";
import type {
  ExceptionGroup,
  ReassignmentProposalInput,
} from "../types/exceptionTypes";
import { toExceptionError } from "../utils";
import {
  getExceptionGroups,
  submitReassignmentProposal,
} from "./exceptionsService";

export const exceptionsApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["APPOINTMENT_EXCEPTIONS"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getExceptionGroups: build.query<ExceptionGroup[], void>({
        queryFn: () => {
          try {
            return { data: getExceptionGroups() };
          } catch (error) {
            return { error: toExceptionError(error) };
          }
        },
        providesTags: [{ type: "APPOINTMENT_EXCEPTIONS", id: "LIST" }],
      }),
      proposeReplacementDoctor: build.mutation<
        ExceptionGroup[],
        ReassignmentProposalInput
      >({
        queryFn: (input) => {
          try {
            return { data: submitReassignmentProposal(input) };
          } catch (error) {
            return { error: toExceptionError(error) };
          }
        },
        invalidatesTags: [{ type: "APPOINTMENT_EXCEPTIONS", id: "LIST" }],
      }),
    }),
  });

export const {
  useGetExceptionGroupsQuery,
  useProposeReplacementDoctorMutation,
} = exceptionsApi;
