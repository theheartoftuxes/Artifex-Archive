"use client";

import { useEffect, useCallback, useState } from "react";
import { trpc } from "./client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook for rating a media item
 * @param mediaItemId - The ID of the media item to rate
 * @returns Mutation object with rate function
 */
export function useRateMedia(mediaItemId: string) {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();

  const mutation = trpc.media.rate.useMutation({
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await utils.media.getById.cancel(mediaItemId);

      // Snapshot the previous value
      const previousData = utils.media.getById.getData(mediaItemId);

      // Optimistically update the cache
      if (previousData?.mediaItem) {
        const currentRatingTotal = previousData.mediaItem.ratingTotal ?? 0;
        const currentRatingCount = previousData.mediaItem.ratingCount ?? 0;

        // Optimistically assume it's a new rating (will be corrected by server response)
        // If it's an update, the server will handle the adjustment correctly
        const newRatingTotal = currentRatingTotal + variables.value;
        const newRatingCount = currentRatingCount + 1;
        const newAvgRating = newRatingCount > 0 ? newRatingTotal / newRatingCount : null;

        utils.media.getById.setData(mediaItemId, {
          ...previousData,
          mediaItem: {
            ...previousData.mediaItem,
            ratingTotal: newRatingTotal,
            ratingCount: newRatingCount,
            avgRating: newAvgRating,
          },
        });
      }

      // Return context with the previous value
      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.media.getById.setData(mediaItemId, context.previousData);
      }
    },
    onSuccess: (data) => {
      // Update cache with server response for accuracy
      const currentData = utils.media.getById.getData(mediaItemId);
      if (currentData?.mediaItem) {
        utils.media.getById.setData(mediaItemId, {
          ...currentData,
          mediaItem: {
            ...currentData.mediaItem,
            avgRating: data.avgRating,
            ratingCount: data.ratingCount,
          },
        });
      }
      // Invalidate list queries to update ratings in lists
      utils.media.getAllByType.invalidate();
      utils.media.search.invalidate();
      // Show success toast
      toast.success("Thanks for your signal!", {
        description: `You rated this item ${data.avgRating?.toFixed(1)} stars`,
      });
    },
    onError: (err) => {
      toast.error("Failed to rate", {
        description: err.message || "Please try again",
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      utils.media.getById.invalidate(mediaItemId);
    },
  });

  return {
    rate: (value: number) => mutation.mutate({ mediaItemId, value }),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for toggling save status of a media item
 * @param mediaItemId - The ID of the media item to save/unsave
 * @returns Object with isSaved, saveCount, and toggle function
 */
export function useToggleSave(mediaItemId: string) {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();

  // Track saved state locally (will be updated by mutation response)
  const [isSaved, setIsSaved] = useState(false);
  const [previousIsSaved, setPreviousIsSaved] = useState(false);

  const mutation = trpc.media.toggleSave.useMutation({
    onMutate: async () => {
      // Cancel any outgoing refetches
      await utils.media.getById.cancel(mediaItemId);

      // Snapshot the previous value
      const previousData = utils.media.getById.getData(mediaItemId);

      // Store current state for rollback
      setPreviousIsSaved(isSaved);

      // Optimistically update the cache
      if (previousData?.mediaItem) {
        const currentSaveCount = previousData.mediaItem.saveCount;
        // Optimistically toggle (will be corrected by server response)
        const optimisticSaveCount = isSaved ? currentSaveCount - 1 : currentSaveCount + 1;

        utils.media.getById.setData(mediaItemId, {
          ...previousData,
          mediaItem: {
            ...previousData.mediaItem,
            saveCount: Math.max(0, optimisticSaveCount), // Ensure non-negative
          },
        });
      }

      // Optimistically update local state
      setIsSaved((prev) => !prev);

      return { previousData, previousIsSaved: isSaved };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.media.getById.setData(mediaItemId, context.previousData);
      }
      // Rollback local state
      if (context?.previousIsSaved !== undefined) {
        setIsSaved(context.previousIsSaved);
      }
    },
    onSuccess: (data) => {
      // Update cache with server response
      const currentData = utils.media.getById.getData(mediaItemId);
      if (currentData?.mediaItem) {
        utils.media.getById.setData(mediaItemId, {
          ...currentData,
          mediaItem: {
            ...currentData.mediaItem,
            saveCount: data.saveCount,
          },
        });
      }
      // Update local state from server response
      setIsSaved(data.isSaved);
      // Invalidate list queries to update save counts in lists
      utils.media.getAllByType.invalidate();
      utils.media.search.invalidate();
      utils.media.getSaved.invalidate();
      // Show success toast
      toast.success("Thanks for your signal!", {
        description: data.isSaved 
          ? "Item added to your saved collection"
          : "Item removed from your saved collection",
      });
    },
    onError: (err) => {
      toast.error("Failed to save", {
        description: err.message || "Please try again",
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      utils.media.getById.invalidate(mediaItemId);
    },
  });

  // Get initial save count from query data
  const currentData = utils.media.getById.getData(mediaItemId);
  const saveCount = mutation.data?.saveCount ?? currentData?.mediaItem.saveCount ?? 0;

  const toggle = useCallback(() => {
    mutation.mutate({ mediaItemId });
  }, [mediaItemId, mutation]);

  return {
    isSaved,
    saveCount,
    toggle,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Hook for incrementing view count
 * Automatically calls on mount if not already viewed in sessionStorage
 * @param mediaItemId - The ID of the media item to increment views for
 */
export function useIncrementView(mediaItemId: string) {
  const utils = trpc.useUtils();
  const mutation = trpc.media.incrementView.useMutation({
    onSuccess: (data) => {
      // Update cache with new view count
      const currentData = utils.media.getById.getData(mediaItemId);
      if (currentData?.mediaItem) {
        utils.media.getById.setData(mediaItemId, {
          ...currentData,
          mediaItem: {
            ...currentData.mediaItem,
            viewCount: data.viewCount,
          },
        });
      }
      // Invalidate list queries to update view counts in lists
      utils.media.getAllByType.invalidate();
      utils.media.search.invalidate();
    },
  });

  useEffect(() => {
    // Check if already viewed in this session
    const storageKey = `viewed_${mediaItemId}`;
    const hasViewed = sessionStorage.getItem(storageKey);

    if (!hasViewed) {
      // Mark as viewed in sessionStorage
      sessionStorage.setItem(storageKey, "true");

      // Increment view count
      mutation.mutate({ mediaItemId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaItemId]);

  return {
    isLoading: mutation.isPending,
    error: mutation.error,
    viewCount: mutation.data?.viewCount,
  };
}

