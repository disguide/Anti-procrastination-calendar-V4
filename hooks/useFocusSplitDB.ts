
import { useFocusContext } from '../contexts/FocusContext';

// Legacy hook bridge -> now just returns the Context
// This ensures App.tsx requires minimal changes.
export function useFocusSplitDB() {
  return useFocusContext();
}
