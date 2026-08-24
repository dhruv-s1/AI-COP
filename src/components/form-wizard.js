export function createFormWizard(config) {
    const { steps, onSubmit, containerId } = config;
    const container = document.getElementById(containerId);
    if (!container) return;

    let currentStep = 0;
    const formData = {};

    const render = () => {
        let html = `
            <div class="wizard-container glass-card">
                <div class="wizard-progress">
                    ${steps.map((step, idx) => `
                        <div class="progress-step ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}">
                            <div class="step-indicator">${idx + 1}</div>
                            <div class="step-label">${step.title}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="wizard-content">
                    <form id="wizard-form" novalidate>
                        ${renderFields(steps[currentStep].fields)}
                        <div class="wizard-actions">
                            ${currentStep > 0 ? `<button type="button" class="btn-neo btn-prev">Previous</button>` : '<div></div>'}
                            <button type="button" class="btn-neo-primary btn-next">${currentStep === steps.length - 1 ? 'Submit' : 'Next'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        container.innerHTML = html;
        attachEvents();
    };

    const renderFields = (fields) => {
        return fields.map(field => {
            const value = formData[field.name] || '';
            let inputHtml = '';
            
            switch (field.type) {
                case 'heading':
                    return `<h3 class="participant-section-heading">${field.label}</h3>`;
                case 'textarea':
                    inputHtml = `<textarea id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>${value}</textarea>`;
                    break;
                case 'select':
                    inputHtml = `
                        <select id="${field.name}" name="${field.name}" ${field.required ? 'required' : ''}>
                            <option value="">Select an option</option>
                            ${field.options.map(opt => `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                    `;
                    break;
                case 'checkbox':
                    inputHtml = `
                        <label class="checkbox-label">
                            <input type="checkbox" id="${field.name}" name="${field.name}" ${value ? 'checked' : ''} ${field.required ? 'required' : ''}>
                            ${field.label}
                        </label>
                    `;
                    break;
                case 'radio':
                    inputHtml = field.options.map(opt => `
                        <label class="radio-label">
                            <input type="radio" name="${field.name}" value="${opt.value}" ${value === opt.value ? 'checked' : ''} ${field.required ? 'required' : ''}>
                            ${opt.label}
                        </label>
                    `).join('');
                    break;
                default:
                    inputHtml = `<input type="${field.type || 'text'}" id="${field.name}" name="${field.name}" value="${value}" ${field.required ? 'required' : ''}>`;
            }

            if (field.type === 'checkbox') {
                return `<div class="form-group">${inputHtml}<span class="error-msg" id="error-${field.name}"></span></div>`;
            }

            return `
                <div class="form-group">
                    ${field.type !== 'radio' ? `<label for="${field.name}">${field.label}</label>` : `<label>${field.label}</label>`}
                    ${inputHtml}
                    <span class="error-msg" id="error-${field.name}"></span>
                </div>
            `;
        }).join('');
    };

    const attachEvents = () => {
        const form = container.querySelector('#wizard-form');
        const prevBtn = container.querySelector('.btn-prev');
        const nextBtn = container.querySelector('.btn-next');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                saveData(form);
                currentStep--;
                render();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                saveData(form);
                if (validateStep(form)) {
                    if (currentStep === steps.length - 1) {
                        nextBtn.disabled = true;
                        handleSubmit();
                    } else {
                        currentStep++;
                        render();
                    }
                }
            });
        }
    };

    const saveData = (form) => {
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el.name) {
                if (el.type === 'checkbox') {
                    formData[el.name] = el.checked;
                } else if (el.type === 'radio') {
                    if (el.checked) formData[el.name] = el.value;
                } else {
                    formData[el.name] = el.value;
                }
            }
        }
    };

    const validateStep = (form) => {
        let isValid = true;
        const currentFields = steps[currentStep].fields;
        
        currentFields.forEach(field => {
            const el = form.elements[field.name];
            const errorSpan = container.querySelector(`#error-${field.name}`);
            let error = '';

            if (field.required) {
                if (field.type === 'checkbox' && !el.checked) {
                    error = 'This field is required';
                } else if (field.type === 'radio') {
                    const radios = form.querySelectorAll(`input[name="${field.name}"]`);
                    const checked = Array.from(radios).some(r => r.checked);
                    if (!checked) error = 'Please select an option';
                } else if (!formData[field.name]) {
                    error = 'This field is required';
                }
            }

            if (!error && formData[field.name] && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.name])) {
                error = 'Enter a valid email address';
            }
            if (!error && formData[field.name] && field.type === 'tel' && !/^[+\d][\d\s().-]{6,}$/.test(formData[field.name])) {
                error = 'Enter a valid phone number';
            }

            if (error) {
                isValid = false;
                if (errorSpan) {
                    errorSpan.textContent = error;
                    errorSpan.parentElement.classList.add('shake');
                    setTimeout(() => errorSpan.parentElement.classList.remove('shake'), 500);
                }
            } else if (errorSpan) {
                errorSpan.textContent = '';
            }
        });

        const stepValidateFn = steps[currentStep].validate;
        if (isValid && stepValidateFn) {
            const customError = stepValidateFn(formData);
            if (customError) {
                isValid = false;
                alert(customError);
            }
        }

        return isValid;
    };

    const handleSubmit = async () => {
        try {
            if (config.onSubmit) await config.onSubmit(formData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unable to submit registration.';
            const formError = document.createElement('p');
            formError.className = 'form-submit-error';
            formError.textContent = errorMessage;
            container.querySelector('.wizard-actions')?.prepend(formError);
            return;
        }

        container.innerHTML = `
            <div class="wizard-container glass-card success-animation">
                <div class="success-icon">✓</div>
                <h2>Registration Successful!</h2>
                <p>Thank you for registering. We will be in touch shortly.</p>
            </div>
        `;
    };

    render();
}

export function generateEventFields(eventId, eventName, participantCount = 1) {
    const fields = [];

    for (let participantIndex = 1; participantIndex <= participantCount; participantIndex++) {
        const participantPrefix = `${eventId}_participant${participantIndex}`;
        fields.push(
            { name: `${participantPrefix}_heading`, label: `Participant ${participantIndex}`, type: 'heading' },
            { name: `${participantPrefix}_name`, label: 'Name', type: 'text', required: true },
            { name: `${participantPrefix}_email`, label: 'Email', type: 'email', required: true },
            { name: `${participantPrefix}_phone`, label: 'Phone', type: 'tel', required: true },
            { name: `${participantPrefix}_grade`, label: 'Grade', type: 'select', options: [
                { value: '9', label: 'Grade 9' },
                { value: '10', label: 'Grade 10' },
                { value: '11', label: 'Grade 11' },
                { value: '12', label: 'Grade 12' }
            ], required: true }
        );
    }

    return {
        id: eventId,
        title: eventName,
        fields,
    };
}
