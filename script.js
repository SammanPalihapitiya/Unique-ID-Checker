document.addEventListener('DOMContentLoaded', () => {
    const masterCsvInput = document.getElementById('masterCsv');
    const monthlyCsvInput = document.getElementById('monthlyCsv');
    const compareBtn = document.getElementById('compareBtn');
    const errorDiv = document.getElementById('error');
    const resultsDiv = document.getElementById('results');
    const monthlyUniqueIdsList = document.getElementById('monthlyUniqueIds');

    // Helper function to clear previous results
    function clearResults() {
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
        resultsDiv.classList.add('hidden');
        monthlyUniqueIdsList.innerHTML = '';
    }

    // Helper function to show error
    function showError(message) {
        console.error(message)
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    // Compare Property IDs
    compareBtn.addEventListener('click', () => {
        // Clear previous results
        clearResults();

        // Validate file inputs
        if (!masterCsvInput.files.length || !monthlyCsvInput.files.length) {
            showError('Please upload both CSV files');
            return;
        }

        // Read Unique Property IDs CSV
        Papa.parse(masterCsvInput.files[0], {
            header: true,
            complete: function(masterResults) {
                // Read Monthly Analytics Data
                Papa.parse(monthlyCsvInput.files[0], {
                    header: true,
                    complete: function(monthlyResults) {

                        // Validate 'Property ID' column
                        if (!masterResults.meta.fields.includes('Property ID') || 
                            !monthlyResults.meta.fields.includes('ID')) {
                            showError("Both CSVs must have a 'Project ID or ID' column");
                            return;
                        }

                        // Extract Property IDs
                        const masterIds = new Set(masterResults.data.map(row => row['Project ID']));   
                        const uniqueRows = monthlyResults.data.filter(row => !masterIds.has(row['ID']));

                        // Display results
                        if (uniqueRows.length > 0) {
                            resultsDiv.classList.remove('hidden');

                            // Create table for unique rows
                            const table = document.createElement('table');
                            table.className = 'results-table';

                            // Create header row
                            const headerRow = document.createElement('tr');
                            Object.keys(uniqueRows[0]).forEach(header => {
                                const th = document.createElement('th');
                                th.textContent = header;
                                headerRow.appendChild(th);
                            });
                            table.appendChild(headerRow);

                            // Add data rows
                            uniqueRows.forEach(row => {
                                const tr = document.createElement('tr');
                                Object.values(row).forEach(value => {
                                    const td = document.createElement('td');
                                    td.textContent = value;
                                    tr.appendChild(td);
                                });
                                table.appendChild(tr);
                            });

                            // Clear previous content and add new table
                            monthlyUniqueIdsList.innerHTML = '';
                            const li = document.createElement('li');
                            li.appendChild(table);
                            monthlyUniqueIdsList.appendChild(li);

                            // Log number of unique rows
                            console.log(`Found ${uniqueRows.length} unique rows`);
                        } else {
                            showError('No unique rows found');
                        }
                    }
                });
            }
        });
    });
});