// Booking Page JavaScript

let currentStep = 1;
let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let availableSlots = [];

// Step management
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep < 4) {
            currentStep++;
            updateStepDisplay();
            updateProgressSteps();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
        updateProgressSteps();
    }
}

function updateStepDisplay() {
    // Hide all steps
    document.querySelectorAll('.booking-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show current step
    document.getElementById(`step-${currentStep}`).classList.add('active');
    
    // Update step 4 summary if we're on that step
    if (currentStep === 4) {
        updateBookingSummary();
    }
}

function updateProgressSteps() {
    document.querySelectorAll('.step').forEach((step, index) => {
        const stepNumber = index + 1;
        
        step.classList.remove('active', 'completed');
        
        if (stepNumber < currentStep) {
            step.classList.add('completed');
        } else if (stepNumber === currentStep) {
            step.classList.add('active');
        }
    });
}

// Step validation
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

function validateStep1() {
    const selectedServiceRadio = document.querySelector('input[name="service"]:checked');
    if (!selectedServiceRadio) {
        SkinSense.showErrorMessage('Please select a service.');
        return false;
    }
    
    selectedService = {
        id: selectedServiceRadio.value,
        name: selectedServiceRadio.closest('.service-option').querySelector('.service-name').textContent,
        price: selectedServiceRadio.closest('.service-option').querySelector('.service-price').textContent,
        duration: selectedServiceRadio.closest('.service-option').querySelector('.service-duration').textContent
    };
    
    return true;
}

function validateStep2() {
    const dateInput = document.getElementById('appointment-date');
    const timeInput = document.getElementById('appointment-time');
    
    if (!dateInput.value) {
        SkinSense.showErrorMessage('Please select an appointment date.');
        return false;
    }
    
    if (!timeInput.value) {
        SkinSense.showErrorMessage('Please select an appointment time.');
        return false;
    }
    
    selectedDate = dateInput.value;
    selectedTime = timeInput.value;
    
    return true;
}

function validateStep3() {
    const form = document.getElementById('booking-form');
    const requiredFields = form.querySelectorAll('#step-3 [required]');
    
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            SkinSense.showErrorMessage('Please fill in all required fields.');
            return false;
        }
    }
    
    return true;
}

// Service selection handling
function initializeServiceSelection() {
    document.querySelectorAll('input[name="service"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Update next button state
            const nextButton = document.getElementById('step-1-next');
            nextButton.disabled = false;
            
            // Highlight selected service
            document.querySelectorAll('.service-option').forEach(option => {
                option.classList.remove('selected');
            });
            this.closest('.service-option').classList.add('selected');
        });
    });
}

// Date and time handling
function initializeDateTimeSelection() {
    const dateInput = document.getElementById('appointment-date');
    const timeSelect = document.getElementById('appointment-time');
    const nextButton = document.getElementById('step-2-next');
    
    // Set minimum date to today
    const today = new Date();
    dateInput.min = today.toISOString().split('T')[0];
    
    // Set maximum date to 6 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    dateInput.addEventListener('change', async function() {
        if (this.value && selectedService) {
            await loadAvailableSlots(this.value, selectedService.id);
        }
    });
    
    timeSelect.addEventListener('change', function() {
        selectedTime = this.value;
        nextButton.disabled = !selectedDate || !selectedTime;
    });
}

// Load available time slots
async function loadAvailableSlots(date, serviceId) {
    const slotsContainer = document.getElementById('time-slots-container');
    const timeSelect = document.getElementById('appointment-time');
    const loadingIndicator = document.getElementById('slots-loading');
    const availableSlotsDiv = document.getElementById('available-slots');
    
    try {
        loadingIndicator.style.display = 'block';
        availableSlotsDiv.style.display = 'none';
        
        const response = await SkinSense.makeRequest(`/api/bookings/available-slots?date=${date}&serviceId=${serviceId}`, {
            silent: true
        });
        
        availableSlots = response.data.availableSlots;
        
        // Clear existing options
        timeSelect.innerHTML = '<option value="">Choose a time</option>';
        slotsContainer.innerHTML = '';
        
        if (availableSlots.length === 0) {
            slotsContainer.innerHTML = '<p class="text-muted">No available slots for this date. Please choose another date.</p>';
        } else {
            // Populate time select
            availableSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = SkinSense.formatTime(slot);
                timeSelect.appendChild(option);
            });
            
            // Create time slot buttons
            availableSlots.forEach(slot => {
                const slotButton = document.createElement('button');
                slotButton.type = 'button';
                slotButton.className = 'time-slot';
                slotButton.textContent = SkinSense.formatTime(slot);
                slotButton.addEventListener('click', () => selectTimeSlot(slot, slotButton));
                slotsContainer.appendChild(slotButton);
            });
        }
        
        availableSlotsDiv.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading available slots:', error);
        slotsContainer.innerHTML = '<p class="text-danger">Error loading available slots. Please try again.</p>';
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

function selectTimeSlot(time, buttonElement) {
    // Remove selection from all slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Select clicked slot
    buttonElement.classList.add('selected');
    
    // Update select dropdown
    const timeSelect = document.getElementById('appointment-time');
    timeSelect.value = time;
    
    // Update variables and button state
    selectedTime = time;
    const nextButton = document.getElementById('step-2-next');
    nextButton.disabled = !selectedDate || !selectedTime;
}

