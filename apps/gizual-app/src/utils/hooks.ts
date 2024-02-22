import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { QueryError } from "@giz/maestro";
import { useQuery } from "@giz/maestro/react";
import { SearchQueryType } from "@giz/query";

/**
 *  Get the current window size on every resize event.
 *
 *  @deprecated Use `useMediaQuery`, unless you specifically need the exact size.
 */
export function useWindowSize() {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
}

export function useMediaQuery(breakpoint: { min?: number; max?: number }) {
  const [matches, setMatches] = useState(false);
  const { min, max } = breakpoint;

  if (min === undefined && max === undefined) {
    throw new Error("Either min or max must be defined");
  }

  if (min !== undefined && max !== undefined && min > max) {
    throw new Error("min must be less than or equal to max");
  }

  let query = "";
  if (min === undefined && max !== undefined) {
    query = `(max-width: ${max}px)`;
  } else if (max === undefined && min !== undefined) {
    query = `(min-width: ${min}px)`;
  } else {
    query = `(min-width: ${min}px) and (max-width: ${max}px)`;
  }

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener("change", listener);
    setMatches(mediaQuery.matches);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [min, max]);

  return matches;
}

export const useTheme = () => {
  const defaultTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [theme, setTheme] = useState<"dark" | "light">(defaultTheme);
  useEffect(() => {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => e.matches && setTheme("dark"));
    window
      .matchMedia("(prefers-color-scheme: light)")
      .addEventListener("change", (e) => e.matches && setTheme("light"));
  }, []);
  return theme;
};

export const useDoc = () => {
  const [doc, setDoc] = useState<HTMLElement | undefined>();
  useEffect(() => {
    setDoc(document.documentElement);
  }, []);

  return doc;
};

export const useStyle = (key: string) => {
  const doc = useDoc();
  const theme = useTheme();
  const [style, setStyle] = useState<string>("#00000000");
  useEffect(() => {
    if (!doc) return;
    setStyle(getComputedStyle(doc).getPropertyValue(key));
  }, [doc, key, theme]);

  return style;
};

export const LocalQueryContext = createContext<
  | {
      localQuery: SearchQueryType;
      updateLocalQuery: (partial: Partial<SearchQueryType>) => void;
      publishLocalQuery: () => void;
      errors: QueryError[] | undefined;
    }
  | undefined
>(undefined);

export const useLocalQuery = () => {
  const { query, setQuery } = useQuery();

  const [localQuery, setLocalQuery] = useState<SearchQueryType>(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const updateLocalQuery = useCallback(
    (partial: Partial<SearchQueryType>) => {
      setLocalQuery({ ...Object.assign(localQuery, partial) });
    },
    [setLocalQuery, localQuery],
  );

  const publishLocalQuery = useCallback(() => {
    setQuery(localQuery);
  }, [setLocalQuery, localQuery]);

  const resetLocalQuery = useCallback(() => {
    setLocalQuery(query);
  }, [localQuery, query]);

  return { localQuery, updateLocalQuery, publishLocalQuery, resetLocalQuery };
};

export const useLocalQueryCtx = () => {
  const ctx = useContext(LocalQueryContext);

  if (!ctx) {
    throw new Error("Unable to consume LocalQueryContext");
  }

  return ctx;
};

export function useForwardedRef<T>(ref: React.ForwardedRef<T>) {
  const innerRef = useRef<T>(null);

  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(innerRef.current);
    } else {
      ref.current = innerRef.current;
    }
  });

  return innerRef;
}
