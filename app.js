const content = document.getElementById('contentText');
const statusText = document.getElementById('statusText');
const commandList = document.getElementById('commandList');
const showCommandsBtn = document.getElementById('showCommandsBtn');
const settingsBtn = document.getElementById('settingsBtn');
const modeToggleBtn = document.getElementById('modeToggleBtn');
const commandModal = document.getElementById('commandModal');
const settingsModal = document.getElementById('settingsModal');
const closeBtns = document.getElementsByClassName('close');
const micButton = document.getElementById('micButton');
const musicFolderInput = document.getElementById('musicFolderInput');
const outputContainer = document.getElementById('outputContainer');
const voiceSelect = document.getElementById('voiceSelect');
const languageSelect = document.getElementById('languageSelect');
const themeSelect = document.getElementById('themeSelect');
const saveSettingsBtn = document.getElementById('saveSettings');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const chatContainer = document.getElementById('chatContainer');
const voiceMode = document.getElementById('voiceMode');
const typeMode = document.getElementById('typeMode');

let musicFiles = [];
let isListening = false;
let currentVoice = null;
let currentLanguage = 'en-US';
let isVoiceMode = true;
let spotifyPlayer = null;
let waitingForInput = false;
let currentCommand = '';

const commands = [
    'play [song/artist/album] (on Spotify)',
    'pause (Spotify)',
    'resume (Spotify)',
    'next track (on Spotify)',
    'previous track (on Spotify)',
    'open [website] (.[domain])',
    'search for [query]',
    'what is [query]',
    'who is [query]',
    'wikipedia [query]',
    'time',
    'date',
    'calculate [expression]',
    'weather in [location]',
    'stock price of [symbol]',
    'set reminder [text]',
    'show notes',
    'delete note [id]',
    'translate [text] to [language]',
    'movie recommendations for [genre]',
    'tell me a joke',
    'random quote',
    'calculate bmi [weight] [height]',
    'generate password [length]',
    'set timer for [duration]',
    'set alarm for [time]',
    'show alarms',
    'delete alarm [id]',
    'start pomodoro',
    'show todo list',
    'add todo [task]',
    'complete todo [id]',
    'delete todo [id]',
    'show calendar',
    'add event [event details]',
    'summarize text [text]',
    'analyze sentiment [text]',
    'get news about [topic]',
    'find recipes for [dish]',
    'convert [amount] [from_currency] to [to_currency]',
    'define [word]',
    'find synonyms for [word]',
    'get directions from [start] to [end]',
    'set volume to [level]',
    'search images of [query]',
    'create playlist [name]',
    'add song [song name] to playlist [playlist name]',
    'get flight status for [flight number]',
    'book appointment on [date] at [time]',
    'start workout [type]',
    'track calories for [food item]',
    'find nearby [place type]',
    'get movie showtimes for [movie] in [location]',
    'type mode',
    'voice mode'
];

// Add these new commands to the commands list if they're not already there
if (!commands.includes('start screen recording')) {
    commands.push('start screen recording');
}
if (!commands.includes('stop screen recording')) {
    commands.push('stop screen recording');
}
if (!commands.includes('take screenshot')) {
    commands.push('take screenshot');
}
if (!commands.includes('schedule email to [recipient] at [time]')) {
    commands.push('schedule email to [recipient] at [time]');
}

commands.forEach(command => {
    const li = document.createElement('li');
    li.textContent = command;
    commandList.appendChild(li);
});

showCommandsBtn.onclick = () => commandModal.style.display = "block";
settingsBtn.onclick = () => settingsModal.style.display = "block";
modeToggleBtn.onclick = toggleInputMode;
sendBtn.onclick = sendCommand;
voiceBtn.onclick = startVoiceInput;

Array.from(closeBtns).forEach(btn => {
    btn.onclick = function() {
        commandModal.style.display = "none";
        settingsModal.style.display = "none";
    }
});

