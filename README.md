# Portfolio Website

A modern, polished portfolio website built with HTML, CSS, and vanilla JavaScript. Inspired by the design language of Backseat and The Wall projects.

## 🎨 Design Features

- **Bold Typography**: Large, impactful headings with proper hierarchy
- **Vibrant Colors**: Eye-catching color palette inspired by transport maps
- **Card-Based Layout**: Clean, modular design system
- **Smooth Animations**: Delightful micro-interactions throughout
- **Responsive Design**: Works beautifully on all screen sizes
- **Accessible**: Built with WCAG guidelines in mind

## 🚀 Quick Start

Simply open `index.html` in your browser - no build process needed!

```bash
# Option 1: Direct open
open index.html

# Option 2: Local server (recommended)
python3 -m http.server 8000
# Then visit http://localhost:8000

# Option 3: Using Node.js
npx serve
```

## 📁 File Structure

```
├── index.html          # Main HTML structure
├── style.css           # All styles and design system
├── script.js           # Interactive features and animations
└── README.md           # This file
```

## ✨ Features

### Navigation
- Fixed header that hides on scroll down, shows on scroll up
- Smooth scroll to sections
- Responsive mobile menu

### Hero Section
- Large, bold typography
- Animated floating cards
- Clear call-to-action buttons

### Work Section
- Project cards with hover effects
- Tags and descriptions
- Grid layout that adapts to screen size

### Skills Section
- Colorful skill cards
- Icon + description format
- Responsive grid

### About Section
- Animated counter statistics
- Personal story
- Two-column layout

### Contact Section
- Multiple contact methods
- Hover effects on cards
- Links to social profiles

### Hidden Features
- **Konami Code Easter Egg**: Try ↑↑↓↓←→←→BA
- **Dark Mode**: Press Cmd+Shift+D (or Ctrl+Shift+D)
- **Console Messages**: Check your browser console
- **Auto-hide Navigation**: Scroll behavior
- **Smooth Reveals**: Elements animate in on scroll

## 🎨 Design System

### Colors
- **Accent**: #FF00C3 (Pink)
- **Yellow**: #FFD35A
- **Blue**: #C9E7FF
- **Teal**: #C4FFF9
- **Cream**: #FFEFB7
- And more vibrant options

### Typography
- System fonts for optimal performance
- Font weights: 400 (regular), 600 (semibold), 700 (bold), 800 (extrabold)
- Responsive text scaling using clamp()

### Spacing Scale
- XS: 0.5rem
- SM: 1rem
- MD: 1.5rem
- LG: 2.5rem
- XL: 4rem
- 2XL: 6rem

### Border Radius
- SM: 8px
- MD: 15px
- LG: 20px
- Full: 200px (pills)

## 🛠️ Customization

### Update Content

1. **Personal Info**: Edit the hero section in `index.html`
2. **Projects**: Modify the work section cards
3. **Skills**: Update skill cards with your technologies
4. **Contact**: Change links to your social profiles

### Update Colors

Colors are defined as CSS custom properties in `style.css`:

```css
:root {
    --color-accent: #FF00C3;
    --color-yellow: #FFD35A;
    /* ... more colors */
}
```

### Add Images

Replace the emoji placeholders in project cards with actual images:

```html
<div class="project-image">
    <img src="path/to/image.jpg" alt="Project name">
</div>
```

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome)

## 📱 Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 968px
- Desktop: > 968px

## ⚡ Performance

- No frameworks or libraries
- Minimal JavaScript
- Optimized CSS
- Fast load times
- Smooth 60fps animations

## 🎯 Best Practices

- Semantic HTML5
- Accessible markup
- SEO-friendly structure
- Reduced motion support
- High contrast mode support

## 📝 To-Do

Before going live, remember to:

- [ ] Add your actual project images
- [ ] Update all links with real URLs
- [ ] Change contact information
- [ ] Add a favicon
- [ ] Test on multiple devices
- [ ] Run accessibility audit
- [ ] Optimize images
- [ ] Add analytics (optional)

## 🤝 Credits

Design inspired by:
- **Backseat** - Transport feedback app
- **The Wall** - Community platform

Built with ❤️ in Wellington

## 📄 License

Free to use and modify for your personal portfolio!

