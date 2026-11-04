/**
 * KICKSTART FUNCTIONAL PRIMARY CARE
 * Master Controller: FAQ Accordion, Modal Dialog, Navigation, Form Handling
 * Zero external dependencies. Fast vanilla JS.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- 1. FAQ ACCORDION CONTROLLER ---
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const header = item.querySelector('.faq-header');
    const body = item.querySelector('.faq-body');

    if (header && body) {
      header.addEventListener('click', () => {
        const isCurrentActive = item.classList.contains('active');

        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherBody = otherItem.querySelector('.faq-body');
            if (otherBody) otherBody.style.maxHeight = null;
          }
        });

        // Toggle clicked item
        if (!isCurrentActive) {
          item.classList.add('active');
          body.style.maxHeight = body.scrollHeight + 'px';
        } else {
          item.classList.remove('active');
          body.style.maxHeight = null;
        }
      });
    }
  });

  // --- 2. SCHEDULE VISIT MODAL CONTROLLER ---
  const modal = document.getElementById('schedule-modal');
  const openTriggers = document.querySelectorAll('.open-modal-trigger');
  const closeTrigger = document.getElementById('modal-close-trigger');

  function openModal() {
    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  }

  openTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (closeTrigger) {
    closeTrigger.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  }

  // --- 3. CONSULTATION FORM SUBMISSION (Make.com Webhook for Forminator 448) ---
  const MAKE_WEBHOOK_URL = 'https://hook.us1.make.com/gvci47v65434cdiq95mwojld43bdyj3j';
  const form = document.getElementById('consultation-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('.modal-submit-btn');
      const originalText = submitBtn ? submitBtn.textContent : 'Secure Your Discovery Call';

      if (submitBtn) {
        submitBtn.textContent = 'Submitting Request...';
        submitBtn.disabled = true;
      }

      try {
        const formData = new FormData(form);

        // Ensure hidden page context fields are populated dynamically
        formData.set('current_url', window.location.href);
        formData.set('referer_url', document.referrer || '');
        formData.set('_wp_http_referer', window.location.pathname || '/');
        formData.set('page_title', document.title || '');
        formData.set('submitted_at', new Date().toISOString());

        // Provide both hyphenated (Forminator HTML) and underscored (Forminator Webhook) keys so existing Make modules map seamlessly
        const firstName = formData.get('name-1') || '';
        const lastName = formData.get('name-2') || '';
        const phone = formData.get('phone-1') || '';
        const email = formData.get('email-1') || '';
        const healthFocus = formData.get('select-1') || '';
        const details = formData.get('textarea-1') || '';
        const insuranceProvider = formData.get('text-1') || '';
        const smsConsent = form.querySelector('#sms-consent')?.checked ? 'yes' : 'no';
        const marketingConsent = form.querySelector('#marketing-consent')?.checked ? 'yes' : 'no';

        formData.append('name_1', firstName);
        formData.append('name_2', lastName);
        formData.append('phone_1', phone);
        formData.append('email_1', email);
        formData.append('select_1', healthFocus);
        formData.append('textarea_1', details);
        formData.append('text_1', insuranceProvider);
        formData.append('checkbox_1', smsConsent);
        formData.append('checkbox_2', marketingConsent);

        const uploadInput = form.querySelector('#insurance-card');
        if (uploadInput && uploadInput.files && uploadInput.files.length > 0) {
          formData.append('upload_1', uploadInput.files[0]);
        }

        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('full_name', `${firstName} ${lastName}`.trim());
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('primary_health_focus', healthFocus);
        formData.append('details', details);
        formData.append('insurance_provider', insuranceProvider);
        formData.append('sms_consent', smsConsent);
        formData.append('marketing_consent', marketingConsent);

        const response = await fetch(MAKE_WEBHOOK_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Webhook responded with status ${response.status}`);
        }

        // Fire analytics/conversion events if present
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', {
            event_category: 'New Patient Intake Modal',
            event_label: window.location.pathname
          });
        }
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Lead', {
            content_name: 'New Patient Intake Modal',
            content_category: healthFocus
          });
        }

        form.innerHTML = `
          <div style="text-align: center; padding: 25px 0;">
            <div style="width: 50px; height: 50px; background-color: #4F6841; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 15px;">&#10003;</div>
            <h4 style="font-size: 20px; color: #1A2B45; margin-bottom: 10px;">Consultation Request Received!</h4>
            <p style="font-size: 14px; color: #54595F; line-height: 1.6;">Our Glendale clinical coordinator will call you shortly to confirm your preferred visit time and verify insurance benefits.</p>
          </div>
        `;
      } catch (err) {
        console.error('Error submitting form to Make webhook:', err);
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
        alert('There was an issue submitting your request. Please try again or call our clinic directly at (623) 624-8011.');
      }
    });
  }

  // --- 3B. CONTACT PAGE FORM SUBMISSION (Make.com Webhook for Forminator 199) ---
  const CONTACT_WEBHOOK_URL = 'https://hook.us1.make.com/2ga7nrli6oi1x3en8n2vbidjdr31qvex';
  const contactPageForm = document.getElementById('contact-page-form');
  if (contactPageForm) {
    contactPageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactPageForm.querySelector('.contact-submit-btn');
      const originalText = submitBtn ? submitBtn.textContent : 'SUBMIT';

      if (submitBtn) {
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
      }

      try {
        const formData = new FormData(contactPageForm);

        // Populate context metadata
        formData.set('current_url', window.location.href);
        formData.set('referer_url', document.referrer || '');
        formData.set('page_title', document.title || 'Contact Us');
        formData.set('submitted_at', new Date().toISOString());

        const firstName = formData.get('name-2') || '';
        const lastName = formData.get('name-1') || '';
        const email = formData.get('email-1') || '';
        const phone = formData.get('phone-1') || '';
        const topic = formData.get('select-1') || '';
        const details = formData.get('textarea-1') || '';
        const smsConsent = contactPageForm.querySelector('#contact-consent-sms')?.checked ? 'yes' : 'no';
        const marketingConsent = contactPageForm.querySelector('#contact-consent-marketing')?.checked ? 'yes' : 'no';

        // Provide underscored keys to match Make standard conventions
        formData.append('name_2', firstName);
        formData.append('name_1', lastName);
        formData.append('email_1', email);
        formData.append('phone_1', phone);
        formData.append('select_1', topic);
        formData.append('textarea_1', details);
        formData.append('checkbox_1', smsConsent);
        formData.append('checkbox_2', marketingConsent);

        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('full_name', `${firstName} ${lastName}`.trim());
        formData.append('email', email);
        formData.append('phone', phone);
        formData.append('topic', topic);
        formData.append('details', details);
        formData.append('sms_consent', smsConsent);
        formData.append('marketing_consent', marketingConsent);

        const response = await fetch(CONTACT_WEBHOOK_URL, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Contact webhook responded with status ${response.status}`);
        }

        // Fire analytics events
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', {
            event_category: 'Contact Page Inquiry',
            event_label: '/contact-glendale-functional-medicine-pcp/'
          });
        }
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Contact', {
            content_name: 'Contact Page Form',
            content_category: topic
          });
        }

        contactPageForm.innerHTML = `
          <div style="text-align: center; padding: 30px 10px;">
            <div style="width: 50px; height: 50px; background-color: #4F6841; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; margin: 0 auto 15px;">&#10003;</div>
            <h4 style="font-size: 20px; color: #1A2B45; margin-bottom: 10px;">Message Received!</h4>
            <p style="font-size: 14px; color: #54595F; line-height: 1.6;">Thank you for reaching out to KickStart Functional Primary Care. Our Glendale team will follow up with you shortly.</p>
          </div>
        `;
      } catch (err) {
        console.error('Error submitting contact form to Make webhook:', err);
        if (submitBtn) {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }
        alert('There was an issue sending your message. Please try again or call our clinic directly at (623) 624-8011.');
      }
    });
  }

  // --- 4. MOBILE MENU & ACCORDION DROPDOWN CONTROLLER ---
  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const siteNav = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      siteNav.classList.toggle('is-open');
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
      if (siteNav.classList.contains('is-open') && !siteNav.contains(e.target) && !menuToggle.contains(e.target)) {
        siteNav.classList.remove('is-open');
      }
    });

    // Enable dropdown accordion click on mobile screens
    const navItemsWithSubmenu = siteNav.querySelectorAll('.nav-item');
    navItemsWithSubmenu.forEach(item => {
      const link = item.querySelector('.nav-link');
      const dropdown = item.querySelector('.dropdown-menu');

      if (link && dropdown) {
        link.addEventListener('click', (e) => {
          if (window.innerWidth <= 768) {
            // Toggle dropdown instead of navigating immediately if clicking the parent
            if (e.target.closest('svg') || link.getAttribute('href').startsWith('/#')) {
              e.preventDefault();
              dropdown.classList.toggle('is-active');
            }
          }
        });
      }
    });
  }
});
