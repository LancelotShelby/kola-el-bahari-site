document.addEventListener('DOMContentLoaded', () => {
    const universityListContainer = document.getElementById('universityList');
    const searchInput = document.getElementById('searchUniversities');
    const countryFilter = document.getElementById('countryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const degreeFilter = document.getElementById('degreeFilter');

    let allUniversities = []; // This will hold the raw data from data.json

    // Function to fetch university data
    async function fetchUniversities() {
        try {
            const response = await fetch('data.json'); // Path to your JSON file
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allUniversities = await response.json();
            populateFilters(); // Populate dropdowns once data is loaded
            displayUniversities(allUniversities); // Display all universities initially
        } catch (error) {
            console.error('Could not fetch universities:', error);
            if (universityListContainer) {
                universityListContainer.innerHTML = '<p class="error-message">Failed to load universities. Please try again later.</p>';
            }
        }
    }

    // Function to populate filter dropdowns (e.g., countries)
    function populateFilters() {
        const countries = new Set();
        allUniversities.forEach(uni => countries.add(uni.country));

        // Populate Country Filter
        countryFilter.innerHTML = '<option value="all">All Countries</option>';
        Array.from(countries).sort().forEach(country => {
            const option = document.createElement('option');
            option.value = country.toLowerCase().replace(/\s/g, '-'); // e.g., "turkey"
            option.textContent = country;
            countryFilter.appendChild(option);
        });
    }

    // Function to display universities based on filtered data
    function displayUniversities(universitiesToShow) {
        if (!universityListContainer) return;

        universityListContainer.innerHTML = ''; // Clear previous content

        if (universitiesToShow.length === 0) {
            universityListContainer.innerHTML = '<p class="no-results-message">No universities found matching your criteria.</p>';
            return;
        }

        universitiesToShow.forEach(uni => {
            const card = document.createElement('div');
            card.classList.add('university-card-explore');

            // Find all unique degrees offered by this university for display
            const offeredDegrees = new Set();
            uni.programs.forEach(prog => offeredDegrees.add(prog.degree));
            const degreesText = Array.from(offeredDegrees).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');

            card.innerHTML = `
                <a href="${uni.url || '#'}" class="university-card-link">
                    <div class="uni-logo-wrapper">
                        <img src="${uni.logo}" alt="${uni.name} Logo">
                    </div>
                    <h3>${uni.name}</h3>
                    <p class="uni-info"><strong>Country:</strong> ${uni.country}</p>
                    <p class="uni-info"><strong>Type:</strong> ${uni.type.charAt(0).toUpperCase() + uni.type.slice(1)}</p>
                    <p class="uni-info"><strong>Degrees:</strong> ${degreesText || 'N/A'}</p>
                    <p class="uni-description">${uni.description}</p>
                    <span class="read-more-btn">View Details</span>
                </a>
            `;
            universityListContainer.appendChild(card);
        });
    }

    // Function to filter and render universities
    function filterAndRenderUniversities() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCountry = countryFilter.value;
        const selectedType = typeFilter.value;
        const selectedDegree = degreeFilter.value;

        const filteredUniversities = allUniversities.filter(uni => {
            const matchesSearch = searchTerm === '' ||
                                  uni.name.toLowerCase().includes(searchTerm) ||
                                  uni.description.toLowerCase().includes(searchTerm) ||
                                  uni.programs.some(prog => prog.name.toLowerCase().includes(searchTerm));

            const matchesCountry = selectedCountry === 'all' ||
                                   uni.country.toLowerCase().replace(/\s/g, '-') === selectedCountry;

            const matchesType = selectedType === 'all' ||
                                uni.type === selectedType;

            const matchesDegree = selectedDegree === 'all' ||
                                  uni.programs.some(prog => prog.degree === selectedDegree);

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
    // Check if we are on the explore page by checking for the universityListContainer
    if (universityListContainer) {
        fetchUniversities();
    }
});