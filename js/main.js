document.addEventListener('DOMContentLoaded', () => {
    const universityListContainer = document.getElementById('universityList');
    const searchInput = document.getElementById('searchUniversities');
    const countryFilter = document.getElementById('countryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const degreeFilter = document.getElementById('degreeFilter');

    // Modal elements
    const programDetailModal = document.getElementById('programDetailModal');
    const modalContent = document.getElementById('modalProgramContent');
    const closeModalBtn = document.querySelector('.close-button');

    let allUniversities = []; // Raw data from data.json

    // State to track the type of search
    let currentSearchType = 'university_focused'; // 'university_focused' or 'program_focused'

    // Function to fetch university data
    async function fetchUniversities() {
        try {
            const response = await fetch('data.json?t=' + new Date().getTime());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allUniversities = await response.json();
            populateFilters();
            filterAndRenderUniversities(); // Initial render after fetching
        } catch (error) {
            console.error('Could not fetch universities:', error);
            if (universityListContainer) {
                universityListContainer.innerHTML = '<p class="error-message">Failed to load universities. Please try again later.</p>';
            }
        }
    }

    // Function to populate filter dropdowns
    function populateFilters() {
        const countries = new Set();
        allUniversities.forEach(uni => countries.add(uni.country));

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

    // Function to display universities and their programs
    function displayUniversities(universitiesData) {
        if (!universityListContainer) return;

        universityListContainer.innerHTML = ''; // Clear previous content

        if (universitiesData.length === 0) {
            universityListContainer.innerHTML = '<p class="no-results-message">No universities or programs found matching your criteria.</p>';
            return;
        }

        universitiesData.forEach(uniData => {
            const uni = uniData.university;
            const programsToDisplay = uniData.programsToDisplay; // Programs determined by filterAndRenderUniversities
            const autoExpandPrograms = uniData.autoExpandPrograms; // Boolean to auto-expand programs

            const card = document.createElement('div');
            card.classList.add('university-card-explore');

            // Basic University Info Section (always present)
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

            // Programs Section
            if (programsToDisplay && programsToDisplay.length > 0) {
                const programsSection = document.createElement('div');
                programsSection.classList.add('uni-programs-list');
                if (currentSearchType === 'program_focused') {
                     programsSection.innerHTML = `<h4>Programs matching your search:</h4>`;
                } else {
                     programsSection.innerHTML = `<h4>Available Programs:</h4>`;
                }


                programsToDisplay.forEach(program => {
                    const programItem = document.createElement('div');
                    programItem.classList.add('program-item-explore');
                    programItem.dataset.universityId = uni.id; // Store uni ID for modal lookup
                    programItem.dataset.programName = program.name; // Store program name for modal lookup

                    // Conditionally add 'active' class for auto-expansion
                    const detailsActive = autoExpandPrograms ? 'active' : '';
                    const iconDirection = autoExpandPrograms ? 'fa-chevron-up' : 'fa-chevron-down';

                    programItem.innerHTML = `
                        <h5 class="program-title-explore">
                            ${program.name} (${program.degree.charAt(0).toUpperCase() + program.degree.slice(1)})
                            <i class="fas ${iconDirection} toggle-icon-explore"></i>
                        </h5>
                        <div class="program-details-explore ${detailsActive}">
                            <p><strong>Overview:</strong> ${program.details || 'No overview available.'}</p>
                            <ul>
                                ${program.duration ? `<li><strong>Duration:</strong> ${program.duration}</li>` : ''}
                                ${program.language ? `<li><strong>Language:</strong> ${program.language}</li>` : ''}
                                ${program.requirements ? `<li><strong>Requirements:</strong> ${program.requirements}</li>` : ''}
                                ${program.tuition ? `<li><strong>Tuition Fee:</strong> ${program.tuition}</li>` : ''}
                            </ul>
                            <button class="view-full-program-details" data-university-id="${uni.id}" data-program-name="${program.name}">View Full Details</button>
                        </div>
                    `;
                    programsSection.appendChild(programItem);
                });
                card.appendChild(programsSection);
            }

            universityListContainer.appendChild(card);
        });

        // Add event listeners for new program-item-explore elements and modal buttons
        addProgramExpandListeners();
        addViewDetailsButtonListeners();
    }

    // Function to add expand/collapse listeners to program items
    function addProgramExpandListeners() {
        const programItemsExplore = document.querySelectorAll('.program-item-explore');
        programItemsExplore.forEach(item => {
            const title = item.querySelector('.program-title-explore');
            const details = item.querySelector('.program-details-explore');
            const toggleIcon = item.querySelector('.toggle-icon-explore');

            // Remove existing listener to prevent duplicates if displayUniversities is called multiple times
            const oldClickListener = item.dataset.oldClickListener;
            if (oldClickListener) {
                title.removeEventListener('click', eval(oldClickListener));
            }

            const newClickListener = () => {
                details.classList.toggle('active');
                toggleIcon.classList.toggle('fa-chevron-up');
                toggleIcon.classList.toggle('fa-chevron-down');
            };
            title.addEventListener('click', newClickListener);
            item.dataset.oldClickListener = newClickListener.toString(); // Store listener for removal
        });
    }

    // Function to add listeners for "View Full Details" buttons
    function addViewDetailsButtonListeners() {
        const detailButtons = document.querySelectorAll('.view-full-program-details');
        detailButtons.forEach(button => {
            // Remove existing listener to prevent duplicates
            const oldClickListener = button.dataset.oldClickListener;
            if (oldClickListener) {
                button.removeEventListener('click', eval(oldClickListener));
            }

            const newClickListener = () => {
                const uniId = button.dataset.universityId;
                const programName = button.dataset.programName;
                showProgramDetailsInModal(uniId, programName);
            };
            button.addEventListener('click', newClickListener);
            button.dataset.oldClickListener = newClickListener.toString();
        });
    }

    // Function to show program details in a modal
    function showProgramDetailsInModal(uniId, programName) {
        const university = allUniversities.find(uni => uni.id === uniId);
        if (!university) return;

        const program = university.programs.find(prog => prog.name === programName);
        if (!program) return;

        // Populate modal content
        modalContent.innerHTML = `
            <h2>${program.name}</h2>
            <p><strong>University:</strong> ${university.name}</p>
            <p><strong>Degree:</strong> ${program.degree.charAt(0).toUpperCase() + program.degree.slice(1)}</p>
            <p><strong>Overview:</strong> ${program.details || 'No overview available.'}</p>
            <ul>
                ${program.duration ? `<li><strong>Duration:</strong> ${program.duration}</li>` : ''}
                ${program.language ? `<li><strong>Language:</strong> ${program.language}</li>` : ''}
                ${program.requirements ? `<li><strong>Requirements:</strong> ${program.requirements}</li>` : ''}
                ${program.tuition ? `<li><strong>Tuition Fee:</strong> ${program.tuition}</li>` : ''}
            </ul>
            ${university.url ? `<p><a href="${university.url}" target="_blank" class="modal-uni-link">Visit University Page</a></p>` : ''}
        `;
        programDetailModal.style.display = 'block';
    }

    // Close modal logic
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            programDetailModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === programDetailModal) {
            programDetailModal.style.display = 'none';
        }
    });


// Function to filter and render universities based on search and filters
function filterAndRenderUniversities() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedCountry = countryFilter.value;
    const selectedType = typeFilter.value;
    const selectedDegree = degreeFilter.value;

    const results = []; // To store university objects along with their matching programs
    let currentSearchType = 'university_focused'; // Default search type

    // Determine if search is program-focused or university-focused
    // A search is considered program-focused if the search term
    // matches a program name more specifically than a university name,
    // OR if a degree filter is active.
    const isProgramSpecificSearch = (searchTerm !== '' && allUniversities.some(uni => uni.programs.some(prog => prog.name.toLowerCase().includes(searchTerm) && !uni.name.toLowerCase().includes(searchTerm)))) || selectedDegree !== 'all';
    if (isProgramSpecificSearch) {
        currentSearchType = 'program_focused';
    }

    allUniversities.forEach(uni => {
        let universityMatchesGeneralFilters = true; // Does the university match country/type?
        let programsMatchingSearchCriteria = []; // Programs within this uni that match search term/degree

        // Check university-level filters (country, type)
        if (selectedCountry !== 'all' && uni.country.toLowerCase().replace(/\s/g, '-') !== selectedCountry) {
            universityMatchesGeneralFilters = false;
        }
        if (selectedType !== 'all' && uni.type !== selectedType) {
            universityMatchesGeneralFilters = false;
        }

        // If university passes general filters, then evaluate programs
        if (universityMatchesGeneralFilters) {
            if (currentSearchType === 'program_focused') {
                // In program-focused mode, only show programs that specifically match the search/degree
                uni.programs.forEach(program => {
                    const programName = program.name.toLowerCase();

                    const matchesProgramSearchTerm = searchTerm === '' ||
                                                     programName.includes(searchTerm) ||
                                                     uni.name.toLowerCase().includes(searchTerm); // Still allow university name search to pull programs

                    const matchesProgramDegree = selectedDegree === 'all' || program.degree === selectedDegree;

                    if (matchesProgramSearchTerm && matchesProgramDegree) {
                        programsMatchingSearchCriteria.push(program);
                    }
                });
            } else {
                // In university-focused mode (or no specific program search/degree filter), show all programs
                // as long as the university matches general filters.
                programsMatchingSearchCriteria = [...uni.programs]; // Include all programs
            }
        }

        // Add university to results only if it has programs to display after filtering
        if (universityMatchesGeneralFilters && programsMatchingSearchCriteria.length > 0) {
            // --- NEW: Sort programs based on priority ---
            programsMatchingSearchCriteria.sort((a, b) => {
                // Programs with a priority number come before those without (or with higher numbers)
                // Default to a very high number if priority is not set, pushing them to the end.
                const priorityA = a.priority !== undefined && a.priority !== null ? a.priority : Infinity;
                const priorityB = b.priority !== undefined && b.priority !== null ? b.priority : Infinity;

                if (priorityA < priorityB) return -1; // a has higher priority (smaller number)
                if (priorityA > priorityB) return 1;  // b has higher priority (smaller number)

                // If priorities are equal (or both undefined/null), sort alphabetically by name
                return a.name.localeCompare(b.name);
            });
            // --- END NEW ---

            results.push({
                university: uni,
                programsToDisplay: programsMatchingSearchCriteria,
                autoExpandPrograms: currentSearchType === 'program_focused' // Auto-expand if program-focused search
            });
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