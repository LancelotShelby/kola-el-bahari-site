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
            // Using a timestamp to prevent caching during development
            const response = await fetch('data.json?t=' + new Date().getTime());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allUniversities = await response.json();
            populateFilters(); // Populate dropdowns once data is loaded
            filterAndRenderUniversities(); // Initial render after fetching
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
        if (countryFilter) {
            countryFilter.innerHTML = '<option value="all">All Countries</option>';
            Array.from(countries).sort().forEach(country => {
                const option = document.createElement('option');
                option.value = country.toLowerCase().replace(/\s/g, '-');
                option.textContent = country;
                countryFilter.appendChild(option);
            });
        }
    }

    // Function to display universities and their matching programs
    function displayUniversities(universitiesData) {
        if (!universityListContainer) return;

        universityListContainer.innerHTML = ''; // Clear previous content

        if (universitiesData.length === 0) {
            universityListContainer.innerHTML = '<p class="no-results-message">No universities or programs found matching your criteria.</p>';
            return;
        }

        universitiesData.forEach(uniData => {
            const uni = uniData.university;
            const matchingPrograms = uniData.matchingPrograms; // Programs that specifically matched the search/filters

            const card = document.createElement('div');
            card.classList.add('university-card-explore');

            // Basic University Info Section
            const uniInfoHtml = `
                <a href="${uni.url || '#'}" class="university-card-link-main">
                    <div class="uni-logo-wrapper">
                        <img src="${uni.logo}" alt="${uni.name} Logo">
                    </div>
                    <h3>${uni.name}</h3>
                    <p class="uni-info"><strong>Country:</strong> ${uni.country}</p>
                    <p class="uni-info"><strong>Type:</strong> ${uni.type.charAt(0).toUpperCase() + uni.type.slice(1)}</p>
                    <p class="uni-description">${uni.description}</p>
                </a>
            `;
            card.innerHTML += uniInfoHtml;

            // Programs Section (only show if there are matching programs)
            if (matchingPrograms && matchingPrograms.length > 0) {
                const programsSection = document.createElement('div');
                programsSection.classList.add('uni-programs-list');
                programsSection.innerHTML = `<h4>Matching Programs:</h4>`;

                matchingPrograms.forEach(program => {
                    const programItem = document.createElement('div');
                    programItem.classList.add('program-item-explore'); // New class for explore page programs

                    programItem.innerHTML = `
                        <h5 class="program-title-explore">${program.name} (${program.degree.charAt(0).toUpperCase() + program.degree.slice(1)}) <i class="fas fa-chevron-down toggle-icon-explore"></i></h5>
                        <div class="program-details-explore">
                            <p><strong>Overview:</strong> ${program.details || 'No overview available.'}</p>
                            <ul>
                                ${program.duration ? `<li><strong>Duration:</strong> ${program.duration}</li>` : ''}
                                ${program.language ? `<li><strong>Language:</strong> ${program.language}</li>` : ''}
                                ${program.requirements ? `<li><strong>Requirements:</strong> ${program.requirements}</li>` : ''}
                                ${program.tuition ? `<li><strong>Tuition Fee:</strong> ${program.tuition}</li>` : ''}
                            </ul>
                        </div>
                    `;
                    programsSection.appendChild(programItem);
                });
                card.appendChild(programsSection);
            }

            universityListContainer.appendChild(card);
        });

        // Add event listeners for new program-item-explore elements
        addProgramExpandListeners();
    }

    // Function to add expand/collapse listeners to program items
    function addProgramExpandListeners() {
        const programItemsExplore = document.querySelectorAll('.program-item-explore');
        programItemsExplore.forEach(item => {
            const title = item.querySelector('.program-title-explore');
            const details = item.querySelector('.program-details-explore');
            const toggleIcon = item.querySelector('.toggle-icon-explore');

            if (title && details && toggleIcon) {
                title.addEventListener('click', () => {
                    // Close other open program details within the same university card if desired
                    // (Currently, this logic is commented out to allow multiple open programs per card)
                    /*
                    item.closest('.university-card-explore').querySelectorAll('.program-details-explore.active').forEach(otherDetails => {
                        if (otherDetails !== details) {
                            otherDetails.classList.remove('active');
                            otherDetails.previousElementSibling.querySelector('.toggle-icon-explore').classList.remove('fa-chevron-up');
                            otherDetails.previousElementSibling.querySelector('.toggle-icon-explore').classList.add('fa-chevron-down');
                        }
                    });
                    */

                    details.classList.toggle('active');
                    toggleIcon.classList.toggle('fa-chevron-up');
                    toggleIcon.classList.toggle('fa-chevron-down');
                });
            }
        });
    }


    // Function to filter and render universities based on search and filters
    function filterAndRenderUniversities() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedCountry = countryFilter.value;
        const selectedType = typeFilter.value;
        const selectedDegree = degreeFilter.value;

        const results = []; // To store university objects along with their matching programs

        allUniversities.forEach(uni => {
            let universityMatches = true;
            let programsMatch = []; // Programs within this uni that match search/degree

            // Check university-level filters
            if (selectedCountry !== 'all' && uni.country.toLowerCase().replace(/\s/g, '-') !== selectedCountry) {
                universityMatches = false;
            }
            if (selectedType !== 'all' && uni.type !== selectedType) {
                universityMatches = false;
            }

            // If university-level filters match, check programs
            if (universityMatches) {
                uni.programs.forEach(program => {
                    const programName = program.name.toLowerCase();
                    const programDegree = program.degree.toLowerCase();

                    const matchesProgramSearch = searchTerm === '' ||
                                                 programName.includes(searchTerm) ||
                                                 uni.name.toLowerCase().includes(searchTerm) || // Still allow searching university name
                                                 uni.description.toLowerCase().includes(searchTerm);

                    const matchesProgramDegree = selectedDegree === 'all' || programDegree === selectedDegree;

                    if (matchesProgramSearch && matchesProgramDegree) {
                        programsMatch.push(program);
                    }
                });
            }

            // Only add university to results if it passed university-level filters AND has at least one matching program
            // OR if there's no program-specific search term and no program-specific degree filter, and the university itself matches.
            const hasProgramSpecificSearchOrDegreeFilter = searchTerm !== '' || selectedDegree !== 'all';

            if (universityMatches && programsMatch.length > 0) {
                 results.push({ university: uni, matchingPrograms: programsMatch });
            } else if (universityMatches && !hasProgramSpecificSearchOrDegreeFilter) {
                // If no program-specific search/degree, just display all of the university's programs if uni matches
                results.push({ university: uni, matchingPrograms: uni.programs });
            }
        });

        displayUniversities(results);
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