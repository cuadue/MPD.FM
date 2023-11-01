import { useCallback, useState } from "react";

export const useNotchStyle = (style: {
  notchTop: any
  notchRight: any
  notchBottom: any
  notchLeft: any
}) => {
  const mapping = useCallback(() => {
    switch (screen.orientation.type) {
      case 'landscape-primary': return style.notchRight;
      case 'landscape-secondary': return style.notchLeft;
      case 'portrait-primary': return style.notchTop;
      case 'portrait-secondary': return style.notchBottom;
      default: return 'unknown??';
    }
  }, []);
  const [state, setState] = useState(mapping());
  screen.orientation.addEventListener('change', () => {
    const newval = mapping();
    setState(newval)
  });
  return state;
};