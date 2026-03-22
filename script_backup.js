/**
 * Eco Home France - SCRIPT PRINCIPAL
 * Landing page para casas modulares
 * Optimizado para conversión y experiencia de usuario
 */

// ==========================================
// CONFIGURACIÓN Y VARIABLES
// ==========================================

const CONFIG = {
    // Configuración de animaciones
    ANIMATION_DURATION: 800,
    SCROLL_THRESHOLD: 100,
    
    // Configuración del formulario
    FORM_ENDPOINT: '#', // Cambiar por tu endpoint real
    WHATSAPP_NUMBER: '5493512345678',
    
    // Configuración de lazy loading
    LAZY_LOAD_OFFSET: '50px',
    
    // Breakpoints responsive
    BREAKPOINTS: {
        MOBILE: 768,
        TABLET: 1024,
        DESKTOP: 1200
    },

    // Mensajes de WhatsApp
    WHATSAPP_MESSAGES: {
        DEFAULT: 'Hola! Quiero información sobre Eco Home France',
        LEAD_MAGNET: 'Hola! Me interesa la guía gratuita "Cómo tener tu hogar propio sin construir"',
        MODEL_INTEREST: (model) => `Hola! Me interesa el modelo ${model} de Eco Home France`,
        CONTACT_FORM: 'Hola! Envié una consulta desde el formulario web de Eco Home France'
    }
};

// ==========================================
// UTILIDADES
// ==========================================

const Utils = {
    /**
     * Debounce function para optimizar eventos de scroll y resize
     */
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    /**
     * Throttle function para eventos frecuentes
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Verificar si un elemento está visible en el viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        return (
            rect.top >= -100 &&
            rect.left >= 0 &&
            rect.bottom <= windowHeight + 100 &&
            rect.right <= windowWidth
        );
    },

    /**
     * Smooth scroll a un elemento
     */
    smoothScrollTo(element, duration = 1000) {
        const targetPosition = element.offsetTop - 80; // Offset para header fijo
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    },

    /**
     * Validar email
     */
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Formatear número de teléfono
     */
    formatPhoneNumber(phone) {
        return phone.replace(/\D/g, '');
    },

    /**
     * Detectar dispositivo móvil
     */
    isMobile() {
        return window.innerWidth <= CONFIG.BREAKPOINTS.MOBILE;
    },

    /**
     * Obtener sección más cercana
     */
    getClosestSection(element) {
        const section = element.closest('section');
        return section ? section.id || 'unknown' : 'unknown';
    }
};

// ==========================================
// GESTIÓN DE NAVEGACIÓN
// ==========================================

const Navigation = {
    init() {
        this.header = document.querySelector('.header');
        this.navLinks = document.querySelectorAll('a[href^="#"]');
        
        this.bindEvents();
        this.handleScroll();
        this.updateActiveNavLink();
    },

    bindEvents() {
        // Scroll events
        window.addEventListener('scroll', Utils.throttle(() => {
            this.handleScroll();
            this.updateActiveNavLink();
        }, 100));

        // Navigation links smooth scroll
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#') && href !== '#') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        Utils.smoothScrollTo(target);
                        this.trackNavigationClick(link);
                    }
                }
            });
        });
    },

    handleScroll() {
        const scrollY = window.scrollY;
        
        // Header background opacity
        if (scrollY > 50) {
            this.header.classList.add('header--scrolled');
        } else {
            this.header.classList.remove('header--scrolled');
        }
    },

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href === `#${sectionId}`) {
                        link.classList.add('nav__link--active');
                    } else {
                        link.classList.remove('nav__link--active');
                    }
                });
            }
        });
    },

    trackNavigationClick(link) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'navigation_click', {
                link_text: link.textContent.trim(),
                link_href: link.getAttribute('href'),
                page_section: Utils.getClosestSection(link)
            });
        }
    }
};

// ==========================================
// GESTIÓN DE ANIMACIONES
// ==========================================

