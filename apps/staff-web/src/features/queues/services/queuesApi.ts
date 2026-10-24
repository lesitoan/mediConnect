import { baseApi } from "@/lib/redux/baseApi";
import type { QueueActionInput, QueueItem } from "../types/queueTypes";
import { getQueueItems, updateQueueItem } from "./queuesService";
import { toQueueError } from "../utils";

export const queuesApi = baseApi
  .enhanceEndpoints({ addTagTypes: ["QUEUES"] })
  .injectEndpoints({
    endpoints: (build) => ({
      getQueueItems: build.query<QueueItem[], void>({
        queryFn: () => {
          try {
            return { data: getQueueItems() };
          } catch (error) {
            return { error: toQueueError(error) };
          }
        },
        providesTags: [{ type: "QUEUES", id: "LIST" }],
      }),
      updateQueueItem: build.mutation<QueueItem, QueueActionInput>({
        queryFn: (input) => {
          try {
            return { data: updateQueueItem(input) };
          } catch (error) {
            return { error: toQueueError(error) };
          }
        },
        invalidatesTags: [{ type: "QUEUES", id: "LIST" }],
      }),
    }),
  });

export const { useGetQueueItemsQuery, useUpdateQueueItemMutation } = queuesApi;
