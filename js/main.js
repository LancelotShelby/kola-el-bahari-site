document.addEventListener('DOMContentLoaded', () => {
    // Correctly get all elements by their IDs from the HTML
    const universityListContainer = document.getElementById('universityList');
    const searchInput = document.getElementById('searchInput');
    const countryFilter = document.getElementById('countryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const degreeFilter = document.getElementById('degreeFilter');
    
    let allUniversities = [];

    // Function to fetch university data
    async function fetchUniversities() {
        try {
            // Path to data.json from the explore.html page
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allUniversities = await response.json();
            console.log('Data fetched:', allUniversities);
            displayUniversities(allUniversities);
        } catch (error) {
            console.error('Could not fetch universities:', error);
            if (universityListContainer) {
                universityListContainer.innerHTML = '<p class="error-message">Failed to load universities. Please try again later.</p>';
            }
        }
    }

    // Function to display universities based on filtered data
    function displayUniversities(universitiesToShow) {
        if (!universityListContainer) return;

        universityListContainer.innerHTML = '';

        if (universitiesToShow.length === 0) {
            universityListContainer.innerHTML = '<p class="no-results-message">No universities found matching your criteria.</p>';
            return;
        }

        universitiesToShow.forEach(uni => {
            const card = document.createElement('div');
            card.classList.add('university-card'); // Use the correct class from CSS
            
            // Extract unique degree types from programs
            const offeredDegrees = new Set();
            if (uni.programs) {
                uni.programs.forEach(prog => {
                    if (prog.degree) {
                        offeredDegrees.add(prog.degree.toLowerCase());
                    }
                });
            }
            const degreesText = Array.from(offeredDegrees).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');

            const cardHtml = `
                <a href="${uni.explore_url}" class="university-card-link">
                    <div class="uni-logo-wrapper">
                        <img src="${uni.explore_logo}" alt="${uni.name} Logo">
                    </div>
                    <h3>${uni.name}</h3>
                    <p class="uni-info"><strong>Country:</strong> ${uni.country}</p>
                    <p class="uni-info"><strong>Type:</strong> ${uni.type.charAt(0).toUpperCase() + uni.type.slice(1)}</p>
                    <p class="uni-info"><strong>Degrees:</strong> ${degreesText || 'N/A'}</p>
                </a>
            `;
            card.innerHTML = cardHtml;
            universityListContainer.appendChild(card);
        });
    }

    // Function to filter and render universities
    function filterAndRenderUniversities() {
        // Read filter values directly from the elements
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCountry = countryFilter.value; // The value is already lowercase from Python
        const selectedType = typeFilter.value;
        const selectedDegree = degreeFilter.value;
        
        const filteredUniversities = allUniversities.filter(uni => {
            // Check if uni.programs exists to prevent errors
            const programs = uni.programs || [];

            // 1. Check for search term in relevant fields
            const matchesSearch = searchTerm === '' ||
                                  uni.name.toLowerCase().includes(searchTerm) ||
                                  uni.country.toLowerCase().includes(searchTerm) ||
                                  (uni.description && uni.description.toLowerCase().includes(searchTerm)) ||
                                  programs.some(prog => prog.name && prog.name.toLowerCase().includes(searchTerm));

            // 2. Check for country filter
            const matchesCountry = selectedCountry === '' || uni.country.toLowerCase() === selectedCountry;

            // 3. Check for type filter
            const matchesType = selectedType === '' || uni.type.toLowerCase() === selectedType;

            // 4. Check for degree filter
            const matchesDegree = selectedDegree === '' ||
                                  programs.some(prog => prog.degree_level && prog.degree_level.toLowerCase() === selectedDegree);

            return matchesSearch && matchesCountry && matchesType && matchesDegree;
        });

        displayUniversities(filteredUniversities);
    }

    // Event Listeners for Filters
    // These are checked to ensure the element exists before adding a listener
    if (searchInput) searchInput.addEventListener('input', filterAndRenderUniversities);
    if (countryFilter) countryFilter.addEventListener('change', filterAndRenderUniversities);
    if (typeFilter) typeFilter.addEventListener('change', filterAndRenderUniversities);
    if (degreeFilter) degreeFilter.addEventListener('change', filterAndRenderUniversities);

    // Initial fetch when explore.html is loaded
    if (universityListContainer) {
        fetchUniversities();
    }
});