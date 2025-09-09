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
        
        // Pass a default searchCriteria object for initial render
        displayUniversities(allUniversities, { searchTerm: '', selectedDegree: 'all', searchType: 'all' });
    } catch (error) {
        console.error('Could not fetch universities:', error);
        if (universityListContainer) {
            universityListContainer.innerHTML = '<p class="error-message">Failed to load universities. Please try again later.</p>';
        }
    }
}

// Function to display universities based on filtered data and search criteria
function displayUniversities(universitiesToShow, searchCriteria = {}) {
    if (!universityListContainer) return;

    universityListContainer.innerHTML = '';
    const searchTerm = searchCriteria.searchTerm.toLowerCase().trim();
    const selectedDegree = searchCriteria.selectedDegree.toLowerCase();

    if (universitiesToShow.length === 0) {
        universityListContainer.innerHTML = '<p class="no-results-message">No universities found matching your criteria.</p>';
        return;
    }

    universitiesToShow.forEach(uni => {
        const card = document.createElement('div');
        card.classList.add('university-card');
        
        let cardHtml = '';
        
        // Check if search term matches a program name
        const matchingPrograms = searchTerm ? uni.programs.filter(prog => {
            const matchesSearch = prog.name && prog.name.toLowerCase().includes(searchTerm);
            const matchesDegree = selectedDegree === 'all' || (prog.degree && prog.degree.toLowerCase() === selectedDegree);
            return matchesSearch && matchesDegree;
        }) : [];

        if (matchingPrograms.length > 0) {
            // Scenario 1: Display university with matching programs
            const programsListHtml = matchingPrograms.map(prog => 
                `<li class="program-item">${prog.name} (${prog.degree}) (${prog.tuition || 'N/A'})</li>`
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
        }
        
        else {
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

        // Basic filters for country and type (these apply to the whole university)
        const matchesCountry = selectedCountry === '' || (uni.country && uni.country.toLowerCase() === selectedCountry);
        const matchesType = selectedType === '' || (uni.type && uni.type.toLowerCase() === selectedType);

        // If the basic filters don't match, we can immediately exclude the university.
        if (!matchesCountry || !matchesType) {
            return false;
        }

        // *** START OF CORRECTED LOGIC ***

        // Check if the university's own name or description matches the search term.
        const uniInfoMatchesSearch = searchTerm === '' ||
                                     uni.name.toLowerCase().includes(searchTerm) ||
                                     (uni.description && uni.description.toLowerCase().includes(searchTerm));

        // Check if there is at least ONE program that satisfies BOTH the search term and the degree filter.
        const hasProgramMatchingBoth = programs.some(prog => {
            // A program matches the search term if its name includes the term.
            const programNameMatchesSearch = prog.name && prog.name.toLowerCase().includes(searchTerm);
            
            // A program matches the degree filter if no degree is selected OR its degree matches.
            const programMatchesDegree = selectedDegree === '' || (prog.degree && prog.degree.toLowerCase() === selectedDegree);
            
            // This program is a match only if BOTH conditions are true.
            return programNameMatchesSearch && programMatchesDegree;
        });
        
        // A university should be shown if:
        // 1. A specific program matches both search and degree filters.
        // OR
        // 2. The general university info matches the search, AND it also satisfies the degree filter
        //    (meaning it has at least one program with the selected degree, or no degree is selected).
        if (hasProgramMatchingBoth) {
            return true;
        }

        if (uniInfoMatchesSearch) {
            if (selectedDegree === '') {
                return true; // Uni info matches and no degree filter, so it's a match.
            }
            // Uni info matches, but we must also check if it has any program with the selected degree.
            return programs.some(prog => prog.degree && prog.degree.toLowerCase() === selectedDegree);
        }

        // If neither of the above conditions are met, exclude the university.
        return false;
        
        // *** END OF CORRECTED LOGIC ***
    });

    displayUniversities(filteredUniversities, { searchTerm, selectedDegree });
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