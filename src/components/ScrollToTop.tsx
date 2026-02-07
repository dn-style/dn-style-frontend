import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // Si el usuario está volviendo atrás (POP), no forzamos el scroll a 0
    // Esto permite que el navegador intente restaurar la posición anterior.
    if (navType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;