(function () {
  var header = document.getElementById('site-header');
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobile-menu');

  if (!header) return;

  var isTransparent = header.classList.contains('transparent');

  function updateScroll() {
    if (!isTransparent) return;
    var hero = document.getElementById('hero');
    if (!hero) return;
    var scrolled = hero.getBoundingClientRect().bottom <= 80;
    header.classList.toggle('scrolled', scrolled);
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', function () {
    var isOpen = mobileMenu.classList.toggle('open');
    header.classList.toggle('menu-open', isOpen);
    if (isOpen) {
      hamburger.innerHTML = '<span class="close-x">×</span>';
    } else {
      hamburger.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
    }
  });

  mobileMenu.querySelectorAll('a, button').forEach(function (el) {
    el.addEventListener('click', function () {
      mobileMenu.classList.remove('open');
      header.classList.remove('menu-open');
      hamburger.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';
    });
  });
})();
