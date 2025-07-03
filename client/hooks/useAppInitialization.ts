import { usePrefetchData } from "./usePrefetch";
import { useBackgroundRefetch } from "./useBackgroundRefetch";

export function useAppInitialization() {
  usePrefetchData();
  useBackgroundRefetch();
}