const AnimationManager = {
    init() {
        this.revealElements = document.querySelectorAll('.reveal');
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        this.setupIntersectionObserver();
        this.animateOnLoad();
        
        // Animaciones especiales
        this.setupSpecialAnimations();
    },

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        this.revealElements.forEach(element => {
            this.observer.observe(element);
        });
    },

    animateElement(element) {
        // Añadir clase para activar animación
        setTimeout(() => {
            element.classList.add('active');
        }, 100);

        // Animación específica según el tipo de elemento
        if (element.classList.contains('model__card')) {
            this.animateModelCard(element);
        } else if (element.classList.contains('benefit__card')) {
            this.animateBenefitCard(element);
        } else if (element.classList.contains('testimonial__card')) {
            this.animateTestimonialCard(element);
        } else if (element.classList.contains('step')) {
            this.animateStep(element);
        }
    },

    animateModelCard(element) {
        const img = element.querySelector('.model__image img');
        const content = element.querySelector('.model__content');
        
        if (img) {
            img.style.animationDelay = '0.2s';
        }
        if (content) {
            content.style.animationDelay = '0.4s';
        }
    },

    animateBenefitCard(element) {
        const icon = element.querySelector('.benefit__icon');
        if (icon) {
            icon.style.animation = 'bounce 1s ease-in-out 0.3s';
        }
    },

    animateTestimonialCard(element) {
        const author = element.querySelector('.testimonial__author');
        if (author) {
            author.style.animation = 'slideInUp 0.6s ease-out 0.5s forwards';
        }
    },

    animateStep(element) {
        const number = element.querySelector('.step__number');
        if (number) {
            number.style.animation = 'scaleIn 0.5s ease-out 0.2s forwards';
        }
    },

    animateOnLoad() {
        // Animar elementos que están visible al cargar la página
        this.revealElements.forEach(element => {
            if (Utils.isInViewport(element)) {
                this.animateElement(element);
            }
        });
    },

    setupSpecialAnimations() {
        // Animación del hero
        this.setupHeroAnimations();
        
        // Animación de contadores
        this.setupCounters();
        
        // Animación de parallax suave
        this.setupParallax();
    },

    setupHeroAnimations() {
        const heroTitle = document.querySelector('.hero__title');
        const heroSubtitle = document.querySelector('.hero__subtitle');
        const heroBenefits = document.querySelector('.hero__benefits');
        const heroActions = document.querySelector('.hero__actions');

        if (heroTitle) {
            heroTitle.style.opacity = '0';
            heroTitle.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                heroTitle.style.transition = 'all 0.8s ease-out';
                heroTitle.style.opacity = '1';
                heroTitle.style.transform = 'translateY(0)';
            }, 200);
        }

        if (heroSubtitle) {
            heroSubtitle.style.opacity = '0';
            heroSubtitle.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                heroSubtitle.style.transition = 'all 0.8s ease-out';
                heroSubtitle.style.opacity = '1';
                heroSubtitle.style.transform = 'translateY(0)';
            }, 400);
        }

        if (heroBenefits) {
            heroBenefits.style.opacity = '0';
            heroBenefits.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                heroBenefits.style.transition = 'all 0.8s ease-out';
                heroBenefits.style.opacity = '1';
                heroBenefits.style.transform = 'translateY(0)';
            }, 600);
        }

        if (heroActions) {
            heroActions.style.opacity = '0';
            heroActions.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                heroActions.style.transition = 'all 0.8s ease-out';
                heroActions.style.opacity = '1';
                heroActions.style.transform = 'translateY(0)';
            }, 800);
        }
    },

    setupCounters() {
        const counters = document.querySelectorAll('[data-counter]');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-counter'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };

            // Iniciar contador cuando sea visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });

            observer.observe(counter);
        });
    },

    setupParallax() {
        const parallaxElements = document.querySelectorAll('.parallax');
        
        if (parallaxElements.length === 0) return;

        const parallaxUpdate = Utils.throttle(() => {
            const scrollY = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = element.dataset.speed || 0.5;
                const yPos = -(scrollY * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        }, 16);

        window.addEventListener('scroll', parallaxUpdate);
    }
};

