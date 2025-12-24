// frontend/public/assets/js/ui/carousel.js

export function setupCarousel(postCard) {
  const track = postCard.querySelector(".carousel-track");
  const slides = Array.from(track.children);
  const nextButton = postCard.querySelector(".carousel-btn.next");
  const prevButton = postCard.querySelector(".carousel-btn.prev");
  const dotsNav = postCard.querySelector(".carousel-dots");
  const dots = dotsNav ? Array.from(dotsNav.children) : [];
  if (slides.length === 0) return;
  const slideWidth = slides[0].getBoundingClientRect().width;

  let currentIndex = 0;

  const moveToSlide = (targetIndex) => {
    track.style.transform = `translateX(-${slideWidth * targetIndex}px)`;
    currentIndex = targetIndex;
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  };

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      const newIndex = (currentIndex + 1) % slides.length;
      moveToSlide(newIndex);
    });
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      const newIndex = (currentIndex - 1 + slides.length) % slides.length;
      moveToSlide(newIndex);
    });
  }

  if (dotsNav) {
    dotsNav.addEventListener("click", (e) => {
      const targetDot = e.target.closest("span.dot");
      if (!targetDot) return;
      const targetIndex = dots.findIndex((dot) => dot === targetDot);
      moveToSlide(targetIndex);
    });
  }
}