window.onclick = function(event) {
    if (event.target == commandModal || event.target == settingsModal) {
        commandModal.style.display = "none";
        settingsModal.style.display = "none";
    }
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    if (currentVoice) utterance.voice = currentVoice;
    utterance.lang = currentLanguage;
    window.speechSynthesis.speak(utterance);
    addChatBubble('ai', text);
}

function addChatBubble(type, text) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${type}-bubble`;
    bubble.textContent = text;
    chatContainer.appendChild(bubble);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function wishMe() {
    const day = new Date();
    const hour = day.getHours();
    let greeting;

    if (hour >= 0 && hour < 12) {
        greeting = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
        greeting = "Good Afternoon";
    } else {
        greeting = "Good Evening";
    }

    speak(` {Good} ${greeting} master. How may I assist you today?`);
}

window.addEventListener('load', () => {
    speak("{Good} Spark ready...");
    wishMe();
    loadVoices();
    loadLanguages();
    loadTheme();
    initializeSpotify();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
    const current = event.resultIndex;
    const transcript = event.results[current][0].transcript;
    
    if (transcript.toLowerCase().includes('pilon')) {
        isListening = true;
        statusText.textContent = "Listening...";
        content.textContent = "How may I help you?";
    } else if (isListening) {
        content.textContent = transcript;
        addChatBubble('user', transcript);
        processCommand(transcript.toLowerCase());
    }
}

recognition.onend = () => {
    if (isVoiceMode && !isListening) {
        recognition.start();
    }
};

micButton.addEventListener('click', () => {
    if (isVoiceMode) {
        isListening = true;
        statusText.textContent = "Listening...";
        content.textContent = "How may I help you?";
    }
});

textInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendCommand();
    }
});

function sendCommand() {
    const command = textInput.value.trim();
    if (command) {
        addChatBubble('user', command);
        processCommand(command.toLowerCase());
        textInput.value = '';
    }
}

function startVoiceInput() {
    isListening = true;
    recognition.start();
    speak("{Good} I'm listening. What would you like me to do?");
}

function toggleInputMode() {
    isVoiceMode = !isVoiceMode;
    if (isVoiceMode) {
        modeToggleBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceMode.style.display = 'block';
        typeMode.style.display = 'none';
        recognition.start();
    } else {
        modeToggleBtn.innerHTML = '<i class="fas fa-keyboard"></i>';
        voiceMode.style.display = 'none';
        typeMode.style.display = 'block';
        recognition.stop();
    }
    speak(isVoiceMode ? "{Good} Switched to voice mode" : "{Good} Switched to typing mode");
}

async function processCommand(message) {
    if (waitingForInput) {
        completeCommand(currentCommand, message);
        return;
    }

    if (message.includes('play') && (message.includes('spotify') || !message.includes('music'))) {
        const query = message.replace('play', '').replace('on spotify', '').trim();
        playSpotify(query);
    } else if (message.includes('pause') || message.includes('stop')) {
        pauseSpotify();
    } else if (message.includes('resume') || message.includes('continue')) {
        resumeSpotify();
    } else if (message.includes('next track') || message.includes('skip song')) {
        nextTrackSpotify();
    } else if (message.includes('previous track') || message.includes('last song')) {
        previousTrackSpotify();
    } else if (message.includes('open')) {
        currentCommand = 'open';
        waitingForInput = true;
        speak("{Good} What would you like to open?");
    } else if (message.includes('search')) {
        currentCommand = 'search';
        waitingForInput = true;
        speak(" {Good} What would you like to search for?");
    } else if (message.includes('type mode')) {
        toggleInputMode();
        speak("{Good} Switched to typing mode");
    } else if (message.includes('voice mode')) {
        toggleInputMode();
        speak("{Good} Switched to voice mode");
    } else if (message.includes('start screen recording')) {
        startScreenRecording();
    } else if (message.includes('stop screen recording')) {
        stopScreenRecording();
    } else if (message.includes('take screenshot')) {
        takeScreenshot();
    } else if (message.includes('schedule email')) {
        const [recipient, time] = message.split('schedule email to ')[1].split(' at ');
        scheduleEmail(recipient, time);
    } else {
        await takeCommand(message);
    }
}

async function completeCommand(command, input) {
    waitingForInput = false;
    currentCommand = '';

    if (command === 'open') {
        const parts = input.split(' ');
        const site = parts[0];
        const domain = parts[1] || 'com';
        window.open(`https://${site}.${domain}`, "_blank");
        speak(`Opening ${site}.${domain}...`);
    } else if (command === 'search') {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(input)}`, "_blank");
        speak(`{Good} Searching for ${input}...`);
    }
}

async function takeCommand(message) {
    if (message.includes('what is') || message.includes('who is') || message.includes('what are')) {
        const query = message.replace(/what is|who is|what are/i, '').trim();
        const result = await searchWikipedia(query);
        speak(result);
    } else if (message.includes('time')) {
        const time = new Date().toLocaleTimeString();
        speak(`{Good} The current time is ${time}`);
    } else if (message.includes('date')) {
        const date = new Date().toLocaleDateString();
        speak(`{Good} Today's date is ${date}`);
    } else if (message.includes('weather in')) {
        const location = message.split('weather in ')[1];
        const weather = await getWeatherInfo(location);
        speak(weather);
    } else if (message.includes('stock price of')) {
        const symbol = message.split('stock price of ')[1];
        const price = await getStockPrice(symbol);
        speak(price);
    } else if (message.includes('set reminder')) {
        const reminder = message.split('set reminder ')[1];
        const result = setReminder(reminder);
        speak(result);
    } else if (message.includes('show notes')) {
        const notes = getNotes();
        speak(notes);
    } else if (message.includes('delete note')) {
        const noteId = parseInt(message.split('delete note ')[1]);
        const result = deleteNote(noteId);
        speak(result);
    } else if (message.includes('translate')) {
        const [text, targetLang] = message.split(' to ');
        const translation = await translateText(text.replace('translate ', ''), targetLang);
        speak(translation);
    } else if (message.includes('movie recommendations for')) {
        const genre = message.split('movie recommendations for ')[1];
        const recommendations = await getMovieRecommendations(genre);
        speak(recommendations);
    } else if (message.includes('tell me a joke')) {
        const joke = await getRandomJoke();
        speak(joke);
    } else if (message.includes('random quote')) {
        const quote = getRandomQuote();
        speak(quote);
    } else if (message.includes('calculate bmi')) {
        const [, weight, height] = message.split(' ');
        const bmi = calculateBMI(parseFloat(weight), parseFloat(height));
        speak(bmi);
    } else if (message.includes('generate password')) {
        const length = parseInt(message.split('generate password ')[1]) || 12;
        const password = generatePassword(length);
        speak(password);
    } else if (message.includes('set timer for')) {
        const duration = message.split('set timer for ')[1];
        setTimer(duration);
    } else if (message.includes('set alarm for')) {
        const time = message.split('set alarm for ')[1];
        setAlarm(time);
    } else if (message.includes('show alarms')) {
        showAlarms();
    } else if (message.includes('delete alarm')) {
        const alarmId = parseInt(message.split('delete alarm ')[1]);
        deleteAlarm(alarmId);
    } else if (message.includes('start pomodoro')) {
        startPomodoro();
    } else if (message.includes('show todo list')) {
        showTodoList();
    } else if (message.includes('add todo')) {
        const task = message.split('add todo ')[1];
        addTodo(task);
    } else if (message.includes('complete todo')) {
        const todoId = parseInt(message.split('complete todo ')[1]);
        completeTodo(todoId);
    } else if (message.includes('delete todo')) {
        const todoId = parseInt(message.split('delete todo ')[1]);
        deleteTodo(todoId);
    } else if (message.includes('show calendar')) {
        showCalendar();
    } else if (message.includes('add event')) {
        const eventDetails = message.split('add event ')[1];
        addEvent(eventDetails);
    } else if (message.includes('summarize text')) {
        const text = message.split('summarize text ')[1];
        const summary = await summarizeText(text);
        speak(summary);
    } else if (message.includes('analyze sentiment')) {
        const text = message.split('analyze sentiment ')[1];
        const sentiment = await analyzeSentiment(text);
        speak(sentiment);
    } else if (message.includes('get news about')) {
        const topic = message.split('get news about ')[1];
        const news = await getNews(topic);
        speak(news);
    } else if (message.includes('find recipes for')) {
        const dish = message.split('find recipes for ')[1];
        const recipes = await findRecipes(dish);
        speak(recipes);
    } else if (message.includes('convert')) {
        const [amount, fromCurrency, , toCurrency] = message.split('convert ')[1].split(' ');
        const result = await convertCurrency(amount, fromCurrency, toCurrency);
        speak(result);
    } else if (message.includes('calculate')) {
        const expression = message.split('calculate ')[1];
        const result = evaluateMathExpression(expression);
        speak(`{Good} The result is ${result}`);
    } else if (message.includes('define')) {
        const word = message.split('define ')[1];
        const definition = await getDefinition(word);
        speak(definition);
    } else if (message.includes('find synonyms for')) {
        const word = message.split('find synonyms for ')[1];
        const synonyms = await getSynonyms(word);
        speak(synonyms);
    } else if (message.includes('get directions from')) {
        const [start, end] = message.split('get directions from ')[1].split(' to ');
        const directions = await getDirections(start, end);
        speak(directions);
    } else if (message.includes('set volume to')) {
        const level = parseInt(message.split('set volume to ')[1]);
        setVolume(level);
    } else if (message.includes('search images of')) {
        const query = message.split('search images of ')[1];
        const images = await searchImages(query);
        speak(`{Good} I've found some images of ${query}. You can view them in the output container.`);
        displayImages(images);
    } else if (message.includes('create playlist')) {
        const name = message.split('create playlist ')[1];
        createPlaylist(name);
    } else if (message.includes('add song')) {
        const [songName, playlistName] = message.split('add song ')[1].split(' to playlist ');
        addSongToPlaylist(songName, playlistName);
    } else if (message.includes('get flight status for')) {
        const flightNumber = message.split('get flight status for ')[1];
        const status = await getFlightStatus(flightNumber);
        speak(status);
    } else if (message.includes('book appointment on')) {
        const [date, time] = message.split('book appointment on ')[1].split(' at ');
        bookAppointment(date, time);
    } else if (message.includes('start workout')) {
        const workoutType = message.split('start workout ')[1];
        startWorkout(workoutType);
    } else if (message.includes('track calories for')) {
        const foodItem = message.split('track calories for ')[1];
        const calories = await trackCalories(foodItem);
        speak(calories);
    } else if (message.includes('find nearby')) {
        const placeType = message.split('find nearby ')[1];
        const places = await findNearbyPlaces(placeType);
        speak(places);
    } else if (message.includes('get movie showtimes for')) {
        const [movie, location] = message.split('get movie showtimes for ')[1].split(' in ');
        const showtimes = await getMovieShowtimes(movie, location);
        speak(showtimes);
    }
    if (message.includes('hey') || message.includes('hello')|| message.includes('hi')) {
        speak("{Good} Hello Master, How May I Help You?");
    }
     else {
        speak("{Good} sorry");
    }
}