// ==========================================
// GESTIÓN DE FORMULARIOS
// ==========================================

const FormManager = {
    init() {
        this.contactForm = document.getElementById('contact-form');
        this.leadForm = document.getElementById('lead-form');
        
        if (this.contactForm) {
            this.initContactForm();
        }
        
        if (this.leadForm) {
            this.initLeadForm();
        }
    },

    initContactForm() {
        this.contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleContactSubmit();
        });

        // Validación en tiempo real
        const inputs = this.contactForm.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    },

    initLeadForm() {
        this.leadForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLeadSubmit();
        });

        // Validación en tiempo real
        const inputs = this.leadForm.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateLeadField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    },

    async handleContactSubmit() {
        const formData = new FormData(this.contactForm);
        const data = Object.fromEntries(formData);

        // Validar formulario
        if (!this.validateContactForm(data)) {
            return;
        }

        // Mostrar estado de carga
        this.setLoadingState(this.contactForm, true);

        try {
            // Enviar a WhatsApp
            this.sendContactToWhatsApp(data);
            
            // Opcional: Enviar al backend
            // await this.sendToBackend(data);
            
            this.showSuccessMessage('¡Consulta enviada! Te contactaremos pronto.');
            this.resetForm(this.contactForm);
            this.trackFormSubmission('contact_form', data);
            
        } catch (error) {
            console.error('Error al enviar formulario:', error);
            this.showErrorMessage('Hubo un error. Por favor, intenta nuevamente.');
        } finally {
            this.setLoadingState(this.contactForm, false);
        }
    },

    async handleLeadSubmit() {
        const formData = new FormData(this.leadForm);
        const data = Object.fromEntries(formData);

        // Validar formulario
        if (!this.validateLeadForm(data)) {
            return;
        }

        // Mostrar estado de carga
        this.setLoadingState(this.leadForm, true);

        try {
            // Simular envío de email
            await this.sendLeadEmail(data);
            
            this.showSuccessMessage('¡Guía enviada a tu email! Revisa tu bandeja de entrada.');
            this.resetForm(this.leadForm);
            this.trackFormSubmission('lead_magnet', data);
            
            // Redirigir a WhatsApp después de 3 segundos
            setTimeout(() => {
                this.redirectToWhatsApp(CONFIG.WHATSAPP_MESSAGES.LEAD_MAGNET);
            }, 3000);
            
        } catch (error) {
            console.error('Error al enviar lead magnet:', error);
            this.showErrorMessage('Hubo un error. Por favor, intenta nuevamente.');
        } finally {
            this.setLoadingState(this.leadForm, false);
        }
    },

    validateContactForm(data) {
        let isValid = true;

        // Validar nombre
        if (!data.name || data.name.trim().length < 2) {
            this.showFieldError('contact-name', 'Por favor, ingresa tu nombre completo');
            isValid = false;
        }

        // Validar teléfono
        if (!data.phone || !this.isValidPhone(data.phone)) {
            this.showFieldError('contact-phone', 'Por favor, ingresa un teléfono válido');
            isValid = false;
        }

        // Validar modelo
        if (!data.model || data.model === '') {
            this.showFieldError('contact-model', 'Por favor, selecciona un modelo');
            isValid = false;
        }

        // Validar mensaje
        if (!data.message || data.message.trim().length < 10) {
            this.showFieldError('contact-message', 'Por favor, contanos sobre tu proyecto');
            isValid = false;
        }

        return isValid;
    },

    validateLeadForm(data) {
        let isValid = true;

        // Validar nombre
        if (!data.name || data.name.trim().length < 2) {
            this.showFieldError('lead-name', 'Por favor, ingresa tu nombre');
            isValid = false;
        }

        // Validar email
        if (!data.email || !Utils.isValidEmail(data.email)) {
            this.showFieldError('lead-email', 'Por favor, ingresa un email válido');
            isValid = false;
        }

        return isValid;
    },

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('name');
        const fieldId = field.getAttribute('id');

        switch (fieldName) {
            case 'name':
                if (value.length < 2) {
                    this.showFieldError(fieldId, 'El nombre debe tener al menos 2 caracteres');
                    return false;
                }
                break;
            case 'phone':
                if (!this.isValidPhone(value)) {
                    this.showFieldError(fieldId, 'Teléfono inválido');
                    return false;
                }
                break;
        }

        this.clearFieldError(fieldId);
        return true;
    },

    validateLeadField(field) {
        const value = field.value.trim();
        const fieldId = field.getAttribute('id');

        if (fieldId === 'lead-name' && value.length < 2) {
            this.showFieldError(fieldId, 'El nombre debe tener al menos 2 caracteres');
            return false;
        }

        if (fieldId === 'lead-email' && !Utils.isValidEmail(value)) {
            this.showFieldError(fieldId, 'Email inválido');
            return false;
        }

        this.clearFieldError(fieldId);
        return true;
    },

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    },

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const formGroup = field.closest('.form__group');
        
        // Remover error previo
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Añadir clase de error
        field.classList.add('error');

        // Añadir mensaje de error
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #ef4444;
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;

        formGroup.appendChild(errorElement);
    },

    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const formGroup = field.closest('.form__group');
        const errorMessage = formGroup.querySelector('.error-message');
        
        if (errorMessage) {
            errorMessage.remove();
        }
        
        field.classList.remove('error');
    },

    setLoadingState(form, loading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        
        if (loading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            submitBtn.classList.add('loading');
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = form.id === 'lead-form' ? 'Descargar guía gratis' : 'Enviar consulta';
            submitBtn.classList.remove('loading');
        }
    },

    sendContactToWhatsApp(data) {
        const modelNames = {
            'monoambiente': 'Monoambiente',
            '1-dormitorio': '1 Dormitorio',
            '2-dormitorios': '2 Dormitorios',
            'consulta': 'Consulta general'
        };

        const modelName = modelNames[data.model] || 'Modelo no especificado';
        
        const message = `${CONFIG.WHATSAPP_MESSAGES.CONTACT_FORM}

?? *Datos de contacto:*
• Nombre: ${data.name}
• Teléfono: ${data.phone}

?? *Modelo de interés:*
• ${modelName}

?? *Mensaje:*
${data.message}

¡Espero su respuesta!`;

        this.redirectToWhatsApp(message);
    },

    async sendLeadEmail(data) {
        // Simular envío de email
        console.log('Sending lead magnet to email:', data.email);
        
        // Aquí iría la integración real con tu servicio de email
        // Por ejemplo: Mailchimp, SendGrid, etc.
        
        return new Promise((resolve) => {
            setTimeout(resolve, 1000);
        });
    },

    redirectToWhatsApp(message) {
        const whatsappUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    },

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    },

    showErrorMessage(message) {
        this.showMessage(message, 'error');
    },

    showMessage(message, type) {
        // Crear elemento de mensaje
        const messageEl = document.createElement('div');
        messageEl.className = `form-message form-message--${type}`;
        messageEl.textContent = message;
        
        // Estilos del mensaje
        messageEl.style.cssText = `
            padding: 1rem;
            margin-top: 1rem;
            border-radius: 0.5rem;
            font-weight: 500;
            text-align: center;
            ${type === 'success' 
                ? 'background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;' 
                : 'background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca;'
            }
        `;

        // Insertar después del formulario activo
        const activeForm = this.leadForm.offsetParent ? this.leadForm : this.contactForm;
        if (activeForm && activeForm.parentNode) {
            activeForm.parentNode.insertBefore(messageEl, activeForm.nextSibling);

            // Remover mensaje después de 5 segundos
            setTimeout(() => {
                messageEl.remove();
            }, 5000);
        }
    },

    resetForm(form) {
        form.reset();
        
        // Limpiar errores
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
        
        const errorFields = form.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));
    },

    trackFormSubmission(formType, data) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'form_submit', {
                form_type: formType,
                has_phone: !!data.phone,
                model_interest: data.model || 'none'
            });
        }
    }
};

