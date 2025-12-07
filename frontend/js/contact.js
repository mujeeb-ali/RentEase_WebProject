// ===================================
// Contact Form JavaScript
// ===================================

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };
        
        // Validate required fields
        if (!formData.name || !formData.email || !formData.message) {
            window.rentease.utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Simulate successful submission
        console.log('Contact form submitted:', formData);
        window.rentease.utils.showNotification('Message sent successfully! We will get back to you soon.', 'success');
        contactForm.reset();
    });
}

// ===================================
// FAQ Accordion
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Toggle current item
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
});