// Spotify Integration
function initializeSpotify() {
    window.onSpotifyWebPlaybackSDKReady = () => {
        const token = 'YOUR_SPOTIFY_ACCESS_TOKEN';
        spotifyPlayer = new Spotify.Player({
            name: 'Spark',
            getOAuthToken: cb => { cb(token); }
        });

        // Error handling
        spotifyPlayer.addListener('initialization_error', ({ message }) => { console.error(message); });
        spotifyPlayer.addListener('authentication_error', ({ message }) => { console.error(message); });
        spotifyPlayer.addListener('account_error', ({ message }) => { console.error(message); });
        spotifyPlayer.addListener('playback_error', ({ message }) => { console.error(message); });

        // Playback status updates
        spotifyPlayer.addListener('player_state_changed', state => { console.log(state); });

        // Ready
        spotifyPlayer.addListener('ready', ({ device_id }) => {
            console.log('Ready with Device ID', device_id);
        });

        // Connect to the player!
        spotifyPlayer.connect();
    };
}

function playSpotify(query) {
    // This is a simplified version. In a real implementation, you'd need to search for the track and then play it.
    speak(`{Good} Playing ${query} on Spotify`);
    // Here you would typically use the Spotify Web API to search for the track/album/artist and start playback
}

function pauseSpotify() {
    spotifyPlayer.pause().then(() => {
        speak("{Good} Paused Spotify playback");
    });
}