// ==========================================
// GESTIÓN DE WHATSAPP
// ==========================================

const WhatsAppManager = {
    init() {
        this.setupFloatingButton();
        this.trackWhatsAppEvents();
    },

    setupFloatingButton() {
        const whatsappBtn = document.querySelector('.whatsapp-link');
        
        if (whatsappBtn) {
            // Añadir efectos hover
            whatsappBtn.addEventListener('mouseenter', () => {
                this.showTooltip(whatsappBtn);
            });
            
            whatsappBtn.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        }
    },

    showTooltip(button) {
        const tooltip = document.createElement('div');
        tooltip.className = 'whatsapp-tooltip';
        tooltip.textContent = 'Chateá con nosotros';
        tooltip.style.cssText = `
            position: absolute;
            bottom: 70px;
            right: 0;
            background-color: #1f2937;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 14px;
            white-space: nowrap;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.appendChild(tooltip);
        
        // Mostrar tooltip
        setTimeout(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        }, 100);
    },

    hideTooltip() {
        const tooltip = document.querySelector('.whatsapp-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    },

    trackWhatsAppEvents() {
        const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
        
        whatsappLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.trackWhatsAppClick(link);
            });
        });
    },

    trackWhatsAppClick(link) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'whatsapp_click', {
                button_location: Utils.getClosestSection(link),
                message_type: this.getMessageType(link)
            });
        }
    },

    getMessageType(link) {
        const href = link.getAttribute('href');
        if (href.includes('guía')) return 'lead_magnet';
        if (href.includes('modelo')) return 'model_interest';
        if (href.includes('formulario')) return 'contact_form';
        return 'default';
    }
};

// ==========================================
// GESTIÓN DE PERFORMANCE
// ==========================================

const PerformanceManager = {
    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.preloadCriticalResources();
        this.monitorPerformance();
    },

    setupLazyLoading() {
        const images = document.querySelectorAll('img');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: CONFIG.LAZY_LOAD_OFFSET
            });

            images.forEach(img => {
                if (!img.complete) {
                    imageObserver.observe(img);
                } else {
                    img.classList.add('loaded');
                }
            });
        }
    },

    loadImage(img) {
        if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }
        
        img.classList.add('loaded');
    },

    setupImageOptimization() {
        // Implementar WebP support detection
        this.checkWebPSupport();
        
        // Implementar responsive images
        this.setupResponsiveImages();
    },

    checkWebPSupport() {
        const webP = new Image();
        webP.onload = webP.onerror = () => {
            if (webP.height === 2) {
                document.body.classList.add('webp-support');
            }
        };
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6wwgAAERvepeAAEDtsQAAWQAA/uV/AAA';
    },

    setupResponsiveImages() {
        const images = document.querySelectorAll('img[data-srcset]');
        
        images.forEach(img => {
            const srcset = img.dataset.srcset;
            const sizes = img.dataset.sizes || '100vw';
            
            img.setAttribute('srcset', srcset);
            img.setAttribute('sizes', sizes);
            img.removeAttribute('data-srcset');
        });
    },

    preloadCriticalResources() {
        // Precargar fuentes críticas
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.as = 'font';
        fontLink.type = 'font/woff2';
        fontLink.crossOrigin = 'anonymous';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
        
        // Precargar imágenes críticas del hero
        const heroImg = document.querySelector('.hero__img');
        if (heroImg && heroImg.src) {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'image';
            preloadLink.href = heroImg.src;
            document.head.appendChild(preloadLink);
        }
    },

    monitorPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                    const domReady = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
                    
                    console.log('?? Performance Metrics:', {
                        loadTime: `${loadTime}ms`,
                        domReady: `${domReady}ms`,
                        totalTime: `${perfData.loadEventEnd - perfData.fetchStart}ms`
                    });
                    
                    // Reportar a analytics si es necesario
                    if (typeof gtag !== 'undefined' && loadTime > 0) {
                        gtag('event', 'page_load_time', {
                            load_time: Math.round(loadTime),
                            custom_parameter_1: 'eco_home_france'
                        });
                    }
                }, 0);
            });
        }
    }
};

// ==========================================
// GESTIÓN DE ANALYTICS Y EVENTOS
// ==========================================

const AnalyticsManager = {
    init() {
        this.setupEventTracking();
        this.trackPageView();
        this.setupScrollTracking();
    },

    setupEventTracking() {
        // Track CTA clicks
        document.querySelectorAll('.btn--primary').forEach(btn => {
            btn.addEventListener('click', () => {
                this.trackEvent('CTA_Click', {
                    button_text: btn.textContent.trim(),
                    page_section: Utils.getClosestSection(btn),
                    button_location: this.getButtonLocation(btn)
                });
            });
        });

        // Track navigation clicks
        document.querySelectorAll('.nav__link, a[href^="#"]').forEach(link => {
            link.addEventListener('click', () => {
                this.trackEvent('Navigation_Click', {
                    link_text: link.textContent.trim(),
                    link_href: link.getAttribute('href')
                });
            });
        });

        // Track model interest
        document.querySelectorAll('.model__card .btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modelCard = btn.closest('.model__card');
                const modelTitle = modelCard.querySelector('.model__title').textContent.trim();
                
                this.trackEvent('Model_Interest', {
                    model_name: modelTitle,
                    page_section: Utils.getClosestSection(btn)
                });
            });
        });

        // Track section views
        this.setupSectionTracking();
    },

    trackPageView() {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('config', 'GA_MEASUREMENT_ID', {
                page_title: document.title,
                page_location: window.location.href,
                custom_parameter_1: 'eco_home_france'
            });
        }
    },

    trackEvent(eventName, parameters = {}) {
        // Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...parameters,
                timestamp: new Date().toISOString()
            });
        }
        
        // Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('track', eventName, parameters);
        }
        
        // Console log for development
        console.log('Event tracked:', eventName, parameters);
    },

    getButtonLocation(button) {
        const section = button.closest('section');
        if (section) {
            return section.id || 'unknown';
        }
        return 'header';
    },

    setupSectionTracking() {
        const sections = document.querySelectorAll('section[id]');
        const trackedSections = new Set();
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !trackedSections.has(entry.target.id)) {
                    trackedSections.add(entry.target.id);
                    
                    this.trackEvent('Section_View', {
                        section_name: entry.target.id,
                        scroll_depth: this.getScrollDepth()
                    });
                }
            });
        }, {
            threshold: 0.5
        });

        sections.forEach(section => {
            observer.observe(section);
        });
    },

    getScrollDepth() {
        const scrollTop = window.pageYOffset;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        return Math.round((scrollTop / docHeight) * 100);
    },

    setupScrollTracking() {
        let maxScrollDepth = 0;
        
        const trackScrollDepth = Utils.throttle(() => {
            const currentDepth = this.getScrollDepth();
            
            if (currentDepth > maxScrollDepth) {
                maxScrollDepth = currentDepth;
                
                // Track milestones
                if (currentDepth >= 25 && !this.tracked25) {
                    this.tracked25 = true;
                    this.trackEvent('Scroll_Depth', { depth: 25 });
                }
                
                if (currentDepth >= 50 && !this.tracked50) {
                    this.tracked50 = true;
                    this.trackEvent('Scroll_Depth', { depth: 50 });
                }
                
                if (currentDepth >= 75 && !this.tracked75) {
                    this.tracked75 = true;
                    this.trackEvent('Scroll_Depth', { depth: 75 });
                }
                
                if (currentDepth >= 90 && !this.tracked90) {
                    this.tracked90 = true;
                    this.trackEvent('Scroll_Depth', { depth: 90 });
                }
            }
        }, 250);

        window.addEventListener('scroll', trackScrollDepth);
    }
};

// ==========================================
// INICIALIZACIÓN PRINCIPAL
// ==========================================

class EcoHomeFranceApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Esperar a que el DOM esté listo
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Inicializar módulos en orden de prioridad
            this.initCoreModules();
            
            // Inicializar módulos no críticos de forma asíncrona
            setTimeout(() => {
                this.initSecondaryModules();
            }, 100);
            
            this.isInitialized = true;
            console.log('? EcoHomeFranceApp inicializada correctamente');
            
        } catch (error) {
            console.error('? Error al inicializar la aplicación:', error);
        }
    }

    initCoreModules() {
        // Módulos críticos para la funcionalidad base
        Navigation.init();
        AnimationManager.init();
        FormManager.init();
        WhatsAppManager.init();
    }

    initSecondaryModules() {
        // Módulos para optimización y analytics
        PerformanceManager.init();
        AnalyticsManager.init();
    }

    // Método para reinicializar módulos si es necesario
    reinitModule(moduleName) {
        if (this.modules[moduleName] && typeof this.modules[moduleName].init === 'function') {
            this.modules[moduleName].init();
        }
    }
}

// ==========================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================

// Crear instancia global de la aplicación
const app = new EcoHomeFranceApp();

// Inicializar cuando el script se carga
app.init().catch(console.error);

// Exportar para uso global (útil para debugging)
window.EcoHomeFranceApp = app;

// ==========================================
// EVENTOS ADICIONALES Y MEJORAS UX
// ==========================================

// Smooth scroll para links internos (fallback)
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link && !link.classList.contains('btn')) {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            Utils.smoothScrollTo(target);
        }
    }
});

// Manejar errores JavaScript
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e.error);
    // Reportar errores críticos si es necesario
});

// Manejar promesas rechazadas
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// Manejar cambio de visibilidad de la página
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Página vuelta a estar visible
        console.log('?? Page visible again');
    }
});

// Manejar conexión online/offline
window.addEventListener('online', () => {
    console.log('?? Connection restored');
    // Reintentar acciones pendientes si es necesario
});

window.addEventListener('offline', () => {
    console.log('?? No internet connection');
    // Mostrar mensaje de conexión perdida
});

// Mejora de accesibilidad: focus management
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
});

document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
});

// Service Worker registration (opcional para PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('? Service Worker registrado:', registration);
            })
            .catch(error => {
                console.log('? Service Worker registration failed:', error);
            });
    });
}

// Easter egg: konami code para descuento especial
let konamiCode = [];
const konamiSequence = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ????????BA

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.keyCode);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.toString() === konamiSequence.toString()) {
        // Easter egg activado
        document.body.classList.add('konami-mode');
        
        // Mostrar mensaje especial
        const specialMessage = document.createElement('div');
        specialMessage.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: #1e3a8a; color: white; padding: 2rem; border-radius: 1rem; 
                        z-index: 9999; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <h3>?? ¡Código especial activado!</h3>
                <p>Descuento del 10% en tu primera consulta</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-top: 1rem; padding: 0.5rem 1rem; background: white; color: #1e3a8a; 
                               border: none; border-radius: 0.5rem; cursor: pointer;">
                    Cerrar
                </button>
            </div>
        `;
        document.body.appendChild(specialMessage);
        
        // Limpiar código
        konamiCode = [];
    }
});

// Función para debugging en desarrollo
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugApp = {
        app,
        Utils,
        Navigation,
        AnimationManager,
        FormManager,
        WhatsAppManager,
        PerformanceManager,
        AnalyticsManager
    };
    
    console.log('?? Debug mode activated. Use window.debugApp to access modules.');
}

console.log('?? EcoHomeFrance - Script cargado correctamente');
