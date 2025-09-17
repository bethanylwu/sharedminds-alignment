// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
    const yearSelect = document.getElementById('year');
    const monthSelect = document.getElementById('month');
    const daySelect = document.getElementById('day');
    const selectedDateDiv = document.getElementById('selectedDate');
    const enterButton = document.getElementById('enterButton');
    const errorMessage = document.getElementById('errorMessage');
    const imageContainer = document.getElementById('imageContainer');

    // Populate year dropdown (4 digits)
    function populateYears() {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 200; // Go back 200 years
        const endYear = currentYear + 10;   // Go forward 10 years

        for (let year = endYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year.toString();
            option.textContent = year.toString();
            yearSelect.appendChild(option);
        }
    }

    // Populate month dropdown (2 digits)
    function populateMonths() {
        for (let month = 1; month <= 12; month++) {
            const option = document.createElement('option');
            const monthString = month.toString().padStart(2, '0');
            option.value = monthString;
            option.textContent = monthString;
            monthSelect.appendChild(option);
        }
    }

    // Populate day dropdown (2 digits)
    function populateDays(year, month) {
        // Clear existing options
        daySelect.innerHTML = '<option value="">DD</option>';

        if (!year || !month) return;

        // Get number of days in the selected month
        const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            const dayString = day.toString().padStart(2, '0'); // Ensure 2 digits
            option.value = dayString;
            option.textContent = dayString;
            daySelect.appendChild(option);
        }
    }

    // API function to generate image
    async function generateHistoricalImage(historicalEvent, year) {
        let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
        let authToken = "";

        // Remove comma punctuation from historical event
        const cleanedHistoricalEvent = (historicalEvent && typeof historicalEvent === 'string')
            ? historicalEvent.replace(/,/g, '')
            : String(historicalEvent || '').replace(/,/g, '');
        const imagePrompt = `portrait of '${cleanedHistoricalEvent}' in the style of '${year}' art`;

        const imageData = {
            model: "google/imagen-4-fast",
            input: {
                prompt: imagePrompt
            },
        };

        console.log("Making Image Generation Request", imageData);

        const imageOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(imageData),
        };

        try {
            const image_response = await fetch(replicateProxy, imageOptions);
            const image_json_response = await image_response.json();

            console.log("Image API Response:", image_json_response);

            if (image_json_response && image_json_response.output) {
                console.log("Generated Image URL:", image_json_response.output);
                return {
                    imageUrl: image_json_response.output,
                    imagePrompt: imagePrompt
                };
            } else {
                console.log("No image generated or API error");
                return null;
            }
        } catch (error) {
            console.error("Image API Error:", error);
            return null;
        }
    }

    // API function to get historical events
    async function getHistoricalEvent(month, day) {
        document.body.style.cursor = "progress";

        let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
        let authToken = "";
        // Optionally Get Auth Token from: https://itp-ima-replicate-proxy.web.app/

        const prompt = `provide me with only the title of a historical event that happened on ${month}/${day}, and remove all date refernences except for the four digit year shown in parentheses at the end`;

        const data = {
            model: "anthropic/claude-3.7-sonnet",
            input: {
                prompt: prompt
            },
        };

        console.log("Making a Fetch Request", data);

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(data),
        };

        try {
            const raw_response = await fetch(replicateProxy, options);
            const json_response = await raw_response.json();

            console.log("API Response:", json_response);

            if (json_response && json_response.output) {
                console.log("Historical Event:", json_response.output);

                // Get the year from the dropdown for the image generation
                const selectedYear = yearSelect.value;

                // Make the second API call to generate an image
                const imageResult = await generateHistoricalImage(json_response.output, selectedYear);

                // Display the image on the webpage
                if (imageResult && imageResult.imageUrl) {
                    displayImage(imageResult.imageUrl, imageResult.imagePrompt);
                }

                document.body.style.cursor = "auto";
                return json_response.output;
            } else {
                console.log("No historical event found or API error");
                document.body.style.cursor = "auto";
                return "No historical event found for this date.";
            }
        } catch (error) {
            console.error("API Error:", error);
            document.body.style.cursor = "auto";
            return "Error fetching historical event.";
        }
    }

    // Validate and show error if fields are not populated
    function validateFields() {
        const year = yearSelect.value;
        const month = monthSelect.value;
        const day = daySelect.value;

        if (!year || !month || !day) {
            errorMessage.textContent = 'Error: Please select all three fields (Year, Month, Day) before clicking Enter.';
            errorMessage.style.display = 'block';
            return false;
        } else {
            errorMessage.style.display = 'none';
            return true;
        }
    }

    // Update selected date display (without API call)
    function updateSelectedDate() {
        const year = yearSelect.value;
        const month = monthSelect.value;
        const day = daySelect.value;

        if (selectedDateDiv) {
            if (year && month && day) {
                selectedDateDiv.textContent = `Selected Date: ${year}-${month}-${day}`;
                if (errorMessage) errorMessage.style.display = 'none';
            } else {
                selectedDateDiv.textContent = 'Please select a date';
            }
        }

        // Only reset to 'enter' if there's no image displayed
        if (imageContainer && imageContainer.innerHTML.trim() === '') {
            updateButtonState('enter');
        }
    }

    // Function to display image on webpage
    function displayImage(imageUrl, imagePrompt) {
        // Clear any existing image
        imageContainer.innerHTML = '';

        if (imageUrl) {
            // Create image element
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `Generated image: ${imagePrompt}`;
            img.className = 'generated-image';

            // Create title element
            const title = document.createElement('div');
            title.className = 'image-title';
            title.textContent = imagePrompt;

            // Add to container
            imageContainer.appendChild(img);
            imageContainer.appendChild(title);

            // Update button state to "Clear"
            updateButtonState('clear');
        }
    }

    // API function with state management
    async function getHistoricalEventWithStateManagement(month, day) {
        document.body.style.cursor = "progress";

        let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
        let authToken = "";

        const prompt = `provide me with only the title of a historical event that happened on ${month}/${day}, and remove all date refernences except for the four digit year shown in parentheses at the end`;

        const data = {
            model: "anthropic/claude-3.7-sonnet",
            input: {
                prompt: prompt
            },
        };

        console.log("Making a Fetch Request", data);

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(data),
        };

        try {
            const raw_response = await fetch(replicateProxy, options);
            const json_response = await raw_response.json();

            console.log("API Response:", json_response);

            if (json_response && json_response.output) {
                console.log("Historical Event:", json_response.output);

                // Get the year from the dropdown for the image generation
                const selectedYear = yearSelect.value;

                // Make the second API call to generate an image
                const imageResult = await generateHistoricalImage(json_response.output, selectedYear);

                // Display the image on the webpage
                if (imageResult && imageResult.imageUrl) {
                    displayImage(imageResult.imageUrl, imageResult.imagePrompt);
                    document.body.style.cursor = "auto";
                    return json_response.output;
                } else {
                    // Image generation failed
                    console.log("Image generation failed");
                    document.body.style.cursor = "auto";
                    updateButtonState('retry');
                    throw new Error("Image generation failed");
                }
            } else {
                // Historical event API failed
                console.log("No historical event found or API error");
                document.body.style.cursor = "auto";
                updateButtonState('retry');
                throw new Error("No historical event found");
            }
        } catch (error) {
            console.error("API Error:", error);
            document.body.style.cursor = "auto";
            updateButtonState('retry');
            throw error;
        }
    }

    // Function to remove image from webpage  
    function removeImage() {
        imageContainer.innerHTML = '';
    }

    // Function to reset all dropdowns to placeholder values
    function resetDropdowns() {
        yearSelect.value = '';
        monthSelect.value = '';
        daySelect.value = '';
        // Reset day dropdown to only show placeholder
        daySelect.innerHTML = '<option value="">DD</option>';
        // Clear selected date display
        if (selectedDateDiv) {
            selectedDateDiv.textContent = 'Please select a date';
        }
        // Hide any error messages
        errorMessage.style.display = 'none';
    }

    // Function to update button text based on current state
    function updateButtonState(state) {
        switch (state) {
            case 'enter':
                enterButton.textContent = 'Enter';
                enterButton.disabled = false;
                break;
            case 'wait':
                enterButton.textContent = 'Wait';
                enterButton.disabled = true;
                break;
            case 'retry':
                enterButton.textContent = 'Retry';
                enterButton.disabled = false;
                break;
            case 'clear':
                enterButton.textContent = 'Clear';
                enterButton.disabled = false;
                break;
        }
    }

    // Handle Enter button click with state management
    async function handleEnterClick() {
        const currentButtonText = enterButton.textContent.toLowerCase();

        // Clear mode - reset everything
        if (currentButtonText === 'clear') {
            console.log("Clear button pressed - resetting everything");
            removeImage();
            resetDropdowns();
            updateButtonState('enter');
            console.log("Button state should now be 'enter'");
            return;
        }

        // Enter or Retry mode - validate and make API calls
        if (currentButtonText === 'enter' || currentButtonText === 'retry') {
            if (validateFields()) {
                // Change to wait state
                updateButtonState('wait');

                const month = monthSelect.value;
                const day = daySelect.value;

                try {
                    // Call the API function and wait for result
                    await getHistoricalEventWithStateManagement(month, day);
                } catch (error) {
                    console.error("Error in API calls:", error);
                    updateButtonState('retry');
                }
            }
        }
    }

    // Event listeners
    yearSelect.addEventListener('change', function () {
        populateDays(yearSelect.value, monthSelect.value);
        updateSelectedDate();
    });

    monthSelect.addEventListener('change', function () {
        populateDays(yearSelect.value, monthSelect.value);
        updateSelectedDate();
    });

    daySelect.addEventListener('change', function () {
        updateSelectedDate();
    });

    // Add Enter button event listener
    enterButton.addEventListener('click', handleEnterClick);
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            handleEnterClick();
        }
    });

    // Initialize dropdowns and button state
    populateYears();
    populateMonths();
    updateButtonState('enter');
});