document.addEventListener('DOMContentLoaded', () => {
    const masterCsvInput = document.getElementById('masterCsv');
    const monthlyCsvInput = document.getElementById('monthlyCsv');


    const compareBtn = document.getElementById('compareBtn');
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');

    const uniqueRowsList = document.getElementById('uniqueRowsList');
    const defaultCsvNotice = document.getElementById('defaultNotice');

    
    // Helper function to clear previous results
    function clearResults() {
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
        resultsDiv.classList.add('hidden');
        uniqueRowsList.innerHTML = '';
        defaultCsvNotice.classList.add('hidden');
    }

    // Helper function to show error
    function showError(message) {
        console.error(message)
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    // function to fetch default master CSV from dataset directory
    async function fetchDefault() {
        try {
            const response = await fetch('./dataset/masterDataset.csv');
            if (!response.ok) {
                throw new Error('Unable to fetch default master CSV');
            }
            return await response.text();
        } catch (error) {
            showError('Error loading default master CSV: ' + error.message);
            return null;
        }
    }
    

    // Compare Property IDs
    compareBtn.addEventListener('click', async () => {
        // Clear previous results
        clearResults();

        // validate monthly data
        if (!monthlyCsvInput.files.length) {
            showError('Please upload the monthly analytics.');
            return;
        }

        let masterCsvText;
        let usingDefault;

        if (masterCsvInput.files.length) {
            //user has uploaded master csv
            masterCsvText = await masterCsvInput.files[0].text();
        } else {
            // use default
            masterCsvText = await fetchDefault();
            if (!masterCsvText) return;
            usingDefault = true;
        }

        // parse master csv
        const masterResults = Papa.parse(masterCsvText, { header: true });

        // parse monthly CSV
        Papa.parse(monthlyCsvInput.files[0], {
            header: true,
            complete: function(monthlyResults) {

                const masterCol = "Property ID";
                const monthlyCol = "ID"

                // Validate 'Property ID' column in master csv and 'ID' in monthly csv
                if (!masterResults.meta.fields.includes(masterCol) || 
                    !monthlyResults.meta.fields.includes(monthlyCol)) {
                    showError(`The Master CSV must have '${masterCol}', and Monthly CSV must have '${monthlyCol}'`);
                    return;
                }

                // creates a new array of only Property IDs from each row in masterResults.data
                // so masterIds is a set of all unique property IDs from the master CSV
                const masterIds = new Set(masterResults.data.map(row => row['Property ID']));  
                
                // uses .filter() to create an array with only rows that pass the condition
                // condition: for each row in monthly CSV, check if ID is NOT in masterIds
                const uniqueRows = monthlyResults.data.filter(row => !masterIds.has(row['ID']));
                
                // show notice when we default to our own masterDataset of unique property IDs
                if (usingDefault) {
                    defaultCsvNotice.classList.remove('hidden');
                    defaultCsvNotice.textContent = 'Opted to default Observatory dataset. Data may be outdated.'
                }

                // display results - note this section was largely AI generated.
                if (uniqueRows.length > 0) {
                    resultsDiv.classList.remove('hidden');

                    // Create table for unique rows
                    const table = document.createElement('table');
                    table.className = 'results-table';

                    // Create header row
                    const headerRow = document.createElement('tr');
                    const headers = Object.keys(uniqueRows[0]); // Extract column names
                    headers.forEach(header => {
                        const th = document.createElement('th');
                        th.textContent = header;
                        headerRow.appendChild(th);
                    });
                    table.appendChild(headerRow);

                    // Add data rows
                    uniqueRows.forEach(row => {
                        const tr = document.createElement('tr');
                        headers.forEach(header => {
                            const td = document.createElement('td');
                            td.textContent = row[header] || ''; // Preserve structure
                            tr.appendChild(td);
                        });
                        table.appendChild(tr);
                    });

                    // Clear previous content and add new table
                    uniqueRowsList.innerHTML = '';
                    uniqueRowsList.appendChild(table);

                } else {
                    showError('No unique property IDs found');
                }
            }
        });
    });
});