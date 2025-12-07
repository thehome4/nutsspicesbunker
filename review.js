// Review Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const starRating = document.getElementById('starRating');
    const stars = starRating.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating');
    const reviewForm = document.getElementById('reviewForm');
    const userNameInput = document.getElementById('userName');
    const reviewTextInput = document.getElementById('reviewText');
    const imageInput = document.getElementById('imageInput');
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const reviewsList = document.getElementById('reviewsList');
    
    // Replace with your actual Google Apps Script Web App URL after deployment
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyyBuhOvgX6NWxx6P9dMiEo1TUx1I9kctGoqSjsuKn__azpJzeSrnfzSpxlxuOmBSTp/exec';
    
    // CSV URL for fetching reviews - Use tab-separated format
    const REVIEWS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS4m9d79TtDcJivToGkE4Uu5xoJ9yIRvY8g0SlEzWYghlfCfnqydvsxwzBo_sXaX-AI7rmw4zrQk435/pub?gid=0&single=true&output=tsv';
    
    // Current rating
    let currentRating = 0;
    let selectedImage = null;
    let selectedImageBase64 = null;
    
    // Initialize star rating
    initStarRating();
    
    // Initialize image upload
    initImageUpload();
    
    // Load existing reviews
    loadReviews();
    
    // Form submission
    reviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Disable submit button and show spinner
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitSpinner.style.display = 'block';
        
        try {
            // Prepare submission data
            const formData = {
                name: userNameInput.value.trim(),
                rating: currentRating,
                review: reviewTextInput.value.trim(),
                timestamp: new Date().toISOString()
            };
            
            // Add image if selected
            if (selectedImageBase64) {
                formData.image = selectedImageBase64;
                formData.imageType = selectedImage ? selectedImage.type : 'image/jpeg';
            }
            
            // Submit to Google Apps Script
            const response = await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            // Show success message
            showNotification('Review submitted successfully! Thank you for your feedback.', 'success');
            
            // Reset form
            resetForm();
            
            // Wait 2 seconds then reload reviews
            setTimeout(() => {
                loadReviews();
            }, 2000);
            
        } catch (error) {
            console.error('Error submitting review:', error);
            showNotification('Failed to submit review. Please try again later.', 'error');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitSpinner.style.display = 'none';
        }
    });
    
    // Initialize star rating
    function initStarRating() {
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const value = parseInt(this.getAttribute('data-value'));
                setRating(value);
            });
            
            star.addEventListener('mouseover', function() {
                const value = parseInt(this.getAttribute('data-value'));
                highlightStars(value);
            });
        });
        
        starRating.addEventListener('mouseleave', function() {
            highlightStars(currentRating);
        });
    }
    
    // Set rating
    function setRating(value) {
        currentRating = value;
        ratingInput.value = value;
        highlightStars(value);
    }
    
    // Highlight stars
    function highlightStars(value) {
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }
    
    // Initialize image upload
    function initImageUpload() {
        imageUpload.addEventListener('click', function() {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Image size must be less than 5MB', 'error');
                    return;
                }
                
                // Validate file type
                if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
                    showNotification('Only JPG and PNG images are allowed', 'error');
                    return;
                }
                
                selectedImage = file;
                
                // Show preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    selectedImageBase64 = e.target.result;
                    imagePreview.src = selectedImageBase64;
                    imagePreview.style.display = 'block';
                    imageUpload.style.borderStyle = 'solid';
                    imageUpload.style.borderColor = 'var(--primary-medium)';
                    imageUpload.querySelector('p').textContent = 'Image selected. Click to change.';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Validate form
    function validateForm() {
        if (!userNameInput.value.trim()) {
            showNotification('Please enter your name', 'error');
            userNameInput.focus();
            return false;
        }
        
        if (currentRating === 0) {
            showNotification('Please select a rating', 'error');
            return false;
        }
        
        if (!reviewTextInput.value.trim()) {
            showNotification('Please enter your review', 'error');
            reviewTextInput.focus();
            return false;
        }
        
        if (reviewTextInput.value.trim().length < 10) {
            showNotification('Review must be at least 10 characters long', 'error');
            reviewTextInput.focus();
            return false;
        }
        
        return true;
    }
    
    // Reset form
    function resetForm() {
        userNameInput.value = '';
        reviewTextInput.value = '';
        currentRating = 0;
        ratingInput.value = '';
        selectedImage = null;
        selectedImageBase64 = null;
        imageInput.value = '';
        imagePreview.src = '';
        imagePreview.style.display = 'none';
        imageUpload.style.borderStyle = 'dashed';
        imageUpload.style.borderColor = 'var(--accent-light)';
        imageUpload.querySelector('p').textContent = 'Click to upload image (Max 5MB)';
        highlightStars(0);
    }
    
    // Load reviews from Google Sheets
    async function loadReviews() {
        try {
            // Show loading state
            reviewsList.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading reviews...</p>
                </div>
            `;
            
            // Use a CORS proxy to avoid CORS issues
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const encodedUrl = encodeURIComponent(REVIEWS_CSV_URL);
            const response = await fetch(proxyUrl + encodedUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvData = await response.text();
            console.log('Received CSV data:', csvData.substring(0, 200)); // Debug log
            
            const reviews = parseReviewsCSV(csvData);
            console.log('Parsed reviews:', reviews); // Debug log
            
            displayReviews(reviews);
        } catch (error) {
            console.error('Error loading reviews:', error);
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Unable to load reviews</h3>
                    <p>${error.message}</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem;">Trying direct connection...</p>
                    <button onclick="tryDirectLoad()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary-medium); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Retry Loading
                    </button>
                </div>
            `;
            
            // Try direct load as fallback
            tryDirectLoad();
        }
    }
    
    // Try direct load without proxy
    async function tryDirectLoad() {
        try {
            reviewsList.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Trying direct connection...</p>
                </div>
            `;
            
            const response = await fetch(REVIEWS_CSV_URL);
            const csvData = await response.text();
            const reviews = parseReviewsCSV(csvData);
            displayReviews(reviews);
        } catch (error) {
            console.error('Direct load failed:', error);
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Failed to load reviews</h3>
                    <p>Please check your internet connection and try again.</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">Error: ${error.message}</p>
                </div>
            `;
        }
    }
    
    // Parse CSV data - FIXED VERSION
    function parseReviewsCSV(csvData) {
        const reviews = [];
        
        // Split by new lines and remove empty rows
        const rows = csvData.split('\n').filter(row => row.trim() !== '');
        
        // If we have no rows or only header, return empty array
        if (rows.length <= 1) {
            console.log('No review data found');
            return reviews;
        }
        
        // Determine delimiter
        const firstRow = rows[0];
        let delimiter = '\t'; // Default to tab
        
        // Check if it's tab-separated
        if (firstRow.includes('\t')) {
            delimiter = '\t';
            console.log('Using tab as delimiter');
        } 
        // Check if it's comma-separated
        else if (firstRow.includes(',')) {
            delimiter = ',';
            console.log('Using comma as delimiter');
        }
        
        // Parse each row (skip header row)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].trim();
            
            // Skip completely empty rows
            if (!row) continue;
            
            // Split by delimiter
            let columns;
            
            try {
                // Handle quoted fields
                columns = parseDelimitedLine(row, delimiter);
                
                // Validate minimum columns
                if (columns.length >= 4) {
                    // Map columns to review object
                    // Format should be: username, image_link, reviews, star, timestamp
                    const review = {
                        username: columns[0]?.trim() || 'Anonymous',
                        image_link: columns[1]?.trim() || '',
                        reviews: columns[2]?.trim() || '',
                        star: parseInt(columns[3]?.trim()) || 0,
                        timestamp: columns[4]?.trim() || ''
                    };
                    
                    // Only add if it has valid data
                    if (review.username && review.reviews && review.star > 0) {
                        reviews.push(review);
                    }
                } else {
                    console.log('Skipping row - insufficient columns:', row);
                }
            } catch (e) {
                console.log('Error parsing row:', row, 'Error:', e);
                continue;
            }
        }
        
        // Sort by rating (highest first), then by timestamp (newest first)
        return reviews.sort((a, b) => {
            // First by star rating
            if (b.star !== a.star) {
                return b.star - a.star;
            }
            // Then by timestamp if available
            if (a.timestamp && b.timestamp) {
                return new Date(b.timestamp) - new Date(a.timestamp);
            }
            return 0;
        });
    }
    
    // Helper function to parse delimited line with quotes
    function parseDelimitedLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                // Handle escaped quotes ("")
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        result.push(current);
        return result;
    }
    
    // Convert Google Drive link to embeddable image URL
    function convertDriveLink(link) {
        if (!link || link === 'No Image') return null;
        
        // If it's already a direct link, return as is
        if (link.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return link;
        }
        
        // Convert Google Drive link
        if (link.includes('drive.google.com')) {
            try {
                const url = new URL(link);
                const id = url.searchParams.get('id');
                if (id) {
                    // Return as direct image link for embedding
                    return `https://drive.google.com/uc?export=view&id=${id}`;
                }
            } catch (e) {
                console.error('Error parsing Google Drive link:', e);
            }
        }
        
        return link;
    }
    
    // Create image modal
    function createImageModal() {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 10000;
            justify-content: center;
            align-items: center;
            cursor: zoom-out;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
                <img id="modalImage" src="" alt="Full size image" style="max-width: 100%; max-height: 90vh; object-fit: contain;">
            </div>
            <button class="modal-close" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal on click
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.closest('.modal-close')) {
                modal.style.display = 'none';
            }
        });
        
        return modal;
    }
    
    // Display reviews
    function displayReviews(reviews) {
        if (!reviews || reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-star"></i>
                    <h3>No reviews yet</h3>
                    <p>Be the first to share your experience!</p>
                </div>
            `;
            return;
        }
        
        // Create image modal if it doesn't exist
        let modal = document.querySelector('.image-modal');
        if (!modal) {
            modal = createImageModal();
        }
        
        let reviewsHTML = '<div class="reviews-container">';
        
        reviews.forEach((review, index) => {
            const isHighlighted = review.star >= 4;
            const initials = getInitials(review.username);
            const imageLink = convertDriveLink(review.image_link);
            const hasImage = imageLink && imageLink !== 'No Image';
            const formattedDate = formatDate(review.timestamp);
            
            reviewsHTML += `
                <div class="review-card ${isHighlighted ? 'highlighted' : ''}" data-rating="${review.star}">
                    <div class="review-header">
                        <div class="review-user">
                            <div class="user-avatar">${initials}</div>
                            <div class="user-info">
                                <h3>${review.username}</h3>
                                <div class="review-date">${formattedDate}</div>
                                ${isHighlighted ? '<span class="top-badge"><i class="fas fa-crown"></i> Top Review</span>' : ''}
                            </div>
                        </div>
                        <div class="review-stars">
                            ${getStarsHTML(review.star)}
                        </div>
                    </div>
                    
                    ${hasImage ? 
                        `<div class="review-image-container" style="margin-bottom: 1rem;">
                            <img src="${imageLink}" 
                                  class="review-image" 
                                  alt="Review image" 
                                  loading="lazy"
                                  style="max-width: 300px; max-height: 200px; border-radius: 8px; cursor: pointer; object-fit: cover;"
                                  onclick="
                                      document.querySelector('.image-modal').style.display = 'flex';
                                      document.getElementById('modalImage').src = '${imageLink}';
                                  "
                                  onerror="
                                      this.style.display = 'none';
                                      this.nextElementSibling && (this.nextElementSibling.style.display = 'block');
                                  ">
                            <div class="image-error" style="display: none; background: #f8f9fa; padding: 1rem; border-radius: 8px; color: var(--text-medium);">
                                <i class="fas fa-image"></i>
                                <p style="margin: 0; font-size: 0.9rem;">Image could not be loaded. <a href="${review.image_link}" target="_blank" style="color: var(--primary-medium);">Click here to view</a></p>
                            </div>
                         </div>` 
                        : ''}
                    
                    <div class="review-content">
                        ${review.reviews}
                    </div>
                </div>
            `;
        });
        
        reviewsHTML += '</div>';
        reviewsList.innerHTML = reviewsHTML;
        
        // Add CSS for image modal and styles
        if (!document.querySelector('style[data-review-styles]')) {
            const style = document.createElement('style');
            style.setAttribute('data-review-styles', 'true');
            style.textContent = `
                .top-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #FFD700, #FFA500);
                    color: #333;
                    padding: 0.2rem 0.6rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    font-weight: 700;
                    margin-top: 0.3rem;
                }
                
                .top-badge i {
                    margin-right: 0.3rem;
                }
                
                .review-date {
                    color: var(--text-medium);
                    font-size: 0.9rem;
                    margin-top: 0.2rem;
                }
                
                .review-image-container {
                    position: relative;
                }
                
                .review-image {
                    transition: transform 0.3s ease;
                }
                
                .review-image:hover {
                    transform: scale(1.02);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Format date
    function formatDate(timestamp) {
        if (!timestamp) return 'Recently';
        
        try {
            const date = new Date(timestamp);
            
            // If date is invalid, try parsing different formats
            if (isNaN(date.getTime())) {
                // Try to parse as "YYYY-MM-DD HH:MM:SS"
                const parts = timestamp.split(' ');
                if (parts.length >= 1) {
                    const datePart = parts[0];
                    return datePart; // Just return the date part
                }
                return timestamp;
            }
            
            // Format as "MMM DD, YYYY"
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return timestamp;
        }
    }
    
    // Get initials from name
    function getInitials(name) {
        if (!name) return '??';
        
        return name.split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }
    
    // Get stars HTML
    function getStarsHTML(rating) {
        let starsHTML = '';
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars + 1 && hasHalfStar) {
                starsHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        return starsHTML;
    }
    
    // Show notification
    function showNotification(message, type) {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add CSS
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            background: ${type === 'success' ? '#4CAF50' : '#F44336'};
            color: white;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        // Add CSS animation if not already present
        if (!document.querySelector('style[data-notification-animation]')) {
            const style = document.createElement('style');
            style.setAttribute('data-notification-animation', 'true');
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Reviews';
    refreshBtn.style.cssText = `
        display: block;
        margin: 1rem auto 3rem;
        padding: 0.8rem 1.5rem;
        background: var(--primary-medium);
        color: white;
        border: none;
        border-radius: 30px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    `;
    refreshBtn.addEventListener('click', loadReviews);
    refreshBtn.addEventListener('mouseover', () => {
        refreshBtn.style.background = 'var(--primary-dark)';
        refreshBtn.style.transform = 'translateY(-2px)';
    });
    refreshBtn.addEventListener('mouseout', () => {
        refreshBtn.style.background = 'var(--primary-medium)';
        refreshBtn.style.transform = 'translateY(0)';
    });
    
    // Insert refresh button after reviews container
    reviewsList.parentNode.insertBefore(refreshBtn, reviewsList.nextSibling);
    
    // Debug function to test CSV loading
    window.debugCSV = async function() {
        try {
            console.log('Testing CSV URL:', REVIEWS_CSV_URL);
            const response = await fetch(REVIEWS_CSV_URL);
            const text = await response.text();
            console.log('CSV content (first 500 chars):', text.substring(0, 500));
            console.log('CSV lines:', text.split('\n').length);
            console.log('First 3 lines:', text.split('\n').slice(0, 3));
        } catch (error) {
            console.error('Debug error:', error);
        }
    };
    
    // Auto-retry loading if failed
    setTimeout(() => {
        const loadingDiv = document.querySelector('.loading');
        if (loadingDiv && loadingDiv.parentNode === reviewsList) {
            console.log('Loading taking too long, retrying...');
            loadReviews();
        }
    }, 5000);
});

// Make tryDirectLoad globally accessible for the retry button
window.tryDirectLoad = function() {
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading reviews...</p>
        </div>
    `;
    
    const REVIEWS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS4m9d79TtDcJivToGkE4Uu5xoJ9yIRvY8g0SlEzWYghlfCfnqydvsxwzBo_sXaX-AI7rmw4zrQk435/pub?gid=0&single=true&output=tsv';
    
    fetch(REVIEWS_CSV_URL)
        .then(response => response.text())
        .then(csvData => {
            // Simple parsing for direct load
            const rows = csvData.split('\n').filter(row => row.trim() !== '');
            const reviews = [];
            
            for (let i = 1; i < rows.length; i++) {
                const columns = rows[i].split('\t');
                if (columns.length >= 4) {
                    // Convert Google Drive link
                    let imageLink = columns[1] || '';
                    if (imageLink.includes('drive.google.com') && imageLink.includes('id=')) {
                        const match = imageLink.match(/id=([^&]+)/);
                        if (match) {
                            imageLink = `https://drive.google.com/uc?export=view&id=${match[1]}`;
                        }
                    }
                    
                    reviews.push({
                        username: columns[0] || 'Anonymous',
                        image_link: imageLink,
                        reviews: columns[2] || '',
                        star: parseInt(columns[3]) || 0,
                        timestamp: columns[4] || ''
                    });
                }
            }
            
            // Display the reviews
            if (reviews.length === 0) {
                reviewsList.innerHTML = `
                    <div class="no-reviews">
                        <i class="fas fa-star"></i>
                        <h3>No reviews found</h3>
                        <p>Submit your review to be the first!</p>
                    </div>
                `;
                return;
            }
            
            let reviewsHTML = '<div class="reviews-container">';
            reviews.forEach((review, index) => {
                const initials = (review.username || '??').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                const hasImage = review.image_link && review.image_link !== 'No Image';
                
                reviewsHTML += `
                    <div class="review-card" data-rating="${review.star}">
                        <div class="review-header">
                            <div class="review-user">
                                <div class="user-avatar">${initials}</div>
                                <div class="user-info">
                                    <h3>${review.username || 'Anonymous'}</h3>
                                    ${review.timestamp ? `<div class="review-date">${review.timestamp.split(' ')[0]}</div>` : ''}
                                </div>
                            </div>
                            <div class="review-stars">
                                ${'<i class="fas fa-star"></i>'.repeat(Math.min(review.star, 5))}
                                ${'<i class="far fa-star"></i>'.repeat(Math.max(0, 5 - review.star))}
                            </div>
                        </div>
                        ${hasImage ? 
                            `<div class="review-image-container" style="margin-bottom: 1rem;">
                                <img src="${review.image_link}" 
                                      class="review-image" 
                                      alt="Review image" 
                                      style="max-width: 300px; max-height: 200px; border-radius: 8px; cursor: pointer; object-fit: cover;"
                                      onclick="
                                          const modal = document.querySelector('.image-modal') || createImageModal();
                                          modal.style.display = 'flex';
                                          document.getElementById('modalImage').src = '${review.image_link}';
                                      ">
                             </div>` 
                            : ''}
                        <div class="review-content">
                            ${review.reviews}
                        </div>
                    </div>
                `;
            });
            reviewsHTML += '</div>';
            reviewsList.innerHTML = reviewsHTML;
        })
        .catch(error => {
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Connection Failed</h3>
                    <p>Could not load reviews. Please try again later.</p>
                </div>
            `;
        });
};

// Helper function for tryDirectLoad
function createImageModal() {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 10000;
        justify-content: center;
        align-items: center;
        cursor: zoom-out;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh;">
            <img id="modalImage" src="" alt="Full size image" style="max-width: 100%; max-height: 90vh; object-fit: contain;">
        </div>
        <button class="modal-close" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.2); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal || e.target.closest('.modal-close')) {
            modal.style.display = 'none';
        }
    });
    
    return modal;
}