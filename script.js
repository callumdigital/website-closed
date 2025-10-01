// ================================
// Navigation Scroll Effect
// ================================

let lastScrollTop = 0;
const nav = document.querySelector('.nav');
const heroSection = document.querySelector('.hero');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const heroHeight = heroSection ? heroSection.offsetHeight : 0;
    
    // Add border after scrolling past hero
    if (scrollTop > heroHeight - 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// ================================
// Mobile Menu Toggle
// ================================

const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');

function toggleMobileMenu() {
    const isOpen = mobileMenuBtn.classList.contains('active');
    
    mobileMenuBtn.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    
    // Update aria-expanded
    mobileMenuBtn.setAttribute('aria-expanded', !isOpen);
}

// Toggle menu on button click
mobileMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMobileMenu();
});

// Close menu when clicking a link
mobileMenuLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
        }
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('active') && 
        !mobileMenu.contains(e.target) && 
        !mobileMenuBtn.contains(e.target)) {
        toggleMobileMenu();
    }
});

// ================================
// Smooth Scroll for Anchor Links
// ================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Skip empty anchors
        if (href === '#') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offsetTop = target.offsetTop - 80; // Account for fixed nav
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
                mobileMenuBtn?.classList.remove('active');
            }
        }
    });
});

// ================================
// Reveal Elements on Scroll
// ================================

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// Add reveal class to sections
const sectionsToReveal = document.querySelectorAll('.case-study, .work-item, .contact-card, .cv-item');
sectionsToReveal.forEach(section => {
    section.classList.add('reveal');
    revealObserver.observe(section);
});


// ================================
// Add cursor trail effect (fun touch)
// ================================

let cursorTrail = [];
const maxTrailLength = 20;

document.addEventListener('mousemove', (e) => {
    // Only on larger screens
    if (window.innerWidth < 768) return;
    
    cursorTrail.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
    });
    
    // Keep only recent trail points
    cursorTrail = cursorTrail.filter(point => 
        Date.now() - point.time < 500
    ).slice(-maxTrailLength);
});

// ================================
// Easter Egg: Konami Code
// ================================

let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join(',') === konamiSequence.join(',')) {
        activateEasterEgg();
        konamiCode = [];
    }
});

function activateEasterEgg() {
    // Fun animation
    document.body.style.animation = 'rainbow 2s infinite';
    
    // Create style for rainbow animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
    
    // Show message
    const message = document.createElement('div');
    message.textContent = '🎉 You found the secret! 🎉';
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-yellow);
        color: var(--color-text);
        padding: 2rem 3rem;
        border: 3px solid var(--color-text);
        border-radius: var(--radius-lg);
        font-size: 2rem;
        font-weight: 800;
        z-index: 10000;
        animation: bounce 0.5s ease;
    `;
    document.body.appendChild(message);
    
    // Remove after 3 seconds
    setTimeout(() => {
        message.remove();
        document.body.style.animation = '';
    }, 3000);
}

// ================================
// Console Message
// ================================

console.log('%c👋 Hey there!', 'font-size: 2rem; font-weight: bold;');
console.log(
    '%cLooks like you\'re checking out the code. I like you already! 🚀\n\n' +
    'Want to work together? Drop me a line at hello@callum.digital',
    'font-size: 1rem; line-height: 1.5;'
);

// ================================
// Performance Monitoring
// ================================

if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page loaded in:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
        }, 0);
    });
}

// ================================
// Dark Mode Toggle (Hidden Feature)
// ================================

let darkMode = false;

document.addEventListener('keydown', (e) => {
    // Toggle dark mode with 'd' key
    if (e.key === 'd' && e.shiftKey && e.metaKey) {
        darkMode = !darkMode;
        document.body.style.transition = 'all 0.3s ease';
        
        if (darkMode) {
            document.documentElement.style.setProperty('--color-bg', '#0A0A0A');
            document.documentElement.style.setProperty('--color-text', '#FFFFFF');
            document.documentElement.style.setProperty('--color-text-muted', '#AAAAAA');
        } else {
            document.documentElement.style.setProperty('--color-bg', '#FFFFFF');
            document.documentElement.style.setProperty('--color-text', '#0A0A0A');
            document.documentElement.style.setProperty('--color-text-muted', '#666666');
        }
        
        console.log(`🌓 Dark mode ${darkMode ? 'enabled' : 'disabled'}`);
    }
});

