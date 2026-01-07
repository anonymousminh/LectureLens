// Use relative path - works with Pages Functions proxy in both dev and production
const API_BASE_PATH = '/api';
let currentLectureId = 'lecture-12345';
// Get the DOM elements

chatInput = document.getElementById("chat-input");
sendButton = document.getElementById("send-button");
chatWindow = document.getElementById("chat-window");
const lectureUploadInput = document.getElementById("lecture-upload");

// Handle File Upload Function
async function handleFileUpload(){
    // Check if the file has been uploaded
    if (lectureUploadInput.files.length === 0){
        displayMessage("Please upload a lecture file to begin", 'system');
        return;
    }

    // Get the file
    const file = lectureUploadInput.files[0];

    // Display the loading message
    const uploadMessage = displayMessage(`Uploading and processing "${file.name}"...`, 'system');

    // Disable the upload input
    lectureUploadInput.disabled = true;
    chatInput.disabled = true;
    sendButton.disabled = true;

    try {
        // Use FileReader to read the file content as text
        const reader = new FileReader();

        // This promise will resolve when the file is read
        const fileContent = await new Promise((resolve, reject) => {
            reader.onload = (event) => {
                resolve(event.target.result); // File content
            };
            reader.onerror = (error) => {
                reject(error); // File reading error
            };
            reader.readAsText(file); // Read the file
        });

        // Log for verification
        console.log(`Received file: ${file.name}. Content preview: ${fileContent.substring(0, 100)}...`);

        // Simulate the success and re-enable the UI
        uploadMessage.textContent = `File ${file.name} uploaded successfully`;
    } catch (error){
        console.log("File Upload Error:", error);
        uploadMessage.textContent = `Error: ${error.message}. Please try again.`;
    } finally {
        // Re-enable the UI
        lectureUploadInput.disabled = false;
    }
}

// Handle File Upload Button Click
lectureUploadInput.addEventListener('change', handleFileUpload);

// Initial UI state
chatInput.disabled = true;
sendButton.disabled = true;


// Message Display Function
function displayMessage(text, role){
    // Create a new div element
    const messageElement = document.createElement('div');
    // Set its class to include message and the role
    messageElement.classList.add('message', role);
    // Set its text content
    messageElement.textContent = text;
    // Apend the new div to the chat-window
    chatWindow.appendChild(messageElement);
    // Implement auto-scrolling
    chatWindow.scrollTop = chatWindow.scrollHeight;

    return messageElement;
}

// Handle Send Message
async function sendMessage(){
    // Get the message and trim whitespace
    const messageText = chatInput.value.trim();

    // Check if message is empty
    if (messageText === ""){
        return;
    }

    // Display the user's message and clear the input
    displayMessage(messageText, 'user');
    chatInput.value = '';

    // ------ This is the loading state ------

    // Disable the input and send button immediately after user send messages
    chatInput.disable = true;
    sendButton.disable = true;

    // Display the loading assistant response
    const loadingMessage = displayMessage("Thinking...", 'assistant')

    try {
    // Await the result of callChatAPI
    const aiResponse = await callChatAPI(messageText);

    // Display the AI response
    loadingMessage.textContent = aiResponse;
    } catch (error){
        console.log("Chat Error:", error);
        loadingMessage.textContent = `Error: ${error.message}. Please try again.`;
    } finally {
        // ------ End loading state ------
        // Re-enable the UI
        chatInput.disable = false;
        sendButton.disable = false;
    }


}

// Handle Send Button Click
sendButton.addEventListener('click', sendMessage);

// Handle Enter Key Press
chatInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter'){
        event.preventDefault();
        sendMessage();
    }
})

// callChatAPI function
async function callChatAPI(message) {
    // Construct the full URL
    const url = `${API_BASE_PATH}/chat/${currentLectureId}`;

    try {
        // Use the global fetch to send the POST request
        const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: message})
    });

    // Check the HTTP errors
    if (!response.ok){
        const errorBody = await response.json;
        throw new Error(`API Error (${response.status}): ${errorBody.error || errorBody.message || 'Unknown error'}`);
    }

    // Parsing the JSON body and return the AI response
    const data = await response.json();
    return data.response;

    } catch (error){
        console.log(`Fetch failed:`, error);
        throw new Error(`Chat failed: ${error.message}`);
    }
    
}