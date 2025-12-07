// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        } else {
            element.textContent = formatNumber(Math.floor(current));
        }
    }, 16);
}

function formatNumber(num) {
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace('.0', '') + 'K+';
    }
    return num.toString() + '+';
}

function initCounters() {
    const statBoxes = document.querySelectorAll('.stat-box');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                const numberElement = entry.target.querySelector('.stat-number');
                const text = numberElement.textContent;
                
                // Extract number from text like "10,000+" or "4.8/5"
                let targetNumber;
                
                if (text.includes('/')) {
                    // Handle rating like "4.8/5"
                    return; // Don't animate ratings
                } else {
                    // Handle numbers like "10,000+" or "100+"
                    targetNumber = parseInt(text.replace(/[,+]/g, ''));
                }
                
                // Start from 0 and animate
                numberElement.textContent = '0';
                
                let start = 0;
                const duration = 2000;
                const startTime = Date.now();
                
                const animate = () => {
                    const now = Date.now();
                    const progress = Math.min((now - startTime) / duration, 1);
                    const current = Math.floor(progress * targetNumber);
                    
                    if (text.includes(',')) {
                        numberElement.textContent = current.toLocaleString() + '+';
                    } else {
                        numberElement.textContent = current + '+';
                    }
                    
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        numberElement.textContent = text; // Restore original format
                    }
                };
                
                animate();
            }
        });
    }, { threshold: 0.5 });
    
    statBoxes.forEach(box => observer.observe(box));
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
} else {
    initCounters();
}