// Update booking summary
function updateBookingSummary() {
    const summaryContainer = document.getElementById('booking-summary');
    
    if (!selectedService || !selectedDate || !selectedTime) {
        summaryContainer.innerHTML = '<p class="text-danger">Missing booking information. Please go back and complete all steps.</p>';
        return;
    }
    
    const formData = new FormData(document.getElementById('booking-form'));
    
    const summary = `
        <div class="booking-summary-card">
            <h5 class="mb-3">Booking Summary</h5>
            
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Service:</strong></div>
                <div class="col-sm-8">${selectedService.name}</div>
            </div>
            
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Date:</strong></div>
                <div class="col-sm-8">${SkinSense.formatDate(selectedDate)}</div>
            </div>
            
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Time:</strong></div>
                <div class="col-sm-8">${SkinSense.formatTime(selectedTime)}</div>
            </div>
            
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Duration:</strong></div>
                <div class="col-sm-8">${selectedService.duration}</div>
            </div>
            
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Price:</strong></div>
                <div class="col-sm-8 text-primary fw-bold">${selectedService.price}</div>
            </div>
            
            <hr>
            
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Client:</strong></div>
                <div class="col-sm-8">${formData.get('firstName')} ${formData.get('lastName')}</div>
            </div>
            
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Email:</strong></div>
                <div class="col-sm-8">${formData.get('email')}</div>
            </div>
            
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Phone:</strong></div>
                <div class="col-sm-8">${formData.get('phone')}</div>
            </div>
            
            ${formData.get('notes') ? `
            <div class="row mb-3">
                <div class="col-sm-4"><strong>Notes:</strong></div>
                <div class="col-sm-8">${formData.get('notes')}</div>
            </div>
            ` : ''}
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Important:</strong> Please arrive 15 minutes early for your appointment. 
                You will receive a confirmation email shortly after booking.
            </div>
        </div>
    `;
    
    summaryContainer.innerHTML = summary;
}

// Form submission
async function submitBooking(event) {
    event.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }
    
    const termsCheckbox = document.getElementById('terms-agreement');
    if (!termsCheckbox.checked) {
        SkinSense.showErrorMessage('Please accept the terms and conditions.');
        return;
    }
    
    const submitButton = document.getElementById('confirm-booking');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
        
        // Collect form data
        const formData = new FormData(document.getElementById('booking-form'));
        
        // Prepare booking data
        const bookingData = {
            service: selectedService.id,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
            notes: {
                client: formData.get('notes') || ''
            },
            skinAssessment: {
                skinType: formData.get('skinType'),
                skinConcerns: formData.getAll('skinConcerns'),
                allergies: formData.get('allergies') ? formData.get('allergies').split(',').map(a => a.trim()) : []
            }
        };
        
        // Submit booking
        const response = await SkinSense.makeRequest('/api/bookings', {
            method: 'POST',
            data: bookingData
        });
        
        // Redirect to success page or booking details
        SkinSense.showSuccessMessage('Booking confirmed successfully! Redirecting...');
        
        setTimeout(() => {
            window.location.href = `/bookings/${response.data.booking.id}`;
        }, 2000);
        
    } catch (error) {
        console.error('Booking submission error:', error);
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Booking page initialized');
    
    // Initialize step functionality
    updateStepDisplay();
    updateProgressSteps();
    
    // Initialize service selection
    initializeServiceSelection();
    
    // Initialize date/time selection
    initializeDateTimeSelection();
    
    // Form submission
    document.getElementById('booking-form').addEventListener('submit', submitBooking);
    
    // Check for pre-selected service from URL
    const urlParams = new URLSearchParams(window.location.search);
    const preSelectedService = urlParams.get('service');
    
    if (preSelectedService) {
        const serviceRadio = document.querySelector(`input[name="service"][value="${preSelectedService}"]`);
        if (serviceRadio) {
            serviceRadio.checked = true;
            serviceRadio.dispatchEvent(new Event('change'));
        }
    }
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.classList.contains('time-slot')) {
            e.target.click();
        }
    });
    
    // Add accessibility improvements
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.setAttribute('role', 'button');
        slot.setAttribute('tabindex', '0');
        slot.setAttribute('aria-label', `Select ${slot.textContent} time slot`);
    });
    
    // Auto-save form data to localStorage
    const form = document.getElementById('booking-form');
    const saveFormData = () => {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        data.selectedService = selectedService;
        data.selectedDate = selectedDate;
        data.selectedTime = selectedTime;
        data.currentStep = currentStep;
        
        localStorage.setItem('bookingFormData', JSON.stringify(data));
    };
    
    // Save on input changes
    form.addEventListener('input', saveFormData);
    form.addEventListener('change', saveFormData);
    
    // Load saved form data
    const savedData = localStorage.getItem('bookingFormData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            // Restore form fields
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field && data[key]) {
                    field.value = data[key];
                }
            });
            
            // Restore selections
            if (data.selectedService) {
                selectedService = data.selectedService;
                const serviceRadio = form.querySelector(`input[name="service"][value="${data.selectedService.id}"]`);
                if (serviceRadio) {
                    serviceRadio.checked = true;
                }
            }
            
            if (data.selectedDate) {
                selectedDate = data.selectedDate;
                const dateInput = document.getElementById('appointment-date');
                dateInput.value = data.selectedDate;
            }
            
            if (data.selectedTime) {
                selectedTime = data.selectedTime;
            }
            
            // Don't restore step - always start from step 1
            
        } catch (error) {
            console.error('Error loading saved form data:', error);
            localStorage.removeItem('bookingFormData');
        }
    }
    
    // Clear saved data on successful submission
    window.addEventListener('beforeunload', () => {
        // Only clear if we're navigating away after successful booking
        if (window.location.pathname.includes('/bookings/')) {
            localStorage.removeItem('bookingFormData');
        }
    });
});

// Export functions for external use
window.BookingPage = {
    nextStep,
    prevStep,
    selectTimeSlot,
    loadAvailableSlots
};
