const apiKey = 'ddf32ed4ba6a24adad46657a4e4acdcb'; // Replace with your API key
const searchInput = document.getElementById('search-input');
const cityDropdown = document.getElementById('city-dropdown');
const searchBtn = document.getElementById('search-btn');
const currentLocationBtn = document.getElementById('current-location-btn');
const todayWeatherContainer = document.getElementById('today-weather');
const forecastContainer = document.getElementById('forecast');
const timeDateContainer = document.getElementById('time-date');

// Recent cities storage
let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

// Function to update Date and Time
function updateTimeAndDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  timeDateContainer.textContent = now.toLocaleString('en-US', options);
}
setInterval(updateTimeAndDate, 60000);
updateTimeAndDate();

// Show dropdown with  recent searches
function showCityDropdown() {
  const query = searchInput.value.trim().toLowerCase();

  if (query.length > 0) {
    const filteredCities = recentCities.filter(city => city.toLowerCase().includes(query));
    cityDropdown.innerHTML = '';

    filteredCities.forEach(city => {
      const li = document.createElement('li');
      li.textContent = city;
      li.classList.add('p-2', 'cursor-pointer', 'hover:bg-blue-100');
      li.addEventListener('click', () => {
        searchInput.value = city;
        cityDropdown.classList.add('hidden');
        fetchWeatherByCity(city);
      });
      cityDropdown.appendChild(li);
    });

    cityDropdown.classList.toggle('hidden', filteredCities.length === 0);
  } else {
    cityDropdown.innerHTML = '';
    recentCities.forEach(city => {
      const li = document.createElement('li');
      li.textContent = city;
      li.classList.add('p-2', 'cursor-pointer', 'hover:bg-blue-500');
      li.addEventListener('click', () => {
        searchInput.value = city;
        cityDropdown.classList.add('hidden');
        fetchWeatherByCity(city);
      });
      cityDropdown.appendChild(li);
    });
    cityDropdown.classList.remove('hidden');
  }
}

// Store recent cities in localStorage
function addRecentCity(city) {
  if (!recentCities.includes(city)) {
    recentCities.unshift(city);
    if (recentCities.length > 3) {
      recentCities.pop();
    }
    localStorage.setItem('recentCities', JSON.stringify(recentCities));
  }
}

// Fetch Weather by City Name
async function fetchWeatherByCity(city) {
  if (!city) {
    showError('Please select a city.');
    return;
  }

  try {
    const [weather, forecastData] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`).then(res => res.json()),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`).then(res => res.json())
    ]);

    if (weather.cod === 200 && forecastData.cod === "200") {
      displayTodayWeather(weather);
      displayForecast(forecastData);
      addRecentCity(city);
    } else {
      showError('City not found.');
    }
  } catch {
    showError('Failed to fetch weather data.');
  }
}

// Fetch Weather by Coordinates
async function fetchWeatherByCoordinates(lat, lon) {
  try {
    const [weather, forecastData] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`).then(res => res.json()),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`).then(res => res.json())
    ]);

    if (weather.cod === 200 && forecastData.cod === "200") {
      displayTodayWeather(weather);
      displayForecast(forecastData);
    } else {
      showError('Unable to fetch location-based weather.');
    }
  } catch {
    showError('Failed to fetch weather data.');
  }
}

// Display Today's Weather
function displayTodayWeather(data) {
  const { name, main, weather, wind } = data;
  const iconUrl = `https://openweathermap.org/img/wn/${weather[0].icon}@4x.png`;

  const dayOfWeek = new Date().toLocaleString('en-us', { weekday: 'long' });

  todayWeatherContainer.innerHTML = `
    <h2 class="text-3xl font-bold text-white">${name} - ${dayOfWeek}</h2>
    <img src="${iconUrl}" alt="${weather[0].description}" class="my-4 mx-auto">
    <p class="text-white">${weather[0].description}</p>
    <p class="text-4xl font-bold text-white">${main.temp}°C</p>
    <p>Humidity: ${main.humidity}%</p>
    <p>Wind: ${wind.speed} m/s</p>
  `;
  todayWeatherContainer.classList.remove('hidden');
}

// Display Forecast
function displayForecast(data) {
  forecastContainer.innerHTML = '';
  const forecastList = data.list.filter((_, index) => index % 8 === 0).slice(1, 5);
  forecastList.forEach(day => {
    const iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
    const dayOfWeek = new Date(day.dt * 1000).toLocaleString('en-us', { weekday: 'long' });

    forecastContainer.innerHTML += `
      <div class="bg-blue-500 p-6 rounded-lg shadow-md flex flex-col items-center text-center text-white">
        <p class="text-xl font-semibold">${dayOfWeek}</p>
        <p>${new Date(day.dt * 1000).toLocaleDateString()}</p>
        <img src="${iconUrl}" alt="${day.weather[0].description}" class="w-16 h-16">
        <p>${day.weather[0].description}</p>
        <p>${day.main.temp}°C</p>
        <p>Humidity: ${day.main.humidity}%</p>
        <p>Wind: ${day.wind.speed} m/s</p>
      </div>
    `;
  });
  forecastContainer.classList.remove('hidden');
}

// Show Error
function showError(message) {
  todayWeatherContainer.innerHTML = `<p class="text-red-500">${message}</p>`;
  todayWeatherContainer.classList.remove('hidden');
  forecastContainer.innerHTML = '';
}

// Hide dropdown if clicked outside
document.addEventListener('click', (event) => {
  if (!event.target.closest('#search-input') && !event.target.closest('#city-dropdown')) {
    cityDropdown.classList.add('hidden');
  }
});

// Event Listeners
searchInput.addEventListener('click', showCityDropdown);
searchInput.addEventListener('input', showCityDropdown);
searchBtn.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) fetchWeatherByCity(city);
  else showError('Please select a city.');
});

currentLocationBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => fetchWeatherByCoordinates(coords.latitude, coords.longitude),
      () => showError('Unable to retrieve your location.')
    );
  } else {
    showError('Geolocation is not supported by your browser.');
  }
});
