import { useEffect, useRef } from 'react';

export function useParallax<T extends HTMLElement>(speed = 0.15) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let ticking = false;
    let baseTop = 0;

    function measure() {
      if (!node) return;
      const previousTransform = node.style.transform;
      node.style.transform = 'none';
      baseTop = node.getBoundingClientRect().top + window.scrollY;
      node.style.transform = previousTransform;
    }

    function update() {
      ticking = false;
      if (!node) return;
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      const elementCenter = baseTop + node.offsetHeight / 2;
      const offset = (viewportCenter - elementCenter) * speed;
      node.style.transform = `translateY(${offset}px)`;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    function onResize() {
      measure();
      update();
    }

    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [speed]);

  return ref;
}
