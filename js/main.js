document.addEventListener('DOMContentLoaded', () => {
    // Correctly get all elements by their IDs from the HTML
    const universityListContainer = document.getElementById('universityList');
    const searchInput = document.getElementById('searchInput');
    const countryFilter = document.getElementById('countryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const degreeFilter = document.getElementById('degreeFilter');
    
    let allUniversities = [];
    let currentSearchTerm = '';

    // Function to fetch university data
    async function fetchUniversities() {
        try {
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

    // Function to display universities based on filtered data and search type
    function displayUniversities(universitiesToShow) {
        if (!universityListContainer) return;

        universityListContainer.innerHTML = '';
        const searchTerm = currentSearchTerm.toLowerCase().trim();

        if (universitiesToShow.length === 0) {
            universityListContainer.innerHTML = '<p class="no-results-message">No universities found matching your criteria.</p>';
            return;
        }

        universitiesToShow.forEach(uni => {
            const card = document.createElement('div');
            card.classList.add('university-card');
            
            let cardHtml = '';
            
            // Check if search term matches a program name
            const matchingPrograms = searchTerm ? uni.programs.filter(prog => prog.name && prog.name.toLowerCase().includes(searchTerm)) : [];

            if (matchingPrograms.length > 0) {
                // Scenario 1: Display university with matching programs
                const programsListHtml = matchingPrograms.map(prog => 
                    `<li class="program-item">${prog.name} (${prog.degree})</li>`
                ).join('');

                cardHtml = `
                    <a href="${uni.explore_url}" class="university-card-link">
                        <div class="uni-logo-wrapper">
                            <img src="${uni.explore_logo}" alt="${uni.name} Logo">
                        </div>
                        <h3>${uni.name}</h3>
                        <p class="uni-info"><strong>Country:</strong> ${uni.country}</p>
                        <p class="uni-info"><strong>Type:</strong> ${uni.type.charAt(0).toUpperCase() + uni.type.slice(1)}</p>
                        <div class="program-results">
                            <h4>Matching Programs:</h4>
                            <ul>${programsListHtml}</ul>
                        </div>
                    </a>
                `;
            } else {
                // Scenario 2: Display university with general information
                const offeredDegrees = new Set();
                if (uni.programs) {
                    uni.programs.forEach(prog => {
                        if (prog.degree) {
                            offeredDegrees.add(prog.degree.toLowerCase());
                        }
                    });
                }
                const degreesText = Array.from(offeredDegrees).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');

                cardHtml = `
                    <a href="${uni.explore_url}" class="university-card-link">
                        <div class="uni-logo-wrapper">
                            <img src="${uni.explore_logo}" alt="${uni.name} Logo">
                        </div>
                        <h3>${uni.name}</h3>
                        <p class="uni-info"><strong>Country:</strong> ${uni.country}</p>
                        <p class="uni-info"><strong>Type:</strong> ${uni.type.charAt(0).toUpperCase() + uni.type.slice(1)}</p>
                        <p class="uni-info"><strong>Degrees:</strong> ${degreesText || 'N/A'}</p>
                        <p class="uni-description">${uni.description || 'No description available.'}</p>
                    </a>
                `;
            }

            card.innerHTML = cardHtml;
            universityListContainer.appendChild(card);
        });
    }

    // Function to filter and render universities
    function filterAndRenderUniversities() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCountry = countryFilter.value.toLowerCase();
        const selectedType = typeFilter.value.toLowerCase();
        const selectedDegree = degreeFilter.value.toLowerCase();

        // Store the search term to be used in the display function
        currentSearchTerm = searchTerm;
        
        const filteredUniversities = allUniversities.filter(uni => {
            const programs = uni.programs || [];

            // Check if any program has a matching degree
            const hasMatchingDegree = programs.some(prog => 
                prog.degree && prog.degree.toLowerCase() === selectedDegree
            );
            
            // Check for search term in relevant fields
            const matchesSearch = searchTerm === '' ||
                                 uni.name.toLowerCase().includes(searchTerm) ||
                                 (uni.description && uni.description.toLowerCase().includes(searchTerm)) ||
                                 programs.some(prog => prog.name && prog.name.toLowerCase().includes(searchTerm));

            // Check for other filters
            const matchesCountry = selectedCountry === '' || uni.country.toLowerCase() === selectedCountry;
            const matchesType = selectedType === '' || uni.type.toLowerCase() === selectedType;
            const matchesDegree = selectedDegree === '' || hasMatchingDegree;
                                
            return matchesSearch && matchesCountry && matchesType && matchesDegree;
        });

        displayUniversities(filteredUniversities);
    }
    
    // Event Listeners for Filters
    if (searchInput) searchInput.addEventListener('input', filterAndRenderUniversities);
    if (countryFilter) countryFilter.addEventListener('change', filterAndRenderUniversities);
    if (typeFilter) typeFilter.addEventListener('change', filterAndRenderUniversities);
    if (degreeFilter) degreeFilter.addEventListener('change', filterAndRenderUniversities);

    // Initial fetch when explore.html is loaded
    if (universityListContainer) {
        fetchUniversities();
    }
});