function resumeSpotify() {
    spotifyPlayer.resume().then(() => {
        speak("{Good} Resumed Spotify playback");
    });
}

function nextTrackSpotify() {
    spotifyPlayer.nextTrack().then(() => {
        speak("{Good} Playing next track on Spotify");
    });
}

function previousTrackSpotify() {
    spotifyPlayer.previousTrack().then(() => {
        speak("{Good} Playing previous track on Spotify");
    });
}

// Existing functions (searchWikipedia, getWeatherInfo, etc.) remain unchanged

function loadVoices() {
    let voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
        setTimeout(loadVoices, 10);
    } else {
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = voice.name + ' (' + voice.lang + ')';
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
    }
}

function loadLanguages() {
    const languages = [
        { code: 'en-US', name: 'English (US)' },
        { code: 'es-ES', name: 'Spanish (Spain)' },
        { code: 'fr-FR', name: 'French (France)' },
        { code: 'de-DE', name: 'German (Germany)' },
        { code: 'it-IT', name: 'Italian (Italy)' },
        { code: 'ja-JP', name: 'Japanese (Japan)' },
        { code: 'ko-KR', name: 'Korean (South Korea)' },
        { code: 'pt-BR', name: 'Portuguese (Brazil)' },
        { code: 'ru-RU', name: 'Russian (Russia)' },
        { code: 'zh-CN', name: 'Chinese (Simplified)' }
    ];

    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        languageSelect.appendChild(option);
    });
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    themeSelect.value = savedTheme;
    document.body.className = savedTheme + '-theme';
}

saveSettingsBtn.addEventListener('click', () => {
    const selectedVoice = voiceSelect.selectedOptions[0].getAttribute('data-name');
    currentVoice = speechSynthesis.getVoices().find(voice => voice.name === selectedVoice);
    
    currentLanguage = languageSelect.value;
    recognition.lang = currentLanguage;

    const selectedTheme = themeSelect.value;
    document.body.className = selectedTheme + '-theme';
    localStorage.setItem('theme', selectedTheme);

    speak("{Good} Settings saved successfully");
    settingsModal.style.display = "none";
});

if (isVoiceMode) {
    recognition.start();
}

// Additional productivity features

function startScreenRecording() {
    // Implementation for screen recording
    speak("{Good} Starting screen recording. Say 'stop screen recording' when you're done.");
}

function stopScreenRecording() {
    // Implementation for stopping screen recording
    speak("{Good} Screen recording stopped and saved.");
}

function takeScreenshot() {
    // Implementation for taking a screenshot
    speak("{Good} Screenshot taken and saved.");
}

function scheduleEmail(recipient, time) {
    // Implementation for scheduling an email
    speak(`{Good} Email scheduled to ${recipient} at ${time}.`);
}




