/**
 * Contact Form Validation & Submission Handler
 * Transmet les données du formulaire et notifie salomonkatula2@gmail.com
 */
(function () {
  'use strict';

  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const firstNameInput = document.getElementById('contactFirstName');
    const lastNameInput = document.getElementById('contactLastName');
    const emailInput = document.getElementById('contactEmail');
    const numberInput = document.getElementById('contactNumber');
    const serviceInput = document.getElementById('contactService');
    const messageInput = document.getElementById('contactMessage');
    const submitBtn = document.getElementById('contactSubmitBtn');
    const statusBox = document.getElementById('contactFormStatus');

    const fields = [
      {
        input: firstNameInput,
        errorId: 'errorFirstName',
        groupId: 'groupFirstName',
        validate: (val) => {
          if (!val || !val.trim()) return 'Veuillez renseigner votre prénom.';
          if (val.trim().length < 2) return 'Le prénom doit contenir au moins 2 caractères.';
          return null;
        }
      },
      {
        input: lastNameInput,
        errorId: 'errorLastName',
        groupId: 'groupLastName',
        validate: (val) => {
          if (!val || !val.trim()) return 'Veuillez renseigner votre nom.';
          if (val.trim().length < 2) return 'Le nom doit contenir au moins 2 caractères.';
          return null;
        }
      },
      {
        input: emailInput,
        errorId: 'errorEmail',
        groupId: 'groupEmail',
        validate: (val) => {
          if (!val || !val.trim()) return 'Veuillez renseigner votre adresse e-mail.';
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(val.trim())) {
            return 'Veuillez saisir une adresse e-mail valide (ex: contact@exemple.com).';
          }
          return null;
        }
      },
      {
        input: numberInput,
        errorId: 'errorNumber',
        groupId: 'groupNumber',
        validate: (val) => {
          if (!val || !val.trim()) return 'Veuillez renseigner votre numéro de téléphone.';
          const clean = val.replace(/[\s\-\(\)\.]/g, '');
          if (clean.length < 6) return 'Veuillez saisir un numéro de téléphone valide.';
          return null;
        }
      },
      {
        input: messageInput,
        errorId: 'errorMessage',
        groupId: 'groupMessage',
        validate: (val) => {
          if (!val || !val.trim()) return 'Veuillez écrire votre message.';
          if (val.trim().length < 10) return 'Votre message doit comporter au moins 10 caractères.';
          return null;
        }
      }
    ];

    function clearFieldError(field) {
      const group = document.getElementById(field.groupId);
      const errEl = document.getElementById(field.errorId);
      if (group) group.classList.remove('has-error');
      if (errEl) {
        errEl.textContent = '';
        errEl.classList.remove('visible');
      }
    }

    function setFieldError(field, message) {
      const group = document.getElementById(field.groupId);
      const errEl = document.getElementById(field.errorId);
      if (group) group.classList.add('has-error');
      if (errEl) {
        errEl.textContent = message;
        errEl.classList.add('visible');
      }
    }

    // Clear error dynamically as user types
    fields.forEach((field) => {
      if (!field.input) return;
      ['input', 'change'].forEach((evt) => {
        field.input.addEventListener(evt, function () {
          clearFieldError(field);
        });
      });
      field.input.addEventListener('blur', function () {
        const err = field.validate(field.input.value);
        if (err) {
          setFieldError(field, err);
        } else {
          clearFieldError(field);
        }
      });
    });

    function escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function generateMailtoUrl(data) {
      const subject = encodeURIComponent(
        `Nouveau message portfolio de ${data.firstName} ${data.lastName} - ${data.service || 'Contact'}`
      );
      const body = encodeURIComponent(
        `Bonjour Salomon,\n\n` +
        `Voici un message envoyé depuis votre site portfolio :\n\n` +
        `Nom: ${data.firstName} ${data.lastName}\n` +
        `E-mail: ${data.email}\n` +
        `Téléphone: ${data.phone || 'Non renseigné'}\n` +
        `Service souhaité: ${data.service || 'Général'}\n\n` +
        `Message:\n${data.message}\n`
      );
      return `mailto:salomonkatula2@gmail.com?subject=${subject}&body=${body}`;
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Reset any old status
      if (statusBox) {
        statusBox.style.display = 'none';
        statusBox.className = 'contact-form-status';
        statusBox.innerHTML = '';
      }

      // Run client-side validation
      let hasError = false;
      let firstErrorField = null;

      fields.forEach((field) => {
        if (!field.input) return;
        const err = field.validate(field.input.value);
        if (err) {
          setFieldError(field, err);
          hasError = true;
          if (!firstErrorField) firstErrorField = field.input;
        } else {
          clearFieldError(field);
        }
      });

      if (hasError) {
        if (firstErrorField) {
          firstErrorField.focus();
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Collect values
      const formData = {
        firstName: firstNameInput ? firstNameInput.value.trim() : '',
        lastName: lastNameInput ? lastNameInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        phone: numberInput ? numberInput.value.trim() : '',
        service: serviceInput ? serviceInput.value.trim() : '',
        message: messageInput ? messageInput.value.trim() : ''
      };

      const mailtoLink = generateMailtoUrl(formData);

      // Loading state
      const btnAnimatedText = submitBtn ? submitBtn.querySelector('.btn-animated-text') : null;
      const originalText = btnAnimatedText ? btnAnimatedText.textContent : 'Envoyer le message';

      if (submitBtn) submitBtn.disabled = true;
      if (btnAnimatedText) {
        btnAnimatedText.textContent = 'Envoi en cours...';
        btnAnimatedText.setAttribute('data-text', 'Envoi en cours...');
      }

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
          // Success display
          if (statusBox) {
            statusBox.className = 'contact-form-status status-success';
            statusBox.innerHTML = `
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <i class="ph-thin ph-check-circle" style="font-size: 28px; line-height: 1; flex-shrink: 0; color: #4ade80;"></i>
                <div style="flex-grow: 1;">
                  <strong style="display: block; font-size: 16px; margin-bottom: 4px; color: inherit;">
                    Message transmis avec succès !
                  </strong>
                  <p style="margin-bottom: 8px; color: inherit;">
                    Merci <strong>${escapeHtml(formData.firstName)}</strong>, votre message a bien été enregistré pour transmission à Salomon Katula (<a href="mailto:salomonkatula2@gmail.com" style="text-decoration: underline; color: inherit;">salomonkatula2@gmail.com</a>).
                  </p>
                  <p style="font-size: 13px; opacity: 0.9; margin-bottom: 12px; color: inherit;">
                    Une réponse vous sera adressée sous 24 à 48 heures.
                  </p>
                  <div>
                    <a href="${mailtoLink}" class="btn-mailto-action" target="_blank" rel="noopener noreferrer" title="Ouvrir dans votre client de messagerie">
                      <i class="ph-thin ph-envelope-simple" style="font-size: 16px;"></i>
                      <span>Ouvrir une copie dans votre messagerie e-mail</span>
                    </a>
                  </div>
                </div>
              </div>
            `;
            statusBox.style.display = 'block';
            statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // Reset form fields
          form.reset();
          if (window.jQuery && window.jQuery(serviceInput).length) {
            window.jQuery(serviceInput).niceSelect('update');
          }
        } else {
          throw new Error(result.error || 'Erreur lors de la soumission.');
        }
      } catch (err) {
        console.warn('[Contact Form] Erreur envoi API, fallback e-mail disponible:', err);
        if (statusBox) {
          statusBox.className = 'contact-form-status status-error';
          statusBox.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <i class="ph-thin ph-info" style="font-size: 28px; line-height: 1; flex-shrink: 0; color: #f87171;"></i>
              <div style="flex-grow: 1;">
                <strong style="display: block; font-size: 15px; margin-bottom: 4px; color: inherit;">
                  Information d'envoi
                </strong>
                <p style="margin-bottom: 10px; color: inherit;">
                  Une difficulté temporaire a été rencontrée lors de l'envoi direct. Vous pouvez transmettre directement votre message à <strong>salomonkatula2@gmail.com</strong> ou appeler au <strong>+243 823102313</strong> :
                </p>
                <div>
                  <a href="${mailtoLink}" class="btn-mailto-action" target="_blank" rel="noopener noreferrer">
                    <i class="ph-thin ph-envelope-simple" style="font-size: 16px;"></i>
                    <span>Envoyer directement à salomonkatula2@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>
          `;
          statusBox.style.display = 'block';
          statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnAnimatedText) {
          btnAnimatedText.textContent = originalText;
          btnAnimatedText.setAttribute('data-text', originalText);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForm);
  } else {
    initContactForm();
  }
})();
